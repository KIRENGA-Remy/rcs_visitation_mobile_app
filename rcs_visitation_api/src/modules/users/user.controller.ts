import { Request, Response, NextFunction } from 'express';
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
    try { sendSuccess(res, await userService.updateStatus(req.params.id, req.body, req.user!.id), 'User status updated'); }
    catch (err: any) {
      if (err.message?.includes('cannot suspend or deactivate your own') || err.message?.includes('cannot be suspended or deactivated')) {
        sendError(res, err.message, 403); return;
      }
      next(err);
    }
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

  async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await userService.updateMe(req.user!.id, req.body), 'Profile updated'); }
    catch (err: any) {
      if (err.message?.includes('already registered')) { sendError(res, err.message, 409); return; }
      next(err);
    }
  }

  async updatePhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) { sendError(res, 'An image file is required', 422); return; }
      sendSuccess(res, await userService.updatePhoto(req.user!.id, req.file), 'Profile photo updated');
    } catch (err) { next(err); }
  }

  async createOfficer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await userService.createOfficer(req.body);
      sendSuccess(res, result, 'Officer account created', 201);
    } catch (err: any) {
      if (err.message?.includes('already registered')) { sendError(res, err.message, 409); return; }
      next(err);
    }
  }

  async createAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await userService.createAdmin(req.body);
      sendSuccess(res, result, 'Admin account created', 201);
    } catch (err: any) {
      if (err.message?.includes('already registered')) { sendError(res, err.message, 409); return; }
      next(err);
    }
  }

  async completeSetup(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.completeSetup(req.body);
      sendSuccess(res, { success: true }, 'Account activated — you can now sign in');
    } catch (err: any) {
      if (err.message?.includes('Invalid') || err.message?.includes('expired')) {
        sendError(res, err.message, 401); return;
      }
      next(err);
    }
  }

  async assignPrison(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await userService.assignPrison(req.params.id, req.body), 'Officer assignment updated'); }
    catch (err: any) {
      if (err.message?.includes('Only prison officers')) { sendError(res, err.message, 400); return; }
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
