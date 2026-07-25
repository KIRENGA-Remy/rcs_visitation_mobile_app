import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { logger } from '../config/logger';
import { sendError } from '../shared/utils/apiResponse';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error({ message: err.message, stack: err.stack, url: req.url, method: req.method });

  // Multer upload errors (file too large) and our own fileFilter rejection
  // (unsupported type, thrown as a plain Error) — without this, both fell
  // through to a generic, unhelpful "Internal server error" 500.
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File is too large (max 15MB)', 400); return;
    }
    sendError(res, err.message, 400); return;
  }
  if (err.message?.includes('Unsupported file type')) {
    sendError(res, err.message, 400); return;
  }

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
