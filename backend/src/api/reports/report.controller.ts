/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Response } from 'express';
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
import { DailyReportPhotoService } from '../../services/daily-report-photo.service';
import { toParteDiarioFotoDto } from '../../types/dto/daily-report-photo.dto';

const reportService = new ReportService();
const photoService = new DailyReportPhotoService();

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

  async firmarResidente(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.id_empresa;
      const { id } = req.params;
      const { firma_residente } = req.body;

      if (!id) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte es requerido');
      }

      const report = await reportService.firmarResidente(tenantId, id, firma_residente);

      sendSuccess(res, report);
    } catch (error: any) {
      Logger.error('Error al registrar firma del residente', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reportId: req.params.id,
        context: 'ReportController.firmarResidente',
      });

      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message, error.metadata);
      }

      if (error instanceof ValidationError) {
        return sendError(res, 422, error.name, error.message, error.metadata);
      }

      return sendError(
        res,
        500,
        'FIRMA_RESIDENTE_FAILED',
        'No se pudo registrar la firma',
        error.message
      );
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

  async getReceptionStatus(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.id_empresa;
      const { fecha_desde, fecha_hasta, proyecto_id } = req.query;

      if (!fecha_desde || !fecha_hasta) {
        return sendError(res, 400, 'MISSING_PARAMS', 'fecha_desde y fecha_hasta son requeridos');
      }

      const result = await reportService.getReceptionStatus(
        tenantId,
        fecha_desde as string,
        fecha_hasta as string,
        proyecto_id ? parseInt(proyecto_id as string) : undefined
      );

      sendSuccess(res, result);
    } catch (error: any) {
      Logger.error('Error fetching reception status', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ReportController.getReceptionStatus',
      });
      return sendError(
        res,
        500,
        'RECEPTION_STATUS_FAILED',
        'Failed to fetch reception status',
        error.message
      );
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

  async getInspectionTracking(req: AuthRequest, res: Response) {
    try {
      const { fecha_desde, fecha_hasta, solo_abiertas } = req.query;
      const soloAbiertas = solo_abiertas === 'true';
      const resultado = await reportService.getInspectionTracking(
        fecha_desde as string | undefined,
        fecha_hasta as string | undefined,
        soloAbiertas
      );
      return sendSuccess(res, resultado);
    } catch (error: any) {
      Logger.error('Error fetching inspection tracking', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ReportController.getInspectionTracking',
      });
      return sendError(res, 500, 'INSPECTION_FETCH_FAILED', 'Failed to fetch inspection tracking');
    }
  }

  async resolverObservacion(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'Invalid observation ID');
      const { observacion_resolucion } = req.body;
      await reportService.resolverObservacion(id, observacion_resolucion);
      return sendSuccess(res, { id, resuelta: true });
    } catch (error: any) {
      Logger.error('Error resolving observation', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ReportController.resolverObservacion',
      });
      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message);
      }
      return sendError(res, 500, 'RESOLVE_FAILED', 'Failed to resolve observation');
    }
  }

  async getPhotos(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.id_empresa;
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte debe ser un número');
      }

      const photos = await photoService.getPhotosByReportId(tenantId, reportId);
      sendSuccess(res, photos.map(toParteDiarioFotoDto));
    } catch (error: any) {
      Logger.error('Error fetching report photos', {
        error: error instanceof Error ? error.message : String(error),
        reportId: req.params.id,
        context: 'ReportController.getPhotos',
      });
      return sendError(res, 500, 'PHOTOS_FETCH_FAILED', 'Failed to fetch photos', error.message);
    }
  }

  async uploadPhotos(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.id_empresa;
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return sendError(res, 400, 'INVALID_ID', 'ID de reporte debe ser un número');
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return sendError(res, 400, 'NO_FILES', 'No se proporcionaron archivos');
      }

      const photos = await photoService.uploadPhotos(tenantId, reportId, files);
      sendCreated(res, { photos: photos.map(toParteDiarioFotoDto) });
    } catch (error: any) {
      Logger.error('Error uploading report photos', {
        error: error instanceof Error ? error.message : String(error),
        reportId: req.params.id,
        context: 'ReportController.uploadPhotos',
      });
      return sendError(res, 500, 'PHOTOS_UPLOAD_FAILED', 'Failed to upload photos', error.message);
    }
  }

  async deletePhoto(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.id_empresa;
      const reportId = parseInt(req.params.id);
      const photoId = parseInt(req.params.photoId);

      if (isNaN(reportId) || isNaN(photoId)) {
        return sendError(res, 400, 'INVALID_ID', 'IDs deben ser números');
      }

      await photoService.deletePhoto(tenantId, reportId, photoId);
      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error deleting report photo', {
        error: error instanceof Error ? error.message : String(error),
        reportId: req.params.id,
        photoId: req.params.photoId,
        context: 'ReportController.deletePhoto',
      });

      if (error instanceof NotFoundError) {
        return sendError(res, 404, error.name, error.message);
      }

      return sendError(res, 500, 'PHOTO_DELETE_FAILED', 'Failed to delete photo', error.message);
    }
  }
}
