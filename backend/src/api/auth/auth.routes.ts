import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { simpleLogin, simpleMe } from './auth.simple';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get tokens (Simple version bypassing TypeORM)
 * @access  Public
 */
router.post('/login', simpleLogin);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info (Simple version)
 * @access  Public (token verification included)
 */
router.get('/me', simpleMe);

// Original TypeORM routes (temporarily disabled)
// router.post('/register', authController.register);
// router.post('/login', authController.login);
// router.post('/refresh', authController.refresh);
// router.get('/me', authenticate, authController.me);

export default router;
