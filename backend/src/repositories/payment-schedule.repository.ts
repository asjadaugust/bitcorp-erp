import { AppDataSource } from '../config/database.config';
import { PaymentSchedule } from '../models/payment-schedule.model';
import { PaymentScheduleDetail } from '../models/payment-schedule-detail.model';

export const PaymentScheduleRepository = AppDataSource.getRepository(PaymentSchedule).extend({
  async findByStatus(status: string) {
    return this.find({
      where: { status: status as any },
      relations: ['details', 'details.accounts_payable'],
    });
  },

  async findWithDetails(id: number) {
    return this.findOne({
      where: { id },
      relations: ['details', 'details.accounts_payable', 'details.accounts_payable.provider'],
    });
  },
});

export const PaymentScheduleDetailRepository = AppDataSource.getRepository(PaymentScheduleDetail);
