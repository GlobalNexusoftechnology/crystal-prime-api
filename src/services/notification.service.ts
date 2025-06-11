import { AppDataSource } from '../utils/data-source';
import { Notification, NotificationType } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import AppError from '../utils/appError';

const notificationRepo = AppDataSource.getRepository(Notification);
const userRepo = AppDataSource.getRepository(User);

export const NotificationService = () => {
  // Create a new notification
  const createNotification = async (
    userId: string,
    type: NotificationType,
    message: string,
    metadata?: Record<string, any>
  ) => {
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const notification = notificationRepo.create({
      type,
      message,
      metadata,
      user,
      userId,
    });

    return await notificationRepo.save(notification);
  };

  // Get all notifications for a user
  const getUserNotifications = async (userId: string) => {
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user) throw new AppError(404, 'User not found');

    let notifications;
    
    if (user.role?.role === 'admin') {
      // For admin users, show:
      // 1. Quotation sent notifications (FOLLOWUP_CREATED with AWAITING_RESPONSE status)
      // 2. Business done notifications (FOLLOWUP_CREATED with COMPLETED status)
      notifications = await notificationRepo.find({
        where: [
          {
            type: NotificationType.FOLLOWUP_CREATED,
            metadata: { status: 'AWAITING RESPONSE' },
            deleted: false
          },
          {
            type: NotificationType.FOLLOWUP_CREATED,
            metadata: { status: 'COMPLETED' },
            deleted: false
          }
        ],
        order: { created_at: 'DESC' },
        relations: ['user', 'user.role']
      });
    } else if (user.role?.role === 'staff') {
      // For staff users, show:
      // 1. Lead assigned notifications (LEAD_ASSIGNED)
      // 2. Lead escalated notifications (LEAD_UPDATED with escalate_to)
      notifications = await notificationRepo.find({
        where: [
          {
            type: NotificationType.LEAD_ASSIGNED,
            deleted: false
          },
          {
            type: NotificationType.LEAD_UPDATED,
            metadata: { escalatedBy: { $exists: true } },
            deleted: false
          }
        ],
        order: { created_at: 'DESC' },
        relations: ['user', 'user.role']
      });
    } else {
      // For other users, show all their notifications
      notifications = await notificationRepo.find({
        where: { userId, deleted: false },
        order: { created_at: 'DESC' },
        relations: ['user', 'user.role']
      });
    }

    return notifications;
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string, userId: string) => {
    const notification = await notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) throw new AppError(404, 'Notification not found');

    notification.isRead = true;
    return await notificationRepo.save(notification);
  };

  // Mark all notifications as read for a user
  const markAllAsRead = async (userId: string) => {
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user) throw new AppError(404, 'User not found');

    if (user.role?.role === 'admin') {
      // For admin users, mark as read:
      // 1. Quotation sent notifications
      // 2. Business done notifications
      return await notificationRepo.update(
        {
          type: NotificationType.FOLLOWUP_CREATED,
          metadata: { status: In(['AWAITING RESPONSE', 'COMPLETED']) },
          isRead: false,
          deleted: false
        },
        { isRead: true }
      );
    } else if (user.role?.role === 'staff') {
      // For staff users, mark as read:
      // 1. Lead assigned notifications
      // 2. Lead escalated notifications
      return await notificationRepo.update(
        {
          type: In([NotificationType.LEAD_ASSIGNED, NotificationType.LEAD_UPDATED]),
          isRead: false,
          deleted: false
        },
        { isRead: true }
      );
    } else {
      // For other users, mark all their notifications as read
      return await notificationRepo.update(
        { userId, isRead: false, deleted: false },
        { isRead: true }
      );
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    const notification = await notificationRepo.findOne({
      where: { id: notificationId, deleted: false },
    });

    if (!notification) throw new AppError(404, 'Notification not found');

    return await notificationRepo.softDelete(notificationId);
  };

  return {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}; 