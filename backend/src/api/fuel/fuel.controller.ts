/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { FuelService } from '../../services/fuel.service';
import { sendError } from '../../utils/api-response';

export class FuelController {
  private fuelService: FuelService;

  constructor() {
    this.fuelService = new FuelService();
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        valorizacionId: req.query.valorizacionId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        tipoCombustible: req.query.tipoCombustible,
        search: req.query.search,
      };

      const result = await this.fuelService.getAllFuelRecords(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      sendError(res, 500, 'FUEL_LIST_FAILED', 'Failed to fetch fuel records', error.message);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.fuelService.getFuelRecordById(parseInt(id));

      if (!record) {
        sendError(res, 404, 'FUEL_NOT_FOUND', 'Fuel record not found');
        return;
      }

      res.json({ success: true, data: record });
    } catch (error: any) {
      sendError(res, 500, 'FUEL_GET_FAILED', 'Failed to fetch fuel record', error.message);
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await this.fuelService.createFuelRecord(req.body);
      res.status(201).json({ success: true, data: record });
    } catch (error: any) {
      sendError(res, 400, 'FUEL_CREATE_FAILED', 'Failed to create fuel record', error.message);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const record = await this.fuelService.updateFuelRecord(parseInt(id), req.body);

      if (!record) {
        sendError(res, 404, 'FUEL_NOT_FOUND', 'Fuel record not found');
        return;
      }

      res.json({ success: true, data: record });
    } catch (error: any) {
      sendError(res, 400, 'FUEL_UPDATE_FAILED', 'Failed to update fuel record', error.message);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.fuelService.deleteFuelRecord(parseInt(id));

      if (!success) {
        sendError(res, 404, 'FUEL_NOT_FOUND', 'Fuel record not found');
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      sendError(res, 500, 'FUEL_DELETE_FAILED', 'Failed to delete fuel record', error.message);
    }
  };
}
