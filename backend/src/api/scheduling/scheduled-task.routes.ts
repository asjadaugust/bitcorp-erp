/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import * as scheduledTaskController from './scheduled-task.controller';
import { validateDto } from '../../middleware/validation.middleware';
import { ScheduledTaskCreateDto, ScheduledTaskUpdateDto } from '../../types/dto/scheduled-task.dto';

const router = Router();

// List all tasks
router.get('/', scheduledTaskController.listTasks);

// Get single task
router.get('/:id', scheduledTaskController.getTaskById);

// Create new task
router.post('/', validateDto(ScheduledTaskCreateDto), scheduledTaskController.createTask);

// Update task
router.put('/:id', validateDto(ScheduledTaskUpdateDto), scheduledTaskController.updateTask);

// Delete task
router.delete('/:id', scheduledTaskController.deleteTask);

// Assign operator to task
router.post('/:id/assign', scheduledTaskController.assignOperator);

// Complete task
router.post('/:id/complete', scheduledTaskController.completeTask);

// Check for scheduling conflicts
router.get('/check-conflicts', scheduledTaskController.checkConflicts);

export default router;
