import { Router } from 'express';
import { prisonerController } from './prisoner.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createPrisonerSchema, transferPrisonerSchema, restrictVisitsSchema, updatePrisonerSchema, releasePrisonerSchema } from './prisoner.schema';

const router = Router();

router.get('/',                  authenticate, authorize('ADMIN', 'PRISON_OFFICER'), prisonerController.findAll.bind(prisonerController));
// IMPORTANT: must be registered before '/:id' — otherwise Express matches
// '/search' as :id and this route is never reached.
router.get('/search',            authenticate, authorize('VISITOR'), prisonerController.searchForVisitor.bind(prisonerController));
router.get('/:id',               authenticate, authorize('ADMIN', 'PRISON_OFFICER'), prisonerController.findById.bind(prisonerController));
router.post('/',                 authenticate, authorize('ADMIN'), validate(createPrisonerSchema), prisonerController.create.bind(prisonerController));
router.put('/:id',               authenticate, authorize('ADMIN'), validate(updatePrisonerSchema), prisonerController.update.bind(prisonerController));
router.patch('/:id/transfer',    authenticate, authorize('ADMIN'), validate(transferPrisonerSchema), prisonerController.transfer.bind(prisonerController));
router.patch('/:id/restrict',    authenticate, authorize('ADMIN', 'PRISON_OFFICER'), validate(restrictVisitsSchema), prisonerController.restrictVisits.bind(prisonerController));
router.patch('/:id/release',     authenticate, authorize('ADMIN'), validate(releasePrisonerSchema), prisonerController.release.bind(prisonerController));
router.patch('/:id/reactivate',  authenticate, authorize('ADMIN'), prisonerController.reactivate.bind(prisonerController));

export default router;
