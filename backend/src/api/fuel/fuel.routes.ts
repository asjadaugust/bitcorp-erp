/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { FuelController } from './fuel.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { FuelRecordCreateDto, FuelRecordUpdateDto } from '../../types/dto/fuel-record.dto';

const router = Router();
const controller = new FuelController();

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateDto(FuelRecordCreateDto), controller.create);
router.put('/:id', validateDto(FuelRecordUpdateDto), controller.update);
router.delete('/:id', controller.delete);

export default router;
