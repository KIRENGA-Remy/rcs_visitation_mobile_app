import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { registerSchema, loginSchema, changePasswordSchema } from './auth.schema';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', authRateLimiter, validate(registerSchema), authController.register.bind(authController));

// POST /api/v1/auth/login
router.post('/login', authRateLimiter, validate(loginSchema), authController.login.bind(authController));

// GET /api/v1/auth/me
router.get('/me', authenticate, authController.getMe.bind(authController));

// POST /api/v1/auth/change-password
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword.bind(authController));

export default router;
