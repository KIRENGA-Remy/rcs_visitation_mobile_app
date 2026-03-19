import { Router } from 'express';
import { scheduleController } from './schedule.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createScheduleSchema } from './schedule.schema';

const router = Router();

// All authenticated users can view available schedules
router.get('/',      authenticate, scheduleController.findAvailable.bind(scheduleController));
router.get('/:id',   authenticate, scheduleController.findById.bind(scheduleController));

// Only admin/officer manage schedules
router.post('/',          authenticate, authorize('ADMIN', 'PRISON_OFFICER'), validate(createScheduleSchema), scheduleController.create.bind(scheduleController));
router.patch('/:id/cancel', authenticate, authorize('ADMIN', 'PRISON_OFFICER'), scheduleController.cancel.bind(scheduleController));

export default router;
