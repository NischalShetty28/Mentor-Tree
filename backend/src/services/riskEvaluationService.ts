import { prisma } from '../prisma';
import { RiskLevel, RiskAlertStatus, NotificationType } from '../types';
import { createNotification } from './notificationService';

export const evaluateStudentRisk = async (menteeId: string) => {
  const mentee = await prisma.menteeProfile.findUnique({
    where: { id: menteeId },
    include: {
      user: true,
      department: true,
      academicRecords: true,
      attendanceRecords: true,
      meetingAttendees: {
        include: {
          meeting: true,
        },
      },
      assignments: {
        where: { status: 'ACTIVE' },
        include: { mentor: { include: { user: true } } },
      },
    },
  });

  if (!mentee) return null;

  // Retrieve threshold configs for department or fallback to global
  const config =
    (await prisma.riskThresholdConfig.findUnique({
      where: { departmentId: mentee.departmentId },
    })) ||
    (await prisma.riskThresholdConfig.findFirst({
      where: { departmentId: null },
    })) || {
      minAttendancePercent: 75.0,
      minCgpa: 6.5,
      maxFailedSubjects: 1,
      maxConsecutiveAbsences: 2,
    };

  const riskTriggers: string[] = [];
  let calculatedRisk: RiskLevel = RiskLevel.NONE;

  const severityRank: Record<RiskLevel, number> = {
    [RiskLevel.NONE]: 0,
    [RiskLevel.LOW]: 1,
    [RiskLevel.MEDIUM]: 2,
    [RiskLevel.HIGH]: 3,
    [RiskLevel.CRITICAL]: 4,
  };

  const elevateRisk = (level: RiskLevel) => {
    if (severityRank[level] > severityRank[calculatedRisk]) {
      calculatedRisk = level;
    }
  };

  // 1. Attendance Check
  const currentAttendance = mentee.attendancePercent || 100.0;
  if (currentAttendance < 65.0) {
    riskTriggers.push(`Severe overall attendance shortage: ${currentAttendance.toFixed(1)}% (Threshold: ${config.minAttendancePercent}%)`);
    elevateRisk(RiskLevel.CRITICAL);
  } else if (currentAttendance < config.minAttendancePercent) {
    riskTriggers.push(`Attendance below threshold: ${currentAttendance.toFixed(1)}% (Threshold: ${config.minAttendancePercent}%)`);
    elevateRisk(RiskLevel.HIGH);
  }

  // Check subject-wise attendance shortages
  const shortageSubjects = mentee.attendanceRecords.filter((rec) => rec.isShortage || rec.attendancePercent < config.minAttendancePercent);
  if (shortageSubjects.length > 0) {
    riskTriggers.push(
      `Course attendance shortage in: ${shortageSubjects.map((s) => `${s.courseCode} (${s.attendancePercent.toFixed(1)}%)`).join(', ')}`
    );
    elevateRisk(RiskLevel.MEDIUM);
  }

  // 2. CGPA / SGPA Check
  const currentCgpa = mentee.cgpa || 0.0;
  if (currentCgpa > 0 && currentCgpa < 5.0) {
    riskTriggers.push(`Critically low CGPA: ${currentCgpa.toFixed(2)} (Threshold: ${config.minCgpa})`);
    elevateRisk(RiskLevel.CRITICAL);
  } else if (currentCgpa > 0 && currentCgpa < config.minCgpa) {
    riskTriggers.push(`CGPA below academic threshold: ${currentCgpa.toFixed(2)} (Threshold: ${config.minCgpa})`);
    elevateRisk(RiskLevel.HIGH);
  }

  // 3. Failed courses check
  const failedCourses = mentee.academicRecords.filter((rec) => !rec.isPassed || (rec.grade && rec.grade.toUpperCase() === 'F'));
  if (failedCourses.length > config.maxFailedSubjects) {
    riskTriggers.push(`Multiple course backlogs (${failedCourses.length} subjects: ${failedCourses.map((c) => c.courseCode).join(', ')})`);
    elevateRisk(RiskLevel.HIGH);
  }

  // 4. Consecutive Mentoring Absences
  const sortedMeetingAttendees = [...mentee.meetingAttendees].sort(
    (a, b) => new Date(b.meeting.scheduledAt).getTime() - new Date(a.meeting.scheduledAt).getTime()
  );
  let consecutiveAbsences = 0;
  for (const att of sortedMeetingAttendees) {
    if (att.attendanceStatus === 'ABSENT') {
      consecutiveAbsences++;
    } else if (att.attendanceStatus === 'PRESENT') {
      break;
    }
  }

  if (consecutiveAbsences >= config.maxConsecutiveAbsences) {
    riskTriggers.push(`Missed ${consecutiveAbsences} consecutive mentoring sessions`);
    elevateRisk(RiskLevel.MEDIUM);
  }

  const isFlagged = riskTriggers.length > 0 && calculatedRisk !== RiskLevel.NONE;

  // Update mentee profile
  await prisma.menteeProfile.update({
    where: { id: menteeId },
    data: {
      isRiskFlagged: isFlagged,
      riskLevel: calculatedRisk,
    },
  });

  // If flagged, check if an unresolved alert already exists
  if (isFlagged) {
    const existingActiveAlert = await prisma.academicRiskAlert.findFirst({
      where: {
        menteeId,
        status: { in: ['NEW', 'UNDER_REVIEW', 'ACTION_PLANNED'] },
      },
    });

    const triggerSummary = riskTriggers.join('; ');
    const metricsSnapshot = JSON.stringify({
      cgpa: mentee.cgpa,
      attendancePercent: mentee.attendancePercent,
      failedCoursesCount: failedCourses.length,
      consecutiveAbsences,
      evaluatedAt: new Date().toISOString(),
    });

    if (!existingActiveAlert) {
      const newAlert = await prisma.academicRiskAlert.create({
        data: {
          menteeId,
          severity: calculatedRisk,
          triggerReason: triggerSummary,
          metricsSnapshot,
          status: RiskAlertStatus.NEW,
        },
      });

      // Send alert notification to student and mentor
      await createNotification({
        recipientId: mentee.userId,
        title: 'Academic Attention Advisory',
        message: `An academic alert was triggered: ${riskTriggers[0]}. Please connect with your mentor.`,
        type: NotificationType.RISK_ALERT,
        link: '/mentee/dashboard',
      });

      const activeMentor = mentee.assignments[0]?.mentor;
      if (activeMentor) {
        await createNotification({
          recipientId: activeMentor.userId,
          title: `Academic Risk Alert: ${mentee.fullName} (${mentee.usn})`,
          message: `${mentee.fullName} has been flagged for ${calculatedRisk} risk: ${riskTriggers[0]}`,
          type: NotificationType.RISK_ALERT,
          link: `/mentor/mentees/${mentee.id}`,
        });
      }

      return newAlert;
    } else {
      // Update existing alert severity & reasons
      await prisma.academicRiskAlert.update({
        where: { id: existingActiveAlert.id },
        data: {
          severity: calculatedRisk,
          triggerReason: triggerSummary,
          metricsSnapshot,
        },
      });
    }
  }

  return null;
};

export const evaluateAllStudents = async () => {
  const mentees = await prisma.menteeProfile.findMany({ select: { id: true } });
  for (const mentee of mentees) {
    await evaluateStudentRisk(mentee.id);
  }
};
