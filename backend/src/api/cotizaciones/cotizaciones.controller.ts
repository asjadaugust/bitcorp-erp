/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { CotizacionService } from '../../services/cotizacion.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import logger from '../../utils/logger';
import { NotFoundError, ConflictError, ValidationError, BusinessRuleError } from '../../errors';

const service = new CotizacionService();

export class CotizacionesController {
  async listar(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const { solicitud_equipo_id, proveedor_id, estado } = req.query as any;

      const result = await service.listar({
        solicitud_equipo_id: solicitud_equipo_id ? parseInt(solicitud_equipo_id) : undefined,
        proveedor_id: proveedor_id ? parseInt(proveedor_id) : undefined,
        estado,
        page,
        limit,
      });

      sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
    } catch (error: any) {
      logger.error('Error listando cotizaciones', { error: error.message });
      sendError(res, 500, 'COTIZACION_LIST_FAILED', 'Error al listar cotizaciones', error.message);
    }
  }

  async obtener(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de cotización inválido');
      const data = await service.obtenerPorId(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      logger.error('Error obteniendo cotización', { error: error.message });
      sendError(res, 500, 'COTIZACION_GET_FAILED', 'Error al obtener cotización', error.message);
    }
  }

  async obtenerComparacion(req: AuthRequest, res: Response) {
    try {
      const solicitudId = parseInt(req.params.solicitudId);
      if (isNaN(solicitudId)) throw new ValidationError('ID de solicitud inválido');
      const data = await service.obtenerComparacion(solicitudId);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      logger.error('Error obteniendo comparación', { error: error.message });
      sendError(res, 500, 'COMPARACION_GET_FAILED', 'Error al obtener comparación', error.message);
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
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      if (error instanceof BusinessRuleError)
        return sendError(res, 422, error.code ?? 'BUSINESS_RULE', error.message);
      logger.error('Error creando cotización', { error: error.message });
      sendError(res, 500, 'COTIZACION_CREATE_FAILED', 'Error al crear cotización', error.message);
    }
  }

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de cotización inválido');
      const data = await service.actualizar(id, req.body);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error actualizando cotización', { error: error.message });
      sendError(
        res,
        500,
        'COTIZACION_UPDATE_FAILED',
        'Error al actualizar cotización',
        error.message
      );
    }
  }

  async evaluar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de cotización inválido');
      const usuarioId = req.user!.id_usuario;
      const { puntaje, observaciones } = req.body;
      if (puntaje === undefined || puntaje === null)
        throw new ValidationError('El puntaje es requerido');
      const data = await service.evaluar(id, parseInt(puntaje), observaciones, usuarioId);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error evaluando cotización', { error: error.message });
      sendError(
        res,
        500,
        'COTIZACION_EVALUAR_FAILED',
        'Error al evaluar cotización',
        error.message
      );
    }
  }

  async seleccionar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de cotización inválido');
      const usuarioId = req.user!.id_usuario;
      const { motivo_seleccion, proveedor_unico } = req.body;
      const data = await service.seleccionar(
        id,
        motivo_seleccion,
        usuarioId,
        proveedor_unico === true
      );
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      if (error instanceof BusinessRuleError)
        return sendError(res, 422, error.code ?? 'BUSINESS_RULE', error.message);
      logger.error('Error seleccionando cotización', { error: error.message });
      sendError(
        res,
        500,
        'COTIZACION_SELECCIONAR_FAILED',
        'Error al seleccionar cotización',
        error.message
      );
    }
  }

  async rechazar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de cotización inválido');
      const { motivo } = req.body;
      const data = await service.rechazar(id, motivo);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      logger.error('Error rechazando cotización', { error: error.message });
      sendError(
        res,
        500,
        'COTIZACION_RECHAZAR_FAILED',
        'Error al rechazar cotización',
        error.message
      );
    }
  }

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de cotización inválido');
      await service.eliminar(id);
      sendSuccess(res, { message: 'Cotización eliminada correctamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'COTIZACION_DELETE_FAILED',
        'Error al eliminar cotización',
        error.message
      );
    }
  }
}
