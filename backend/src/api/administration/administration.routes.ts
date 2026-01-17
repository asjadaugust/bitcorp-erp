/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { AdministrationController } from './administration.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { CostCenterCreateDto, CostCenterUpdateDto } from '../../types/dto/cost-center.dto';

const router = Router();
const adminController = new AdministrationController();

router.use(authenticate);

router.get('/cost-centers', adminController.getCostCenters);
router.post('/cost-centers', validateDto(CostCenterCreateDto), adminController.createCostCenter);
router.get('/cost-centers/:id', adminController.getCostCenterById);
router.put('/cost-centers/:id', validateDto(CostCenterUpdateDto), adminController.updateCostCenter);
router.delete('/cost-centers/:id', adminController.deleteCostCenter);

export default router;
