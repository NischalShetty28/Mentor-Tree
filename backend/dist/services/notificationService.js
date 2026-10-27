"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBulkNotifications = exports.createNotification = void 0;
const prisma_1 = require("../prisma");
const createNotification = async (params) => {
    try {
        return await prisma_1.prisma.notification.create({
            data: {
                recipientId: params.recipientId,
                senderId: params.senderId,
                title: params.title,
                message: params.message,
                type: params.type,
                link: params.link,
            },
        });
    }
    catch (error) {
        console.error('Failed to create notification:', error);
        return null;
    }
};
exports.createNotification = createNotification;
const createBulkNotifications = async (recipientIds, params) => {
    try {
        const data = recipientIds.map((recipientId) => ({
            recipientId,
            senderId: params.senderId,
            title: params.title,
            message: params.message,
            type: params.type,
            link: params.link,
        }));
        return await prisma_1.prisma.notification.createMany({
            data,
        });
    }
    catch (error) {
        console.error('Failed to create bulk notifications:', error);
        return null;
    }
};
exports.createBulkNotifications = createBulkNotifications;
