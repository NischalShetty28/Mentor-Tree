import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest, Role, NotificationType, MeetingStatus, AttendanceStatus } from '../types';
import { createBulkNotifications, createNotification } from '../services/notificationService';
import { logAuditEvent } from '../services/auditService';
import { evaluateStudentRisk } from '../services/riskEvaluationService';

// Get Meetings (Filtered by Role and Context)
export const getMeetings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role;
    const { startDate, endDate, status } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(String(startDate));
    if (endDate) dateFilter.lte = new Date(String(endDate));

    let whereClause: any = {};
    if (Object.keys(dateFilter).length > 0) whereClause.scheduledAt = dateFilter;
    if (status && status !== 'ALL') whereClause.status = String(status);

    if (role === Role.MENTEE) {
      whereClause.attendees = { some: { menteeId: req.user?.menteeId } };
    } else if (role === Role.MENTOR) {
      whereClause.mentorId = req.user?.mentorId;
    } else if (role === Role.HOD && req.user?.departmentId) {
      whereClause.mentor = { departmentId: req.user.departmentId };
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      include: {
        mentor: {
          select: { id: true, fullName: true, designation: true, collegeEmail: true },
        },
        attendees: {
          include: {
            mentee: {
              select: { id: true, fullName: true, usn: true, collegeEmail: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(meetings);
  } catch (error) {
    console.error('getMeetings error:', error);
    res.status(500).json({ message: 'Failed to fetch meetings.' });
  }
};

// Create / Schedule Meeting
export const createMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mentorId = req.user?.mentorId;
    const {
      title,
      agenda,
      meetingType,
      mode,
      locationOrLink,
      scheduledAt,
      durationMinutes = 30,
      menteeIds,
    } = req.body;

    if (!mentorId) {
      res.status(403).json({ message: 'Only mentors can schedule meetings.' });
      return;
    }

    if (!title || !scheduledAt || !menteeIds || !Array.isArray(menteeIds) || menteeIds.length === 0) {
      res.status(400).json({ message: 'Title, scheduled time, and at least one mentee are required.' });
      return;
    }

    const meetingStart = new Date(scheduledAt);
    const meetingEnd = new Date(meetingStart.getTime() + durationMinutes * 60000);

    // Conflict detection: Check if mentor has another active meeting in this interval
    const conflictingMeeting = await prisma.meeting.findFirst({
      where: {
        mentorId,
        status: { in: ['SCHEDULED', 'RESCHEDULED'] },
        scheduledAt: {
          gte: new Date(meetingStart.getTime() - 45 * 60000),
          lte: meetingEnd,
        },
      },
    });

    if (conflictingMeeting) {
      res.status(409).json({
        message: `Conflict detected: You already have a session scheduled around ${new Date(conflictingMeeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      });
      return;
    }

    const meeting = await prisma.meeting.create({
      data: {
        mentorId,
        title,
        agenda,
        meetingType: meetingType || (menteeIds.length > 1 ? 'GROUP' : 'INDIVIDUAL'),
        mode: mode || 'IN_PERSON',
        locationOrLink,
        scheduledAt: meetingStart,
        durationMinutes: parseInt(durationMinutes, 10),
        status: MeetingStatus.SCHEDULED,
        attendees: {
          create: menteeIds.map((menteeId: string) => ({
            menteeId,
            attendanceStatus: AttendanceStatus.SCHEDULED,
          })),
        },
      },
      include: {
        attendees: {
          include: {
            mentee: { select: { userId: true, fullName: true } },
          },
        },
      },
    });

    // Notify students
    const recipientUserIds = meeting.attendees.map((a) => a.mentee.userId);
    await createBulkNotifications(recipientUserIds, {
      senderId: req.user?.userId,
      title: `New Mentoring Session: ${title}`,
      message: `Scheduled for ${meetingStart.toLocaleString()} (${mode === 'ONLINE' ? 'Online' : 'In-person'}). Agenda: ${agenda || 'Mentoring check-in'}`,
      type: NotificationType.MEETING,
      link: '/mentee/dashboard',
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'SCHEDULE_MEETING',
      entityType: 'Meeting',
      entityId: meeting.id,
      details: { title, scheduledAt: meetingStart, menteeCount: menteeIds.length },
      ipAddress: req.ip,
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('createMeeting error:', error);
    res.status(500).json({ message: 'Failed to schedule meeting.' });
  }
};

// Reschedule Meeting
export const rescheduleMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { scheduledAt, durationMinutes, rescheduledReason, mode, locationOrLink } = req.body;

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: {
          include: { mentee: { select: { userId: true } } },
        },
      },
    });

    if (!existingMeeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    const newStart = new Date(scheduledAt);

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        scheduledAt: newStart,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : existingMeeting.durationMinutes,
        rescheduledReason,
        mode: mode || existingMeeting.mode,
        locationOrLink: locationOrLink !== undefined ? locationOrLink : existingMeeting.locationOrLink,
        status: MeetingStatus.RESCHEDULED,
      },
      include: { attendees: true },
    });

    // Notify attendees
    const recipientUserIds = existingMeeting.attendees.map((a) => a.mentee.userId);
    await createBulkNotifications(recipientUserIds, {
      senderId: req.user?.userId,
      title: `Meeting Rescheduled: ${existingMeeting.title}`,
      message: `The session has been moved to ${newStart.toLocaleString()}. Reason: ${rescheduledReason || 'Scheduling adjustment'}`,
      type: NotificationType.MEETING,
      link: '/mentee/dashboard',
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'RESCHEDULE_MEETING',
      entityType: 'Meeting',
      entityId: id,
      details: { newStart, rescheduledReason },
      ipAddress: req.ip,
    });

    res.json({ message: 'Meeting successfully rescheduled.', meeting: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reschedule meeting.' });
  }
};

// Cancel Meeting
export const cancelMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: {
          include: { mentee: { select: { userId: true } } },
        },
      },
    });

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found.' });
      return;
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        status: MeetingStatus.CANCELLED,
        rescheduledReason: reason || 'Meeting cancelled by mentor.',
      },
    });

    // Notify attendees
    const recipientUserIds = meeting.attendees.map((a) => a.mentee.userId);
    await createBulkNotifications(recipientUserIds, {
      senderId: req.user?.userId,
      title: `Meeting Cancelled: ${meeting.title}`,
      message: `The meeting scheduled for ${new Date(meeting.scheduledAt).toLocaleString()} has been cancelled. Note: ${reason || 'Session cancelled.'}`,
      type: NotificationType.MEETING,
      link: '/mentee/dashboard',
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'CANCEL_MEETING',
      entityType: 'Meeting',
      entityId: id,
      details: { reason },
      ipAddress: req.ip,
    });

    res.json({ message: 'Meeting cancelled.', meeting: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel meeting.' });
  }
};

// Record Attendance and Meeting Summary
export const recordAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { attendeeRecords, mentorSummary } = req.body;

    if (!attendeeRecords || !Array.isArray(attendeeRecords)) {
      res.status(400).json({ message: 'Attendee records are required.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update meeting summary
      await tx.meeting.update({
        where: { id },
        data: {
          mentorSummary,
          status: MeetingStatus.COMPLETED,
        },
      });

      // Update each attendee's attendance status
      for (const rec of attendeeRecords) {
        await tx.meetingAttendee.update({
          where: {
            meetingId_menteeId: {
              meetingId: id,
              menteeId: rec.menteeId,
            },
          },
          data: {
            attendanceStatus: rec.status || AttendanceStatus.PRESENT,
            menteeFeedback: rec.feedback || null,
            actionItems: rec.actionItems || null,
            recordedAt: new Date(),
          },
        });
      }
    });

    // Re-evaluate student risk for attendees in case of consecutive absences
    for (const rec of attendeeRecords) {
      await evaluateStudentRisk(rec.menteeId);
    }

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'RECORD_MEETING_ATTENDANCE',
      entityType: 'Meeting',
      entityId: id,
      details: { attendeeCount: attendeeRecords.length },
      ipAddress: req.ip,
    });

    res.json({ message: 'Meeting attendance and summary recorded successfully.' });
  } catch (error) {
    console.error('recordAttendance error:', error);
    res.status(500).json({ message: 'Failed to record attendance.' });
  }
};
