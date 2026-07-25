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
// Delete-all must be registered before '/:id' or Express would try to
// match 'all' as the :id param.
router.delete('/all',         authenticate, notificationController.deleteAll.bind(notificationController));
// Any user may delete their own notification (ownership checked in the
// service); an admin may delete any. This was previously ADMIN-only,
// leaving visitors/officers with no way to clear their own notifications.
router.delete('/:id',         authenticate, notificationController.delete.bind(notificationController));

// Admin: send & manage
router.post('/',              authenticate, authorize('ADMIN'), validate(sendNotificationSchema), notificationController.sendToUser.bind(notificationController));
router.post('/broadcast',     authenticate, authorize('ADMIN'), validate(broadcastSchema), notificationController.broadcast.bind(notificationController));

export default router;
