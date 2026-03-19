import { Response, NextFunction } from 'express';
import { verificationService } from './verification.service';
import { sendSuccess } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

export class VerificationController {
  async scan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await verificationService.scanQrCode(req.body);
      const statusCode = result.valid ? 200 : 422;
      sendSuccess(res, result, result.valid ? 'QR code is valid' : result.reason, statusCode);
    } catch (err) { next(err); }
  }

  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try { sendSuccess(res, await verificationService.getVisitStatus(req.params.visitRequestId)); }
    catch (err) { next(err); }
  }
}

export const verificationController = new VerificationController();
