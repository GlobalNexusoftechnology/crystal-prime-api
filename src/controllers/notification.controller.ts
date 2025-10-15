import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import AppError from '../utils/appError';
import { AnnouncementService } from '../services/announcement.service';
import { findUserById } from '../services';

const notificationService = NotificationService();
const announcementService = AnnouncementService();

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

    await notificationService.deleteNotification(notificationId);
    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}; 

export const createAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const user = res.locals.user;

    const fetchedUser = await findUserById(user.id);
    if (!fetchedUser) {
      throw new AppError(404, 'User not found');
    }

    if ((fetchedUser.role?.role).toLowerCase() !== 'admin') {
      throw new AppError(403, 'Only admin can create announcements');
    }

    const { message, userType } = req.body as {
      message: string;
      userType: 'staff' | 'client';
    };

    const job = await announcementService.enqueueAnnouncement({ message, userType });

    // Return immediately; processing is async
    res.status(202).json({
      status: 'accepted',
      data: { jobId: job.id, status: job.status },
    });
  } catch (error) {
    next(error);
  }
};