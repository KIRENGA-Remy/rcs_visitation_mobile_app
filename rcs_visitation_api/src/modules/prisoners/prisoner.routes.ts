import { Router } from 'express';
import { prisonerController } from './prisoner.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createPrisonerSchema, transferPrisonerSchema, restrictVisitsSchema } from './prisoner.schema';

const router = Router();

router.get('/',                  authenticate, authorize('ADMIN', 'PRISON_OFFICER'), prisonerController.findAll.bind(prisonerController));
router.get('/:id',               authenticate, authorize('ADMIN', 'PRISON_OFFICER'), prisonerController.findById.bind(prisonerController));
router.post('/',                 authenticate, authorize('ADMIN'), validate(createPrisonerSchema), prisonerController.create.bind(prisonerController));
router.patch('/:id/transfer',    authenticate, authorize('ADMIN'), validate(transferPrisonerSchema), prisonerController.transfer.bind(prisonerController));
router.patch('/:id/restrict',    authenticate, authorize('ADMIN', 'PRISON_OFFICER'), validate(restrictVisitsSchema), prisonerController.restrictVisits.bind(prisonerController));

export default router;
