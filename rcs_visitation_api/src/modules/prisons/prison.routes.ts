import { Router } from 'express';
import { prisonController } from './prison.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createPrisonSchema, updatePrisonSchema } from './prison.schema';

const router = Router();

router.get('/',      authenticate, prisonController.findAll.bind(prisonController));
router.get('/:id',   authenticate, prisonController.findById.bind(prisonController));
router.post('/',     authenticate, authorize('ADMIN'), validate(createPrisonSchema), prisonController.create.bind(prisonController));
router.patch('/:id', authenticate, authorize('ADMIN'), validate(updatePrisonSchema), prisonController.update.bind(prisonController));
router.delete('/:id',authenticate, authorize('ADMIN'), prisonController.deactivate.bind(prisonController));

export default router;
