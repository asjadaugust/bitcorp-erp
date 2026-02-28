import { Router } from 'express';
import { PaymentRecordController } from './payment-record.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new PaymentRecordController();

// All payment routes require authentication
router.use(authenticate);

// Payment CRUD operations
router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.delete('/:id', controller.cancel);

// Payment reconciliation
router.post('/:id/reconcile', controller.reconcile);

export default router;
