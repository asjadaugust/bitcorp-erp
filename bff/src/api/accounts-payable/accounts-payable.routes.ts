/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { AccountsPayableController } from './accounts-payable.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import {
  AccountsPayableCreateDto,
  AccountsPayableUpdateDto,
} from '../../types/dto/accounts-payable.dto';

const router = Router();
const controller = new AccountsPayableController();

// Apply authentication middleware to all routes
router.use(authenticate);

router.get('/', controller.findAll);
router.get('/pending', controller.findPending);
router.get('/:id', controller.findOne);
router.post('/', validateDto(AccountsPayableCreateDto), controller.create);
router.put('/:id', validateDto(AccountsPayableUpdateDto), controller.update);
router.delete('/:id', controller.remove);

export default router;
