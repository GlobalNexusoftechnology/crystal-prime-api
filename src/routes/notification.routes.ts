import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);

export default router; 