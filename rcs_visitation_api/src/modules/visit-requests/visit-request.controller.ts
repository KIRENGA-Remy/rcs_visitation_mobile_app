import { Response, NextFunction } from 'express';
import { visitRequestService } from './visit-request.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class VisitRequestController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitRequestService.create(req.body, req.user!.id), 'Visit request submitted', 201); }
    catch (err: any) {
      const clientErrors = ['banned', 'not currently accepting', 'restricted', 'not available', 'fully booked', 'past time', 'already have'];
      if (clientErrors.some(e => err.message?.toLowerCase().includes(e))) { sendError(res, err.message, 422); return; }
      next(err);
    }
  }
  async process(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitRequestService.processRequest(req.params.id, req.body, req.user!.id), 'Request processed'); }
    catch (err: any) {
      if (err.message?.includes('Only pending')) { sendError(res, err.message, 422); return; }
      next(err);
    }
  }
  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitRequestService.cancel(req.params.id, req.body, req.user!.id), 'Request cancelled'); }
    catch (err: any) {
      if (err.message?.includes('Cannot cancel') || err.message?.includes('cannot be cancelled')) { sendError(res, err.message, 422); return; }
      next(err);
    }
  }
  async myRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requests, pagination } = await visitRequestService.findByVisitor(req.user!.id, req.query as any);
      sendSuccess(res, requests, 'Your visit requests', 200, pagination);
    } catch (err) { next(err); }
  }
  async byPrison(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requests, pagination } = await visitRequestService.findByPrison(req.params.prisonId, req.query as any);
      sendSuccess(res, requests, 'Visit requests retrieved', 200, pagination);
    } catch (err) { next(err); }
  }
  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitRequestService.getById(req.params.id)); }
    catch (err) { next(err); }
  }

  async allPrisonRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requests, pagination } = await visitRequestService.allPrisonRequests(req.query as any);
      sendSuccess(res, requests, 'Visit requests retrieved', 200, pagination);
    } catch (err) { next(err); }
  }
}

export const visitRequestController = new VisitRequestController();
