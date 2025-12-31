import { Router } from 'express';
import { AccountsPayableController } from './accounts-payable.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new AccountsPayableController();

// Apply authentication middleware to all routes
router.use(authenticate);

router.get('/', controller.findAll);
router.get('/pending', controller.findPending);
router.get('/:id', controller.findOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
