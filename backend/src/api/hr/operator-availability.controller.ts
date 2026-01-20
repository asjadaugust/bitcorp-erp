/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { OperatorAvailabilityService } from '../../services/operator-availability.service';
import {
  sendError,
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
} from '../../utils/api-response';
import { NotFoundError, ConflictError } from '../../errors/http.errors';

const availabilityService = new OperatorAvailabilityService();

export class OperatorAvailabilityController {
  async getAvailabilities(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { trabajador_id, disponible, fecha_inicio, fecha_fin, page, limit } = req.query;

      const pageNumber = page ? Number(page) : 1;
      const limitNumber = limit ? Number(limit) : 10;

      const result = await availabilityService.findAll(
        tenantId,
        {
          trabajadorId: trabajador_id ? Number(trabajador_id) : undefined,
          disponible: disponible === 'true' ? true : disponible === 'false' ? false : undefined,
          fechaInicio: fecha_inicio ? new Date(fecha_inicio as string) : undefined,
          fechaFin: fecha_fin ? new Date(fecha_fin as string) : undefined,
        },
        pageNumber,
        limitNumber
      );

      sendPaginatedSuccess(res, result.data, {
        page: pageNumber,
        limit: limitNumber,
        total: result.total,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_LIST_FAILED',
        'Error al obtener las disponibilidades de operadores',
        error.message
      );
    }
  }

  async getAvailabilityById(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const availability = await availabilityService.findById(tenantId, id);
      sendSuccess(res, availability);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(
          res,
          404,
          'OPERATOR_AVAILABILITY_NOT_FOUND',
          'Disponibilidad de operador no encontrada'
        );
        return;
      }

      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_GET_FAILED',
        'Error al obtener la disponibilidad del operador',
        error.message
      );
    }
  }

  async getAvailabilityByOperator(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const operatorId = parseInt(req.params.operatorId);
      if (isNaN(operatorId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de operador inválido');
        return;
      }

      const { fecha_inicio, fecha_fin, page, limit } = req.query;

      const pageNumber = page ? Number(page) : 1;
      const limitNumber = limit ? Number(limit) : 10;

      const result = await availabilityService.findByOperator(
        tenantId,
        operatorId,
        fecha_inicio ? new Date(fecha_inicio as string) : undefined,
        fecha_fin ? new Date(fecha_fin as string) : undefined,
        pageNumber,
        limitNumber
      );

      sendPaginatedSuccess(res, result.data, {
        page: pageNumber,
        limit: limitNumber,
        total: result.total,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_BY_OPERATOR_FAILED',
        'Error al obtener la disponibilidad del operador',
        error.message
      );
    }
  }

  async getAvailableOperators(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { fecha_inicio, fecha_fin, page, limit } = req.query;
      if (!fecha_inicio || !fecha_fin) {
        sendError(
          res,
          400,
          'MISSING_PARAMETERS',
          'Los parámetros fecha_inicio y fecha_fin son requeridos'
        );
        return;
      }

      const pageNumber = page ? Number(page) : 1;
      const limitNumber = limit ? Number(limit) : 10;

      const result = await availabilityService.findAvailableOperators(
        tenantId,
        new Date(fecha_inicio as string),
        new Date(fecha_fin as string),
        pageNumber,
        limitNumber
      );

      sendPaginatedSuccess(res, result.data, {
        page: pageNumber,
        limit: limitNumber,
        total: result.total,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'AVAILABLE_OPERATORS_FAILED',
        'Error al obtener los operadores disponibles',
        error.message
      );
    }
  }

  async createAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const availability = await availabilityService.create(tenantId, req.body);
      sendCreated(res, availability);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        sendError(res, 409, 'OPERATOR_AVAILABILITY_CONFLICT', error.message, error.metadata);
        return;
      }

      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_CREATE_FAILED',
        'Error al crear la disponibilidad del operador',
        error.message
      );
    }
  }

  async bulkCreateAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const { availabilities } = req.body;
      if (!Array.isArray(availabilities)) {
        sendError(res, 400, 'INVALID_INPUT', 'Las disponibilidades deben ser un arreglo');
        return;
      }

      const created = await availabilityService.bulkCreate(tenantId, availabilities);
      sendCreated(res, created);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        sendError(res, 409, 'OPERATOR_AVAILABILITY_BULK_CONFLICT', error.message, error.metadata);
        return;
      }

      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_BULK_CREATE_FAILED',
        'Error al crear las disponibilidades en lote',
        error.message
      );
    }
  }

  async updateAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const availability = await availabilityService.update(tenantId, id, req.body);
      sendSuccess(res, availability);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(
          res,
          404,
          'OPERATOR_AVAILABILITY_NOT_FOUND',
          'Disponibilidad de operador no encontrada'
        );
        return;
      }

      if (error instanceof ConflictError) {
        sendError(res, 409, 'OPERATOR_AVAILABILITY_CONFLICT', error.message, error.metadata);
        return;
      }

      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_UPDATE_FAILED',
        'Error al actualizar la disponibilidad del operador',
        error.message
      );
    }
  }

  async deleteAvailability(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Get tenantId from JWT token (multi-tenant context)
      const tenantId = req.user!.id_empresa;

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      await availabilityService.delete(tenantId, id);
      res.status(204).send();
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(
          res,
          404,
          'OPERATOR_AVAILABILITY_NOT_FOUND',
          'Disponibilidad de operador no encontrada'
        );
        return;
      }

      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_DELETE_FAILED',
        'Error al eliminar la disponibilidad del operador',
        error.message
      );
    }
  }
}
