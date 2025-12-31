import { AppDataSource } from '../config/database.config';
import { OperatorAvailability } from '../models/operator-availability.entity';
import { Repository, Between } from 'typeorm';

export class OperatorAvailabilityService {
  private repository: Repository<OperatorAvailability>;

  constructor() {
    this.repository = AppDataSource.getRepository(OperatorAvailability);
  }

  async findAll(filters?: { 
    operator_id?: number; 
    project_id?: number;
    status?: string;
    date?: Date;
    start_date?: Date;
    end_date?: Date;
  }): Promise<OperatorAvailability[]> {
    const query = this.repository.createQueryBuilder('avail')
      .leftJoinAndSelect('avail.operator', 'operator')
      .leftJoinAndSelect('avail.project', 'project')
      .where('avail.is_active = :is_active', { is_active: true });

    if (filters?.operator_id) {
      query.andWhere('avail.operator_id = :operator_id', { operator_id: filters.operator_id });
    }

    if (filters?.project_id) {
      query.andWhere('avail.project_id = :project_id', { project_id: filters.project_id });
    }

    if (filters?.status) {
      query.andWhere('avail.status = :status', { status: filters.status });
    }

    if (filters?.date) {
      query.andWhere('avail.date = :date', { date: filters.date });
    }

    if (filters?.start_date && filters?.end_date) {
      query.andWhere('avail.date BETWEEN :start_date AND :end_date', {
        start_date: filters.start_date,
        end_date: filters.end_date
      });
    }

    return await query.orderBy('avail.date', 'DESC').getMany();
  }

  async findById(id: number): Promise<OperatorAvailability | null> {
    return await this.repository.findOne({
      where: { id, is_active: true },
      relations: ['operator', 'project']
    });
  }

  async findByOperator(operatorId: number, startDate?: Date, endDate?: Date): Promise<OperatorAvailability[]> {
    const query = this.repository.createQueryBuilder('avail')
      .where('avail.operator_id = :operator_id', { operator_id: operatorId })
      .andWhere('avail.is_active = :is_active', { is_active: true });

    if (startDate && endDate) {
      query.andWhere('avail.date BETWEEN :start_date AND :end_date', {
        start_date: startDate,
        end_date: endDate
      });
    }

    return await query.orderBy('avail.date', 'ASC').getMany();
  }

  async findAvailableOperators(date: Date, projectId?: number): Promise<OperatorAvailability[]> {
    const query = this.repository.createQueryBuilder('avail')
      .leftJoinAndSelect('avail.operator', 'operator')
      .where('avail.date = :date', { date })
      .andWhere('avail.status = :status', { status: 'available' })
      .andWhere('avail.is_active = :is_active', { is_active: true });

    if (projectId) {
      query.andWhere('(avail.project_id = :project_id OR avail.project_id IS NULL)', { project_id: projectId });
    }

    return await query.getMany();
  }

  async create(data: Partial<OperatorAvailability>): Promise<OperatorAvailability> {
    const availability = this.repository.create(data);
    return await this.repository.save(availability);
  }

  async update(id: number, data: Partial<OperatorAvailability>): Promise<OperatorAvailability | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.update(id, {
      is_active: false,
      deleted_at: new Date()
    });
    return (result.affected || 0) > 0;
  }

  async bulkCreate(availabilities: Partial<OperatorAvailability>[]): Promise<OperatorAvailability[]> {
    const entities = availabilities.map(data => this.repository.create(data));
    return await this.repository.save(entities);
  }
}
