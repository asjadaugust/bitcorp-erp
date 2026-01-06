/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { ChecklistService } from '../../services/checklist.service';

export class ChecklistController {
  private checklistService: ChecklistService;

  constructor() {
    this.checklistService = new ChecklistService();
  }

  // ===== TEMPLATES =====
  getAllTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        activo: req.query.activo,
        tipoEquipo: req.query.tipoEquipo,
        search: req.query.search,
      };

      const templates = await this.checklistService.getAllTemplates(filters);
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await this.checklistService.getTemplateById(parseInt(id));

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const template = await this.checklistService.createTemplate(req.body, userId);
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await this.checklistService.updateTemplate(parseInt(id), req.body);

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.checklistService.deleteTemplate(parseInt(id));

      if (!success) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ===== ITEMS =====
  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.checklistService.createItem(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const item = await this.checklistService.updateItem(parseInt(id), req.body);

      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.checklistService.deleteItem(parseInt(id));

      if (!success) {
        return res.status(404).json({ success: false, message: 'Item not found' });
      }

      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ===== INSPECTIONS =====
  getAllInspections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        equipoId: req.query.equipoId,
        trabajadorId: req.query.trabajadorId,
        estado: req.query.estado,
        resultadoGeneral: req.query.resultadoGeneral,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await this.checklistService.getAllInspections(filters);

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
    } catch (error) {
      next(error);
    }
  };

  getInspectionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.getInspectionById(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection });
    } catch (error) {
      next(error);
    }
  };

  getInspectionWithResults = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.getInspectionWithResults(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection });
    } catch (error) {
      next(error);
    }
  };

  createInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inspection = await this.checklistService.createInspection(req.body);
      res.status(201).json({ success: true, data: inspection });
    } catch (error) {
      next(error);
    }
  };

  updateInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.updateInspection(parseInt(id), req.body);

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection });
    } catch (error) {
      next(error);
    }
  };

  completeInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.completeInspection(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection, message: 'Inspection completed' });
    } catch (error) {
      next(error);
    }
  };

  cancelInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const inspection = await this.checklistService.cancelInspection(parseInt(id));

      if (!inspection) {
        return res.status(404).json({ success: false, message: 'Inspection not found' });
      }

      res.json({ success: true, data: inspection, message: 'Inspection cancelled' });
    } catch (error) {
      next(error);
    }
  };

  // ===== RESULTS =====
  saveResult = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.checklistService.saveResult(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getResultsByInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inspectionId } = req.params;
      const results = await this.checklistService.getResultsByInspection(parseInt(inspectionId));
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  };

  // ===== STATS =====
  getInspectionStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const stats = await this.checklistService.getInspectionStats(filters);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };
}
