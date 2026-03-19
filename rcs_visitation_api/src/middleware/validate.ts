import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../shared/utils/apiResponse';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, target: ValidateTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = (result.error as ZodError).errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      sendError(res, `Validation failed: ${errors}`, 422);
      return;
    }
    req[target] = result.data;
    next();
  };
