import { Router } from 'express';
import { ReportingController } from './reporting.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ReportingController();

router.use(authenticate);

router.get(
  '/equipment-utilization',
  authorize('administrador', 'jefe_equipos', 'finanzas', 'director_proyecto'),
  controller.getEquipmentUtilization
);

router.get(
  '/maintenance',
  authorize('administrador', 'jefe_equipos', 'finanzas', 'director_proyecto'),
  controller.getMaintenanceHistory
);

router.get(
  '/inventory',
  authorize('administrador', 'logistica', 'finanzas', 'director_proyecto'),
  controller.getInventoryMovements
);

router.get(
  '/operator-timesheet',
  authorize('administrador', 'jefe_equipos', 'finanzas', 'director_proyecto', 'rrhh'),
  controller.getOperatorTimesheet
);

export default router;
