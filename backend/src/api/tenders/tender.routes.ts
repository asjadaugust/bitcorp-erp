/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { TenderController } from './tender.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { LicitacionCreateDto, LicitacionUpdateDto } from '../../types/dto/tender.dto';

const router = Router();
const tenderController = new TenderController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Tender CRUD routes
router.get('/', tenderController.getTenders);
router.get('/:id', tenderController.getTenderById);
router.post('/', validateDto(LicitacionCreateDto), tenderController.createTender);
router.put('/:id', validateDto(LicitacionUpdateDto), tenderController.updateTender);
router.delete('/:id', tenderController.deleteTender);

export default router;
