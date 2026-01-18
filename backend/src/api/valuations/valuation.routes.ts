/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ValuationController } from './valuation.controller';
import { PaymentRecordController } from '../payments/payment-record.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import {
  ValuationCreateDto,
  ValuationUpdateDto,
  ValuationCalculateDto,
  ValuationGenerateDto,
} from '../../types/dto/valuation.dto';
import { ROLES } from '../../types/roles';

const router = Router();
const controller = new ValuationController();
const paymentController = new PaymentRecordController();

router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO), controller.getAll);
router.get(
  '/analytics',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.getAnalytics
);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO), controller.getById);
router.get(
  '/:id/pdf',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.downloadPdf
);
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(ValuationCreateDto),
  controller.create
);
router.post(
  '/calculate',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(ValuationCalculateDto),
  controller.calculate
);
router.post(
  '/generate',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(ValuationGenerateDto),
  controller.generate
);
router.post(
  '/preview-pdf',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  (req, res, next) => {
    req.params.id = 'preview';
    controller.downloadPdf(req, res, next);
  }
);
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(ValuationUpdateDto),
  controller.update
);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.DIRECTOR), controller.remove);

// Approval workflow endpoints
router.post(
  '/:id/submit-review',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.OPERADOR),
  controller.submitForReview
);
router.post(
  '/:id/approve',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.approveValuation
);
router.post(
  '/:id/reject',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.rejectValuation
);
router.post('/:id/mark-paid', authorize(ROLES.ADMIN), controller.markAsPaid);

// Payment-related endpoints for valuations
router.get(
  '/:valuationId/payments',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  paymentController.findByValuation
);
router.get(
  '/:valuationId/payment-summary',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  paymentController.getPaymentSummary
);

export default router;
