/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { FuelService } from '../../services/fuel.service';
import {
  sendError,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
} from '../../utils/api-response';

export class FuelController {
  private fuelService: FuelService;

  constructor() {
    this.fuelService = new FuelService();
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
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

      const result = await this.fuelService.getAllFuelRecords(filters);

      sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
    } catch (error: any) {
      sendError(res, 500, 'FUEL_LIST_FAILED', 'Failed to fetch fuel records', error.message);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de registro de combustible debe ser un número');
        return;
      }

      const record = await this.fuelService.getFuelRecordById(id);

      if (!record) {
        sendError(res, 404, 'FUEL_NOT_FOUND', 'Registro de combustible no encontrado');
        return;
      }

      sendSuccess(res, record);
    } catch (error: any) {
      sendError(res, 500, 'FUEL_GET_FAILED', 'Failed to fetch fuel record', error.message);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await this.fuelService.createFuelRecord(req.body);
      sendCreated(res, record);
    } catch (error: any) {
      sendError(res, 400, 'FUEL_CREATE_FAILED', 'Failed to create fuel record', error.message);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de registro de combustible debe ser un número');
        return;
      }

      const record = await this.fuelService.updateFuelRecord(id, req.body);

      if (!record) {
        sendError(res, 404, 'FUEL_NOT_FOUND', 'Registro de combustible no encontrado');
        return;
      }

      sendSuccess(res, record);
    } catch (error: any) {
      sendError(res, 400, 'FUEL_UPDATE_FAILED', 'Failed to update fuel record', error.message);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de registro de combustible debe ser un número');
        return;
      }

      const success = await this.fuelService.deleteFuelRecord(id);

      if (!success) {
        sendError(res, 404, 'FUEL_NOT_FOUND', 'Registro de combustible no encontrado');
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      sendError(res, 500, 'FUEL_DELETE_FAILED', 'Failed to delete fuel record', error.message);
    }
  };
}
