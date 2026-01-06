/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { PaymentScheduleService } from '../../services/payment-schedule.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendError } from '../../utils/api-response';

export interface CreatePaymentScheduleDto {
  schedule_date: Date;
  payment_date: Date;
  description?: string;
  currency?: string;
}

export interface AddScheduleDetailDto {
  amount_to_pay: number;
}

const paymentScheduleService = new PaymentScheduleService();

export class PaymentScheduleController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedule = await paymentScheduleService.create(
        req.body,
        Number(req.user!.userId),
        1 // Default tenant
      );
      res.status(201).json({ success: true, data: schedule });
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_CREATE_FAILED',
        'Failed to create payment schedule',
        error.message
      );
    }
  }

  async findAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedules = await paymentScheduleService.findAll(1); // Default tenant
      res.json({ success: true, data: schedules });
    } catch (error: any) {
      sendError(
        res,
        500,
        'PAYMENT_SCHEDULE_LIST_FAILED',
        'Failed to fetch payment schedules',
        error.message
      );
    }
  }

  async findOne(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedule = await paymentScheduleService.findOne(Number(req.params.id));
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      sendError(
        res,
        404,
        'PAYMENT_SCHEDULE_NOT_FOUND',
        'Payment schedule not found',
        error.message
      );
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedule = await paymentScheduleService.update(Number(req.params.id), req.body);
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_UPDATE_FAILED',
        'Failed to update payment schedule',
        error.message
      );
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      await paymentScheduleService.delete(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_DELETE_FAILED',
        'Failed to delete payment schedule',
        error.message
      );
    }
  }

  async addDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const detail = await paymentScheduleService.addDetail(Number(req.params.id), req.body);
      res.status(201).json({ success: true, data: detail });
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_DETAIL_ADD_FAILED',
        'Failed to add payment schedule detail',
        error.message
      );
    }
  }

  async removeDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      await paymentScheduleService.removeDetail(Number(req.params.id), Number(req.params.detailId));
      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_DETAIL_REMOVE_FAILED',
        'Failed to remove payment schedule detail',
        error.message
      );
    }
  }

  async approve(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedule = await paymentScheduleService.approve(Number(req.params.id));
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_APPROVE_FAILED',
        'Failed to approve payment schedule',
        error.message
      );
    }
  }

  async process(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedule = await paymentScheduleService.process(Number(req.params.id));
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_PROCESS_FAILED',
        'Failed to process payment schedule',
        error.message
      );
    }
  }

  async cancelSchedule(req: AuthRequest, res: Response): Promise<void> {
    try {
      const schedule = await paymentScheduleService.cancel(Number(req.params.id));
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      sendError(
        res,
        400,
        'PAYMENT_SCHEDULE_CANCEL_FAILED',
        'Failed to cancel payment schedule',
        error.message
      );
    }
  }
}
