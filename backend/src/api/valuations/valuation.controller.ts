import { Request, Response, NextFunction } from 'express';
import { ValuationService } from '../../services/valuation.service';
import { PdfService } from '../../services/pdf.service';

export class ValuationController {
  private valuationService: ValuationService;

  constructor() {
    this.valuationService = new ValuationService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const result = await this.valuationService.getAllValuations(filters);

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
      const record = await this.valuationService.getValuationById(id);
      if (!record) return res.status(404).json({ success: false, message: 'Valuation not found' });
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.valuationService.getAnalytics();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const record = await this.valuationService.createValuation(req.body, userId);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const record = await this.valuationService.updateValuation(id, req.body, userId);
      if (!record) return res.status(404).json({ success: false, message: 'Valuation not found' });
      res.json({ success: true, data: record });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const success = await this.valuationService.deleteValuation(id);
      if (!success) return res.status(404).json({ success: false, message: 'Valuation not found' });
      res.json({ success: true, message: 'Valuation deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  calculate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contract_id, month, year } = req.body;
      if (!contract_id || !month || !year) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      const result = await this.valuationService.calculateValuation(contract_id, month, year);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contract_id, month, year } = req.body;
      const userId = (req as any).user.id;

      if (!month || !year) {
        return res.status(400).json({ success: false, message: 'Month and year are required' });
      }

      let result;
      if (contract_id) {
        result = await this.valuationService.generateValuationForContract(contract_id, month, year, userId);
      } else {
        result = await this.valuationService.generateValuationsForPeriod(month, year, userId);
      }

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  downloadPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      // If ID is 'preview', we expect data in body (for previewing before saving)
      if (id === 'preview') {
          const data = req.body;
          const pdfService = new PdfService();
          pdfService.generateValuationPdf(data, res);
          return;
      }

      // Use getValuationDetailsForPdf instead of getValuationById
      const record = await this.valuationService.getValuationDetailsForPdf(id);
      if (!record) return res.status(404).json({ success: false, message: 'Valuation not found' });
      
      const pdfService = new PdfService();
      pdfService.generateValuationPdf(record, res);
    } catch (error) {
      next(error);
    }
  };
}
