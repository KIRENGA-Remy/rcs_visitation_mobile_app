import { Response, NextFunction } from 'express';
import { scheduleService } from './schedule.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class ScheduleController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await scheduleService.create(req.body, req.user!.id), 'Schedule created', 201); }
    catch (err) { next(err); }
  }
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await scheduleService.update(req.params.id, req.body), 'Schedule updated'); }
    catch (err: any) {
      if (err.message?.includes('Cannot reduce capacity') || err.message?.includes('End time must be after')) {
        sendError(res, err.message, 400); return;
      }
      next(err);
    }
  }
  async findAvailable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { schedules, pagination } = await scheduleService.findAvailable(req.query as any);
      sendSuccess(res, schedules, 'Available schedules retrieved', 200, pagination);
    } catch (err) { next(err); }
  }
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await scheduleService.findById(req.params.id)); }
    catch (err) { next(err); }
  }
  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await scheduleService.cancel(req.params.id), 'Schedule cancelled'); }
    catch (err) { next(err); }
  }
}

export const scheduleController = new ScheduleController();
