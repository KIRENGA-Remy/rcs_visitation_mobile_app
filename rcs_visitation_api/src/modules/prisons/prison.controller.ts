import { Response, NextFunction } from 'express';
import { prisonService } from './prison.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class PrisonController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await prisonService.create(req.body), 'Prison created', 201); }
    catch (err) { next(err); }
  }
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { prisons, pagination } = await prisonService.findAll(req.query);
      sendSuccess(res, prisons, 'Prisons retrieved', 200, pagination);
    } catch (err) { next(err); }
  }
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await prisonService.findById(req.params.id)); }
    catch (err) { next(err); }
  }
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await prisonService.update(req.params.id, req.body), 'Prison updated'); }
    catch (err) { next(err); }
  }
  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await prisonService.deactivate(req.params.id), 'Prison deactivated'); }
    catch (err) { next(err); }
  }
}

export const prisonController = new PrisonController();
