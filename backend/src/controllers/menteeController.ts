import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest, NotificationType, TaskStatus, RecommendationStatus } from '../types';
import { createNotification } from '../services/notificationService';
import { evaluateStudentRisk } from '../services/riskEvaluationService';
import { logAuditEvent } from '../services/auditService';

// Mentee Dashboard Data
export const getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    if (!menteeId) {
      res.status(403).json({ message: 'Mentee profile not associated with this account.' });
      return;
    }

    // Dynamic risk evaluation before loading dashboard
    await evaluateStudentRisk(menteeId);

    const mentee = await prisma.menteeProfile.findUnique({
      where: { id: menteeId },
      include: {
        department: true,
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            mentor: {
              include: { department: true },
            },
          },
        },
        recommendations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            comments: {
              include: {
                author: { select: { id: true, role: true, email: true } },
              },
            },
            mentor: { select: { fullName: true, designation: true } },
          },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            recommendation: { select: { title: true } },
          },
        },
        riskAlerts: {
          where: { status: { in: ['NEW', 'UNDER_REVIEW', 'ACTION_PLANNED'] } },
          orderBy: { createdAt: 'desc' },
        },
        meetingAttendees: {
          include: {
            meeting: {
              include: {
                mentor: { select: { fullName: true, officeLocation: true } },
              },
            },
          },
          orderBy: { meeting: { scheduledAt: 'desc' } },
        },
      },
    });

    if (!mentee) {
      res.status(404).json({ message: 'Student profile not found.' });
      return;
    }

    // Academic performance history for charts
    const academicRecords = await prisma.academicRecord.findMany({
      where: { menteeId },
      orderBy: [{ semester: 'asc' }, { courseCode: 'asc' }],
    });

    // Attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { menteeId },
      orderBy: { courseCode: 'asc' },
    });

    // Assigned mentor
    const activeAssignment = mentee.assignments[0];
    const assignedMentor = activeAssignment
      ? {
          id: activeAssignment.mentor.id,
          fullName: activeAssignment.mentor.fullName,
          designation: activeAssignment.mentor.designation,
          department: activeAssignment.mentor.department.name,
          email: activeAssignment.mentor.collegeEmail,
          phone: activeAssignment.mentor.phone,
          officeLocation: activeAssignment.mentor.officeLocation,
          assignedSince: activeAssignment.assignedAt,
        }
      : null;

    // Upcoming meetings
    const now = new Date();
    const upcomingMeetings = mentee.meetingAttendees
      .filter((att) => new Date(att.meeting.scheduledAt) >= now && att.meeting.status === 'SCHEDULED')
      .map((att) => ({
        id: att.meeting.id,
        title: att.meeting.title,
        agenda: att.meeting.agenda,
        mode: att.meeting.mode,
        locationOrLink: att.meeting.locationOrLink,
        scheduledAt: att.meeting.scheduledAt,
        durationMinutes: att.meeting.durationMinutes,
        mentorName: att.meeting.mentor.fullName,
        myAttendance: att.attendanceStatus,
      }));

    // Recent meeting history
    const pastMeetings = mentee.meetingAttendees
      .filter((att) => new Date(att.meeting.scheduledAt) < now || att.meeting.status === 'COMPLETED')
      .slice(0, 5)
      .map((att) => ({
        id: att.meeting.id,
        title: att.meeting.title,
        scheduledAt: att.meeting.scheduledAt,
        mode: att.meeting.mode,
        mentorName: att.meeting.mentor.fullName,
        attendanceStatus: att.attendanceStatus,
        feedback: att.menteeFeedback,
        actionItems: att.actionItems,
      }));

    // Semester SGPA aggregation for charts
    const semesterMap: { [key: number]: { semester: number; sgpa: number; totalCourses: number } } = {};
    academicRecords.forEach((rec) => {
      if (!semesterMap[rec.semester]) {
        semesterMap[rec.semester] = { semester: rec.semester, sgpa: rec.sgpa || 0, totalCourses: 0 };
      }
      semesterMap[rec.semester].totalCourses += 1;
      if (rec.sgpa) semesterMap[rec.semester].sgpa = rec.sgpa;
    });

    const performanceTrend = Object.values(semesterMap).sort((a, b) => a.semester - b.semester);

    // Pending tasks
    const pendingTasks = mentee.tasks.filter((t) => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED);

    res.json({
      profile: {
        id: mentee.id,
        fullName: mentee.fullName,
        usn: mentee.usn,
        collegeEmail: mentee.collegeEmail,
        department: mentee.department.name,
        departmentCode: mentee.department.code,
        semester: mentee.semester,
        academicYear: mentee.academicYear,
        section: mentee.section,
        cgpa: mentee.cgpa,
        sgpa: mentee.sgpa,
        attendancePercent: mentee.attendancePercent,
        isRiskFlagged: mentee.isRiskFlagged,
        riskLevel: mentee.riskLevel,
      },
      assignedMentor,
      performanceOverview: {
        cgpa: mentee.cgpa,
        sgpa: mentee.sgpa,
        overallAttendance: mentee.attendancePercent,
        completedTasksCount: mentee.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
        totalTasksCount: mentee.tasks.length,
        performanceTrend,
      },
      attendanceRecords,
      upcomingMeetings,
      pastMeetings,
      recommendations: mentee.recommendations,
      pendingTasks,
      riskAlerts: mentee.riskAlerts,
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    res.status(500).json({ message: 'Failed to load mentee dashboard.' });
  }
};

