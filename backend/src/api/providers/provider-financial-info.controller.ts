/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ProviderFinancialInfoService } from '../../services/provider-financial-info.service';
import Logger from '../../utils/logger';

export class ProviderFinancialInfoController {
  private service: ProviderFinancialInfoService;

  constructor() {
    this.service = new ProviderFinancialInfoService();
  }

  /**
   * GET /api/providers/:providerId/financial-info
   * Get all financial info for a provider
   */
  getByProviderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;

      const financialInfo = await this.service.findByProviderId(providerId);
      res.json(financialInfo);
    } catch (error: any) {
      Logger.error('Error in getByProviderId', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.providerId,
        context: 'ProviderFinancialInfoController.getByProviderId',
      });
      res.status(500).json({ error: error.message || 'Error fetching financial info' });
    }
  };

  /**
   * GET /api/providers/financial-info/:id
   * Get financial info by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const financialInfo = await this.service.findById(parseInt(id));
      res.json(financialInfo);
    } catch (error: any) {
      Logger.error('Error in getById', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        financialInfoId: req.params.id,
        context: 'ProviderFinancialInfoController.getById',
      });
      res.status(404).json({ error: error.message || 'Financial info not found' });
    }
  };

  /**
   * POST /api/providers/:providerId/financial-info
   * Create new financial info
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;
      const data = {
        ...req.body,
        provider_id: providerId,
        created_by: (req as any).user?.id,
      };

      const financialInfo = await this.service.create(data);
      res.status(201).json(financialInfo);
    } catch (error: any) {
      Logger.error('Error in create', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.providerId,
        context: 'ProviderFinancialInfoController.create',
      });
      res.status(400).json({ error: error.message || 'Error creating financial info' });
    }
  };

  /**
   * PUT /api/providers/financial-info/:id
   * Update financial info
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
        updated_by: (req as any).user?.id,
      };

      const financialInfo = await this.service.update(parseInt(id), data);
      res.json(financialInfo);
    } catch (error: any) {
      Logger.error('Error in update', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        financialInfoId: req.params.id,
        context: 'ProviderFinancialInfoController.update',
      });
      res.status(400).json({ error: error.message || 'Error updating financial info' });
    }
  };

  /**
   * DELETE /api/providers/financial-info/:id
   * Delete financial info
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const deleted = await this.service.delete(parseInt(id));

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Financial info not found' });
      }
    } catch (error: any) {
      Logger.error('Error in delete', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        financialInfoId: req.params.id,
        context: 'ProviderFinancialInfoController.delete',
      });
      res.status(500).json({ error: error.message || 'Error deleting financial info' });
    }
  };
}
