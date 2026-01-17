/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { TenderController } from './tender.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { LicitacionCreateDto } from '../../types/dto/tender.dto';

const router = Router();
const tenderController = new TenderController();

router.use(authenticate);

router.get('/', tenderController.getTenders);
router.post('/', validateDto(LicitacionCreateDto), tenderController.createTender);

export default router;
