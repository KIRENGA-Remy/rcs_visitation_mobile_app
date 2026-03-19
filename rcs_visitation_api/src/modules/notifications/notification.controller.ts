import { Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class NotificationController {
  async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { notifications, pagination } = await notificationService.findMyNotifications(req.user!.id, req.query as any);
      sendSuccess(res, notifications, 'Notifications retrieved', 200, pagination);
    } catch (err) { next(err); }
  }

  async unreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await notificationService.unreadCount(req.user!.id);
      sendSuccess(res, { unreadCount: count });
    } catch (err) { next(err); }
  }

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await notificationService.markRead(req.params.id, req.user!.id), 'Marked as read'); }
    catch (err: any) {
      if (err.message?.includes('Not your notification')) { sendError(res, err.message, 403); return; }
      next(err);
    }
  }

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await notificationService.markAllRead(req.user!.id), 'All notifications marked as read'); }
    catch (err) { next(err); }
  }

  async sendToUser(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await notificationService.sendToUser(req.body), 'Notification sent', 201); }
    catch (err) { next(err); }
  }

  async broadcast(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await notificationService.broadcast(req.body), 'Broadcast sent', 201); }
    catch (err) { next(err); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await notificationService.delete(req.params.id), 'Notification deleted'); }
    catch (err) { next(err); }
  }
}

export const notificationController = new NotificationController();
