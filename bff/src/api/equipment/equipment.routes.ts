/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { EquipmentController } from './equipment.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { ROLES } from '../../types/roles';
import {
  EquipmentCreateDto,
  EquipmentUpdateDto,
  EquipmentStatusUpdateDto,
  EquipmentAssignmentCreateDto,
  EquipmentTransferCreateDto,
} from '../../types/dto/equipment.dto';

const router = Router();
const equipmentController = new EquipmentController();

router.use(authenticate);

/**
 * @openapi
 * /api/equipment:
 *   get:
 *     tags:
 *       - Equipment
 *     summary: Get all equipment
 *     description: Retrieve a list of all equipment with optional filters and pagination.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of equipment retrieved
 */
router.get('/', equipmentController.findAll);
router.get('/available', equipmentController.getAvailable);
router.get('/types', equipmentController.getTypes);
/**
 * @openapi
 * /api/equipment/statistics:
 *   get:
 *     tags:
 *       - Equipment
 *     summary: Get equipment statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved
 */
router.get(
  '/statistics',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  equipmentController.getStatistics
);
/**
 * @openapi
 * /api/equipment/{id}:
 *   get:
 *     tags:
 *       - Equipment
 *     summary: Get equipment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Equipment found
 */
router.get('/:id', equipmentController.findById);
router.post(
  '/',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  validateDto(EquipmentCreateDto),
  equipmentController.create
);
router.put(
  '/:id',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  validateDto(EquipmentUpdateDto),
  equipmentController.update
);
router.delete('/:id', authorize(ROLES.DIRECTOR, ROLES.ADMIN), equipmentController.delete);
router.patch(
  '/:id/status',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  validateDto(EquipmentStatusUpdateDto),
  equipmentController.updateStatus
);
router.patch(
  '/:id/transfer',
  authorize(ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  validateDto(EquipmentTransferCreateDto),
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
  validateDto(EquipmentAssignmentCreateDto),
  equipmentController.assignEquipment
);
router.post(
  '/:id/transfer',
  authorize('DIRECTOR', 'JEFE_EQUIPO', 'ADMIN'),
  validateDto(EquipmentTransferCreateDto),
  equipmentController.transferEquipment
);
router.get(
  '/availability/range',
  authorize('DIRECTOR', 'JEFE_EQUIPO', 'ADMIN'),
  equipmentController.getAvailability
);

export default router;
