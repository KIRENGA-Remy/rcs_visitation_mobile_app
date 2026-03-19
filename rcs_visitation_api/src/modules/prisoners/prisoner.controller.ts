import { Response, NextFunction } from 'express';
import { prisonerService } from './prisoner.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class PrisonerController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await prisonerService.create(req.body), 'Prisoner registered', 201); }
    catch (err) { next(err); }
  }
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { prisoners, pagination } = await prisonerService.findAll(req.query as any);
      sendSuccess(res, prisoners, 'Prisoners retrieved', 200, pagination);
    } catch (err) { next(err); }
  }
  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await prisonerService.findById(req.params.id)); }
    catch (err) { next(err); }
  }
  async transfer(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await prisonerService.transfer(req.params.id, req.body), 'Prisoner transferred'); }
    catch (err) { next(err); }
  }
  async restrictVisits(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await prisonerService.restrictVisits(req.params.id, req.body), 'Visitation restriction updated'); }
    catch (err) { next(err); }
  }
}

export const prisonerController = new PrisonerController();
