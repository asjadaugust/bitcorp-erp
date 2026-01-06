/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { ValuationService } from '../../services/valuation.service';
import { PdfService } from '../../services/pdf.service';
import { puppeteerPdfService } from '../../services/puppeteer-pdf.service';

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
        result = await this.valuationService.generateValuationForContract(
          contract_id,
          month,
          year,
          userId
        );
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
      const useNewTemplate = req.query.template === 'v2' || true; // Default to new template
      const pageNumber = req.query.page ? parseInt(req.query.page as string) : undefined;

      // If ID is 'preview', we expect data in body (for previewing before saving)
      if (id === 'preview') {
        const data = req.body;
        const pdfService = new PdfService();
        pdfService.generateValuationPdf(data, res);
        return;
      }

      // Get valuation data
      const valuationId = parseInt(id);
      if (isNaN(valuationId)) {
        return res.status(400).json({ success: false, message: 'Invalid valuation ID' });
      }

      if (useNewTemplate) {
        // If no page parameter provided, generate complete PDF with all 7 pages
        if (pageNumber === undefined) {
          const [page1Data, page2Data, page3Data, page4Data, page5Data, page6Data, page7Data] =
            await Promise.all([
              this.valuationService.getValuationPage1Data(valuationId),
              this.valuationService.getValuationPage2Data(valuationId),
              this.valuationService.getValuationPage3Data(valuationId),
              this.valuationService.getValuationPage4Data(valuationId),
              this.valuationService.getValuationPage5Data(valuationId),
              this.valuationService.getValuationPage6Data(valuationId),
              this.valuationService.getValuationPage7Data(valuationId),
            ]);

          const pdf = await puppeteerPdfService.generateCompleteValuationPdf(
            page1Data,
            page2Data,
            page3Data,
            page4Data,
            page5Data,
            page6Data,
            page7Data
          );

          const filename = `valorizacion-${page1Data.valorizacion.numero_valorizacion}-completo.pdf`;

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.setHeader('Content-Length', pdf.length);
          res.send(pdf);
          return;
        }

        // Use new Puppeteer-based PDF generation for individual pages
        let pageData: any;
        let filename: string;

        switch (pageNumber) {
          case 1:
            pageData = await this.valuationService.getValuationPage1Data(valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p1.pdf`;
            break;
          case 2:
            pageData = await this.valuationService.getValuationPage2Data(valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p2.pdf`;
            break;
          case 3:
            pageData = await this.valuationService.getValuationPage3Data(valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p3.pdf`;
            break;
          case 4:
            pageData = await this.valuationService.getValuationPage4Data(valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p4.pdf`;
            break;
          case 5:
            pageData = await this.valuationService.getValuationPage5Data(valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p5.pdf`;
            break;
          case 6:
            pageData = await this.valuationService.getValuationPage6Data(valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p6.pdf`;
            break;
          case 7:
            pageData = await this.valuationService.getValuationPage7Data(valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p7.pdf`;
            break;
          default:
            return res.status(400).json({ error: 'Invalid page number (1-7)' });
        }

        // Generate PDF using the appropriate method
        let pdf: Buffer;
        switch (pageNumber) {
          case 1:
            pdf = await puppeteerPdfService.generateValuationPage1(pageData);
            break;
          case 2:
            pdf = await puppeteerPdfService.generateValuationPage2(pageData);
            break;
          case 3:
            pdf = await puppeteerPdfService.generateValuationPage3(pageData);
            break;
          case 4:
            pdf = await puppeteerPdfService.generateValuationPage4(pageData);
            break;
          case 5:
            pdf = await puppeteerPdfService.generateValuationPage5(pageData);
            break;
          case 6:
            pdf = await puppeteerPdfService.generateValuationPage6(pageData);
            break;
          case 7:
            pdf = await puppeteerPdfService.generateValuationPage7(pageData);
            break;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdf!.length);
        res.send(pdf);
      } else {
        // Use legacy PDFKit-based generation
        const record = await this.valuationService.getValuationDetailsForPdf(id);
        if (!record) {
          return res.status(404).json({ success: false, message: 'Valuation not found' });
        }

        const pdfService = new PdfService();
        pdfService.generateValuationPdf(record, res);
      }
    } catch (error) {
      next(error);
    }
  };
}
