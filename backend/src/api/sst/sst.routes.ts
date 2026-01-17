/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { SstController } from './sst.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { IncidenteCreateDto } from '../../types/dto/sst.dto';

const router = Router();
const sstController = new SstController();

router.use(authenticate);

router.get('/incidents', sstController.getIncidents);
router.post('/incidents', validateDto(IncidenteCreateDto), sstController.createIncident);

export default router;
