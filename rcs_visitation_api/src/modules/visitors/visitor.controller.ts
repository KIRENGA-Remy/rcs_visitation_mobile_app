import { Response, NextFunction } from 'express';
import { visitorService } from './visitor.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
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

  // ── Visitor self-service contact requests ────────────────────────────────
  async requestContact(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitorService.requestContact(req.user!.id, req.body);
      sendSuccess(res, result, 'Contact request submitted for review', 201);
    } catch (err: any) {
      if (err.message?.includes('not currently available')) {
        sendError(res, err.message, 409); return;
      }
      next(err);
    }
  }

  async getMyContactRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.getMyContactRequests(req.user!.id)); }
    catch (err) { next(err); }
  }

  async getPendingContactRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requests, pagination } = await visitorService.getPendingContactRequests(req.query as any);
      sendSuccess(res, requests, 'Pending contact requests retrieved', 200, pagination);
    } catch (err) { next(err); }
  }

  async approveContactRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.approveContactRequest(req.params.id, req.user!.id), 'Contact request approved'); }
    catch (err) { next(err); }
  }

  async rejectContactRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await visitorService.rejectContactRequest(req.params.id, req.body), 'Contact request rejected'); }
    catch (err) { next(err); }
  }
}

export const visitorController = new VisitorController();
