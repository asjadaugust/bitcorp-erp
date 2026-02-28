/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';
import { CombustibleConfigController } from './combustible-config.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { ROLES } from '../../types/roles';

const router = Router();
const controller = new CombustibleConfigController();

// All routes require authentication
router.use(authenticate);

// Get current config (any authenticated user — valuation calculations need this)
router.get('/', controller.obtener);

// Get just the manipuleo rate (any authenticated user)
router.get('/precio-manipuleo', controller.obtenerPrecio);

// Update config (ADMIN only)
router.put('/', authorize(ROLES.ADMIN), controller.actualizar);

export default router;
