import { Request, Response, NextFunction } from 'express';
import { FuelService } from '../../services/fuel.service';

export class FuelController {
  private fuelService: FuelService;

  constructor() {
    this.fuelService = new FuelService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Legacy fuel table not migrated yet - return empty for now
      res.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const record = await this.fuelService.getFuelRecordById(parseInt(id));
      if (!record)
        return res.status(404).json({ success: false, message: 'Fuel record not found' });
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const record = await this.fuelService.createFuelRecord(req.body, userId);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const record = await this.fuelService.updateFuelRecord(parseInt(id), req.body, userId);
      if (!record)
        return res.status(404).json({ success: false, message: 'Fuel record not found' });
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.fuelService.deleteFuelRecord(parseInt(id));
      if (!success)
        return res.status(404).json({ success: false, message: 'Fuel record not found' });
      res.json({ success: true, message: 'Fuel record deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}
