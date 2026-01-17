/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { EquipmentController } from './equipment.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { ROLES } from '../../types/roles';

const router = Router();
const equipmentController = new EquipmentController();

router.use(authenticate);

router.get('/', equipmentController.findAll);
router.get('/available', equipmentController.getAvailable);
router.get('/types', equipmentController.getTypes);
router.get(
  '/statistics',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.getStatistics
);
router.get('/:id', equipmentController.findById);
router.post(
  '/',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.create
);
router.put(
  '/:id',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.update
);
router.delete('/:id', authorize(ROLES.DIRECTOR, ROLES.ADMIN), equipmentController.delete);
router.patch(
  '/:id/status',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.updateStatus
);
router.patch(
  '/:id/transfer',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.transferEquipment
);
router.get(
  '/availability/range',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.getAvailability
);
router.get(
  '/:id/assignment-history',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.getAssignmentHistory
);
router.get(
  '/export/excel',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.exportExcel
);
router.get(
  '/export/csv',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.exportCSV
);

// Equipment assignment and transfer
router.post(
  '/:id/assign',
  authorize('DIRECTOR', 'JEFE_EQUIPO', 'ADMIN'),
  equipmentController.assignEquipment
);
router.post(
  '/:id/transfer',
  authorize('DIRECTOR', 'JEFE_EQUIPO', 'ADMIN'),
  equipmentController.transferEquipment
);
router.get(
  '/availability/range',
  authorize('DIRECTOR', 'JEFE_EQUIPO', 'ADMIN'),
  equipmentController.getAvailability
);

export default router;
