import { Router } from 'express';
import { visitLogController } from './visit-log.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { checkInSchema, checkOutSchema } from './visit-log.schema';

const router = Router();

router.get('/',                authenticate, authorize('PRISON_OFFICER', 'ADMIN'), visitLogController.findAll.bind(visitLogController));
router.get('/:id',             authenticate, authorize('PRISON_OFFICER', 'ADMIN'), visitLogController.getById.bind(visitLogController));
router.post('/check-in',       authenticate, authorize('PRISON_OFFICER', 'ADMIN'), validate(checkInSchema), visitLogController.checkIn.bind(visitLogController));
router.patch('/:id/check-out', authenticate, authorize('PRISON_OFFICER', 'ADMIN'), validate(checkOutSchema), visitLogController.checkOut.bind(visitLogController));

export default router;
