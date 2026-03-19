import { Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class ReportsController {
  async dailyVisits(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await reportsService.dailyVisits(req.query as any), 'Daily visits report'); }
    catch (err) { next(err); }
  }

  async peakHours(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await reportsService.peakHours(req.query as any), 'Peak hours report'); }
    catch (err) { next(err); }
  }

  async prisonerActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await reportsService.prisonerActivity(req.query as any), 'Prisoner activity report'); }
    catch (err) { next(err); }
  }

  async overview(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await reportsService.overview(req.query as any), 'Platform overview'); }
    catch (err) { next(err); }
  }
}

export const reportsController = new ReportsController();
