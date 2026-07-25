import { Router } from 'express';
import { officerReportController } from './officer-report.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createReportRequestSchema } from './officer-report.schema';

const router = Router();

// GET /api/v1/report-requests/my — officer: requests addressed to them or
// broadcast to all officers. Registered before '/:id'-shaped routes (there
// are none yet, but keeping the convention for when they're added).
router.get('/my', authenticate, authorize('PRISON_OFFICER'), officerReportController.getMyRequests.bind(officerReportController));

// POST /api/v1/report-requests — admin requests a report (one officer, or all)
router.post('/', authenticate, authorize('ADMIN'), validate(createReportRequestSchema), officerReportController.createRequest.bind(officerReportController));

// GET /api/v1/report-requests — admin: every request they've sent
router.get('/', authenticate, authorize('ADMIN'), officerReportController.getRequests.bind(officerReportController));

export default router;
