/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { ProductCreateDto, ProductUpdateDto } from '../../types/dto/product.dto';

const router = Router();
const controller = new ProductController();

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateDto(ProductCreateDto), controller.create);
router.put('/:id', validateDto(ProductUpdateDto), controller.update);
router.delete('/:id', controller.delete);

export default router;
