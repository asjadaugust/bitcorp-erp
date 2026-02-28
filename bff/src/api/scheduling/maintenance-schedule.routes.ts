/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import * as maintenanceScheduleController from './maintenance-schedule.controller';
import { validateDto } from '../../middleware/validation.middleware';
import {
  MaintenanceScheduleCreateDto,
  MaintenanceScheduleUpdateDto,
  GenerateTasksDto,
  CompleteScheduleDto,
} from '../../types/dto/maintenance-schedule.dto';

const router = Router();

// List all maintenance schedules
router.get('/', maintenanceScheduleController.listSchedules);

// Get single schedule
router.get('/:id', maintenanceScheduleController.getScheduleById);

// Create new schedule
router.post(
  '/',
  validateDto(MaintenanceScheduleCreateDto),
  maintenanceScheduleController.createSchedule
);

// Update schedule
router.put(
  '/:id',
  validateDto(MaintenanceScheduleUpdateDto),
  maintenanceScheduleController.updateSchedule
);

// Delete schedule
router.delete('/:id', maintenanceScheduleController.deleteSchedule);

// Generate tasks from schedules
router.post(
  '/generate-tasks',
  validateDto(GenerateTasksDto),
  maintenanceScheduleController.generateTasks
);

// Complete schedule (mark as done and recalculate next due)
router.post(
  '/:id/complete',
  validateDto(CompleteScheduleDto),
  maintenanceScheduleController.completeSchedule
);

export default router;
