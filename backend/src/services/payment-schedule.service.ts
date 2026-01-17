import { PaymentSchedule, PaymentScheduleStatus } from '../models/payment-schedule.model';
import {
  PaymentScheduleRepository,
  PaymentScheduleDetailRepository,
} from '../repositories/payment-schedule.repository';
import {
  PaymentScheduleCreateDto,
  PaymentScheduleDetailCreateDto,
} from '../types/dto/payment-schedule.dto';

// Re-export for backwards compatibility
export type CreatePaymentScheduleDto = PaymentScheduleCreateDto;
export type AddScheduleDetailDto = PaymentScheduleDetailCreateDto;

export class PaymentScheduleService {
  async create(data: PaymentScheduleCreateDto, _userId: number, _tenantId: number) {
    const schedule = PaymentScheduleRepository.create({
      ...data,
      status: PaymentScheduleStatus.DRAFT,
    });
    return PaymentScheduleRepository.save(schedule);
  }

  async findAll(
    _tenantId: number,
    filters?: {
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: 'ASC' | 'DESC';
    }
  ): Promise<{ data: PaymentSchedule[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Sortable fields whitelist
    const sortableFields: Record<string, string> = {
      schedule_date: 'ps.schedule_date',
      payment_date: 'ps.payment_date',
      total_amount: 'ps.total_amount',
      status: 'ps.status',
      currency: 'ps.currency',
      created_at: 'ps.created_at',
    };

    const sortBy =
      filters?.sort_by && sortableFields[filters.sort_by]
        ? sortableFields[filters.sort_by]
        : 'ps.created_at';
    const sortOrder = filters?.sort_order === 'ASC' ? 'ASC' : 'DESC';

    // Use query builder for dynamic sorting
    const queryBuilder = PaymentScheduleRepository.createQueryBuilder('ps').orderBy(
      sortBy,
      sortOrder
    );

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated data
    const schedules = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      data: schedules,
      total,
    };
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

  async addDetail(scheduleId: number, data: PaymentScheduleDetailCreateDto) {
    const schedule = await PaymentScheduleRepository.findOne({ where: { id: scheduleId } });
    if (!schedule) {
      throw new Error('Payment schedule not found');
    }
    if (schedule.status !== PaymentScheduleStatus.DRAFT) {
      throw new Error('Cannot add details to non-draft schedule');
    }

    const detail = PaymentScheduleDetailRepository.create({
      payment_schedule_id: scheduleId,
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

    const detail = await PaymentScheduleDetailRepository.findOne({
      where: { id: detailId, payment_schedule_id: scheduleId },
    });
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

    await PaymentScheduleRepository.update(id, { status: PaymentScheduleStatus.APPROVED } as Record<
      string,
      unknown
    >);
    return await this.findOne(id);
  }

  async process(id: number): Promise<PaymentSchedule> {
    const schedule = await this.findOne(id);
    if (schedule.status !== PaymentScheduleStatus.APPROVED) {
      throw new Error('Only approved schedules can be processed');
    }

    await PaymentScheduleRepository.update(id, {
      status: PaymentScheduleStatus.PROCESSED,
    } as Record<string, unknown>);
    return await this.findOne(id);
  }

  async cancel(id: number): Promise<PaymentSchedule> {
    const schedule = await this.findOne(id);
    if (schedule.status === PaymentScheduleStatus.PROCESSED) {
      throw new Error('Processed schedules cannot be cancelled');
    }

    await PaymentScheduleRepository.update(id, {
      status: PaymentScheduleStatus.CANCELLED,
    } as Record<string, unknown>);
    return await this.findOne(id);
  }
}
