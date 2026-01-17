/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ReportingController } from './reporting.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { ReportQueryDto } from '../../types/dto/reporting.dto';
import { ROLES } from '../../types/roles';

const router = Router();
const controller = new ReportingController();

router.use(authenticate);

router.get(
  '/equipment-utilization',
  authorize(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  validateDto(ReportQueryDto),
  controller.getEquipmentUtilization
);

router.get(
  '/maintenance',
  authorize(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  validateDto(ReportQueryDto),
  controller.getMaintenanceHistory
);

router.get(
  '/inventory',
  authorize(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  validateDto(ReportQueryDto),
  controller.getInventoryMovements
);

router.get(
  '/operator-timesheet',
  authorize(ROLES.DIRECTOR, ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  validateDto(ReportQueryDto),
  controller.getOperatorTimesheet
);

export default router;
