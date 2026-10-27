import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest, Role, NotificationType, ApprovalStatus } from '../types';
import { createNotification } from '../services/notificationService';
import { logAuditEvent } from '../services/auditService';
import { evaluateAllStudents } from '../services/riskEvaluationService';

// Admin & HOD Dashboard
export const getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isHod = req.user?.role === Role.HOD;
    const departmentId = isHod ? req.user?.departmentId : undefined;

    const studentWhere = departmentId ? { departmentId } : {};
    const mentorWhere = departmentId ? { departmentId } : {};

    const [
      totalStudents,
      totalMentors,
      activeAssignmentsCount,
      pendingApprovalsCount,
      criticalRisksCount,
      highRisksCount,
      allDepartments,
    ] = await Promise.all([
      prisma.menteeProfile.count({ where: studentWhere }),
      prisma.mentorProfile.count({ where: mentorWhere }),
      prisma.mentorMenteeAssignment.count({
        where: {
          status: 'ACTIVE',
          ...(departmentId ? { mentee: { departmentId } } : {}),
        },
      }),
      prisma.user.count({ where: { approvalStatus: ApprovalStatus.PENDING } }),
      prisma.menteeProfile.count({
        where: { ...studentWhere, riskLevel: 'CRITICAL', isRiskFlagged: true },
      }),
      prisma.menteeProfile.count({
        where: { ...studentWhere, riskLevel: 'HIGH', isRiskFlagged: true },
      }),
      prisma.department.findMany({
        include: {
          _count: {
            select: { mentees: true, mentors: true },
          },
        },
      }),
    ]);

    // Mentor workload distribution
    const mentorsWithWorkload = await prisma.mentorProfile.findMany({
      where: mentorWhere,
      select: {
        id: true,
        fullName: true,
        facultyId: true,
        designation: true,
        maxMentees: true,
        department: { select: { code: true } },
        _count: {
          select: {
            assignments: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    const mentorWorkload = mentorsWithWorkload.map((m) => ({
      id: m.id,
      name: m.fullName,
      facultyId: m.facultyId,
      department: m.department.code,
      assignedCount: m._count.assignments,
      capacity: m.maxMentees,
      utilizationPercent: Math.round((m._count.assignments / (m.maxMentees || 20)) * 100),
    }));

    // Flagged students for review
    const flaggedStudents = await prisma.menteeProfile.findMany({
      where: {
        ...studentWhere,
        isRiskFlagged: true,
      },
      include: {
        department: true,
        assignments: {
          where: { status: 'ACTIVE' },
          include: { mentor: { select: { fullName: true } } },
        },
        riskAlerts: {
          where: { status: { in: ['NEW', 'UNDER_REVIEW', 'ACTION_PLANNED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Meeting statistics
    const totalMeetings = await prisma.meeting.count({
      where: departmentId ? { mentor: { departmentId } } : {},
    });
    const completedMeetings = await prisma.meeting.count({
      where: {
        status: 'COMPLETED',
        ...(departmentId ? { mentor: { departmentId } } : {}),
      },
    });

    // Semester-wise distribution
    const semesterDistribution = await prisma.menteeProfile.groupBy({
      by: ['semester'],
      where: studentWhere,
      _count: { id: true },
      _avg: { attendancePercent: true, cgpa: true },
      orderBy: { semester: 'asc' },
    });

    res.json({
      summary: {
        totalStudents,
        totalMentors,
        activeAssignmentsCount,
        pendingApprovalsCount,
        unassignedStudentsCount: Math.max(0, totalStudents - activeAssignmentsCount),
        criticalRisksCount,
        highRisksCount,
        totalMeetings,
        completedMeetings,
        completionRate: totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 100,
      },
      mentorWorkload,
      flaggedStudents: flaggedStudents.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        usn: s.usn,
        department: s.department.code,
        semester: s.semester,
        attendancePercent: s.attendancePercent,
        cgpa: s.cgpa,
        riskLevel: s.riskLevel,
        assignedMentor: s.assignments[0]?.mentor?.fullName || 'Unassigned',
        latestTrigger: s.riskAlerts[0]?.triggerReason || 'Under academic review',
      })),
      semesterDistribution: semesterDistribution.map((item) => ({
        semester: `Sem ${item.semester}`,
        studentsCount: item._count.id,
        avgAttendance: item._avg.attendancePercent ? parseFloat(item._avg.attendancePercent.toFixed(1)) : 0,
        avgCgpa: item._avg.cgpa ? parseFloat(item._avg.cgpa.toFixed(2)) : 0,
      })),
      departments: allDepartments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        menteesCount: d._count.mentees,
        mentorsCount: d._count.mentors,
      })),
    });
  } catch (error) {
    console.error('Admin getDashboard error:', error);
    res.status(500).json({ message: 'Failed to load administrator dashboard.' });
  }
};

// All Students with Search and Filter
export const getAllStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isHod = req.user?.role === Role.HOD;
    const departmentId = isHod ? req.user?.departmentId : req.query.departmentId;
    const { search, semester, riskLevel, assignmentStatus } = req.query;

    const whereClause: any = {};

    if (departmentId) {
      whereClause.departmentId = String(departmentId);
    }

    if (semester) {
      whereClause.semester = parseInt(String(semester), 10);
    }

    if (riskLevel && riskLevel !== 'ALL') {
      whereClause.riskLevel = String(riskLevel);
    }

    if (search) {
      const q = String(search).trim();
      whereClause.OR = [
        { fullName: { contains: q } },
        { usn: { contains: q } },
        { collegeEmail: { contains: q } },
      ];
    }

    if (assignmentStatus === 'ASSIGNED') {
      whereClause.assignments = { some: { status: 'ACTIVE' } };
    } else if (assignmentStatus === 'UNASSIGNED') {
      whereClause.assignments = { none: { status: 'ACTIVE' } };
    }

    const students = await prisma.menteeProfile.findMany({
      where: whereClause,
      include: {
        department: true,
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            mentor: { select: { id: true, fullName: true, facultyId: true } },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(
      students.map((s) => ({
        id: s.id,
        fullName: s.fullName,
        usn: s.usn,
        collegeEmail: s.collegeEmail,
        department: s.department.name,
        departmentCode: s.department.code,
        semester: s.semester,
        academicYear: s.academicYear,
        attendancePercent: s.attendancePercent,
        cgpa: s.cgpa,
        isRiskFlagged: s.isRiskFlagged,
        riskLevel: s.riskLevel,
        assignedMentor: s.assignments[0]?.mentor || null,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students list.' });
  }
};

// All Mentors
export const getAllMentors = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isHod = req.user?.role === Role.HOD;
    const departmentId = isHod ? req.user?.departmentId : req.query.departmentId;

    const whereClause = departmentId ? { departmentId: String(departmentId) } : {};

    const mentors = await prisma.mentorProfile.findMany({
      where: whereClause,
      include: {
        department: true,
        _count: {
          select: {
            assignments: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(
      mentors.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        facultyId: m.facultyId,
        collegeEmail: m.collegeEmail,
        phone: m.phone,
        department: m.department.name,
        departmentCode: m.department.code,
        designation: m.designation,
        officeLocation: m.officeLocation,
        maxMentees: m.maxMentees,
        activeMenteesCount: m._count.assignments,
        isCapacityFull: m._count.assignments >= m.maxMentees,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch mentors.' });
  }
};

// Create / Reassign Mentor Assignment
export const createAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { mentorId, menteeIds, notes } = req.body;

    if (!mentorId || !menteeIds || !Array.isArray(menteeIds) || menteeIds.length === 0) {
      res.status(400).json({ message: 'Mentor ID and at least one mentee ID are required.' });
      return;
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { id: mentorId },
      include: { user: true },
    });

    if (!mentor) {
      res.status(404).json({ message: 'Mentor not found.' });
      return;
    }

    // Process assignments in transaction
    const results = await prisma.$transaction(async (tx) => {
      const createdAssignments = [];

      for (const menteeId of menteeIds) {
        // Deactivate previous active assignments
        await tx.mentorMenteeAssignment.updateMany({
          where: { menteeId, status: 'ACTIVE' },
          data: { status: 'TRANSFERRED' },
        });

        // Create new assignment
        const newAssignment = await tx.mentorMenteeAssignment.create({
          data: {
            mentorId,
            menteeId,
            status: 'ACTIVE',
            assignedBy: req.user?.userId,
            notes,
          },
          include: {
            mentee: { select: { fullName: true, userId: true } },
          },
        });

        createdAssignments.push(newAssignment);

        // Notify student
        await createNotification({
          recipientId: newAssignment.mentee.userId,
          title: 'Mentor Assignment Assigned',
          message: `${mentor.fullName} has been assigned as your academic mentor.`,
          type: NotificationType.ASSIGNMENT,
          link: '/mentee/dashboard',
        });
      }

      return createdAssignments;
    });

    // Notify mentor
    await createNotification({
      recipientId: mentor.userId,
      title: 'New Mentees Assigned',
      message: `${results.length} new student(s) have been assigned to your mentoring roster.`,
      type: NotificationType.ASSIGNMENT,
      link: '/mentor/mentees',
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'ASSIGN_MENTOR',
      entityType: 'MentorMenteeAssignment',
      details: { mentorId, menteeCount: menteeIds.length, menteeIds },
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: `Successfully assigned ${results.length} student(s) to ${mentor.fullName}.`,
      assignments: results,
    });
  } catch (error) {
    console.error('createAssignment error:', error);
    res.status(500).json({ message: 'Failed to assign mentor.' });
  }
};

// Remove Assignment
export const removeAssignment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await prisma.mentorMenteeAssignment.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'REMOVE_ASSIGNMENT',
      entityType: 'MentorMenteeAssignment',
      entityId: id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Assignment successfully deactivated.', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate assignment.' });
  }
};

// Registration Requests (Pending Approvals)
export const getRegistrationRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { approvalStatus: ApprovalStatus.PENDING },
      include: {
        mentorProfile: { include: { department: true } },
        adminProfile: { include: { department: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      pendingUsers.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        details:
          u.role === Role.MENTOR
            ? {
                fullName: u.mentorProfile?.fullName,
                identifier: u.mentorProfile?.facultyId,
                department: u.mentorProfile?.department.name,
                designation: u.mentorProfile?.designation,
              }
            : {
                fullName: u.adminProfile?.fullName,
                identifier: u.adminProfile?.employeeId,
                department: u.adminProfile?.department?.name || 'Institutional',
                designation: u.adminProfile?.administrativeDesignation,
              },
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch registration requests.' });
  }
};

// Approve or Reject Registration Request
export const updateRegistrationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Status must be APPROVED or REJECTED.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: status },
    });

    await logAuditEvent({
      userId: req.user?.userId,
      action: `REGISTRATION_${status}`,
      entityType: 'User',
      entityId: userId,
      details: { newStatus: status },
      ipAddress: req.ip,
    });

    // Notify user
    await createNotification({
      recipientId: userId,
      title: `Account Registration ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      message:
        status === 'APPROVED'
          ? 'Your institutional account has been approved. You can now access all features.'
          : 'Your account registration was declined by administration.',
      type: NotificationType.APPROVAL,
    });

    res.json({ message: `Registration has been ${status.toLowerCase()}.`, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update registration status.' });
  }
};

// Audit Logs
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, action, page = '1', limit = '30' } = req.query;

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};
    if (action) whereClause.action = String(action);
    if (search) {
      whereClause.OR = [
        { action: { contains: String(search) } },
        { entityType: { contains: String(search) } },
        { user: { email: { contains: String(search) } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: { select: { email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load audit logs.' });
  }
};

// Trigger Global Academic Risk Evaluation
export const triggerRiskEvaluation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await evaluateAllStudents();
    await logAuditEvent({
      userId: req.user?.userId,
      action: 'TRIGGER_GLOBAL_RISK_EVALUATION',
      entityType: 'System',
      ipAddress: req.ip,
    });

    res.json({ message: 'Academic risk evaluation successfully executed across all student records.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to run risk evaluation.' });
  }
};

// Thresholds
export const getRiskThresholds = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const config =
      (await prisma.riskThresholdConfig.findFirst({
        where: { departmentId: null },
      })) || {
        minAttendancePercent: 75.0,
        minCgpa: 6.5,
        maxFailedSubjects: 1,
        maxConsecutiveAbsences: 2,
      };

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load risk thresholds.' });
  }
};

export const updateRiskThresholds = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { minAttendancePercent, minCgpa, maxFailedSubjects, maxConsecutiveAbsences } = req.body;

    const existing = await prisma.riskThresholdConfig.findFirst({
      where: { departmentId: null },
    });

    const data = {
      minAttendancePercent: parseFloat(minAttendancePercent),
      minCgpa: parseFloat(minCgpa),
      maxFailedSubjects: parseInt(maxFailedSubjects, 10),
      maxConsecutiveAbsences: parseInt(maxConsecutiveAbsences, 10),
      updatedBy: req.user?.userId,
    };

    let updated;
    if (existing) {
      updated = await prisma.riskThresholdConfig.update({
        where: { id: existing.id },
        data,
      });
    } else {
      updated = await prisma.riskThresholdConfig.create({
        data,
      });
    }

    await logAuditEvent({
      userId: req.user?.userId,
      action: 'UPDATE_RISK_THRESHOLDS',
      entityType: 'RiskThresholdConfig',
      entityId: updated.id,
      details: data,
      ipAddress: req.ip,
    });

    res.json({ message: 'Thresholds updated successfully.', config: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update risk thresholds.' });
  }
};
