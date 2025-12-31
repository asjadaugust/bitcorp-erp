import { Router } from 'express';
import { OperatorAvailabilityController } from './operator-availability.controller';

const router = Router();
const controller = new OperatorAvailabilityController();

// GET /api/hr/availability - Get all availabilities (with filters)
router.get('/', (req, res) => controller.getAvailabilities(req, res));

// GET /api/hr/availability/available-operators - Get available operators for a date
router.get('/available-operators', (req, res) => controller.getAvailableOperators(req, res));

// GET /api/hr/availability/operator/:operatorId - Get availability by operator
router.get('/operator/:operatorId', (req, res) => controller.getAvailabilityByOperator(req, res));

// GET /api/hr/availability/:id - Get availability by ID
router.get('/:id', (req, res) => controller.getAvailabilityById(req, res));

// POST /api/hr/availability - Create new availability
router.post('/', (req, res) => controller.createAvailability(req, res));

// POST /api/hr/availability/bulk - Bulk create availabilities
router.post('/bulk', (req, res) => controller.bulkCreateAvailability(req, res));

// PUT /api/hr/availability/:id - Update availability
router.put('/:id', (req, res) => controller.updateAvailability(req, res));

// DELETE /api/hr/availability/:id - Delete availability
router.delete('/:id', (req, res) => controller.deleteAvailability(req, res));

export default router;
