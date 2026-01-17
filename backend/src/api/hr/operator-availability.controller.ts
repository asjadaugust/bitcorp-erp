/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { OperatorAvailabilityService } from '../../services/operator-availability.service';
import {
  sendError,
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
} from '../../utils/api-response';

const availabilityService = new OperatorAvailabilityService();

export class OperatorAvailabilityController {
  async getAvailabilities(req: Request, res: Response): Promise<void> {
    try {
      const { trabajador_id, disponible, fecha_inicio, fecha_fin, page, limit } = req.query;
      const result = await availabilityService.findAll({
        trabajadorId: trabajador_id ? Number(trabajador_id) : undefined,
        disponible: disponible === 'true' ? true : disponible === 'false' ? false : undefined,
        fechaInicio: fecha_inicio ? new Date(fecha_inicio as string) : undefined,
        fechaFin: fecha_fin ? new Date(fecha_fin as string) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendPaginatedSuccess(res, result.data, {
        page: result.page,
        limit: result.limit,
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

  async getAvailabilityById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const availability = await availabilityService.findById(id);
      if (!availability) {
        sendError(
          res,
          404,
          'OPERATOR_AVAILABILITY_NOT_FOUND',
          'Disponibilidad de operador no encontrada'
        );
        return;
      }
      sendSuccess(res, availability);
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_GET_FAILED',
        'Error al obtener la disponibilidad del operador',
        error.message
      );
    }
  }

  async getAvailabilityByOperator(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = parseInt(req.params.operatorId);
      if (isNaN(operatorId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de operador inválido');
        return;
      }

      const { fecha_inicio, fecha_fin } = req.query;
      const availabilities = await availabilityService.findByOperator(
        operatorId,
        fecha_inicio ? new Date(fecha_inicio as string) : undefined,
        fecha_fin ? new Date(fecha_fin as string) : undefined
      );
      sendSuccess(res, availabilities);
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

  async getAvailableOperators(req: Request, res: Response): Promise<void> {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      if (!fecha_inicio || !fecha_fin) {
        sendError(
          res,
          400,
          'MISSING_PARAMETERS',
          'Los parámetros fecha_inicio y fecha_fin son requeridos'
        );
        return;
      }
      const availabilities = await availabilityService.findAvailableOperators(
        new Date(fecha_inicio as string),
        new Date(fecha_fin as string)
      );
      sendSuccess(res, availabilities);
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

  async createAvailability(req: Request, res: Response): Promise<void> {
    try {
      const availability = await availabilityService.create(req.body);
      sendCreated(res, availability);
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_CREATE_FAILED',
        'Error al crear la disponibilidad del operador',
        error.message
      );
    }
  }

  async bulkCreateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { availabilities } = req.body;
      if (!Array.isArray(availabilities)) {
        sendError(res, 400, 'INVALID_INPUT', 'Las disponibilidades deben ser un arreglo');
        return;
      }
      const created = await availabilityService.bulkCreate(availabilities);
      sendCreated(res, created);
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_BULK_CREATE_FAILED',
        'Error al crear las disponibilidades en lote',
        error.message
      );
    }
  }

  async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const availability = await availabilityService.update(id, req.body);
      if (!availability) {
        sendError(
          res,
          404,
          'OPERATOR_AVAILABILITY_NOT_FOUND',
          'Disponibilidad de operador no encontrada'
        );
        return;
      }
      sendSuccess(res, availability);
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_UPDATE_FAILED',
        'Error al actualizar la disponibilidad del operador',
        error.message
      );
    }
  }

  async deleteAvailability(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const success = await availabilityService.delete(id);
      if (!success) {
        sendError(
          res,
          404,
          'OPERATOR_AVAILABILITY_NOT_FOUND',
          'Disponibilidad de operador no encontrada'
        );
        return;
      }
      res.status(204).send();
    } catch (error: any) {
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
