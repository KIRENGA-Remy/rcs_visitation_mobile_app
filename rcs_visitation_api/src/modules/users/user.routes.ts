import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { updateUserRoleSchema, updateUserStatusSchema, listUsersQuerySchema } from './user.schema';

const router = Router();

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
