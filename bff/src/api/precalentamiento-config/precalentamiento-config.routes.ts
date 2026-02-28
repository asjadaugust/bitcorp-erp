/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';
import { PrecalentamientoConfigController } from './precalentamiento-config.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new PrecalentamientoConfigController();

// All routes require authentication
router.use(authenticate);

// List all configs (any authenticated user — needed by daily report form)
router.get('/', controller.listar);

// Get config for a specific tipo_equipo
router.get('/tipo-equipo/:tipoEquipoId', controller.obtenerPorTipoEquipo);

// Get only the hours value (lightweight endpoint used by daily report form auto-fill)
router.get('/tipo-equipo/:tipoEquipoId/horas', controller.obtenerHoras);

// Update config (ADMIN / JEFE_EQUIPO — enforced via role check in controller if needed)
router.put('/tipo-equipo/:tipoEquipoId', controller.actualizar);

export default router;
