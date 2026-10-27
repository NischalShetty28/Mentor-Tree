import { prisma } from '../prisma';
import { NotificationType } from '../types';

export const createNotification = async (params: {
  recipientId: string;
  senderId?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}) => {
  try {
    return await prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        senderId: params.senderId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

export const createBulkNotifications = async (
  recipientIds: string[],
  params: {
    senderId?: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
  }
) => {
  try {
    const data = recipientIds.map((recipientId) => ({
      recipientId,
      senderId: params.senderId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
    }));
    return await prisma.notification.createMany({
      data,
    });
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    return null;
  }
};
