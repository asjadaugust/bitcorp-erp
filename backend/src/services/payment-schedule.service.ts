import { PaymentSchedule, PaymentScheduleStatus } from '../models/payment-schedule.model';
import { PaymentScheduleRepository, PaymentScheduleDetailRepository } from '../repositories/payment-schedule.repository';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { CreatePaymentScheduleDto, AddScheduleDetailDto } from '../api/payment-schedule/payment-schedule.controller';

export class PaymentScheduleService {
  async create(data: CreatePaymentScheduleDto, userId: number, tenantId: number) {
    const schedule = PaymentScheduleRepository.create({
      ...data,
      created_by: userId,
      tenant_id: tenantId,
      status: PaymentScheduleStatus.DRAFT,
    });
    return PaymentScheduleRepository.save(schedule);
  }

  async findAll(tenantId: number) {
    return PaymentScheduleRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const schedule = await PaymentScheduleRepository.findWithDetails(id);
    if (!schedule) {
      throw new Error('Payment schedule not found');
    }
    return schedule;
  }

  async update(id: number, data: Partial<PaymentSchedule>) {
    const schedule = await this.findOne(id);
    PaymentScheduleRepository.merge(schedule, data);
    return PaymentScheduleRepository.save(schedule);
  }

  async delete(id: number) {
    const schedule = await this.findOne(id);
    if (schedule.status !== PaymentScheduleStatus.DRAFT) {
      throw new Error('Only draft schedules can be deleted');
    }
    return PaymentScheduleRepository.remove(schedule);
  }

  async addDetail(scheduleId: number, data: AddScheduleDetailDto) {
    const schedule = await PaymentScheduleRepository.findOne({ where: { id: scheduleId } });
    if (!schedule) {
      throw new Error('Payment schedule not found');
    }
    if (schedule.status !== PaymentScheduleStatus.DRAFT) {
      throw new Error('Cannot add details to non-draft schedule');
    }

    const accountsPayable = await AccountsPayableRepository.findOne({ where: { id: data.accounts_payable_id } });
    if (!accountsPayable) {
      throw new Error('Accounts payable item not found');
    }

    const detail = PaymentScheduleDetailRepository.create({
      payment_schedule_id: scheduleId,
      accounts_payable_id: data.accounts_payable_id,
      amount_to_pay: data.amount_to_pay,
    });

    await PaymentScheduleDetailRepository.save(detail);

    // Update total amount
    schedule.total_amount = Number(schedule.total_amount) + Number(data.amount_to_pay);
    await PaymentScheduleRepository.save(schedule);

    return detail;
  }

  async removeDetail(scheduleId: number, detailId: number) {
    const schedule = await PaymentScheduleRepository.findOne({ where: { id: scheduleId } });
    if (!schedule) {
      throw new Error('Payment schedule not found');
    }
    if (schedule.status !== PaymentScheduleStatus.DRAFT) {
      throw new Error('Cannot remove details from non-draft schedule');
    }

    const detail = await PaymentScheduleDetailRepository.findOne({ where: { id: detailId, payment_schedule_id: scheduleId } });
    if (!detail) {
      throw new Error('Schedule detail not found');
    }

    // Update total amount
    schedule.total_amount = Number(schedule.total_amount) - Number(detail.amount_to_pay);
    await PaymentScheduleRepository.save(schedule);

    return PaymentScheduleDetailRepository.remove(detail);
  }

  async approve(id: number): Promise<PaymentSchedule> {
    const schedule = await this.findOne(id);
    if (schedule.status !== PaymentScheduleStatus.DRAFT) {
      throw new Error('Only draft schedules can be approved');
    }
    
    await PaymentScheduleRepository.update(id, { status: PaymentScheduleStatus.APPROVED as any });
    return await this.findOne(id);
  }

  async process(id: number): Promise<PaymentSchedule> {
    const schedule = await this.findOne(id);
    if (schedule.status !== PaymentScheduleStatus.APPROVED) {
      throw new Error('Only approved schedules can be processed');
    }
    
    await PaymentScheduleRepository.update(id, { status: PaymentScheduleStatus.PROCESSED as any });
    return await this.findOne(id);
  }

  async cancel(id: number): Promise<PaymentSchedule> {
    const schedule = await this.findOne(id);
    if (schedule.status === PaymentScheduleStatus.PROCESSED) {
      throw new Error('Processed schedules cannot be cancelled');
    }
    
    await PaymentScheduleRepository.update(id, { status: PaymentScheduleStatus.CANCELLED as any });
    return await this.findOne(id);
  }
}
