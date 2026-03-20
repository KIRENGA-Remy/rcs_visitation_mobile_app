import { Response, NextFunction } from 'express';
import { userService } from './user.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';
import { AuthRequest } from '../../shared/types';

export class UserController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { users, pagination } = await userService.findAll(req.query as any);
      sendSuccess(res, users, 'Users retrieved', 200, pagination);
    } catch (err) { next(err); }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await userService.findById(req.params.id)); }
    catch (err) { next(err); }
  }

  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await userService.updateRole(req.params.id, req.body), 'User role updated'); }
    catch (err: any) {
      if (err.message?.includes('cannot be deleted')) { sendError(res, err.message, 422); return; }
      next(err);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await userService.updateStatus(req.params.id, req.body), 'User status updated'); }
    catch (err) { next(err); }
  }

  async softDelete(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await userService.softDelete(req.params.id, req.user!.id), 'User removed'); }
    catch (err: any) {
      if (err.message?.includes('cannot delete') || err.message?.includes('cannot be deleted')) {
        sendError(res, err.message, 422); return;
      }
      next(err);
    }
  }

  async updatePushToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { expoPushToken } = req.body;
      const updatedUser = await userService.updatePushToken(req.user!.id, expoPushToken);
      sendSuccess(res, { userId: updatedUser.id }, 'Push token updated successfully');
    } catch (err: any) {
      if (err instanceof ValidationError) {
        sendError(res, err.message, 400);
        return;
      }
      if (err instanceof NotFoundError) {
        sendError(res, err.message, 404);
        return;
      }
      next(err);
    }
  }
}

export const userController = new UserController();
