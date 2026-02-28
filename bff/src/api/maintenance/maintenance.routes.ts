/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { MaintenanceCreateDto, MaintenanceUpdateDto } from '../../types/dto/maintenance.dto';

const router = Router();
const controller = new MaintenanceController();

router.use(authenticate);

router.get('/', controller.getAll);

// GET /api/maintenance/stats - Get maintenance statistics
router.get('/stats', controller.getStats);
router.get('/:id', controller.getById);
router.post('/', validateDto(MaintenanceCreateDto), controller.create);
router.put('/:id', validateDto(MaintenanceUpdateDto), controller.update);
router.delete('/:id', controller.delete);

export default router;
