import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import AppError from '../utils/appError';

const notificationService = NotificationService();

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.status(200).json({
      status: 'success',
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.params;
    if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    const notification = await notificationService.markAsRead(notificationId, req.user.id);
    res.status(200).json({
      status: 'success',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
 if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }
    await notificationService.markAllAsRead(req.user.id);
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.params;
 if (!req.user) {
      throw new AppError(401, 'User not authenticated');
    }

    await notificationService.deleteNotification(notificationId, req.user.id);
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}; 