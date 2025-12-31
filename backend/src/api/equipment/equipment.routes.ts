import { Router } from 'express';
import { EquipmentController } from './equipment.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const equipmentController = new EquipmentController();

router.use(authenticate);

router.get('/', equipmentController.findAll);
router.get('/available', equipmentController.getAvailable);
router.get('/types', equipmentController.getTypes);
router.get(
  '/statistics',
  authorize('ingeniero_planificacion', 'ingeniero_costos', 'administrador'),
  equipmentController.getStatistics
);
router.get('/:id', equipmentController.findById);
router.post('/', authorize('ingeniero_planificacion', 'administrador'), equipmentController.create);
router.put(
  '/:id',
  authorize('ingeniero_planificacion', 'administrador'),
  equipmentController.update
);
router.delete('/:id', authorize('administrador'), equipmentController.delete);
router.patch(
  '/:id/status',
  authorize('ingeniero_planificacion', 'supervisor', 'administrador'),
  equipmentController.updateStatus
);
router.patch(
  '/:id/hourmeter',
  authorize('operador', 'supervisor', 'administrador'),
  equipmentController.updateHourmeter
);
router.get('/export/excel', authorize('ingeniero_planificacion', 'ingeniero_costos', 'administrador'), equipmentController.exportExcel);
router.get('/export/csv', authorize('ingeniero_planificacion', 'ingeniero_costos', 'administrador'), equipmentController.exportCSV);

// Equipment assignment and transfer
router.post(
  '/:id/assign',
  authorize('ingeniero_planificacion', 'administrador'),
  equipmentController.assignEquipment
);
router.post(
  '/:id/transfer',
  authorize('ingeniero_planificacion', 'administrador'),
  equipmentController.transferEquipment
);
router.get(
  '/availability/range',
  authorize('ingeniero_planificacion', 'ingeniero_costos', 'administrador'),
  equipmentController.getAvailability
);
router.get(
  '/:id/assignment-history',
  authorize('ingeniero_planificacion', 'ingeniero_costos', 'administrador'),
  equipmentController.getAssignmentHistory
);

export default router;
