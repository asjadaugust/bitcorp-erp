/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ProviderService } from '../../services/provider.service';
import { TipoProveedor } from '../../models/provider.model';
import Logger from '../../utils/logger';

const providerService = new ProviderService();

export class ProviderController {
  /**
   * GET /api/providers
   * Get all providers with optional filters
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, is_active, tipo_proveedor } = req.query;

      const filters: any = {};

      if (search) filters.search = String(search);
      if (is_active !== undefined) filters.is_active = is_active === 'true';
      if (tipo_proveedor) filters.tipo_proveedor = String(tipo_proveedor);

      const providers = await providerService.findAll(filters);

      res.json(providers);
    } catch (error: any) {
      Logger.error('Error in getAll providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProviderController.getAll',
      });
      res.status(500).json({
        error: 'Failed to fetch providers',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/providers/:id
   * Get provider by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid provider ID' });
        return;
      }

      const provider = await providerService.findById(id);

      res.json(provider);
    } catch (error: any) {
      Logger.error('Error in getById provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.id,
        context: 'ProviderController.getById',
      });

      if (error.message === 'Provider not found') {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      res.status(500).json({
        error: 'Failed to fetch provider',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/providers/ruc/:ruc
   * Get provider by RUC
   */
  static async getByRuc(req: Request, res: Response): Promise<void> {
    try {
      const { ruc } = req.params;

      const provider = await providerService.findByRuc(ruc);

      if (!provider) {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      res.json(provider);
    } catch (error: any) {
      Logger.error('Error in getByRuc provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ruc: req.params.ruc,
        context: 'ProviderController.getByRuc',
      });
      res.status(500).json({
        error: 'Failed to fetch provider',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/providers
   * Create new provider
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const provider = await providerService.create(req.body);

      res.status(201).json(provider);
    } catch (error: any) {
      Logger.error('Error in create provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProviderController.create',
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
        error: 'Failed to create provider',
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/providers/:id
   * Update provider
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid provider ID' });
        return;
      }

      const provider = await providerService.update(id, req.body);

      res.json(provider);
    } catch (error: any) {
      Logger.error('Error in update provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.id,
        context: 'ProviderController.update',
      });

      if (error.message === 'Provider not found') {
        res.status(404).json({ error: 'Provider not found' });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Failed to update provider',
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/providers/:id
   * Soft delete provider
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid provider ID' });
        return;
      }

      await providerService.delete(id);

      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error in delete provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.id,
        context: 'ProviderController.delete',
      });
      res.status(500).json({
        error: 'Failed to delete provider',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/providers/type/:type
   * Get providers by type
   */
  static async getByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;

      const providers = await providerService.findByType(type as TipoProveedor);

      res.json(providers);
    } catch (error: any) {
      Logger.error('Error in getByType providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: req.params.type,
        context: 'ProviderController.getByType',
      });
      res.status(500).json({
        error: 'Failed to fetch providers by type',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/providers/stats/count
   * Get active providers count
   */
  static async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await providerService.getActiveCount();

      res.json({ count });
    } catch (error: any) {
      Logger.error('Error in getActiveCount', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProviderController.getActiveCount',
      });
      res.status(500).json({
        error: 'Failed to count providers',
        message: error.message,
      });
    }
  }
}
