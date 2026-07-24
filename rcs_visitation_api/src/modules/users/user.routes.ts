import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { updateUserRoleSchema, updateUserStatusSchema, listUsersQuerySchema, updatePushTokenSchema, updateMyProfileSchema } from './user.schema';

const router = Router();

// PATCH /api/v1/users/push-token 
router.patch('/push-token', authenticate, validate(updatePushTokenSchema), userController.updatePushToken.bind(userController));

// PATCH /api/v1/users/me — any authenticated user updates their own limited
// fields (nationalId, gender, dateOfBirth, profilePhoto, preferredLang).
// Registered before '/:id' so it's never shadowed by the admin-only route.
router.patch('/me', authenticate, validate(updateMyProfileSchema), userController.updateMe.bind(userController));

// GET  /api/v1/users              → list all users (admin)
router.get('/',      authenticate, authorize('ADMIN'), validate(listUsersQuerySchema, 'query'), userController.findAll.bind(userController));

// GET  /api/v1/users/:id          → get single user (admin)
router.get('/:id',   authenticate, authorize('ADMIN'), userController.findById.bind(userController));

// PUT  /api/v1/users/:id/role     → change role (admin)
router.put('/:id/role',   authenticate, authorize('ADMIN'), validate(updateUserRoleSchema), userController.updateRole.bind(userController));

// PUT  /api/v1/users/:id/status   → suspend / reactivate (admin)
router.put('/:id/status', authenticate, authorize('ADMIN'), validate(updateUserStatusSchema), userController.updateStatus.bind(userController));

// DELETE /api/v1/users/:id        → soft delete (admin)
router.delete('/:id', authenticate, authorize('ADMIN'), userController.softDelete.bind(userController));

export default router;
