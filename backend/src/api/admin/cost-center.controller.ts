/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { CostCenterService } from '../../services/cost-center.service';
import Logger from '../../utils/logger';

const costCenterService = new CostCenterService();

export class CostCenterController {
  /**
   * GET /api/admin/cost-centers
   * Get all cost centers with optional filters
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, project_id, is_active } = req.query;

      const filters: any = {};

      if (search) filters.search = String(search);
      if (project_id) filters.project_id = parseInt(String(project_id));
      if (is_active !== undefined) filters.is_active = is_active === 'true';

      const costCenters = await costCenterService.findAll(filters);

      res.json(costCenters);
    } catch (error: any) {
      Logger.error('Error in getAll cost centers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'CostCenterController.getAll',
      });
      res.status(500).json({
        error: 'Failed to fetch cost centers',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/admin/cost-centers/:id
   * Get cost center by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid cost center ID' });
        return;
      }

      const costCenter = await costCenterService.findById(id);

      res.json(costCenter);
    } catch (error: any) {
      Logger.error('Error in getById cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'CostCenterController.getById',
      });

      if (error.message === 'Cost center not found') {
        res.status(404).json({ error: 'Cost center not found' });
        return;
      }

      res.status(500).json({
        error: 'Failed to fetch cost center',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/admin/cost-centers/code/:code
   * Get cost center by code
   */
  static async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const costCenter = await costCenterService.findByCode(code);

      if (!costCenter) {
        res.status(404).json({ error: 'Cost center not found' });
        return;
      }

      res.json(costCenter);
    } catch (error: any) {
      Logger.error('Error in getByCode cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: req.params.code,
        context: 'CostCenterController.getByCode',
      });
      res.status(500).json({
        error: 'Failed to fetch cost center',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/admin/cost-centers/project/:project_id
   * Get cost centers by project
   */
  static async getByProject(req: Request, res: Response): Promise<void> {
    try {
      const project_id = parseInt(req.params.project_id);

      if (isNaN(project_id)) {
        res.status(400).json({ error: 'Invalid project ID' });
        return;
      }

      const costCenters = await costCenterService.findByProject(project_id);

      res.json(costCenters);
    } catch (error: any) {
      Logger.error('Error in getByProject', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.project_id,
        context: 'CostCenterController.getByProject',
      });
      res.status(500).json({
        error: 'Failed to fetch cost centers',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/admin/cost-centers
   * Create new cost center
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const costCenter = await costCenterService.create(req.body);

      res.status(201).json(costCenter);
    } catch (error: any) {
      Logger.error('Error in create cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'CostCenterController.create',
      });

      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      if (error.message.includes('required')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Failed to create cost center',
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/admin/cost-centers/:id
   * Update cost center
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid cost center ID' });
        return;
      }

      const costCenter = await costCenterService.update(id, req.body);

      res.json(costCenter);
    } catch (error: any) {
      Logger.error('Error in update cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'CostCenterController.update',
      });

      if (error.message === 'Cost center not found') {
        res.status(404).json({ error: 'Cost center not found' });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Failed to update cost center',
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/admin/cost-centers/:id
   * Soft delete cost center
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid cost center ID' });
        return;
      }

      await costCenterService.delete(id);

      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error in delete cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'CostCenterController.delete',
      });
      res.status(500).json({
        error: 'Failed to delete cost center',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/admin/cost-centers/stats/count
   * Get active cost centers count
   */
  static async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await costCenterService.getActiveCount();

      res.json({ count });
    } catch (error: any) {
      Logger.error('Error in getActiveCount', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'CostCenterController.getActiveCount',
      });
      res.status(500).json({
        error: 'Failed to count cost centers',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/admin/cost-centers/project/:project_id/budget
   * Get total budget for project
   */
  static async getProjectBudget(req: Request, res: Response): Promise<void> {
    try {
      const project_id = parseInt(req.params.project_id);

      if (isNaN(project_id)) {
        res.status(400).json({ error: 'Invalid project ID' });
        return;
      }

      const total = await costCenterService.getTotalBudgetByProject(project_id);

      res.json({ project_id, total_budget: total });
    } catch (error: any) {
      Logger.error('Error in getProjectBudget', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.project_id,
        context: 'CostCenterController.getProjectBudget',
      });
      res.status(500).json({
        error: 'Failed to calculate budget',
        message: error.message,
      });
    }
  }
}
