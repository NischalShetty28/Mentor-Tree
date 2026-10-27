"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRiskAlertStatus = exports.getRiskAlerts = void 0;
const prisma_1 = require("../prisma");
const types_1 = require("../types");
const notificationService_1 = require("../services/notificationService");
const auditService_1 = require("../services/auditService");
// Get Academic Risk Alerts
const getRiskAlerts = async (req, res) => {
    try {
        const role = req.user?.role;
        const { status, severity, departmentId } = req.query;
        const whereClause = {};
        if (status && status !== 'ALL')
            whereClause.status = String(status);
        if (severity && severity !== 'ALL')
            whereClause.severity = String(severity);
        if (role === types_1.Role.MENTEE) {
            whereClause.menteeId = req.user?.menteeId;
        }
        else if (role === types_1.Role.MENTOR) {
            const assignments = await prisma_1.prisma.mentorMenteeAssignment.findMany({
                where: { mentorId: req.user?.mentorId, status: 'ACTIVE' },
                select: { menteeId: true },
            });
            whereClause.menteeId = { in: assignments.map((a) => a.menteeId) };
        }
        else if (role === types_1.Role.HOD && req.user?.departmentId) {
            whereClause.mentee = { departmentId: req.user.departmentId };
        }
        else if (departmentId) {
            whereClause.mentee = { departmentId: String(departmentId) };
        }
        const alerts = await prisma_1.prisma.academicRiskAlert.findMany({
            where: whereClause,
            include: {
                mentee: {
                    include: {
                        department: true,
                        assignments: {
                            where: { status: 'ACTIVE' },
                            include: { mentor: { select: { fullName: true } } },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to retrieve academic risk alerts.' });
    }
};
exports.getRiskAlerts = getRiskAlerts;
// Update Academic Risk Alert Workflow Status
const updateRiskAlertStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reviewNotes, actionPlan } = req.body;
        const validStatuses = ['NEW', 'UNDER_REVIEW', 'ACTION_PLANNED', 'RESOLVED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: 'Invalid risk alert status.' });
            return;
        }
        const alert = await prisma_1.prisma.academicRiskAlert.findUnique({
            where: { id },
            include: { mentee: true },
        });
        if (!alert) {
            res.status(404).json({ message: 'Risk alert not found.' });
            return;
        }
        const updated = await prisma_1.prisma.academicRiskAlert.update({
            where: { id },
            data: {
                status,
                reviewNotes: reviewNotes !== undefined ? reviewNotes : alert.reviewNotes,
                actionPlan: actionPlan !== undefined ? actionPlan : alert.actionPlan,
                reviewedBy: req.user?.userId,
                resolvedAt: status === 'RESOLVED' ? new Date() : null,
            },
        });
        // If resolved, verify if mentee has other active alerts before clearing flag
        if (status === 'RESOLVED') {
            const otherActiveAlerts = await prisma_1.prisma.academicRiskAlert.count({
                where: {
                    menteeId: alert.menteeId,
                    status: { in: ['NEW', 'UNDER_REVIEW', 'ACTION_PLANNED'] },
                    id: { not: id },
                },
            });
            if (otherActiveAlerts === 0) {
                await prisma_1.prisma.menteeProfile.update({
                    where: { id: alert.menteeId },
                    data: { isRiskFlagged: false, riskLevel: 'NONE' },
                });
            }
        }
        // Send notification to mentee
        await (0, notificationService_1.createNotification)({
            recipientId: alert.mentee.userId,
            title: `Academic Review Status: ${status.replace('_', ' ')}`,
            message: `Your academic risk review status has been updated to "${status.replace('_', ' ')}". Action Plan: ${actionPlan || 'Under mentor monitoring.'}`,
            type: types_1.NotificationType.RISK_ALERT,
            link: '/mentee/dashboard',
        });
        await (0, auditService_1.logAuditEvent)({
            userId: req.user?.userId,
            action: 'UPDATE_RISK_ALERT_STATUS',
            entityType: 'AcademicRiskAlert',
            entityId: id,
            details: { newStatus: status, menteeId: alert.menteeId },
            ipAddress: req.ip,
        });
        res.json({ message: 'Academic risk status updated.', alert: updated });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update alert status.' });
    }
};
exports.updateRiskAlertStatus = updateRiskAlertStatus;
