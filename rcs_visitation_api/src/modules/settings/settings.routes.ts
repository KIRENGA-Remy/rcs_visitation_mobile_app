import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { upsertSettingSchema, bulkUpsertSchema } from './settings.schema';

const router = Router();

// GET  /api/v1/settings/keys                      → list known setting keys
router.get('/keys',                       authenticate, authorize('ADMIN'), settingsController.getKnownKeys.bind(settingsController));

// GET  /api/v1/settings/global                    → get global settings
router.get('/global',                     authenticate, authorize('ADMIN'), settingsController.getGlobal.bind(settingsController));

// PUT  /api/v1/settings/global                    → upsert a global setting
router.put('/global',                     authenticate, authorize('ADMIN'), validate(upsertSettingSchema), settingsController.upsertGlobal.bind(settingsController));

// GET  /api/v1/settings/prison/:prisonId          → get merged settings for a prison
router.get('/prison/:prisonId',           authenticate, authorize('ADMIN', 'PRISON_OFFICER'), settingsController.getForPrison.bind(settingsController));

// PUT  /api/v1/settings/prison/:prisonId          → upsert one prison setting
router.put('/prison/:prisonId',           authenticate, authorize('ADMIN'), validate(upsertSettingSchema), settingsController.upsertForPrison.bind(settingsController));

// PUT  /api/v1/settings/prison/:prisonId/bulk     → bulk upsert prison settings
router.put('/prison/:prisonId/bulk',      authenticate, authorize('ADMIN'), validate(bulkUpsertSchema), settingsController.bulkUpsertForPrison.bind(settingsController));

// DELETE /api/v1/settings/prison/:prisonId/:key   → delete one prison setting (reverts to global)
router.delete('/prison/:prisonId/:key',   authenticate, authorize('ADMIN'), settingsController.deleteForPrison.bind(settingsController));

export default router;
