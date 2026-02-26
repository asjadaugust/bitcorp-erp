import { Router } from 'express';
import { PaymentScheduleController } from './payment-schedule.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new PaymentScheduleController();

router.use(authenticate);

router.get('/', controller.findAll);
router.get('/:id', controller.findOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Workflow actions
router.post('/:id/approve', controller.approve);
router.post('/:id/process', controller.process);
router.post('/:id/cancel', controller.cancel);

// Details
router.post('/:id/details', controller.addDetail);
router.delete('/:id/details/:detailId', controller.removeDetail);

export default router;
