import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';
import { prisma } from '../../config/prisma';

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

  async savePushToken(req: AuthRequest, res: Response) {
    const userId = req.user!.id; 
    const { expoPushToken } = req.body;

    if (!expoPushToken) return res.status(400).json({ message: "expoPushToken is required" });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { expoPushToken },
    });

    res.json({ success: true, expoPushToken: updatedUser.expoPushToken });
  }
}

export const authController = new AuthController();
