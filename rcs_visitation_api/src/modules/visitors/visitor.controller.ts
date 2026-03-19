import { Response, NextFunction } from 'express';
import { visitorService } from './visitor.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class VisitorController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { visitors, pagination } = await visitorService.findAll(req.query as any);
      sendSuccess(res, visitors, 'Visitors retrieved', 200, pagination);
    } catch (err) { next(err); }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.findById(req.params.id)); }
    catch (err) { next(err); }
  }

  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.findByUserId(req.user!.id)); }
    catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.update(req.params.id, req.body), 'Visitor profile updated'); }
    catch (err) { next(err); }
  }

  async updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.updateMyProfile(req.user!.id, req.body), 'Profile updated'); }
    catch (err) { next(err); }
  }

  async ban(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.ban(req.params.id, req.body), 'Visitor ban status updated'); }
    catch (err) { next(err); }
  }

  async linkPrisoner(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.linkPrisoner(req.params.id, req.body, req.user!.id), 'Prisoner linked to visitor', 201); }
    catch (err) { next(err); }
  }

  async unlinkPrisoner(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.unlinkPrisoner(req.params.id, req.params.prisonerId), 'Prisoner unlinked'); }
    catch (err) { next(err); }
  }

  async getVisitHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requests, pagination } = await visitorService.getVisitHistory(req.params.id, req.query as any);
      sendSuccess(res, requests, 'Visit history retrieved', 200, pagination);
    } catch (err) { next(err); }
  }
}

export const visitorController = new VisitorController();
