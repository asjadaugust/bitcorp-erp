import { Router } from 'express';
import { AdministrationController } from './administration.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const adminController = new AdministrationController();

router.use(authenticate);

router.get('/cost-centers', adminController.getCostCenters);
router.post('/cost-centers', adminController.createCostCenter);
router.get('/cost-centers/:id', adminController.getCostCenterById);
router.put('/cost-centers/:id', adminController.updateCostCenter);
router.delete('/cost-centers/:id', adminController.deleteCostCenter);

export default router;
