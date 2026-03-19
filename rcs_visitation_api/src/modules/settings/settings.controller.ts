import { Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';
import { KNOWN_SETTINGS } from './settings.schema';

export class SettingsController {
  async getForPrison(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await settingsService.getForPrison(req.params.prisonId), 'Settings retrieved'); }
    catch (err) { next(err); }
  }

  async getGlobal(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await settingsService.getGlobal(), 'Global settings retrieved'); }
    catch (err) { next(err); }
  }

  async getKnownKeys(_req: AuthRequest, res: Response) {
    sendSuccess(res, KNOWN_SETTINGS, 'Known setting keys');
  }

  async upsertForPrison(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await settingsService.upsertForPrison(req.params.prisonId, req.body, req.user!.id), 'Setting saved'); }
    catch (err) { next(err); }
  }

  async upsertGlobal(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await settingsService.upsertGlobal(req.body, req.user!.id), 'Global setting saved'); }
    catch (err) { next(err); }
  }

  async bulkUpsertForPrison(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await settingsService.bulkUpsertForPrison(req.params.prisonId, req.body, req.user!.id), 'Settings saved'); }
    catch (err) { next(err); }
  }

  async deleteForPrison(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await settingsService.deleteForPrison(req.params.prisonId, req.params.key), 'Setting removed'); }
    catch (err) { next(err); }
  }
}

export const settingsController = new SettingsController();
