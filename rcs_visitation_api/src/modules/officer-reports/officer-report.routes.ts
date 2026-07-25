import { Router } from 'express';
import { officerReportController } from './officer-report.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { reportUpload } from './report-upload.middleware';
import { updateOfficerReportSchema, createOfficerReportMetaSchema } from './officer-report.schema';

const router = Router();

// POST /api/v1/officer-reports — officer uploads a report (multipart/form-data, field name "file")
router.post(
  '/',
  authenticate, authorize('PRISON_OFFICER'),
  reportUpload.single('file'),
  validate(createOfficerReportMetaSchema),
  officerReportController.createReport.bind(officerReportController)
);

// GET /api/v1/officer-reports/my — officer's own reports
// Registered before '/:id' so 'my' is never matched as an :id.
router.get('/my', authenticate, authorize('PRISON_OFFICER'), officerReportController.getMyReports.bind(officerReportController));

// GET /api/v1/officer-reports — admin: every submitted report (optionally ?officerId=)
router.get('/', authenticate, authorize('ADMIN'), officerReportController.getAllReports.bind(officerReportController));

// GET /api/v1/officer-reports/:id/download — stream the file (admin, or the owning officer)
router.get('/:id/download', authenticate, officerReportController.download.bind(officerReportController));

// GET /api/v1/officer-reports/:id
router.get('/:id', authenticate, officerReportController.getById.bind(officerReportController));

// PUT /api/v1/officer-reports/:id — officer edits their own report's metadata
router.put('/:id', authenticate, authorize('PRISON_OFFICER'), validate(updateOfficerReportSchema), officerReportController.update.bind(officerReportController));

// DELETE /api/v1/officer-reports/:id — officer deletes their own report
router.delete('/:id', authenticate, authorize('PRISON_OFFICER'), officerReportController.delete.bind(officerReportController));

export default router;
