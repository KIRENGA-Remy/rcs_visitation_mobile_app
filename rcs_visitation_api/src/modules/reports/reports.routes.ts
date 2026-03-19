import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// All report endpoints: Admin & Prison Officer only
// Optional ?prisonId= to filter per prison
// Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD for date range

// GET /api/v1/reports/overview             → dashboard stats
router.get('/overview',          authenticate, authorize('ADMIN', 'PRISON_OFFICER'), reportsController.overview.bind(reportsController));

// GET /api/v1/reports/daily-visits         → visits per day
router.get('/daily-visits',      authenticate, authorize('ADMIN', 'PRISON_OFFICER'), reportsController.dailyVisits.bind(reportsController));

// GET /api/v1/reports/peak-hours           → busiest hours of day
router.get('/peak-hours',        authenticate, authorize('ADMIN', 'PRISON_OFFICER'), reportsController.peakHours.bind(reportsController));

// GET /api/v1/reports/prisoner-activity    → most/least visited prisoners
router.get('/prisoner-activity', authenticate, authorize('ADMIN', 'PRISON_OFFICER'), reportsController.prisonerActivity.bind(reportsController));

export default router;
