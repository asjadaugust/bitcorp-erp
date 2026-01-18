/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { SstController } from './sst.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import {
  SafetyIncidentCreateDto,
  SafetyIncidentUpdateDto,
} from '../../types/dto/safety-incident.dto';

const router = Router();
const sstController = new SstController();

router.use(authenticate);

// List all incidents (with pagination and filters)
router.get('/incidents', sstController.getIncidents);

// Get single incident by ID
router.get('/incidents/:id', sstController.getIncidentById);

// Create new incident
router.post('/incidents', validateDto(SafetyIncidentCreateDto), sstController.createIncident);

// Update incident
router.put('/incidents/:id', validateDto(SafetyIncidentUpdateDto), sstController.updateIncident);

// Delete incident
router.delete('/incidents/:id', sstController.deleteIncident);

export default router;
