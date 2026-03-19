import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { sendNotificationSchema, broadcastSchema } from './notification.schema';

const router = Router();

// All authenticated users: own notifications
router.get('/',               authenticate, notificationController.getMyNotifications.bind(notificationController));
router.get('/unread-count',   authenticate, notificationController.unreadCount.bind(notificationController));
router.patch('/:id/read',     authenticate, notificationController.markRead.bind(notificationController));
router.patch('/mark-all-read',authenticate, notificationController.markAllRead.bind(notificationController));

// Admin: send & manage
router.post('/',              authenticate, authorize('ADMIN'), validate(sendNotificationSchema), notificationController.sendToUser.bind(notificationController));
router.post('/broadcast',     authenticate, authorize('ADMIN'), validate(broadcastSchema), notificationController.broadcast.bind(notificationController));
router.delete('/:id',         authenticate, authorize('ADMIN'), notificationController.delete.bind(notificationController));

export default router;