// Get Full Profile
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    if (!menteeId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const mentee = await prisma.menteeProfile.findUnique({
      where: { id: menteeId },
      include: {
        department: true,
        assignments: {
          where: { status: 'ACTIVE' },
          include: { mentor: true },
        },
      },
    });

    if (!mentee) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(mentee);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile.' });
  }
};

// Update Profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    if (!menteeId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const {
      phone,
      hobbies,
      interests,
      strengths,
      areasForImprovement,
      skills,
      certifications,
      achievements,
      extracurricular,
      projects,
      careerGoals,
      specializationPreference,
      personalDevGoals,
      mentoringPreferences,
      privateNotes,
      shareWithMentor,
      section,
    } = req.body;

    const updated = await prisma.menteeProfile.update({
      where: { id: menteeId },
      data: {
        phone,
        hobbies,
        interests,
        strengths,
        areasForImprovement,
        skills,
        certifications,
        achievements,
        extracurricular,
        projects,
        careerGoals,
        specializationPreference,
        personalDevGoals,
        mentoringPreferences,
        privateNotes,
        shareWithMentor: shareWithMentor !== undefined ? Boolean(shareWithMentor) : true,
        section,
      },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'UPDATE_PROFILE',
      entityType: 'MenteeProfile',
      entityId: menteeId,
      details: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.json({ message: 'Profile updated successfully.', profile: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student profile.' });
  }
};

// Recommendations List
export const getRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    const recommendations = await prisma.recommendation.findMany({
      where: { menteeId },
      orderBy: { createdAt: 'desc' },
      include: {
        mentor: { select: { fullName: true, designation: true, collegeEmail: true } },
        comments: {
          include: {
            author: { select: { id: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        tasks: true,
      },
    });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recommendations.' });
  }
};

// Acknowledge Recommendation
export const acknowledgeRecommendation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    const { id } = req.params;
    const { acknowledgmentNote } = req.body;

    const recommendation = await prisma.recommendation.findFirst({
      where: { id, menteeId },
      include: { mentor: true },
    });

    if (!recommendation) {
      res.status(404).json({ message: 'Recommendation not found.' });
      return;
    }

    const updated = await prisma.recommendation.update({
      where: { id },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgmentNote: acknowledgmentNote || 'Acknowledged by mentee.',
        status: RecommendationStatus.ACKNOWLEDGED,
      },
    });

    // Notify mentor
    await createNotification({
      recipientId: recommendation.mentor.userId,
      title: 'Recommendation Acknowledged',
      message: `Your mentee acknowledged recommendation: "${recommendation.title}"`,
      type: NotificationType.RECOMMENDATION,
      link: `/mentor/mentees/${menteeId}`,
    });

    res.json({ message: 'Recommendation acknowledged.', recommendation: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to acknowledge recommendation.' });
  }
};

// Comment on Recommendation
export const addRecommendationComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const menteeId = req.user?.menteeId;
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Comment content cannot be empty.' });
      return;
    }

    const recommendation = await prisma.recommendation.findFirst({
      where: { id, menteeId },
      include: { mentor: true },
    });

    if (!recommendation) {
      res.status(404).json({ message: 'Recommendation not found.' });
      return;
    }

    const comment = await prisma.recommendationComment.create({
      data: {
        recommendationId: id,
        authorId: userId!,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, email: true, role: true } },
      },
    });

    // Notify mentor
    await createNotification({
      recipientId: recommendation.mentor.userId,
      title: 'New Student Feedback / Comment',
      message: `Student commented on: "${recommendation.title}"`,
      type: NotificationType.RECOMMENDATION,
      link: `/mentor/mentees/${menteeId}`,
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment.' });
  }
};

