import { AppDataSource } from '../utils/data-source';
import { Notification, NotificationType } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import AppError from '../utils/appError';
import {wsService} from "../services/websocket.service";
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

    const savedNotification = notificationRepo.save(notification);
      if (wsService) {
      wsService.sendNotification(userId, savedNotification);
    }

    return savedNotification;


  };

  // Get all notifications for a user
  const getUserNotifications = async (userId: string) => {
    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ['role']
    });

    if (!user) throw new AppError(404, 'User not found');

    let notifications;
    
    if (user.role?.role.toLowerCase() === 'admin') {
      notifications = await notificationRepo.find({
        where: [
          {
            type: NotificationType.QUOTATION_SENT,
            deleted: false
          },
          {
            type: NotificationType.BUSINESS_DONE,
            deleted: false
          },
          {
            type: NotificationType.LEAD_ESCALATED,
            deleted: false
          },
          {
            type: NotificationType.WORK_REQUEST_CREATED,
            deleted: false
          }
        ],
        order: { created_at: 'DESC' },
        relations: ['user', 'user.role']
      });
    } else if (user.role?.role.toLowerCase() === 'staff') {
      notifications = await notificationRepo.find({
        where: [
          {
            type: NotificationType.LEAD_ASSIGNED,
            deleted: false
          },
          {
            type: NotificationType.LEAD_ESCALATED,
            deleted: false
          },
          {
            type: NotificationType.FOLLOWUP_REMINDER,
            userId: userId,
            deleted: false
          },
          {
            type: NotificationType.WORK_REQUEST_APPROVED,
            userId: userId,
            deleted: false
          },
          {
            type: NotificationType.WORK_REQUEST_REJECTED,
            userId: userId,
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
    return await notificationRepo.update(
      
      {  isRead: false },
      { isRead: true }
    );
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