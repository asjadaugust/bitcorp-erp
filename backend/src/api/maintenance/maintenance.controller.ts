import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../../services/maintenance.service';

export class MaintenanceController {
  private maintenanceService: MaintenanceService;

  constructor() {
    this.maintenanceService = new MaintenanceService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: req.query.status as string,
        type: req.query.type as string,
        search: req.query.search as string,
      };

      const result = await this.maintenanceService.getAllMaintenance(filters);

      if ((result as any).tableMissing) {
        return res.json({
          success: true,
          data: [],
          message:
            'Tabla de mantenimiento legacy no encontrada; ejecutar migraciones de mantenimiento',
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

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
      if ((error as Error).message === 'LEGACY_MAINTENANCE_TABLE_MISSING') {
        return res.status(503).json({
          success: false,
          message:
            'Tabla de mantenimiento legacy no encontrada; ejecute migraciones de mantenimiento',
        });
      }

      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const record = await this.maintenanceService.createMaintenance(req.body, userId);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      if ((error as Error).message === 'LEGACY_MAINTENANCE_TABLE_MISSING') {
        return res.status(503).json({
          success: false,
          message:
            'Tabla de mantenimiento legacy no encontrada; ejecute migraciones de mantenimiento',
        });
      }

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
      if ((error as Error).message === 'LEGACY_MAINTENANCE_TABLE_MISSING') {
        return res.status(503).json({
          success: false,
          message:
            'Tabla de mantenimiento legacy no encontrada; ejecute migraciones de mantenimiento',
        });
      }

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
      if ((error as Error).message === 'LEGACY_MAINTENANCE_TABLE_MISSING') {
        return res.status(503).json({
          success: false,
          message:
            'Tabla de mantenimiento legacy no encontrada; ejecute migraciones de mantenimiento',
        });
      }

      next(error);
    }
  };
}
