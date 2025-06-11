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

    // If user is admin, show all notifications
    if (user.role.role === 'admin') {
      return await notificationRepo.find({
        where: { deleted: false },
        order: { created_at: 'DESC' },
        relations: ['user']
      });
    }

    // For regular users, show only their notifications
    return await notificationRepo.find({
      where: { userId, deleted: false },
      order: { created_at: 'DESC' },
      relations: ['user']
    });
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
    return await notificationRepo.update(
      { userId, isRead: false },
      { isRead: true }
    );
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string, userId: string) => {
    const notification = await notificationRepo.findOne({
      where: { id: notificationId, userId },
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