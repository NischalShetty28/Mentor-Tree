import { prisma } from '../prisma';

export const logAuditEvent = async (params: {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};
