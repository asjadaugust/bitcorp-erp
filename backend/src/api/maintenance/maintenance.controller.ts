/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../../services/maintenance.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';

export class MaintenanceController {
  private maintenanceService: MaintenanceService;

  constructor() {
    this.maintenanceService = new MaintenanceService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, type, search, page, limit, sort_by, sort_order } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);

      const filters: any = {
        page: pageNum,
        limit: limitNum,
        sort_by: sort_by as string,
        sort_order: (String(sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC',
      };

      if (status) filters.status = status;
      if (type) filters.type = type;
      if (search) filters.search = search;

      const result = await this.maintenanceService.getAllMaintenance(filters);

      sendPaginatedSuccess(res, result.data, {
        page: pageNum,
        limit: limitNum,
        total: result.total,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'FETCH_MAINTENANCE_FAILED',
        'No se pudieron obtener los registros de mantenimiento',
        error.message
      );
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de mantenimiento inválido');
        return;
      }

      const record = await this.maintenanceService.getMaintenanceById(id);

      if (!record) {
        sendError(res, 404, 'MAINTENANCE_NOT_FOUND', 'Registro de mantenimiento no encontrado');
        return;
      }

      sendSuccess(res, record);
    } catch (error: any) {
      sendError(
        res,
        500,
        'FETCH_MAINTENANCE_FAILED',
        'No se pudo obtener el registro de mantenimiento',
        error.message
      );
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const record = await this.maintenanceService.createMaintenance(req.body, userId);
      sendCreated(res, record);
    } catch (error: any) {
      sendError(
        res,
        400,
        'CREATE_MAINTENANCE_FAILED',
        'No se pudo crear el registro de mantenimiento',
        error.message
      );
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de mantenimiento inválido');
        return;
      }

      const userId = (req as any).user.id;
      const record = await this.maintenanceService.updateMaintenance(id, req.body, userId);

      if (!record) {
        sendError(res, 404, 'MAINTENANCE_NOT_FOUND', 'Registro de mantenimiento no encontrado');
        return;
      }

      sendSuccess(res, record);
    } catch (error: any) {
      sendError(
        res,
        500,
        'UPDATE_MAINTENANCE_FAILED',
        'No se pudo actualizar el registro de mantenimiento',
        error.message
      );
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de mantenimiento inválido');
        return;
      }

      const success = await this.maintenanceService.deleteMaintenance(id);

      if (!success) {
        sendError(res, 404, 'MAINTENANCE_NOT_FOUND', 'Registro de mantenimiento no encontrado');
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        500,
        'DELETE_MAINTENANCE_FAILED',
        'No se pudo eliminar el registro de mantenimiento',
        error.message
      );
    }
  };
}
