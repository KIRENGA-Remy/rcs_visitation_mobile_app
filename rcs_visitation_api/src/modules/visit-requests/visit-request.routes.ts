import { Router } from 'express';
import { visitRequestController } from './visit-request.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createVisitRequestSchema, processRequestSchema, cancelRequestSchema } from './visit-request.schema';

const router = Router();

// Visitor: submit and view own requests
router.post('/',      authenticate, authorize('VISITOR'), validate(createVisitRequestSchema), visitRequestController.create.bind(visitRequestController));
router.get('/my',     authenticate, authorize('VISITOR'), visitRequestController.myRequests.bind(visitRequestController));

// All roles: get single request
router.get('/:id',    authenticate, visitRequestController.getById.bind(visitRequestController));

// Visitor: cancel own request
router.patch('/:id/cancel', authenticate, validate(cancelRequestSchema), visitRequestController.cancel.bind(visitRequestController));

// GET /api/v1/visit-requests/prison/all  → officer sees all prisons
router.get('/prison/all', authenticate, authorize('PRISON_OFFICER', 'ADMIN'), visitRequestController.allPrisonRequests.bind(visitRequestController));

// Officer / Admin: process (approve/reject) and view by prison
router.patch('/:id/process', authenticate, authorize('PRISON_OFFICER', 'ADMIN'), validate(processRequestSchema), visitRequestController.process.bind(visitRequestController));
router.get('/prison/:prisonId', authenticate, authorize('PRISON_OFFICER', 'ADMIN'), visitRequestController.byPrison.bind(visitRequestController));

export default router;
