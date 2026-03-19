import { Router } from 'express';
import { verificationController } from './verification.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { scanQrSchema } from './verification.schema';

const router = Router();

// POST /api/v1/verification/scan           → officer scans QR code at gate
router.post('/scan',             authenticate, authorize('PRISON_OFFICER', 'ADMIN'), validate(scanQrSchema), verificationController.scan.bind(verificationController));

// GET  /api/v1/verification/:visitRequestId → check visit status (visitor or officer)
router.get('/:visitRequestId',   authenticate, verificationController.getStatus.bind(verificationController));

export default router;
