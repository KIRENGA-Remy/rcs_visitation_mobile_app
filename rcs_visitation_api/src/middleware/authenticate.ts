import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../shared/utils/jwt';
import { sendError } from '../shared/utils/apiResponse';
import { AuthRequest } from '../shared/types';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401);
    return;
  }

  const token = authHeader.substring(7);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};
