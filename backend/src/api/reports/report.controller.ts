/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ReportService } from '../../services/report.service';
import { puppeteerPdfService } from '../../services/puppeteer-pdf.service';
import {
  sendError,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
} from '../../utils/api-response';
import Logger from '../../utils/logger';
import { NotFoundError } from '../../errors/http.errors';
import { ValidationError } from '../../errors/validation.error';

const reportService = new ReportService();

export class ReportController {
  async getReports(req: AuthRequest, res: Response) {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      // Extract and validate pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      // Extract filters (excluding pagination params)
      const { page: _page, limit: _limit, ...filters } = req.query;

      // Service now handles pagination internally
      const result = await reportService.getAllReports(tenantId, page, limit, filters as any);

      sendPaginatedSuccess(res, result.data, {
        page,
        limit,
        total: result.total,
      });
    } catch (error: any) {
      Logger.error('Error fetching reports', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        page: req.query.page,
        limit: req.query.limit,
        context: 'ReportController.getReports',
      });

      if (error instanceof ValidationError) {
        return sendError(res, 422, error.name, error.message, error.metadata);
      }

      return sendError(res, 500, 'REPORT_LIST_FAILED', 'Failed to fetch reports', error.message);
    }
  }

  async getReportById(req: AuthRequest, res: Response) {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { id } = req.params;

      // Validate ID format if needed (keep as string for now since service expects string)
      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      // Service now throws NotFoundError instead of returning null
      const report = await reportService.getReportById(tenantId, id);

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error fetching report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.getReportById',
      });

      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message, error.metadata);
      }

      return sendError(res, 500, 'REPORT_GET_FAILED', 'Failed to fetch report', error.message);
    }
  }

  async createReport(req: AuthRequest, res: Response) {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const report = await reportService.createReport(tenantId, req.body);
      sendCreated(res, report);
    } catch (error: any) {
      Logger.error('Error creating report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ReportController.createReport',
      });

      if (error instanceof ValidationError) {
        return sendError(res, 422, error.name, error.message, error.metadata);
      }

      return sendError(res, 500, 'REPORT_CREATE_FAILED', 'Failed to create report', error.message);
    }
  }

  async updateReport(req: AuthRequest, res: Response) {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { id } = req.params;

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      // Service now throws NotFoundError instead of returning null
      const report = await reportService.updateReport(tenantId, id, req.body);

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error updating report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.updateReport',
      });

      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message, error.metadata);
      }

      if (error instanceof ValidationError) {
        return sendError(res, 422, error.name, error.message, error.metadata);
      }

      return sendError(res, 500, 'REPORT_UPDATE_FAILED', 'Failed to update report', error.message);
    }
  }

  async approveReport(req: AuthRequest, res: Response) {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { id } = req.params;
      const userId = String(req.user!.id_usuario);

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      if (!userId) {
        return sendError(res, 401, 'UNAUTHORIZED', 'Usuario no autenticado');
      }

      // Service now throws NotFoundError instead of returning null
      const report = await reportService.approveReport(tenantId, id, userId);

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error approving report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.approveReport',
      });

      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message, error.metadata);
      }

      return sendError(
        res,
        500,
        'REPORT_APPROVE_FAILED',
        'Failed to approve report',
        error.message
      );
    }
  }

  async rejectReport(req: AuthRequest, res: Response) {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      // Service now validates reason, so we don't need to check here
      // Service now throws NotFoundError instead of returning null
      const report = await reportService.rejectReport(tenantId, id, reason);

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error rejecting report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.rejectReport',
      });

      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message, error.metadata);
      }

      if (error instanceof ValidationError) {
        return sendError(res, 422, error.name, error.message, error.metadata);
      }

      return sendError(res, 500, 'REPORT_REJECT_FAILED', 'Failed to reject report', error.message);
    }
  }

  async deleteReport(req: AuthRequest, res: Response) {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { id } = req.params;

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      // Service now throws NotFoundError instead of returning boolean
      await reportService.deleteReport(tenantId, id);

      // 204 No Content on successful deletion
      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error deleting report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.deleteReport',
      });

      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message, error.metadata);
      }

      return sendError(res, 500, 'REPORT_DELETE_FAILED', 'Failed to delete report', error.message);
    }
  }

  async downloadPdf(req: AuthRequest, res: Response) {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { id } = req.params;
      const reportId = parseInt(id);

      if (isNaN(reportId)) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte debe ser un número');
      }

      // Get report data formatted for PDF (service now throws NotFoundError)
      const pdfData = await reportService.getDailyReportPdfData(tenantId, reportId);

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

      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message, error.metadata);
      }

      return sendError(res, 500, 'PDF_GENERATION_FAILED', 'Failed to generate PDF', error.message);
    }
  }
}
