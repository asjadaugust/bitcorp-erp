/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { OperatorAvailabilityService } from '../../services/operator-availability.service';
import { sendError } from '../../utils/api-response';

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
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_LIST_FAILED',
        'Failed to fetch operator availabilities',
        error.message
      );
    }
  }

  async getAvailabilityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const availability = await availabilityService.findById(Number(id));
      if (!availability) {
        sendError(res, 404, 'OPERATOR_AVAILABILITY_NOT_FOUND', 'Operator availability not found');
        return;
      }
      res.json({ success: true, data: availability });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_GET_FAILED',
        'Failed to fetch operator availability',
        error.message
      );
    }
  }

  async getAvailabilityByOperator(req: Request, res: Response): Promise<void> {
    try {
      const { operatorId } = req.params;
      const { fecha_inicio, fecha_fin } = req.query;
      const availabilities = await availabilityService.findByOperator(
        Number(operatorId),
        fecha_inicio ? new Date(fecha_inicio as string) : undefined,
        fecha_fin ? new Date(fecha_fin as string) : undefined
      );
      res.json({ success: true, data: availabilities });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_BY_OPERATOR_FAILED',
        'Failed to fetch operator availability',
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
          'fecha_inicio and fecha_fin parameters are required'
        );
        return;
      }
      const availabilities = await availabilityService.findAvailableOperators(
        new Date(fecha_inicio as string),
        new Date(fecha_fin as string)
      );
      res.json({ success: true, data: availabilities });
    } catch (error: any) {
      sendError(
        res,
        500,
        'AVAILABLE_OPERATORS_FAILED',
        'Failed to fetch available operators',
        error.message
      );
    }
  }

  async createAvailability(req: Request, res: Response): Promise<void> {
    try {
      const availability = await availabilityService.create(req.body);
      res.status(201).json({ success: true, data: availability });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_CREATE_FAILED',
        'Failed to create operator availability',
        error.message
      );
    }
  }

  async bulkCreateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { availabilities } = req.body;
      if (!Array.isArray(availabilities)) {
        sendError(res, 400, 'INVALID_INPUT', 'Availabilities must be an array');
        return;
      }
      const created = await availabilityService.bulkCreate(availabilities);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_BULK_CREATE_FAILED',
        'Failed to bulk create operator availabilities',
        error.message
      );
    }
  }

  async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const availability = await availabilityService.update(Number(id), req.body);
      if (!availability) {
        sendError(res, 404, 'OPERATOR_AVAILABILITY_NOT_FOUND', 'Operator availability not found');
        return;
      }
      res.json({ success: true, data: availability });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_UPDATE_FAILED',
        'Failed to update operator availability',
        error.message
      );
    }
  }

  async deleteAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await availabilityService.delete(Number(id));
      if (!success) {
        sendError(res, 404, 'OPERATOR_AVAILABILITY_NOT_FOUND', 'Operator availability not found');
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_AVAILABILITY_DELETE_FAILED',
        'Failed to delete operator availability',
        error.message
      );
    }
  }
}
