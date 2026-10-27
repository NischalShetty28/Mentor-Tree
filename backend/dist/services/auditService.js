"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = void 0;
const prisma_1 = require("../prisma");
const logAuditEvent = async (params) => {
    try {
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: params.userId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                details: params.details ? JSON.stringify(params.details) : null,
                ipAddress: params.ipAddress,
            },
        });
    }
    catch (error) {
        console.error('Failed to log audit event:', error);
    }
};
exports.logAuditEvent = logAuditEvent;
