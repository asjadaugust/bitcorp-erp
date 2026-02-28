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

// Lazy controller instantiation - defer until first request to avoid "Database not initialized" error
let sstControllerInstance: SstController | null = null;
const getSstController = () => {
  if (!sstControllerInstance) {
    sstControllerInstance = new SstController();
  }
  return sstControllerInstance;
};

router.use(authenticate);

// List all incidents (with pagination and filters)
router.get('/incidents', (req, res) => getSstController().getIncidents(req, res));

// Get single incident by ID
router.get('/incidents/:id', (req, res) => getSstController().getIncidentById(req, res));

// Create new incident
router.post('/incidents', validateDto(SafetyIncidentCreateDto), (req, res) =>
  getSstController().createIncident(req, res)
);

// Update incident
router.put('/incidents/:id', validateDto(SafetyIncidentUpdateDto), (req, res) =>
  getSstController().updateIncident(req, res)
);

// Delete incident
router.delete('/incidents/:id', (req, res) => getSstController().deleteIncident(req, res));

export default router;
