/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ReportingController } from './reporting.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { ROLES } from '../../types/roles';

const router = Router();
const controller = new ReportingController();

router.use(authenticate);

router.get(
  '/equipment-utilization',
  authorize(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.getEquipmentUtilization
);

router.get(
  '/maintenance',
  authorize(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.getMaintenanceHistory
);

router.get(
  '/inventory',
  authorize(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.getInventoryMovements
);

router.get(
  '/operator-timesheet',
  authorize(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.getOperatorTimesheet
);

export default router;
