/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { TenderController } from './tender.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const tenderController = new TenderController();

router.use(authenticate);

router.get('/', tenderController.getTenders);
router.post('/', tenderController.createTender);

export default router;
