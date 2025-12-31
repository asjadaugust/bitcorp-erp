import { Router } from 'express';
import { PaymentScheduleController } from './payment-schedule.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const paymentScheduleController = new PaymentScheduleController();

// Apply authentication to all routes
router.use(authenticate);

// CRUD routes
router.get('/', paymentScheduleController.findAll.bind(paymentScheduleController));
router.post('/', paymentScheduleController.create.bind(paymentScheduleController));
router.get('/:id', paymentScheduleController.findOne.bind(paymentScheduleController));
router.put('/:id', paymentScheduleController.update.bind(paymentScheduleController));
router.delete('/:id', paymentScheduleController.delete.bind(paymentScheduleController));

// Detail management
router.post('/:id/details', paymentScheduleController.addDetail.bind(paymentScheduleController));
router.delete('/:id/details/:detailId', paymentScheduleController.removeDetail.bind(paymentScheduleController));

// Workflow actions
router.post('/:id/approve', paymentScheduleController.approve.bind(paymentScheduleController));
router.post('/:id/process', paymentScheduleController.process.bind(paymentScheduleController));
router.post('/:id/cancel', paymentScheduleController.cancelSchedule.bind(paymentScheduleController));

export default router;
