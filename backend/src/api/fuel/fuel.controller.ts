/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { FuelService } from '../../services/fuel.service';
import {
  sendError,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
} from '../../utils/api-response';
import { NotFoundError } from '../../errors/http.errors';
import { BusinessRuleError } from '../../errors/business.error';
import { AppError } from '../../errors/base.error';

/**
 * Fuel Controller
 *
 * Handles HTTP requests for fuel record management.
 *
 * TODO: Implement proper tenant context extraction from JWT
 * Currently using hardcoded tenantId = 1 for all requests.
 * Update JwtPayload interface to include tenantId field.
 */
export class FuelController {
  private fuelService: FuelService;

  constructor() {
    this.fuelService = new FuelService();
  }

  /**
   * Get all fuel records with pagination and filters
   * GET /api/fuel?page=1&limit=20&valorizacionId=123
   */
  getAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // TODO: Extract tenantId from req.user.tenantId when JWT is updated
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)

      // Extract and validate pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

      const filters = {
        page,
        limit,
        valorizacionId: req.query.valorizacionId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        tipoCombustible: req.query.tipoCombustible,
        search: req.query.search,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
      };

      const result = await this.fuelService.getAllFuelRecords(tenantId, filters);

      sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
    } catch (error: any) {
      if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message);
      } else {
        sendError(res, 500, 'FUEL_LIST_FAILED', 'Failed to fetch fuel records', error.message);
      }
    }
  };

  /**
   * Get single fuel record by ID
   * GET /api/fuel/:id
   */
  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // TODO: Extract tenantId from req.user.tenantId when JWT is updated
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de registro de combustible debe ser un número');
        return;
      }

      const record = await this.fuelService.getFuelRecordById(tenantId, id);

      sendSuccess(res, record);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'FUEL_NOT_FOUND', error.message);
      } else if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message);
      } else {
        sendError(res, 500, 'FUEL_GET_FAILED', 'Failed to fetch fuel record', error.message);
      }
    }
  };

  /**
   * Create new fuel record
   * POST /api/fuel
   */
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // TODO: Extract tenantId from req.user.tenantId when JWT is updated
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)

      const record = await this.fuelService.createFuelRecord(tenantId, req.body);
      sendCreated(res, record);
    } catch (error: any) {
      if (error instanceof BusinessRuleError) {
        sendError(res, 422, error.code, error.message, error.metadata);
      } else if (error instanceof NotFoundError) {
        sendError(res, 404, 'RELATED_RESOURCE_NOT_FOUND', error.message);
      } else if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message);
      } else {
        sendError(res, 400, 'FUEL_CREATE_FAILED', 'Failed to create fuel record', error.message);
      }
    }
  };

  /**
   * Update fuel record
   * PUT /api/fuel/:id
   */
  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // TODO: Extract tenantId from req.user.tenantId when JWT is updated
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de registro de combustible debe ser un número');
        return;
      }

      const record = await this.fuelService.updateFuelRecord(tenantId, id, req.body);

      sendSuccess(res, record);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'FUEL_NOT_FOUND', error.message);
      } else if (error instanceof BusinessRuleError) {
        sendError(res, 422, error.code, error.message, error.metadata);
      } else if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message);
      } else {
        sendError(res, 400, 'FUEL_UPDATE_FAILED', 'Failed to update fuel record', error.message);
      }
    }
  };

  /**
   * Delete fuel record
   * DELETE /api/fuel/:id
   */
  delete = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // TODO: Extract tenantId from req.user.tenantId when JWT is updated
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)

      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de registro de combustible debe ser un número');
        return;
      }

      await this.fuelService.deleteFuelRecord(tenantId, id);

      res.status(204).send();
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'FUEL_NOT_FOUND', error.message);
      } else if (error instanceof BusinessRuleError) {
        sendError(res, 422, error.code, error.message, error.metadata);
      } else if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message);
      } else {
        sendError(res, 500, 'FUEL_DELETE_FAILED', 'Failed to delete fuel record', error.message);
      }
    }
  };
}
