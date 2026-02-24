/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { MovementController } from './movement.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { MovementCreateDto } from '../../types/dto/movement.dto';

const router = Router();
const controller = new MovementController();

router.use(authenticate);

router.get('/', controller.getAll.bind(controller));

// GET /api/logistics/movements/stats - Get movement statistics
router.get('/stats', controller.getStats.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', validateDto(MovementCreateDto), controller.create.bind(controller));
router.post('/:id/approve', controller.approve.bind(controller));

export default router;
