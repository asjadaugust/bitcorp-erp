/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ValuationService } from '../../services/valuation.service';
import { PdfService } from '../../services/pdf.service';
import { puppeteerPdfService } from '../../services/puppeteer-pdf.service';
import { toValuationDto } from '../../types/dto/valuation.dto';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';

export class ValuationController {
  private valuationService: ValuationService;

  constructor() {
    this.valuationService = new ValuationService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const sort_by = req.query.sort_by as string;
      const sort_order = req.query.sort_order?.toString().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const filters = {
        page,
        limit,
        sort_by,
        sort_order,
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const result = await this.valuationService.getAllValuations(tenantId, filters);

      sendPaginatedSuccess(res, result.data, {
        page,
        limit,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const data = await this.valuationService.getValuationPage1Data(tenantId, id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const record = await this.valuationService.getValuationById(tenantId, id.toString());
      if (!record) {
        sendError(res, 404, 'VALUATION_NOT_FOUND', 'Valorización no encontrada');
        return;
      }

      // Enrich with deadline info
      const deadlines = ValuationService.computeDeadlines(record.periodo);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const enriched = {
        ...record,
        deadlines: deadlines
          ? {
              parcial: deadlines.parcial.toISOString().split('T')[0],
              gasto_obra: deadlines.gastoObra.toISOString().split('T')[0],
              adelantos: deadlines.adelantos.toISOString().split('T')[0],
              final: deadlines.final.toISOString().split('T')[0],
              is_overdue:
                today > deadlines.final && ['BORRADOR', 'PENDIENTE'].includes(record.estado),
              days_until_final: Math.ceil(
                (deadlines.final.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              ),
            }
          : null,
      };

      sendSuccess(res, enriched);
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthRequest).user!.id_empresa;
      const data = await this.valuationService.getAnalytics(tenantId);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user!.id_usuario;
      const record = await this.valuationService.createValuation(
        tenantId,
        req.body,
        String(userId)
      );
      sendCreated(res, (record as any).id, 'Valorización creada exitosamente');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user!.id_usuario;
      const record = await this.valuationService.updateValuation(
        tenantId,
        id.toString(),
        req.body,
        String(userId)
      );
      if (!record) {
        sendError(res, 404, 'VALUATION_NOT_FOUND', 'Valorización no encontrada');
        return;
      }

      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const success = await this.valuationService.deleteValuation(tenantId, id.toString());
      if (!success) {
        sendError(res, 404, 'VALUATION_NOT_FOUND', 'Valorización no encontrada');
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  calculate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.id_empresa;
      const { contract_id, month, year } = req.body;
      if (!contract_id || !month || !year) {
        sendError(res, 400, 'MISSING_FIELDS', 'Campos requeridos: contract_id, month, year');
        return;
      }
      const result = await this.valuationService.calculateValuation(
        tenantId,
        contract_id,
        month,
        year
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  generate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.id_empresa;
      const { contract_id, month, year } = req.body;
      const userId = String(req.user!.id_usuario);

      if (!month || !year) {
        sendError(res, 400, 'MISSING_FIELDS', 'Campos requeridos: month, year');
        return;
      }

      let result;
      if (contract_id) {
        result = await this.valuationService.generateValuationForContract(
          tenantId,
          contract_id,
          month,
          year,
          userId
        );
      } else {
        result = await this.valuationService.generateValuationsForPeriod(
          tenantId,
          month,
          year,
          userId
        );
      }

      sendSuccess(res, result);
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

      const tenantId = (req as AuthRequest).user!.id_empresa;

      if (useNewTemplate) {
        // If no page parameter provided, generate complete PDF with all 7 pages
        if (pageNumber === undefined) {
          const [page1Data, page2Data, page3Data, page4Data, page5Data, page6Data, page7Data] =
            await Promise.all([
              this.valuationService.getValuationPage1Data(tenantId, valuationId),
              this.valuationService.getValuationPage2Data(tenantId, valuationId),
              this.valuationService.getValuationPage3Data(tenantId, valuationId),
              this.valuationService.getValuationPage4Data(tenantId, valuationId),
              this.valuationService.getValuationPage5Data(tenantId, valuationId),
              this.valuationService.getValuationPage6Data(tenantId, valuationId),
              this.valuationService.getValuationPage7Data(tenantId, valuationId),
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
            pageData = await this.valuationService.getValuationPage1Data(tenantId, valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p1.pdf`;
            break;
          case 2:
            pageData = await this.valuationService.getValuationPage2Data(tenantId, valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p2.pdf`;
            break;
          case 3:
            pageData = await this.valuationService.getValuationPage3Data(tenantId, valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p3.pdf`;
            break;
          case 4:
            pageData = await this.valuationService.getValuationPage4Data(tenantId, valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p4.pdf`;
            break;
          case 5:
            pageData = await this.valuationService.getValuationPage5Data(tenantId, valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p5.pdf`;
            break;
          case 6:
            pageData = await this.valuationService.getValuationPage6Data(tenantId, valuationId);
            filename = `valorizacion-${pageData.valorizacion.numero_valorizacion}-p6.pdf`;
            break;
          case 7:
            pageData = await this.valuationService.getValuationPage7Data(tenantId, valuationId);
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
        const record = await this.valuationService.getValuationDetailsForPdf(
          tenantId,
          id.toString()
        );
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

  /**
   * Get valuation registry (consolidated cross-project)
   * GET /api/valuations/registry
   */
  getRegistry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        proyecto_id: req.query.proyecto_id ? parseInt(req.query.proyecto_id as string) : undefined,
        periodo_desde: req.query.periodo_desde as string,
        periodo_hasta: req.query.periodo_hasta as string,
        estado: req.query.estado as string,
        proveedor: req.query.proveedor as string,
        equipo_id: req.query.equipo_id ? parseInt(req.query.equipo_id as string) : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 50, 200),
      };

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const result = await this.valuationService.getRegistry(tenantId, filters);

      // Service already returns DTOs, so we don't need to map them again
      const responseData = {
        data: result.data,
        total: result.total,
        summary: result.summary,
      };

      sendSuccess(res, responseData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit draft valuation (BORRADOR → PENDIENTE)
   * POST /api/valuations/:id/submit-draft
   */
  submitDraft = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user!.id_usuario;
      const record = await this.valuationService.submitDraft(tenantId, id, userId);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submit valuation for review
   * POST /api/valuations/:id/submit-review
   */
  submitForReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user!.id_usuario;
      const record = await this.valuationService.submitForReview(tenantId, id, userId);

      sendSuccess(res, record);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot submit')) {
        sendError(res, 400, 'INVALID_STATE_TRANSITION', error.message);
        return;
      }
      next(error);
    }
  };

  /**
   * Validate valuation (EN_REVISION → VALIDADO)
   * POST /api/valuations/:id/validate
   * Requires RESIDENTE, ADMINISTRADOR_PROYECTO, or ADMIN role
   */
  validateValuation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user!.id_usuario;
      const record = await this.valuationService.validate(tenantId, id, userId);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve valuation (VALIDADO → APROBADO)
   * POST /api/valuations/:id/approve
   * Requires DIRECTOR or ADMIN role
   */
  approveValuation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const user = (req as AuthRequest).user!;
      const userRoles = (user as any).roles || [(user as any).rol];
      const allowedRoles = ['ADMIN', 'DIRECTOR'];

      const hasPermission = userRoles.some((role: string) => allowedRoles.includes(role));

      if (!hasPermission) {
        sendError(res, 403, 'FORBIDDEN', 'No tienes permisos para aprobar valorizaciones');
        return;
      }

      const record = await this.valuationService.approve(tenantId, id, user.id_usuario);
      sendSuccess(res, record);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot approve')) {
        sendError(res, 400, 'INVALID_STATE_TRANSITION', error.message);
        return;
      }
      next(error);
    }
  };

  /**
   * Reject valuation
   * POST /api/valuations/:id/reject
   * Requires RESIDENTE, ADMINISTRADOR_PROYECTO, DIRECTOR, or ADMIN role
   */
  rejectValuation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const { reason } = req.body;
      if (!reason || reason.trim().length === 0) {
        sendError(res, 400, 'MISSING_REASON', 'Motivo de rechazo requerido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user!.id_usuario;
      const record = await this.valuationService.reject(tenantId, id, userId, reason);
      sendSuccess(res, record);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot reject')) {
        sendError(res, 400, 'INVALID_STATE_TRANSITION', error.message);
        return;
      }
      next(error);
    }
  };

  /**
   * Reopen rejected valuation (RECHAZADO → BORRADOR)
   * POST /api/valuations/:id/reopen
   */
  reopenValuation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user!.id_usuario;
      const record = await this.valuationService.reopen(tenantId, id, userId);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Register provider conformity
   * POST /api/valuations/:id/conformidad
   */
  registerConformidad = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user!.id_usuario;
      const data = {
        fecha: req.body.fecha ? new Date(req.body.fecha) : undefined,
        observaciones: req.body.observaciones,
      };

      const record = await this.valuationService.registerConformidad(tenantId, id, userId, data);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark valuation as paid
   * POST /api/valuations/:id/mark-paid
   * Requires ADMIN role (Finance)
   */
  markAsPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const user = (req as AuthRequest).user!;
      const userRoles = (user as any).roles || [(user as any).rol];

      if (!userRoles.includes('ADMIN')) {
        sendError(
          res,
          403,
          'FORBIDDEN',
          'Solo el rol ADMIN puede marcar valorizaciones como pagadas'
        );
        return;
      }

      const paymentData = {
        fechaPago: req.body.fecha_pago ? new Date(req.body.fecha_pago) : undefined,
        referenciaPago: req.body.referencia_pago,
        metodoPago: req.body.metodo_pago,
      };

      const record = await this.valuationService.markAsPaid(
        tenantId,
        id,
        user.id_usuario,
        paymentData
      );
      sendSuccess(res, record);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Cannot mark as paid')) {
        sendError(res, 400, 'INVALID_STATE_TRANSITION', error.message);
        return;
      }
      next(error);
    }
  };

  // ─── Payment Document Endpoints (WS-5) ───

  getPaymentDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid valuation ID');
        return;
      }
      const tenantId = (req as AuthRequest).user!.id_empresa;
      const docs = await this.valuationService.getPaymentDocuments(tenantId, id);
      sendSuccess(res, docs);
    } catch (error) {
      next(error);
    }
  };

  createPaymentDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid valuation ID');
        return;
      }
      const tenantId = (req as AuthRequest).user!.id_empresa;
      const doc = await this.valuationService.createPaymentDocument(tenantId, {
        valorizacion_id: id,
        ...req.body,
      });
      sendCreated(res, doc);
    } catch (error) {
      next(error);
    }
  };

  updatePaymentDocument = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const docId = parseInt(req.params.docId);
      if (isNaN(docId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid document ID');
        return;
      }
      const tenantId = (req as AuthRequest).user!.id_empresa;
      const doc = await this.valuationService.updatePaymentDocument(tenantId, docId, req.body);
      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  };

  checkPaymentDocsComplete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid valuation ID');
        return;
      }
      const tenantId = (req as AuthRequest).user!.id_empresa;
      const complete = await this.valuationService.checkPaymentDocumentsComplete(tenantId, id);
      sendSuccess(res, { complete });
    } catch (error) {
      next(error);
    }
  };

  // ─── Recalculate (Anexo B) ───

  recalculate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const result = await this.valuationService.recalculateValuation(tenantId, id);
      sendSuccess(res, toValuationDto(result));
    } catch (error) {
      next(error);
    }
  };

  // ─── Discount Events (Anexo B) ───

  getDiscountEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const events = await this.valuationService.getDiscountEvents(tenantId, id);
      sendSuccess(res, events);
    } catch (error) {
      next(error);
    }
  };

  createDiscountEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const {
        fecha,
        tipo,
        subtipo,
        horas_descuento,
        dias_descuento,
        horas_horometro_mecanica,
        descripcion,
      } = req.body;
      if (!fecha || !tipo) {
        sendError(res, 400, 'MISSING_FIELDS', 'Campos requeridos: fecha, tipo');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const event = await this.valuationService.createDiscountEvent(tenantId, {
        valorizacionId: id,
        fecha,
        tipo,
        subtipo,
        horasDescuento: horas_descuento || 0,
        diasDescuento: dias_descuento || 0,
        horasHorometroMecanica: horas_horometro_mecanica,
        descripcion,
      });
      sendCreated(res, event.id, 'Evento de descuento creado');
    } catch (error) {
      next(error);
    }
  };

  deleteDiscountEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de evento inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      await this.valuationService.deleteDiscountEvent(tenantId, eventId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // ─── Manual Deductions (WS-38) ───

  private toDeduccionDto(d: any) {
    return {
      id: d.id,
      valorizacion_id: d.valorizacionId,
      tipo: d.tipo,
      concepto: d.concepto,
      num_documento: d.numDocumento || null,
      fecha: d.fecha || null,
      monto: d.monto,
      observaciones: d.observaciones || null,
      creado_por: d.creadoPor || null,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
    };
  }

  getManualDeductions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const deductions = await this.valuationService.getManualDeductions(tenantId, id);
      sendSuccess(
        res,
        deductions.map((d) => this.toDeduccionDto(d))
      );
    } catch (error) {
      next(error);
    }
  };

  createManualDeduction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const { tipo, concepto, monto, num_documento, fecha, observaciones } = req.body;
      if (!tipo || !concepto || monto === undefined) {
        sendError(res, 400, 'MISSING_FIELDS', 'Campos requeridos: tipo, concepto, monto');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const userId = (req as AuthRequest).user?.id_usuario;
      const deduction = await this.valuationService.createManualDeduction(tenantId, {
        valorizacionId: id,
        tipo,
        concepto,
        monto: parseFloat(monto),
        numDocumento: num_documento,
        fecha,
        observaciones,
        creadoPor: userId,
      });
      sendCreated(res, deduction.id, 'Deducción manual creada');
    } catch (error) {
      next(error);
    }
  };

  updateManualDeduction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deduccionId = parseInt(req.params.deduccionId);
      if (isNaN(deduccionId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de deducción inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      const { tipo, concepto, monto, num_documento, fecha, observaciones } = req.body;
      const updated = await this.valuationService.updateManualDeduction(tenantId, deduccionId, {
        tipo,
        concepto,
        monto: monto !== undefined ? parseFloat(monto) : undefined,
        numDocumento: num_documento,
        fecha,
        observaciones,
      });
      sendSuccess(res, this.toDeduccionDto(updated));
    } catch (error) {
      next(error);
    }
  };

  deleteManualDeduction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deduccionId = parseInt(req.params.deduccionId);
      if (isNaN(deduccionId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de deducción inválido');
        return;
      }

      const tenantId = (req as AuthRequest).user!.id_empresa;
      await this.valuationService.deleteManualDeduction(tenantId, deduccionId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
