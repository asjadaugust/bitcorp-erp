/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { CostCenterController } from './cost-center.controller';
import { validateDto } from '../../middleware/validation.middleware';
import { CostCenterCreateDto, CostCenterUpdateDto } from '../../types/dto/cost-center.dto';

const router = Router();

// GET /api/admin/cost-centers - Get all cost centers (with optional filters)
router.get('/', CostCenterController.getAll);

// GET /api/admin/cost-centers/stats/count - Get active count
router.get('/stats/count', CostCenterController.getActiveCount);

// GET /api/admin/cost-centers/code/:code - Get cost center by code
router.get('/code/:code', CostCenterController.getByCode);

// GET /api/admin/cost-centers/project/:project_id - Get cost centers by project
router.get('/project/:project_id', CostCenterController.getByProject);

// GET /api/admin/cost-centers/project/:project_id/budget - Get total budget for project
router.get('/project/:project_id/budget', CostCenterController.getProjectBudget);

// GET /api/admin/cost-centers/:id - Get cost center by ID
router.get('/:id', CostCenterController.getById);

// POST /api/admin/cost-centers - Create new cost center
router.post('/', validateDto(CostCenterCreateDto), CostCenterController.create);

// PUT /api/admin/cost-centers/:id - Update cost center
router.put('/:id', validateDto(CostCenterUpdateDto), CostCenterController.update);

// DELETE /api/admin/cost-centers/:id - Soft delete cost center
router.delete('/:id', CostCenterController.remove);

export default router;
