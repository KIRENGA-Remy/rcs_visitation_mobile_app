import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (err: any) {
      if (err.message.includes('already registered')) { sendError(res, err.message, 409); return; }
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (err: any) {
      if (err.message.includes('Invalid credentials') || err.message.includes('suspended')) {
        sendError(res, err.message, 401); return;
      }
      next(err);
    }
  }

  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (err: any) {
      if (err.message.includes('Invalid or expired') || err.message.includes('suspended')) {
        sendError(res, err.message, 401); return;
      }
      next(err);
    }
  }
}

export const authController = new AuthController();
