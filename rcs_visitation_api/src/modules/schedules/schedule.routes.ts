import { Router } from 'express';
import { scheduleController } from './schedule.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createScheduleSchema, updateScheduleSchema } from './schedule.schema';

const router = Router();

// All authenticated users can view available schedules
router.get('/',      authenticate, scheduleController.findAvailable.bind(scheduleController));
// Admin/Officer management view — must be registered before '/:id' or
// Express would try to match 'admin' as the :id param.
router.get('/admin', authenticate, authorize('ADMIN', 'PRISON_OFFICER'), scheduleController.findAllForAdmin.bind(scheduleController));
router.get('/:id',   authenticate, scheduleController.findById.bind(scheduleController));

// Only admin creates/manages schedules — officers can view them (GET /admin
// above) but must not be able to create, edit, cancel, or reopen one; and
// even among admins, only the admin who originally created a schedule may
// modify it (enforced in the service layer, not just this role check).
router.post('/',          authenticate, authorize('ADMIN'), validate(createScheduleSchema), scheduleController.create.bind(scheduleController));
router.put('/:id',         authenticate, authorize('ADMIN'), validate(updateScheduleSchema), scheduleController.update.bind(scheduleController));
router.patch('/:id/cancel', authenticate, authorize('ADMIN'), scheduleController.cancel.bind(scheduleController));
router.patch('/:id/reopen', authenticate, authorize('ADMIN'), scheduleController.reopen.bind(scheduleController));

export default router;
