/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import * as scheduledTaskController from './scheduled-task.controller';

const router = Router();

// List all tasks
router.get('/', scheduledTaskController.listTasks);

// Get single task
router.get('/:id', scheduledTaskController.getTaskById);

// Create new task
router.post('/', scheduledTaskController.createTask);

// Update task
router.put('/:id', scheduledTaskController.updateTask);

// Delete task
router.delete('/:id', scheduledTaskController.deleteTask);

// Assign operator to task
router.post('/:id/assign', scheduledTaskController.assignOperator);

// Complete task
router.post('/:id/complete', scheduledTaskController.completeTask);

// Check for scheduling conflicts
router.get('/check-conflicts', scheduledTaskController.checkConflicts);

export default router;
