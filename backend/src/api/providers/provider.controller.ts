/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ProviderService } from '../../services/provider.service';
import { TipoProveedor } from '../../models/provider.model';
import Logger from '../../utils/logger';
import { RucFetcherService } from '../../services/ruc-fetcher.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';

const providerService = new ProviderService();
const rucFetcherService = new RucFetcherService();

export class ProviderController {
  /**
   * GET /api/providers
   * Get all providers with optional filters, pagination, and sorting
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, is_active, tipo_proveedor, page, limit, sort_by, sort_order } = req.query;

      const filters: any = {};

      if (search) filters.search = String(search);
      if (is_active !== undefined) filters.is_active = is_active === 'true';
      if (tipo_proveedor) filters.tipo_proveedor = String(tipo_proveedor) as TipoProveedor;
      if (sort_by) filters.sort_by = String(sort_by);
      if (sort_order)
        filters.sort_order = (String(sort_order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as
          | 'ASC'
          | 'DESC';

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);

      const { data, total } = await providerService.findAll(filters, pageNum, limitNum);

      sendPaginatedSuccess(res, data, { page: pageNum, limit: limitNum, total });
    } catch (error: any) {
      Logger.error('Error in getAll providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProviderController.getAll',
      });
      sendError(res, 500, 'PROVIDER_FETCH_FAILED', 'Failed to fetch providers', error.message);
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
        sendError(res, 400, 'INVALID_ID', 'Invalid provider ID');
        return;
      }

      const provider = await providerService.findById(id);

      sendSuccess(res, provider);
    } catch (error: any) {
      Logger.error('Error in getById provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.id,
        context: 'ProviderController.getById',
      });

      if (error.message === 'Provider not found') {
        sendError(res, 404, 'PROVIDER_NOT_FOUND', 'Provider not found');
        return;
      }

      sendError(res, 500, 'PROVIDER_FETCH_FAILED', 'Failed to fetch provider', error.message);
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
        sendError(res, 404, 'PROVIDER_NOT_FOUND', 'Provider not found');
        return;
      }

      sendSuccess(res, provider);
    } catch (error: any) {
      Logger.error('Error in getByRuc provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ruc: req.params.ruc,
        context: 'ProviderController.getByRuc',
      });
      sendError(res, 500, 'PROVIDER_FETCH_FAILED', 'Failed to fetch provider', error.message);
    }
  }

  /**
   * POST /api/providers
   * Create new provider
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const provider = await providerService.create(req.body);

      sendCreated(res, provider);
    } catch (error: any) {
      Logger.error('Error in create provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProviderController.create',
      });

      if (error.message.includes('already exists')) {
        sendError(res, 409, 'DUPLICATE_PROVIDER', error.message);
        return;
      }

      if (error.message.includes('required')) {
        sendError(res, 400, 'VALIDATION_ERROR', error.message);
        return;
      }

      sendError(res, 500, 'PROVIDER_CREATE_FAILED', 'Failed to create provider', error.message);
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
        sendError(res, 400, 'INVALID_ID', 'Invalid provider ID');
        return;
      }

      const provider = await providerService.update(id, req.body);

      sendSuccess(res, provider);
    } catch (error: any) {
      Logger.error('Error in update provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.id,
        context: 'ProviderController.update',
      });

      if (error.message === 'Provider not found') {
        sendError(res, 404, 'PROVIDER_NOT_FOUND', 'Provider not found');
        return;
      }

      if (error.message.includes('already exists')) {
        sendError(res, 409, 'DUPLICATE_PROVIDER', error.message);
        return;
      }

      sendError(res, 500, 'PROVIDER_UPDATE_FAILED', 'Failed to update provider', error.message);
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
        sendError(res, 400, 'INVALID_ID', 'Invalid provider ID');
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
      sendError(res, 500, 'PROVIDER_DELETE_FAILED', 'Failed to delete provider', error.message);
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

      sendSuccess(res, providers);
    } catch (error: any) {
      Logger.error('Error in getByType providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: req.params.type,
        context: 'ProviderController.getByType',
      });
      sendError(
        res,
        500,
        'PROVIDER_FETCH_FAILED',
        'Failed to fetch providers by type',
        error.message
      );
    }
  }

  /**
   * GET /api/providers/stats/count
   * Get active providers count
   */
  static async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await providerService.getActiveCount();

      sendSuccess(res, { count });
    } catch (error: any) {
      Logger.error('Error in getActiveCount', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProviderController.getActiveCount',
      });
      sendError(res, 500, 'PROVIDER_COUNT_FAILED', 'Failed to count providers', error.message);
    }
  }

  /**
   * GET /api/providers/:id/logs
   * Get provider audit logs
   */
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid provider ID');
        return;
      }

      const logs = await providerService.getLogs(id);

      sendSuccess(res, logs);
    } catch (error: any) {
      Logger.error('Error in getLogs provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.id,
        context: 'ProviderController.getLogs',
      });
      sendError(res, 500, 'PROVIDER_LOGS_FAILED', 'Failed to fetch provider logs', error.message);
    }
  }

  /**
   * GET /api/providers/ruc/:ruc/lookup
   * Lookup RUC data from external API
   */
  static async lookupRuc(req: Request, res: Response): Promise<void> {
    try {
      const { ruc } = req.params;
      if (!ruc || ruc.length !== 11) {
        sendError(res, 400, 'INVALID_RUC', 'RUC debe tener 11 dígitos');
        return;
      }

      const data = await rucFetcherService.fetchRuc(ruc);
      sendSuccess(res, data);
    } catch (error: any) {
      sendError(
        res,
        500,
        'RUC_LOOKUP_FAILED',
        'Error al buscar los datos del RUC',
        error.message
      );
    }
  }
}
