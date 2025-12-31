import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new MaintenanceController();

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
