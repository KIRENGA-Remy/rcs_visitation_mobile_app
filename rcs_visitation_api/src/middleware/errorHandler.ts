import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';
import { sendError } from '../shared/utils/apiResponse';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({ message: err.message, stack: err.stack, url: req.url, method: req.method });

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409, err.code);
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 'Record not found', 404, err.code);
      return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Invalid data provided', 400);
    return;
  }

  sendError(res, 'Internal server error', 500);
};
