/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ValesCombustibleService } from '../../services/vale-combustible.service';
import { toValeDto } from '../../types/dto/vale-combustible.dto';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import logger from '../../utils/logger';
import { NotFoundError, ValidationError } from '../../errors';

const service = new ValesCombustibleService();

export class ValesCombustibleController {
  async listar(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const offset = (page - 1) * limit;

      const {
        equipo_id,
        proyecto_id,
        parte_diario_id,
        estado,
        tipo_combustible,
        fecha_desde,
        fecha_hasta,
      } = req.query as any;

      const vales = await service.listar({
        equipo_id: equipo_id ? parseInt(equipo_id) : undefined,
        proyecto_id: proyecto_id ? parseInt(proyecto_id) : undefined,
        parte_diario_id: parte_diario_id ? parseInt(parte_diario_id) : undefined,
        estado,
        tipo_combustible,
        fecha_desde,
        fecha_hasta,
        limit,
        offset,
      });

      const dtos = vales.map(toValeDto);
      sendPaginatedSuccess(res, dtos, { page, limit, total: dtos.length });
    } catch (error: any) {
      logger.error('Error listando vales de combustible', { error: error.message });
      sendError(
        res,
        500,
        'VALE_LIST_FAILED',
        'Error al listar vales de combustible',
        error.message
      );
    }
  }

  async obtener(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de vale inválido');

      const vale = await service.obtener(id);
      if (!vale) throw new NotFoundError(`Vale de combustible ${id} no encontrado`);

      sendSuccess(res, toValeDto(vale));
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error obteniendo vale de combustible', { error: error.message });
      sendError(res, 500, 'VALE_GET_FAILED', 'Error al obtener vale de combustible', error.message);
    }
  }

  async crear(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user!.id_usuario;
      const vale = await service.crear(req.body, usuarioId);
      sendCreated(res, toValeDto(vale));
    } catch (error: any) {
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error creando vale de combustible', { error: error.message });
      sendError(
        res,
        500,
        'VALE_CREATE_FAILED',
        'Error al crear vale de combustible',
        error.message
      );
    }
  }

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de vale inválido');

      const vale = await service.actualizar(id, req.body);
      if (!vale) throw new NotFoundError(`Vale de combustible ${id} no encontrado`);

      sendSuccess(res, toValeDto(vale));
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error actualizando vale de combustible', { error: error.message });
      sendError(res, 500, 'VALE_UPDATE_FAILED', 'Error al actualizar vale', error.message);
    }
  }

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de vale inválido');

      const ok = await service.eliminar(id);
      if (!ok) throw new NotFoundError(`Vale de combustible ${id} no encontrado`);

      sendSuccess(res, { message: 'Vale de combustible eliminado correctamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      logger.error('Error eliminando vale de combustible', { error: error.message });
      sendError(res, 500, 'VALE_DELETE_FAILED', 'Error al eliminar vale', error.message);
    }
  }

  /** PENDIENTE → REGISTRADO */
  async registrar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de vale inválido');

      const vale = await service.registrar(id);
      if (!vale) throw new NotFoundError(`Vale de combustible ${id} no encontrado`);

      sendSuccess(res, toValeDto(vale));
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error registrando vale de combustible', { error: error.message });
      sendError(res, 500, 'VALE_REGISTRAR_FAILED', 'Error al registrar vale', error.message);
    }
  }

  /** → ANULADO */
  async anular(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) throw new ValidationError('ID de vale inválido');

      const vale = await service.anular(id);
      if (!vale) throw new NotFoundError(`Vale de combustible ${id} no encontrado`);

      sendSuccess(res, toValeDto(vale));
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error anulando vale de combustible', { error: error.message });
      sendError(res, 500, 'VALE_ANULAR_FAILED', 'Error al anular vale', error.message);
    }
  }
}
