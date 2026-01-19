/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { PaymentScheduleService } from '../../services/payment-schedule.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';

const paymentScheduleService = new PaymentScheduleService();

export class PaymentScheduleController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedule = await paymentScheduleService.create(
        req.body,
        req.user!.id_usuario, // Use new JWT structure
        req.user!.id_empresa // Use tenant from JWT (not hardcoded!)
      );
      sendCreated(res, (schedule as any).id, 'Cronograma de pagos creado exitosamente');
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_CREATE_FAILED',
        'Error al crear cronograma de pagos',
        error.message
      );
    }
  }

  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const sort_by = req.query.sort_by as string;
      const sort_order = (req.query.sort_order as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const result = await paymentScheduleService.findAll(1, {
        page,
        limit,
        sort_by,
        sort_order,
      });

      sendPaginatedSuccess(res, result.data, {
        page,
        limit,
        total: result.total,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_LIST_FAILED',
        'Error al obtener cronogramas de pago',
        error.message
      );
    }
  }

  async findOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const schedule = await paymentScheduleService.findOne(id);
      sendSuccess(res, schedule);
    } catch (error: any) {
      sendError(
        res,
        404,
        'PAYMENT_SCHEDULE_NOT_FOUND',
        'Cronograma de pagos no encontrado',
        error.message
      );
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const schedule = await paymentScheduleService.update(id, req.body);
      sendSuccess(res, schedule);
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_UPDATE_FAILED',
        'Error al actualizar cronograma de pagos',
        error.message
      );
    }
  }

  async remove(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      await paymentScheduleService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_DELETE_FAILED',
        'Error al eliminar cronograma de pagos',
        error.message
      );
    }
  }

  async addDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const detail = await paymentScheduleService.addDetail(id, req.body);
      sendCreated(res, (detail as any).id, 'Detalle agregado exitosamente');
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_DETAIL_ADD_FAILED',
        'Error al agregar detalle',
        error.message
      );
    }
  }

  async removeDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const detailId = parseInt(req.params.detailId);
      if (isNaN(id) || isNaN(detailId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      await paymentScheduleService.removeDetail(id, detailId);
      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_DETAIL_REMOVE_FAILED',
        'Error al eliminar detalle',
        error.message
      );
    }
  }

  async approve(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const schedule = await paymentScheduleService.approve(id);
      sendSuccess(res, schedule);
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_APPROVE_FAILED',
        'Error al aprobar cronograma de pagos',
        error.message
      );
    }
  }

  async process(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const schedule = await paymentScheduleService.process(id);
      sendSuccess(res, schedule);
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_PROCESS_FAILED',
        'Error al procesar cronograma de pagos',
        error.message
      );
    }
  }

  async cancelSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const schedule = await paymentScheduleService.cancel(id);
      sendSuccess(res, schedule);
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_CANCEL_FAILED',
        'Error al cancelar cronograma de pagos',
        error.message
      );
    }
  }
}
