/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../../services/maintenance.service';

export class MaintenanceController {
  private maintenanceService: MaintenanceService;

  constructor() {
    this.maintenanceService = new MaintenanceService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: any = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      if (req.query.status) filters.status = req.query.status;
      if (req.query.type) filters.type = req.query.type;
      if (req.query.search) filters.search = req.query.search;

      const result = await this.maintenanceService.getAllMaintenance(filters);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const record = await this.maintenanceService.getMaintenanceById(parseInt(id));

      if (!record) {
        return res.status(404).json({ success: false, message: 'Maintenance record not found' });
      }

      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const record = await this.maintenanceService.createMaintenance(req.body, userId);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const record = await this.maintenanceService.updateMaintenance(
        parseInt(id),
        req.body,
        userId
      );

      if (!record) {
        return res.status(404).json({ success: false, message: 'Maintenance record not found' });
      }

      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.maintenanceService.deleteMaintenance(parseInt(id));

      if (!success) {
        return res.status(404).json({ success: false, message: 'Maintenance record not found' });
      }

      res.json({ success: true, message: 'Maintenance record deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
