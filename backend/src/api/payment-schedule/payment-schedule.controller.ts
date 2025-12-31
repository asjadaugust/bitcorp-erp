import { Request, Response } from 'express';
import { PaymentScheduleService } from '../../services/payment-schedule.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export interface CreatePaymentScheduleDto {
  schedule_date: Date;
  payment_date: Date;
  description?: string;
  currency?: string;
}

export interface AddScheduleDetailDto {
  accounts_payable_id: number;
  amount_to_pay: number;
}

const paymentScheduleService = new PaymentScheduleService();

export class PaymentScheduleController {
  async create(req: AuthRequest, res: Response) {
    try {
      const schedule = await paymentScheduleService.create(
        req.body,
        Number(req.user!.userId),
        1 // Default tenant
      );
      res.status(201).json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    try {
      const schedules = await paymentScheduleService.findAll(1); // Default tenant
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async findOne(req: AuthRequest, res: Response) {
    try {
      const schedule = await paymentScheduleService.findOne(Number(req.params.id));
      res.json(schedule);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const schedule = await paymentScheduleService.update(Number(req.params.id), req.body);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      await paymentScheduleService.delete(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async addDetail(req: AuthRequest, res: Response) {
    try {
      const detail = await paymentScheduleService.addDetail(Number(req.params.id), req.body);
      res.status(201).json(detail);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async removeDetail(req: AuthRequest, res: Response) {
    try {
      await paymentScheduleService.removeDetail(Number(req.params.id), Number(req.params.detailId));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async approve(req: AuthRequest, res: Response) {
    try {
      const schedule = await paymentScheduleService.approve(Number(req.params.id));
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async process(req: AuthRequest, res: Response) {
    try {
      const schedule = await paymentScheduleService.process(Number(req.params.id));
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async cancelSchedule(req: AuthRequest, res: Response) {
    try {
      const schedule = await paymentScheduleService.cancel(Number(req.params.id));
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