// Tasks List
export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    const tasks = await prisma.studentTask.findMany({
      where: { menteeId },
      orderBy: { dueDate: 'asc' },
      include: {
        mentor: { select: { fullName: true } },
        recommendation: { select: { title: true } },
      },
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks.' });
  }
};

// Update Task Progress / Evidence
export const updateTaskProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    const { id } = req.params;
    const { progressPercent, evidenceUrl, evidenceNotes, status } = req.body;

    const task = await prisma.studentTask.findFirst({
      where: { id, menteeId },
      include: { mentor: true },
    });

    if (!task) {
      res.status(404).json({ message: 'Task not found.' });
      return;
    }

    const progress = Math.min(100, Math.max(0, parseInt(progressPercent ?? task.progressPercent, 10)));
    const taskStatus = progress === 100 ? TaskStatus.COMPLETED : status || (progress > 0 ? TaskStatus.IN_PROGRESS : TaskStatus.PENDING);

    const updated = await prisma.studentTask.update({
      where: { id },
      data: {
        progressPercent: progress,
        evidenceUrl: evidenceUrl !== undefined ? evidenceUrl : task.evidenceUrl,
        evidenceNotes: evidenceNotes !== undefined ? evidenceNotes : task.evidenceNotes,
        status: taskStatus,
        completedAt: progress === 100 ? new Date() : null,
      },
    });

    if (task.mentor) {
      await createNotification({
        recipientId: task.mentor.userId,
        title: `Task Progress Updated: ${task.title}`,
        message: `Task progress updated to ${progress}% (${taskStatus}).`,
        type: NotificationType.TASK,
        link: `/mentor/mentees/${menteeId}`,
      });
    }

    res.json({ message: 'Task updated successfully.', task: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task progress.' });
  }
};

// Request follow-up meeting with mentor
export const requestMeeting = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    const { preferredDate, preferredMode, agenda } = req.body;

    const assignment = await prisma.mentorMenteeAssignment.findFirst({
      where: { menteeId, status: 'ACTIVE' },
      include: {
        mentor: true,
        mentee: true,
      },
    });

    if (!assignment) {
      res.status(400).json({ message: 'No active mentor assigned to you yet.' });
      return;
    }

    // Create notification for mentor
    await createNotification({
      recipientId: assignment.mentor.userId,
      title: `Meeting Requested by ${assignment.mentee.fullName}`,
      message: `Agenda: ${agenda || 'Follow-up mentoring discussion'} | Mode: ${preferredMode || 'In-Person'} | Preferred Date: ${preferredDate || 'Earliest available'}`,
      type: NotificationType.MEETING,
      link: '/mentor/calendar',
    });

    res.status(200).json({
      message: 'Meeting request successfully communicated to your mentor.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request meeting.' });
  }
};

// Academic Records & Results
export const getAcademicRecords = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    const records = await prisma.academicRecord.findMany({
      where: { menteeId },
      orderBy: [{ semester: 'asc' }, { courseCode: 'asc' }],
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load academic records.' });
  }
};

// Attendance
export const getAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const menteeId = req.user?.menteeId;
    const records = await prisma.attendanceRecord.findMany({
      where: { menteeId },
      orderBy: { courseCode: 'asc' },
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load attendance records.' });
  }
};
