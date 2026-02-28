/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { OrdenAlquilerService } from '../../services/orden-alquiler.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import logger from '../../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../../errors';

const service = new OrdenAlquilerService();

export class OrdenesAlquilerController {
  async listar(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const { estado, proveedor_id, proyecto_id } = req.query as any;

      const result = await service.listar({
        estado,
        proveedor_id: proveedor_id ? parseInt(proveedor_id) : undefined,
        proyecto_id: proyecto_id ? parseInt(proyecto_id) : undefined,
        page,
        limit,
      });

      sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
    } catch (error: any) {
      logger.error('Error listando órdenes de alquiler', { error: error.message });
      sendError(
        res,
        500,
        'ORDEN_LIST_FAILED',
        'Error al listar órdenes de alquiler',
        error.message
      );
    }
  }

  async obtener(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de orden inválido');
      const data = await service.obtenerPorId(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      logger.error('Error obteniendo orden de alquiler', { error: error.message });
      sendError(res, 500, 'ORDEN_GET_FAILED', 'Error al obtener orden de alquiler', error.message);
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
      logger.error('Error creando orden de alquiler', { error: error.message });
      sendError(res, 500, 'ORDEN_CREATE_FAILED', 'Error al crear orden de alquiler', error.message);
    }
  }

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de orden inválido');
      const data = await service.actualizar(id, req.body);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error actualizando orden de alquiler', { error: error.message });
      sendError(
        res,
        500,
        'ORDEN_UPDATE_FAILED',
        'Error al actualizar orden de alquiler',
        error.message
      );
    }
  }

  async enviar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de orden inválido');
      const { enviado_a } = req.body;
      const data = await service.enviar(id, enviado_a);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ORDEN_ENVIAR_FAILED',
        'Error al enviar orden de alquiler',
        error.message
      );
    }
  }

  async confirmar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de orden inválido');
      const { confirmado_por } = req.body;
      const data = await service.confirmar(id, confirmado_por);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ORDEN_CONFIRMAR_FAILED',
        'Error al confirmar orden de alquiler',
        error.message
      );
    }
  }

  async cancelar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de orden inválido');
      const { motivo_cancelacion } = req.body;
      const data = await service.cancelar(id, motivo_cancelacion);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ORDEN_CANCELAR_FAILED',
        'Error al cancelar orden de alquiler',
        error.message
      );
    }
  }

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de orden inválido');
      await service.eliminar(id);
      sendSuccess(res, { message: 'Orden de alquiler eliminada correctamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'ORDEN_DELETE_FAILED',
        'Error al eliminar orden de alquiler',
        error.message
      );
    }
  }
}
