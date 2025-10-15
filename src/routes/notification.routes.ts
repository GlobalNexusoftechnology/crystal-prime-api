import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAnnouncement,
} from '../controllers/notification.controller';
import { deserializeUser, requireUser } from '../middleware';

const router = express.Router();

// router.use(protect); :(

router.use(deserializeUser, requireUser);

router.get('/', getNotifications);
router.patch('/:notificationId/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);
router.post('/announce', createAnnouncement);

export default router; 