/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Response } from 'express';
import { PaymentScheduleService } from '../../services/payment-schedule.service';
import { PaymentSchedule } from '../../models/payment-schedule.model';
import {
  sendError,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
} from '../../utils/api-response';
import Logger from '../../utils/logger';
import { AuthRequest } from '../../middleware/auth.middleware';

/** Transform entity to snake_case DTO for frontend */
function toDto(entity: PaymentSchedule): Record<string, unknown> {
  return {
    id: entity.id,
    periodo: entity.periodo,
    proveedor_id: entity.providerId,
    proyecto_id: entity.projectId,
    fecha_programada: entity.scheduleDate,
    monto_total: entity.totalAmount,
    estado: entity.status, // DB stores Spanish values: PROGRAMADO, APROBADO, etc.
    observaciones: entity.description,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
    // Aliases for backward compat with frontend interface
    schedule_date: entity.scheduleDate,
    total_amount: entity.totalAmount,
    description: entity.description,
  };
}

export class PaymentScheduleController {
  private service: PaymentScheduleService;

  constructor() {
    this.service = new PaymentScheduleService();
  }

  findAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

      const filters = {
        page,
        limit,
        sort_by: req.query.sort_by as string,
        sort_order: req.query.sort_order as 'ASC' | 'DESC',
      };

      const result = await this.service.findAll(tenantId, filters);
      sendPaginatedSuccess(res, result.data.map(toDto), { page, limit, total: result.total });
    } catch (error) {
      Logger.error('Error fetching payment schedules', {
        error: error instanceof Error ? error.message : String(error),
        context: 'PaymentScheduleController.findAll',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_LIST_FAILED',
        'Error al obtener cronogramas de pago',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  findOne = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID debe ser un número');
        return;
      }

      const result = await this.service.findOne(id);
      sendSuccess(res, toDto(result));
    } catch (error) {
      Logger.error('Error fetching payment schedule', {
        error: error instanceof Error ? error.message : String(error),
        id: req.params.id,
        context: 'PaymentScheduleController.findOne',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_GET_FAILED',
        'Error al obtener cronograma de pago',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const userId = req.user!.id_usuario;
      const result = await this.service.create(req.body, userId, tenantId);
      sendCreated(res, result);
    } catch (error) {
      Logger.error('Error creating payment schedule', {
        error: error instanceof Error ? error.message : String(error),
        context: 'PaymentScheduleController.create',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_CREATE_FAILED',
        'Error al crear cronograma de pago',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID debe ser un número');
        return;
      }

      const result = await this.service.update(id, req.body);
      sendSuccess(res, result);
    } catch (error) {
      Logger.error('Error updating payment schedule', {
        error: error instanceof Error ? error.message : String(error),
        id: req.params.id,
        context: 'PaymentScheduleController.update',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_UPDATE_FAILED',
        'Error al actualizar cronograma de pago',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID debe ser un número');
        return;
      }

      await this.service.delete(id);
      res.status(204).send();
    } catch (error) {
      Logger.error('Error deleting payment schedule', {
        error: error instanceof Error ? error.message : String(error),
        id: req.params.id,
        context: 'PaymentScheduleController.remove',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_DELETE_FAILED',
        'Error al eliminar cronograma de pago',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  approve = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID debe ser un número');
        return;
      }

      const result = await this.service.approve(id);
      sendSuccess(res, result);
    } catch (error) {
      Logger.error('Error approving payment schedule', {
        error: error instanceof Error ? error.message : String(error),
        id: req.params.id,
        context: 'PaymentScheduleController.approve',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_APPROVE_FAILED',
        'Error al aprobar cronograma de pago',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  process = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID debe ser un número');
        return;
      }

      const result = await this.service.process(id);
      sendSuccess(res, result);
    } catch (error) {
      Logger.error('Error processing payment schedule', {
        error: error instanceof Error ? error.message : String(error),
        id: req.params.id,
        context: 'PaymentScheduleController.process',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_PROCESS_FAILED',
        'Error al procesar cronograma de pago',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  cancel = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID debe ser un número');
        return;
      }

      const result = await this.service.cancel(id);
      sendSuccess(res, result);
    } catch (error) {
      Logger.error('Error cancelling payment schedule', {
        error: error instanceof Error ? error.message : String(error),
        id: req.params.id,
        context: 'PaymentScheduleController.cancel',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_CANCEL_FAILED',
        'Error al cancelar cronograma de pago',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  addDetail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const scheduleId = parseInt(req.params.id);
      if (isNaN(scheduleId)) {
        sendError(res, 400, 'INVALID_ID', 'ID debe ser un número');
        return;
      }

      const result = await this.service.addDetail(scheduleId, req.body);
      sendCreated(res, result);
    } catch (error) {
      Logger.error('Error adding payment schedule detail', {
        error: error instanceof Error ? error.message : String(error),
        scheduleId: req.params.id,
        context: 'PaymentScheduleController.addDetail',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_DETAIL_ADD_FAILED',
        'Error al agregar detalle al cronograma',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  removeDetail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const scheduleId = parseInt(req.params.id);
      const detailId = parseInt(req.params.detailId);
      if (isNaN(scheduleId) || isNaN(detailId)) {
        sendError(res, 400, 'INVALID_ID', 'IDs deben ser números');
        return;
      }

      await this.service.removeDetail(scheduleId, detailId);
      res.status(204).send();
    } catch (error) {
      Logger.error('Error removing payment schedule detail', {
        error: error instanceof Error ? error.message : String(error),
        scheduleId: req.params.id,
        detailId: req.params.detailId,
        context: 'PaymentScheduleController.removeDetail',
      });
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_DETAIL_REMOVE_FAILED',
        'Error al eliminar detalle del cronograma',
        error instanceof Error ? error.message : String(error)
      );
    }
  };
}
