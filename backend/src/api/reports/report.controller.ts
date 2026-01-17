/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ReportService } from '../../services/report.service';
import { puppeteerPdfService } from '../../services/puppeteer-pdf.service';
import {
  sendError,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
} from '../../utils/api-response';
import Logger from '../../utils/logger';

const reportService = new ReportService();

export class ReportController {
  async getReports(req: Request, res: Response) {
    try {
      // Extract and validate pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      const filters = req.query;
      const reports = await reportService.getAllReports(filters);

      // Manual pagination since service returns full array
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedReports = reports.slice(startIndex, endIndex);

      sendPaginatedSuccess(res, paginatedReports, {
        page,
        limit,
        total: reports.length,
      });
    } catch (error: any) {
      Logger.error('Error fetching reports', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        page: req.query.page,
        limit: req.query.limit,
        context: 'ReportController.getReports',
      });
      return sendError(res, 500, 'REPORT_LIST_FAILED', 'Failed to fetch reports', error.message);
    }
  }

  async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Validate ID format if needed (keep as string for now since service expects string)
      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      const report = await reportService.getReportById(id);

      if (!report) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');
      }

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error fetching report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.getReportById',
      });
      return sendError(res, 500, 'REPORT_GET_FAILED', 'Failed to fetch report', error.message);
    }
  }

  async createReport(req: Request, res: Response) {
    try {
      const report = await reportService.createReport(req.body);
      sendCreated(res, report);
    } catch (error: any) {
      Logger.error('Error creating report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ReportController.createReport',
      });
      return sendError(res, 500, 'REPORT_CREATE_FAILED', 'Failed to create report', error.message);
    }
  }

  async updateReport(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      const report = await reportService.updateReport(id, req.body);

      if (!report) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');
      }

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error updating report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.updateReport',
      });
      return sendError(res, 500, 'REPORT_UPDATE_FAILED', 'Failed to update report', error.message);
    }
  }

  async approveReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      if (!userId) {
        return sendError(res, 401, 'UNAUTHORIZED', 'Usuario no autenticado');
      }

      const report = await reportService.approveReport(id, userId);

      if (!report) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');
      }

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error approving report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.approveReport',
      });
      return sendError(
        res,
        500,
        'REPORT_APPROVE_FAILED',
        'Failed to approve report',
        error.message
      );
    }
  }

  async rejectReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      if (!reason) {
        return sendError(res, 400, 'REJECTION_REASON_REQUIRED', 'Razón de rechazo es requerida');
      }

      const report = await reportService.rejectReport(id, reason);

      if (!report) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');
      }

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error rejecting report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.rejectReport',
      });
      return sendError(res, 500, 'REPORT_REJECT_FAILED', 'Failed to reject report', error.message);
    }
  }

  async deleteReport(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      const success = await reportService.deleteReport(id);

      if (!success) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');
      }

      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error deleting report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.deleteReport',
      });
      return sendError(res, 500, 'REPORT_DELETE_FAILED', 'Failed to delete report', error.message);
    }
  }

  async downloadPdf(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reportId = parseInt(id);

      if (isNaN(reportId)) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte debe ser un número');
      }

      // Get report data formatted for PDF
      const pdfData = await reportService.getDailyReportPdfData(reportId);

      // Generate PDF
      const pdf = await puppeteerPdfService.generateDailyReportPdf(pdfData);

      // Create filename
      const filename = `parte-diario-${pdfData.numero_parte}.pdf`;

      // Send PDF response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdf.length);
      res.send(pdf);
    } catch (error: any) {
      Logger.error('Error generating PDF', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.downloadPdf',
      });
      return sendError(res, 500, 'PDF_GENERATION_FAILED', 'Failed to generate PDF', error.message);
    }
  }
}
