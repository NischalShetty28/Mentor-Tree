import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../types';

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification.' });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notifications as read.' });
  }
};
