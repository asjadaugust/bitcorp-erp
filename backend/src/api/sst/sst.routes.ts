import { Router } from 'express';
import { SstController } from './sst.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const sstController = new SstController();

router.use(authenticate);

router.get('/incidents', sstController.getIncidents);
router.post('/incidents', sstController.createIncident);

export default router;
