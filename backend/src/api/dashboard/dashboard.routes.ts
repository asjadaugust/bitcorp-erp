/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { SwitchProjectDto } from '../../types/dto/dashboard.dto';

const router = Router();
const dashboardController = new DashboardController();

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboard/modules - Get user modules with permissions
router.get('/modules', dashboardController.getModules);

// GET /api/dashboard/user-info - Get current user info with projects
router.get('/user-info', dashboardController.getUserInfo);

// PUT /api/dashboard/switch-project - Switch active project
router.put('/switch-project', validateDto(SwitchProjectDto), dashboardController.switchProject);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getStats);

export default router;
