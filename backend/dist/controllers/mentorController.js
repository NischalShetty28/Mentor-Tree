"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTask = exports.createPrivateNote = exports.createTask = exports.createRecommendation = exports.getMenteeDetail = exports.getAssignedMentees = exports.getDashboard = void 0;
const prisma_1 = require("../prisma");
const types_1 = require("../types");
const notificationService_1 = require("../services/notificationService");
const auditService_1 = require("../services/auditService");
const riskEvaluationService_1 = require("../services/riskEvaluationService");
// Mentor Dashboard
const getDashboard = async (req, res) => {
    try {
        const mentorId = req.user?.mentorId;
        if (!mentorId) {
            res.status(403).json({ message: 'Mentor profile not associated with this account.' });
            return;
        }
        // Get active assignments
        const assignments = await prisma_1.prisma.mentorMenteeAssignment.findMany({
            where: { mentorId, status: 'ACTIVE' },
            include: {
                mentee: {
                    include: {
                        department: true,
                        riskAlerts: {
                            where: { status: { in: ['NEW', 'UNDER_REVIEW', 'ACTION_PLANNED'] } },
                        },
                        tasks: {
                            where: { status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
                        },
                    },
                },
            },
        });
        const menteeIds = assignments.map((a) => a.menteeId);
        // Refresh risks
        for (const id of menteeIds) {
            await (0, riskEvaluationService_1.evaluateStudentRisk)(id);
        }
        // Refetch assigned mentees with updated risks
        const mentees = await prisma_1.prisma.menteeProfile.findMany({
            where: { id: { in: menteeIds } },
            include: {
                department: true,
                riskAlerts: {
                    where: { status: { in: ['NEW', 'UNDER_REVIEW', 'ACTION_PLANNED'] } },
                    orderBy: { createdAt: 'desc' },
                },
                tasks: true,
            },
        });
        // Upcoming meetings
        const now = new Date();
        const upcomingMeetings = await prisma_1.prisma.meeting.findMany({
            where: {
                mentorId,
                scheduledAt: { gte: now },
                status: 'SCHEDULED',
            },
            orderBy: { scheduledAt: 'asc' },
            include: {
                attendees: {
                    include: {
                        mentee: { select: { id: true, fullName: true, usn: true } },
                    },
                },
            },
            take: 5,
        });
        // Students requiring attention: Risk flagged or attendance < 75% or CGPA < 6.5
        const studentsRequiringAttention = mentees.filter((m) => m.isRiskFlagged || (m.attendancePercent !== null && m.attendancePercent < 75) || (m.cgpa !== null && m.cgpa < 6.5));
        // Attendance concerns
        const attendanceConcerns = mentees.filter((m) => m.attendancePercent !== null && m.attendancePercent < 75);
        // Incomplete tasks
        const allTasks = await prisma_1.prisma.studentTask.findMany({
            where: {
                menteeId: { in: menteeIds },
                status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] },
            },
            include: {
                mentee: { select: { fullName: true, usn: true } },
            },
            orderBy: { dueDate: 'asc' },
        });
        // Pending recommendations awaiting acknowledgment
        const pendingRecommendations = await prisma_1.prisma.recommendation.findMany({
            where: {
                mentorId,
                isAcknowledged: false,
            },
            include: {
                mentee: { select: { fullName: true, usn: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Academic performance trend average
        let totalCgpa = 0;
        let totalAttendance = 0;
        let countWithMetrics = 0;
        mentees.forEach((m) => {
            if (m.cgpa)
                totalCgpa += m.cgpa;
            if (m.attendancePercent)
                totalAttendance += m.attendancePercent;
            if (m.cgpa || m.attendancePercent)
                countWithMetrics++;
        });
        const averageCgpa = countWithMetrics > 0 ? (totalCgpa / countWithMetrics).toFixed(2) : '0.00';
        const averageAttendance = countWithMetrics > 0 ? (totalAttendance / countWithMetrics).toFixed(1) : '100.0';
        res.json({
            metrics: {
                totalMentees: mentees.length,
                attentionCount: studentsRequiringAttention.length,
                upcomingMeetingsCount: upcomingMeetings.length,
                pendingFollowupsCount: pendingRecommendations.length,
                attendanceConcernsCount: attendanceConcerns.length,
                incompleteTasksCount: allTasks.length,
                averageCgpa: parseFloat(averageCgpa),
                averageAttendance: parseFloat(averageAttendance),
            },
            studentsRequiringAttention: studentsRequiringAttention.map((m) => ({
                id: m.id,
                fullName: m.fullName,
                usn: m.usn,
                department: m.department.code,
                semester: m.semester,
                attendancePercent: m.attendancePercent,
                cgpa: m.cgpa,
                riskLevel: m.riskLevel,
                riskAlerts: m.riskAlerts,
            })),
            upcomingMeetings,
            pendingRecommendations,
            incompleteTasks: allTasks.slice(0, 8),
            attendanceConcerns: attendanceConcerns.map((m) => ({
                id: m.id,
                fullName: m.fullName,
                usn: m.usn,
                attendancePercent: m.attendancePercent,
            })),
        });
    }
    catch (error) {
        console.error('Mentor getDashboard error:', error);
        res.status(500).json({ message: 'Failed to load mentor dashboard.' });
    }
};
exports.getDashboard = getDashboard;
// List Assigned Mentees with Filters
const getAssignedMentees = async (req, res) => {
    try {
        const mentorId = req.user?.mentorId;
        if (!mentorId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        const { search, semester, riskLevel, attendanceRange } = req.query;
        const assignments = await prisma_1.prisma.mentorMenteeAssignment.findMany({
            where: { mentorId, status: 'ACTIVE' },
            select: { menteeId: true },
        });
        const menteeIds = assignments.map((a) => a.menteeId);
        const whereClause = {
            id: { in: menteeIds },
        };
        if (search) {
            const q = String(search).trim();
            whereClause.OR = [
                { fullName: { contains: q } },
                { usn: { contains: q } },
                { collegeEmail: { contains: q } },
            ];
        }
        if (semester) {
            whereClause.semester = parseInt(String(semester), 10);
        }
        if (riskLevel && riskLevel !== 'ALL') {
            whereClause.riskLevel = String(riskLevel);
        }
        if (attendanceRange) {
            if (attendanceRange === 'LOW') {
                whereClause.attendancePercent = { lt: 75.0 };
            }
            else if (attendanceRange === 'MEDIUM') {
                whereClause.attendancePercent = { gte: 75.0, lte: 85.0 };
            }
            else if (attendanceRange === 'HIGH') {
                whereClause.attendancePercent = { gt: 85.0 };
            }
        }
        const mentees = await prisma_1.prisma.menteeProfile.findMany({
            where: whereClause,
            include: {
                department: true,
                riskAlerts: {
                    where: { status: { in: ['NEW', 'UNDER_REVIEW', 'ACTION_PLANNED'] } },
                },
                tasks: {
                    select: { id: true, status: true },
                },
                recommendations: {
                    select: { id: true, isAcknowledged: true },
                },
            },
            orderBy: { fullName: 'asc' },
        });
        res.json(mentees.map((m) => ({
            id: m.id,
            fullName: m.fullName,
            usn: m.usn,
            collegeEmail: m.collegeEmail,
            phone: m.phone,
            department: m.department.name,
            departmentCode: m.department.code,
            semester: m.semester,
            academicYear: m.academicYear,
            section: m.section,
            cgpa: m.cgpa,
            sgpa: m.sgpa,
            attendancePercent: m.attendancePercent,
            isRiskFlagged: m.isRiskFlagged,
            riskLevel: m.riskLevel,
            activeAlertsCount: m.riskAlerts.length,
            pendingTasksCount: m.tasks.filter((t) => t.status !== 'COMPLETED').length,
            unacknowledgedRecsCount: m.recommendations.filter((r) => !r.isAcknowledged).length,
        })));
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch assigned mentees.' });
    }
};
exports.getAssignedMentees = getAssignedMentees;
// Complete Mentee Detail (Scoped strictly to assigned mentor or Admin)
const getMenteeDetail = async (req, res) => {
    try {
        const mentorId = req.user?.mentorId;
        const { menteeId } = req.params;
        // Check authorization: Mentor can only view assigned student unless Admin/HOD
        if (req.user?.role === 'MENTOR') {
            const assignment = await prisma_1.prisma.mentorMenteeAssignment.findFirst({
                where: {
                    mentorId,
                    menteeId,
                    status: 'ACTIVE',
                },
            });
            if (!assignment) {
                res.status(403).json({
                    message: 'Access Denied: You are not assigned to mentor this student.',
                });
                return;
            }
        }
        // Refresh student risk
        await (0, riskEvaluationService_1.evaluateStudentRisk)(menteeId);
        const mentee = await prisma_1.prisma.menteeProfile.findUnique({
            where: { id: menteeId },
            include: {
                department: true,
                academicRecords: {
                    orderBy: [{ semester: 'asc' }, { courseCode: 'asc' }],
                },
                attendanceRecords: {
                    orderBy: { courseCode: 'asc' },
                },
                recommendations: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        comments: {
                            include: { author: { select: { id: true, email: true, role: true } } },
                        },
                        tasks: true,
                    },
                },
                tasks: {
                    orderBy: { dueDate: 'asc' },
                },
                meetingAttendees: {
                    include: {
                        meeting: {
                            include: { mentor: { select: { fullName: true } } },
                        },
                    },
                    orderBy: { meeting: { scheduledAt: 'desc' } },
                },
                riskAlerts: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!mentee) {
            res.status(404).json({ message: 'Student profile not found.' });
            return;
        }
        // Fetch private faculty notes (Visible ONLY to mentor / admin)
        const privateNotes = await prisma_1.prisma.mentorPrivateNote.findMany({
            where: {
                menteeId,
                ...(req.user?.role === 'MENTOR' ? { mentorId } : {}),
            },
            include: {
                mentor: { select: { fullName: true, designation: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Sanitize: Do NOT leak mentee's private personal notes if shareWithMentor is false
        const sanitizedMentee = {
            ...mentee,
            privateNotes: undefined, // Mentee's internal private journal is excluded
            hobbies: mentee.shareWithMentor ? mentee.hobbies : '[Private]',
            interests: mentee.shareWithMentor ? mentee.interests : '[Private]',
            strengths: mentee.shareWithMentor ? mentee.strengths : '[Private]',
            areasForImprovement: mentee.shareWithMentor ? mentee.areasForImprovement : '[Private]',
            careerGoals: mentee.shareWithMentor ? mentee.careerGoals : '[Private]',
            personalDevGoals: mentee.shareWithMentor ? mentee.personalDevGoals : '[Private]',
            mentoringPreferences: mentee.shareWithMentor ? mentee.mentoringPreferences : '[Private]',
        };
        // Calculate semester-by-semester trends
        const semesterTrends = {};
        mentee.academicRecords.forEach((rec) => {
            if (!semesterTrends[rec.semester]) {
                semesterTrends[rec.semester] = {
                    semester: rec.semester,
                    sgpa: rec.sgpa || 0,
                    courses: [],
                };
            }
            semesterTrends[rec.semester].courses.push(rec);
            if (rec.sgpa)
                semesterTrends[rec.semester].sgpa = rec.sgpa;
        });
        res.json({
            mentee: sanitizedMentee,
            privateFacultyNotes: privateNotes,
            semesterTrends: Object.values(semesterTrends).sort((a, b) => a.semester - b.semester),
        });
    }
    catch (error) {
        console.error('getMenteeDetail error:', error);
        res.status(500).json({ message: 'Failed to retrieve mentee detail.' });
    }
};
exports.getMenteeDetail = getMenteeDetail;
// Create Student-Visible Recommendation
const createRecommendation = async (req, res) => {
    try {
        const mentorId = req.user?.mentorId;
        const { menteeId, title, description, category } = req.body;
        if (!mentorId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        if (!title || !description || !menteeId) {
            res.status(400).json({ message: 'Title, description, and mentee ID are required.' });
            return;
        }
        // Check assignment
        const assignment = await prisma_1.prisma.mentorMenteeAssignment.findFirst({
            where: { mentorId, menteeId, status: 'ACTIVE' },
            include: { mentee: { select: { userId: true, fullName: true } } },
        });
        if (!assignment && req.user?.role === 'MENTOR') {
            res.status(403).json({ message: 'You are not assigned to this mentee.' });
            return;
        }
        const recommendation = await prisma_1.prisma.recommendation.create({
            data: {
                mentorId,
                menteeId,
                title,
                description,
                category: category || 'Academic',
                status: types_1.RecommendationStatus.OPEN,
            },
            include: {
                mentor: { select: { fullName: true } },
            },
        });
        // Notify mentee
        const menteeUser = await prisma_1.prisma.menteeProfile.findUnique({
            where: { id: menteeId },
            select: { userId: true },
        });
        if (menteeUser) {
            await (0, notificationService_1.createNotification)({
                recipientId: menteeUser.userId,
                title: 'New Mentor Recommendation',
                message: `Your mentor added a recommendation: "${title}"`,
                type: types_1.NotificationType.RECOMMENDATION,
                link: '/mentee/recommendations',
            });
        }
        await (0, auditService_1.logAuditEvent)({
            userId: req.user?.userId,
            action: 'CREATE_RECOMMENDATION',
            entityType: 'Recommendation',
            entityId: recommendation.id,
            details: { menteeId, title },
            ipAddress: req.ip,
        });
        res.status(201).json(recommendation);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create recommendation.' });
    }
};
exports.createRecommendation = createRecommendation;
// Create Action Item / Task
const createTask = async (req, res) => {
    try {
        const mentorId = req.user?.mentorId;
        const { menteeId, title, description, priority, dueDate, recommendationId } = req.body;
        if (!title || !menteeId) {
            res.status(400).json({ message: 'Title and mentee ID are required.' });
            return;
        }
        const task = await prisma_1.prisma.studentTask.create({
            data: {
                mentorId,
                menteeId,
                recommendationId: recommendationId || null,
                title,
                description,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                status: types_1.TaskStatus.PENDING,
            },
        });
        // Notify student
        const menteeUser = await prisma_1.prisma.menteeProfile.findUnique({
            where: { id: menteeId },
            select: { userId: true },
        });
        if (menteeUser) {
            await (0, notificationService_1.createNotification)({
                recipientId: menteeUser.userId,
                title: 'New Action Item Assigned',
                message: `New task assigned: "${title}". Due date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'None'}`,
                type: types_1.NotificationType.TASK,
                link: '/mentee/tasks',
            });
        }
        await (0, auditService_1.logAuditEvent)({
            userId: req.user?.userId,
            action: 'ASSIGN_TASK',
            entityType: 'StudentTask',
            entityId: task.id,
            details: { menteeId, title, priority },
            ipAddress: req.ip,
        });
        res.status(201).json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create task.' });
    }
};
exports.createTask = createTask;
// Create Private Faculty Note (Visible ONLY to faculty / mentor)
const createPrivateNote = async (req, res) => {
    try {
        const mentorId = req.user?.mentorId;
        const { menteeId, title, content, category } = req.body;
        if (!mentorId) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        if (!title || !content || !menteeId) {
            res.status(400).json({ message: 'Title, content, and mentee ID are required.' });
            return;
        }
        const note = await prisma_1.prisma.mentorPrivateNote.create({
            data: {
                mentorId,
                menteeId,
                title,
                content,
                category: category || 'General',
                isConfidential: true,
            },
        });
        await (0, auditService_1.logAuditEvent)({
            userId: req.user?.userId,
            action: 'CREATE_FACULTY_PRIVATE_NOTE',
            entityType: 'MentorPrivateNote',
            entityId: note.id,
            details: { menteeId, title },
            ipAddress: req.ip,
        });
        res.status(201).json(note);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to save faculty note.' });
    }
};
exports.createPrivateNote = createPrivateNote;
// Verify Task
const verifyTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { verified } = req.body;
        const task = await prisma_1.prisma.studentTask.update({
            where: { id },
            data: {
                verifiedByMentor: verified !== undefined ? Boolean(verified) : true,
            },
        });
        res.json({ message: 'Task verification updated.', task });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to verify task.' });
    }
};
exports.verifyTask = verifyTask;
