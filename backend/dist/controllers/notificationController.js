"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const prisma_1 = require("../prisma");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const [notifications, unreadCount] = await Promise.all([
            prisma_1.prisma.notification.findMany({
                where: { recipientId: userId },
                orderBy: { createdAt: 'desc' },
                take: 30,
            }),
            prisma_1.prisma.notification.count({
                where: { recipientId: userId, isRead: false },
            }),
        ]);
        res.json({
            notifications,
            unreadCount,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications.' });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const notification = await prisma_1.prisma.notification.findFirst({
            where: { id, recipientId: userId },
        });
        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }
        const updated = await prisma_1.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update notification.' });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId;
        await prisma_1.prisma.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        res.json({ message: 'All notifications marked as read.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to mark notifications as read.' });
    }
};
exports.markAllAsRead = markAllAsRead;
