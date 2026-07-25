import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { updateUserRoleSchema, updateUserStatusSchema, listUsersQuerySchema, updatePushTokenSchema, updateMyProfileSchema, assignPrisonSchema, createOfficerSchema, completeSetupSchema } from './user.schema';

const router = Router();

// PATCH /api/v1/users/push-token 
router.patch('/push-token', authenticate, validate(updatePushTokenSchema), userController.updatePushToken.bind(userController));

// PATCH /api/v1/users/me — any authenticated user updates their own limited
// fields (nationalId, gender, dateOfBirth, profilePhoto, preferredLang).
// Registered before '/:id' so it's never shadowed by the admin-only route.
router.patch('/me', authenticate, validate(updateMyProfileSchema), userController.updateMe.bind(userController));

// PUBLIC (unauthenticated) — the officer hasn't logged in yet at this point.
// Rate-limited like login/register since it's an OTP-guessing surface.
// Registered before '/:id' so 'complete-setup' is never matched as an :id.
router.post('/complete-setup', authRateLimiter, validate(completeSetupSchema), userController.completeSetup.bind(userController));

// POST /api/v1/users/officers → admin creates a Prison Officer account (OTP setup email sent)
router.post('/officers', authenticate, authorize('ADMIN'), validate(createOfficerSchema), userController.createOfficer.bind(userController));

// GET  /api/v1/users              → list all users (admin)
router.get('/',      authenticate, authorize('ADMIN'), validate(listUsersQuerySchema, 'query'), userController.findAll.bind(userController));

// GET  /api/v1/users/:id          → get single user (admin)
router.get('/:id',   authenticate, authorize('ADMIN'), userController.findById.bind(userController));

// PUT  /api/v1/users/:id/role     → change role (admin)
router.put('/:id/role',   authenticate, authorize('ADMIN'), validate(updateUserRoleSchema), userController.updateRole.bind(userController));

// PUT  /api/v1/users/:id/status   → suspend / reactivate (admin)
router.put('/:id/status', authenticate, authorize('ADMIN'), validate(updateUserStatusSchema), userController.updateStatus.bind(userController));

// PATCH /api/v1/users/:id/assign-prison → assign/unassign an officer's facility (admin)
router.patch('/:id/assign-prison', authenticate, authorize('ADMIN'), validate(assignPrisonSchema), userController.assignPrison.bind(userController));

// DELETE /api/v1/users/:id        → soft delete (admin)
router.delete('/:id', authenticate, authorize('ADMIN'), userController.softDelete.bind(userController));

export default router;
