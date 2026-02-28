/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { PeriodoInoperatividadService } from '../../services/periodo-inoperatividad.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import logger from '../../utils/logger';
import { NotFoundError, ConflictError, ValidationError } from '../../errors';

const service = new PeriodoInoperatividadService();

export class PeriodosInoperatividadController {
  async listar(req: AuthRequest, res: Response) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const { equipo_id, contrato_id, estado, excede_plazo } = req.query as any;

      const result = await service.listar({
        equipo_id: equipo_id ? parseInt(equipo_id) : undefined,
        contrato_id: contrato_id ? parseInt(contrato_id) : undefined,
        estado,
        excede_plazo: excede_plazo !== undefined ? excede_plazo === 'true' : undefined,
        page,
        limit,
      });

      sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
    } catch (error: any) {
      logger.error('Error listando períodos de inoperatividad', { error: error.message });
      sendError(
        res,
        500,
        'PERIODO_LIST_FAILED',
        'Error al listar períodos de inoperatividad',
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
      sendError(res, 500, 'PERIODO_GET_FAILED', 'Error al obtener período', error.message);
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
      logger.error('Error creando período de inoperatividad', { error: error.message });
      sendError(res, 500, 'PERIODO_CREATE_FAILED', 'Error al crear período', error.message);
    }
  }

  async resolver(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.user!.id_usuario;
      const data = await service.resolver(id, req.body, usuarioId);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      sendError(res, 500, 'PERIODO_RESOLVER_FAILED', 'Error al resolver período', error.message);
    }
  }

  async aplicarPenalidad(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await service.aplicarPenalidad(id, req.body);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'PERIODO_PENALIDAD_FAILED', 'Error al aplicar penalidad', error.message);
    }
  }

  async getResumen(req: AuthRequest, res: Response) {
    try {
      const equipoId = parseInt(req.params.equipoId);
      const data = await service.getResumen(equipoId);
      sendSuccess(res, data);
    } catch (error: any) {
      sendError(res, 500, 'PERIODO_RESUMEN_FAILED', 'Error al obtener resumen', error.message);
    }
  }
}
