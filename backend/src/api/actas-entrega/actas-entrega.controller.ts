/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ActaEntregaService } from '../../services/acta-entrega.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import { NotFoundError, ConflictError, ValidationError } from '../../errors';
import logger from '../../utils/logger';

const service = new ActaEntregaService();

export class ActasEntregaController {
  async listar(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const { equipo_id, estado, tipo } = req.query as any;

      const result = await service.listar({
        equipo_id: equipo_id ? parseInt(equipo_id) : undefined,
        estado,
        tipo,
        page,
        limit,
      });

      sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
    } catch (error: any) {
      logger.error('Error listando actas de entrega', { error: error.message });
      sendError(
        res,
        500,
        'ACTA_ENTREGA_LIST_FAILED',
        'Error al listar actas de entrega',
        error.message
      );
    }
  }

  async obtener(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await service.obtenerPorId(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      sendError(
        res,
        500,
        'ACTA_ENTREGA_GET_FAILED',
        'Error al obtener acta de entrega',
        error.message
      );
    }
  }

  async crear(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user!.id_usuario;
      const data = await service.crear(req.body, usuarioId);
      sendCreated(res, data);
    } catch (error: any) {
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error creando acta de entrega', { error: error.message });
      sendError(
        res,
        500,
        'ACTA_ENTREGA_CREATE_FAILED',
        'Error al crear acta de entrega',
        error.message
      );
    }
  }

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await service.actualizar(id, req.body);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ACTA_ENTREGA_UPDATE_FAILED',
        'Error al actualizar acta de entrega',
        error.message
      );
    }
  }

  async enviarParaFirma(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await service.enviarParaFirma(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ACTA_ENTREGA_ENVIAR_FAILED',
        'Error al enviar acta para firma',
        error.message
      );
    }
  }

  async firmar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await service.firmar(id, req.body);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ACTA_ENTREGA_FIRMAR_FAILED',
        'Error al firmar acta de entrega',
        error.message
      );
    }
  }

  async anular(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { observaciones } = req.body;
      const data = await service.anular(id, observaciones);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ACTA_ENTREGA_ANULAR_FAILED',
        'Error al anular acta de entrega',
        error.message
      );
    }
  }

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await service.eliminar(id);
      sendSuccess(res, { message: 'Acta de entrega eliminada correctamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ACTA_ENTREGA_DELETE_FAILED',
        'Error al eliminar acta de entrega',
        error.message
      );
    }
  }

  async descargarPdf(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const acta = await service.obtenerPorId(id);

      // Lazy-import to avoid loading Puppeteer on every request
      const { puppeteerPdfService } = await import('../../services/puppeteer-pdf.service');
      const { transformToActaEntregaPdfDto } =
        await import('../../utils/acta-entrega-pdf-transformer');

      const pdfDto = transformToActaEntregaPdfDto(acta);
      const pdfBuffer = await puppeteerPdfService.generateActaEntregaPdf(pdfDto);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=acta-entrega-${acta.codigo}.pdf`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.send(pdfBuffer);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      logger.error('Error generando PDF de acta de entrega', { error: error.message });
      sendError(res, 500, 'ACTA_ENTREGA_PDF_FAILED', 'Error al generar PDF', error.message);
    }
  }
}
