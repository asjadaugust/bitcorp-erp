/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { SolicitudEquipoService } from '../../services/solicitud-equipo.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import logger from '../../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../../errors';

const service = new SolicitudEquipoService();

export class SolicitudesEquipoController {
  async listar(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const { estado, proyecto_id } = req.query as any;

      const result = await service.listar({
        estado,
        proyecto_id: proyecto_id ? parseInt(proyecto_id) : undefined,
        page,
        limit,
      });

      sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
    } catch (error: any) {
      logger.error('Error listando solicitudes de equipo', { error: error.message });
      sendError(
        res,
        500,
        'SOLICITUD_LIST_FAILED',
        'Error al listar solicitudes de equipo',
        error.message
      );
    }
  }

  async obtener(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError('ID de solicitud inválido');
      }
      const data = await service.obtenerPorId(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      logger.error('Error obteniendo solicitud de equipo', { error: error.message });
      sendError(res, 500, 'SOLICITUD_GET_FAILED', 'Error al obtener solicitud', error.message);
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
      logger.error('Error creando solicitud de equipo', { error: error.message });
      sendError(res, 500, 'SOLICITUD_CREATE_FAILED', 'Error al crear solicitud', error.message);
    }
  }

  async actualizar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError('ID de solicitud inválido');
      }
      const data = await service.actualizar(id, req.body);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      logger.error('Error actualizando solicitud de equipo', { error: error.message });
      sendError(
        res,
        500,
        'SOLICITUD_UPDATE_FAILED',
        'Error al actualizar solicitud',
        error.message
      );
    }
  }

  async enviar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError('ID de solicitud inválido');
      }
      const data = await service.enviar(id, req.user!.id_usuario);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'SOLICITUD_ENVIAR_FAILED', 'Error al enviar solicitud', error.message);
    }
  }

  async aprobar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError('ID de solicitud inválido');
      }
      const usuarioId = req.user!.id_usuario;
      const { observaciones } = req.body;
      const data = await service.aprobar(id, usuarioId, observaciones);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'SOLICITUD_APROBAR_FAILED', 'Error al aprobar solicitud', error.message);
    }
  }

  async rechazar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError('ID de solicitud inválido');
      }
      const usuarioId = req.user!.id_usuario;
      const { observaciones } = req.body;
      const data = await service.rechazar(id, usuarioId, observaciones);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(
        res,
        500,
        'SOLICITUD_RECHAZAR_FAILED',
        'Error al rechazar solicitud',
        error.message
      );
    }
  }

  async eliminar(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new ValidationError('ID de solicitud inválido');
      }
      await service.eliminar(id);
      sendSuccess(res, { message: 'Solicitud eliminada correctamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'SOLICITUD_DELETE_FAILED', 'Error al eliminar solicitud', error.message);
    }
  }
}
