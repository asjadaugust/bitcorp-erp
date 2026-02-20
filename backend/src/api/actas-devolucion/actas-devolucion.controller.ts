/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ActaDevolucionService } from '../../services/acta-devolucion.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import logger from '../../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../../errors';

const service = new ActaDevolucionService();

export class ActasDevolucionController {
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
      logger.error('Error listando actas de devolución', { error: error.message });
      sendError(res, 500, 'ACTA_LIST_FAILED', 'Error al listar actas de devolución', error.message);
    }
  }

  async obtener(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await service.obtenerPorId(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      sendError(res, 500, 'ACTA_GET_FAILED', 'Error al obtener acta', error.message);
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
      logger.error('Error creando acta de devolución', { error: error.message });
      sendError(res, 500, 'ACTA_CREATE_FAILED', 'Error al crear acta', error.message);
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
      sendError(res, 500, 'ACTA_UPDATE_FAILED', 'Error al actualizar acta', error.message);
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
      sendError(res, 500, 'ACTA_ENVIAR_FAILED', 'Error al enviar acta para firma', error.message);
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
      sendError(res, 500, 'ACTA_FIRMAR_FAILED', 'Error al firmar acta', error.message);
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
      sendError(res, 500, 'ACTA_ANULAR_FAILED', 'Error al anular acta', error.message);
    }
  }

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await service.eliminar(id);
      sendSuccess(res, { message: 'Acta eliminada correctamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'ACTA_DELETE_FAILED', 'Error al eliminar acta', error.message);
    }
  }
}
