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
    try { sendSuccess(res, await scheduleService.update(req.params.id, req.body, req.user!.id), 'Schedule updated'); }
    catch (err: any) {
      if (err.message?.includes('Only the admin who created')) { sendError(res, err.message, 403); return; }
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
  async findAllForAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { schedules, pagination } = await scheduleService.findAllForAdmin(req.query as any, req.user!.id, req.user!.role);
      sendSuccess(res, schedules, 'Schedules retrieved', 200, pagination);
    } catch (err) { next(err); }
  }
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await scheduleService.findById(req.params.id)); }
    catch (err) { next(err); }
  }
  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await scheduleService.cancel(req.params.id, req.user!.id), 'Schedule cancelled'); }
    catch (err: any) {
      if (err.message?.includes('Only the admin who created')) { sendError(res, err.message, 403); return; }
      next(err);
    }
  }
  async reopen(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await scheduleService.reopen(req.params.id, req.user!.id), 'Schedule reopened'); }
    catch (err: any) {
      if (err.message?.includes('Only the admin who created')) { sendError(res, err.message, 403); return; }
      if (err.message?.includes('already open') || err.message?.includes('already passed')) {
        sendError(res, err.message, 400); return;
      }
      next(err);
    }
  }
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await scheduleService.delete(req.params.id, req.user!.id), 'Schedule deleted'); }
    catch (err: any) {
      if (err.message?.includes('Only the admin who created')) { sendError(res, err.message, 403); return; }
      if (err.message?.includes('Cannot delete')) { sendError(res, err.message, 409); return; }
      next(err);
    }
  }
}

export const scheduleController = new ScheduleController();
