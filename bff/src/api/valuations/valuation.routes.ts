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

// Registry endpoint (must be before /:id to avoid conflict)
router.get(
  '/registry',
  authorize(
    ROLES.ADMIN,
    ROLES.DIRECTOR,
    ROLES.JEFE_EQUIPO,
    ROLES.RESIDENTE,
    ROLES.ADMINISTRADOR_PROYECTO
  ),
  controller.getRegistry
);

router.get('/', authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO), controller.getAll);
router.get(
  '/analytics',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.getAnalytics
);
router.get(
  '/:id/summary',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.getSummary
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
// Manual deductions (WS-38) — must be before /:id to avoid param collision
router.put(
  '/deducciones/:deduccionId',
  authorize(ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.updateManualDeduction
);
router.delete(
  '/deducciones/:deduccionId',
  authorize(ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.deleteManualDeduction
);

router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(ValuationUpdateDto),
  controller.update
);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.DIRECTOR), controller.remove);

// Approval workflow endpoints (CORP-GEM-P-002 multi-step)
router.post('/:id/submit-draft', authorize(ROLES.JEFE_EQUIPO, ROLES.ADMIN), controller.submitDraft);
router.post(
  '/:id/submit-review',
  authorize(ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  controller.submitForReview
);
router.post(
  '/:id/validate',
  authorize(ROLES.RESIDENTE, ROLES.ADMINISTRADOR_PROYECTO, ROLES.ADMIN),
  controller.validateValuation
);
router.post('/:id/approve', authorize(ROLES.DIRECTOR, ROLES.ADMIN), controller.approveValuation);
router.post(
  '/:id/reject',
  authorize(ROLES.RESIDENTE, ROLES.ADMINISTRADOR_PROYECTO, ROLES.DIRECTOR, ROLES.ADMIN),
  controller.rejectValuation
);
router.post('/:id/reopen', authorize(ROLES.JEFE_EQUIPO, ROLES.ADMIN), controller.reopenValuation);
router.post('/:id/mark-paid', authorize(ROLES.ADMIN), controller.markAsPaid);

// Provider conformity
router.post(
  '/:id/conformidad',
  authorize(ROLES.JEFE_EQUIPO, ROLES.ADMIN, ROLES.DIRECTOR),
  controller.registerConformidad
);

// Payment document tracking (Cláusula 6.1 prerequisites)
router.get(
  '/:id/payment-documents',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.getPaymentDocuments
);
router.post(
  '/:id/payment-documents',
  authorize(ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.createPaymentDocument
);
router.put('/payment-documents/:docId', authorize(ROLES.ADMIN), controller.updatePaymentDocument);
router.get(
  '/:id/payment-documents/check',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR),
  controller.checkPaymentDocsComplete
);

// Recalculate (Anexo B)
router.post(
  '/:id/recalculate',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.recalculate
);

// Discount events (Anexo B)
router.get(
  '/:id/discount-events',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.getDiscountEvents
);
router.post(
  '/:id/discount-events',
  authorize(ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.createDiscountEvent
);
router.delete(
  '/discount-events/:eventId',
  authorize(ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.deleteDiscountEvent
);

// Manual deduction sub-resource endpoints (WS-38)
router.get(
  '/:id/deducciones',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.getManualDeductions
);
router.post(
  '/:id/deducciones',
  authorize(ROLES.ADMIN, ROLES.JEFE_EQUIPO),
  controller.createManualDeduction
);

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
