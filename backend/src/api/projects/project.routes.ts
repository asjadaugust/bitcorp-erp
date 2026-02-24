/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ProjectController } from './project.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import {
  ProjectCreateDto,
  ProjectUpdateDto,
  AssignUserToProjectDto,
} from '../../types/dto/project.dto';

const router = Router();
const projectController = new ProjectController();

// All routes require authentication
router.use(authenticate);

// GET /api/projects - Get all projects (optionally filtered by user)
router.get('/', projectController.findAll);

// GET /api/projects/stats - Get project statistics
router.get('/stats', projectController.getStats);

// GET /api/projects/code/:code - Get project by code
router.get('/code/:code', projectController.findByCode);

// GET /api/projects/:id - Get project by ID
router.get('/:id', projectController.findById);

// POST /api/projects - Create new project
router.post('/', validateDto(ProjectCreateDto), projectController.create);

// PUT /api/projects/:id - Update project
router.put('/:id', validateDto(ProjectUpdateDto), projectController.update);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', projectController.delete);

// POST /api/projects/:id/users - Assign user to project
router.post('/:id/users', validateDto(AssignUserToProjectDto), projectController.assignUser);

// DELETE /api/projects/:id/users/:userId - Unassign user from project
router.delete('/:id/users/:userId', projectController.unassignUser);

// GET /api/projects/:id/users - Get project users
router.get('/:id/users', projectController.getProjectUsers);

// GET /api/projects/export/excel - Export to Excel
router.get('/export/excel', projectController.exportExcel);

// GET /api/projects/export/csv - Export to CSV
router.get('/export/csv', projectController.exportCSV);

export default router;
