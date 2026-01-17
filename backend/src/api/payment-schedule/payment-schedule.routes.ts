/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { PaymentScheduleController } from './payment-schedule.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import {
  PaymentScheduleCreateDto,
  PaymentScheduleUpdateDto,
  PaymentScheduleDetailCreateDto,
} from '../../types/dto/payment-schedule.dto';

const router = Router();
const paymentScheduleController = new PaymentScheduleController();

// Apply authentication to all routes
router.use(authenticate);

// CRUD routes
router.get('/', paymentScheduleController.findAll.bind(paymentScheduleController));
router.post(
  '/',
  validateDto(PaymentScheduleCreateDto),
  paymentScheduleController.create.bind(paymentScheduleController)
);
router.get('/:id', paymentScheduleController.findOne.bind(paymentScheduleController));
router.put(
  '/:id',
  validateDto(PaymentScheduleUpdateDto),
  paymentScheduleController.update.bind(paymentScheduleController)
);
router.delete('/:id', paymentScheduleController.remove.bind(paymentScheduleController));

// Detail management
router.post(
  '/:id/details',
  validateDto(PaymentScheduleDetailCreateDto),
  paymentScheduleController.addDetail.bind(paymentScheduleController)
);
router.delete(
  '/:id/details/:detailId',
  paymentScheduleController.removeDetail.bind(paymentScheduleController)
);

// Workflow actions
router.post('/:id/approve', paymentScheduleController.approve.bind(paymentScheduleController));
router.post('/:id/process', paymentScheduleController.process.bind(paymentScheduleController));
router.post(
  '/:id/cancel',
  paymentScheduleController.cancelSchedule.bind(paymentScheduleController)
);

export default router;
