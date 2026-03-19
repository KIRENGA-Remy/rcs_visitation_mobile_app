import { Response, NextFunction } from 'express';
import { visitLogService } from './visit-log.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class VisitLogController {
  async checkIn(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitLogService.checkIn(req.body, req.user!.id), 'Visitor checked in', 201); }
    catch (err: any) {
      const clientErrors = ['Only approved', 'already checked in', 'QR code has expired'];
      if (clientErrors.some(e => err.message?.includes(e))) { sendError(res, err.message, 422); return; }
      next(err);
    }
  }
  async checkOut(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitLogService.checkOut(req.params.id, req.body, req.user!.id), 'Visitor checked out'); }
    catch (err: any) {
      if (err.message?.includes('already checked out') || err.message?.includes('not currently checked in')) {
        sendError(res, err.message, 422); return;
      }
      next(err);
    }
  }
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitLogService.getById(req.params.id)); }
    catch (err) { next(err); }
  }
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { logs, pagination } = await visitLogService.findAll(req.query as any);
      sendSuccess(res, logs, 'Visit logs retrieved', 200, pagination);
    } catch (err) { next(err); }
  }
}

export const visitLogController = new VisitLogController();
