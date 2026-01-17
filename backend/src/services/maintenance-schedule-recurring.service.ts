/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { MaintenanceScheduleRecurring } from '../models/maintenance-schedule-recurring.model';
import { Repository } from 'typeorm';

/**
 * Service for managing recurring maintenance schedules
 *
 * This service handles RECURRING maintenance schedules (e.g., "change oil every 250 hours").
 * For one-time maintenance work orders, use MaintenanceSchedule (programa_mantenimiento).
 */

export interface CreateMaintenanceScheduleDto {
  equipmentId: number;
  projectId?: number;
  maintenanceType?: 'preventive' | 'corrective' | 'predictive' | 'calibration' | 'inspection';
  intervalType?: 'hours' | 'days' | 'weeks' | 'months' | 'kilometers';
  intervalValue: number;
  description?: string;
  notes?: string;
  autoGenerateTasks?: boolean;
  createdById?: number;
}

export interface UpdateMaintenanceScheduleDto {
  equipmentId?: number;
  projectId?: number;
  maintenanceType?: 'preventive' | 'corrective' | 'predictive' | 'calibration' | 'inspection';
  intervalType?: 'hours' | 'days' | 'weeks' | 'months' | 'kilometers';
  intervalValue?: number;
  description?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'completed';
  autoGenerateTasks?: boolean;
  nextDueDate?: Date;
  nextDueHours?: number;
  lastCompletedDate?: Date;
  lastCompletedHours?: number;
}

export interface MaintenanceScheduleFilter {
  equipmentId?: number;
  projectId?: number;
  status?: string;
  maintenanceType?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface MaintenanceScheduleDto {
  id: number;
  equipmentId: number;
  projectId?: number;
  maintenanceType: string;
  intervalType: string;
  intervalValue: number;
  description?: string;
  notes?: string;
  status: string;
  autoGenerateTasks: boolean;
  lastCompletedDate?: Date;
  lastCompletedHours?: number;
  nextDueDate?: Date;
  nextDueHours?: number;
  createdById?: number;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  equipment?: {
    id: number;
    code: string;
    name: string;
    brand: string;
  };
  project?: {
    id: number;
    name: string;
  };
}

export class MaintenanceScheduleRecurringService {
  private get repository(): Repository<MaintenanceScheduleRecurring> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(MaintenanceScheduleRecurring);
  }

  /**
   * Calculate next due date based on interval
   */
  private calculateNextDueDate(intervalType: string, intervalValue: number): Date {
    const now = new Date();

    switch (intervalType) {
      case 'days':
        now.setDate(now.getDate() + intervalValue);
        break;
      case 'weeks':
        now.setDate(now.getDate() + intervalValue * 7);
        break;
      case 'months':
        now.setMonth(now.getMonth() + intervalValue);
        break;
      case 'hours':
      default:
        // For hours-based schedules, set a default 30 days ahead
        now.setDate(now.getDate() + 30);
        break;
    }

    return now;
  }

  /**
   * Transform entity to DTO with joined data
   */
  private transformToDto(schedule: MaintenanceScheduleRecurring): MaintenanceScheduleDto {
    const dto: MaintenanceScheduleDto = {
      id: schedule.id,
      equipmentId: schedule.equipmentId,
      projectId: schedule.projectId,
      maintenanceType: schedule.maintenanceType,
      intervalType: schedule.intervalType,
      intervalValue: schedule.intervalValue,
      description: schedule.description,
      notes: schedule.notes,
      status: schedule.status,
      autoGenerateTasks: schedule.autoGenerateTasks,
      lastCompletedDate: schedule.lastCompletedDate,
      lastCompletedHours: schedule.lastCompletedHours,
      nextDueDate: schedule.nextDueDate,
      nextDueHours: schedule.nextDueHours,
      createdById: schedule.createdById,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };

    // Add joined equipment data if loaded
    if (schedule.equipment) {
      dto.equipment = {
        id: schedule.equipment.id,
        code: schedule.equipment.codigo_equipo,
        name: schedule.equipment.marca + ' ' + schedule.equipment.modelo,
        brand: schedule.equipment.marca,
      };
    }

    // Add joined project data if loaded
    if (schedule.project) {
      dto.project = {
        id: schedule.project.id,
        name: schedule.project.nombre,
      };
    }

    return dto;
  }

  /**
   * Find all maintenance schedules with filters, pagination, and sorting
   */
  async findAll(
    filters: MaintenanceScheduleFilter
  ): Promise<{ data: MaintenanceScheduleDto[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    // Define sortable fields (snake_case API → camelCase DB)
    const sortableFields: Record<string, string> = {
      equipment_id: 'ms.equipmentId',
      project_id: 'ms.projectId',
      maintenance_type: 'ms.maintenanceType',
      interval_type: 'ms.intervalType',
      interval_value: 'ms.intervalValue',
      status: 'ms.status',
      next_due_date: 'ms.nextDueDate',
      last_completed_date: 'ms.lastCompletedDate',
      created_at: 'ms.createdAt',
      updated_at: 'ms.updatedAt',
    };

    const sortBy =
      filters.sort_by && sortableFields[filters.sort_by]
        ? sortableFields[filters.sort_by]
        : 'ms.createdAt';
    const sortOrder = filters.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.repository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.equipment', 'e')
      .leftJoinAndSelect('ms.project', 'p');

    // Apply filters
    if (filters.equipmentId) {
      queryBuilder.andWhere('ms.equipmentId = :equipmentId', { equipmentId: filters.equipmentId });
    }

    if (filters.projectId) {
      queryBuilder.andWhere('ms.projectId = :projectId', { projectId: filters.projectId });
    }

    if (filters.status) {
      queryBuilder.andWhere('ms.status = :status', { status: filters.status });
    }

    if (filters.maintenanceType) {
      queryBuilder.andWhere('ms.maintenanceType = :maintenanceType', {
        maintenanceType: filters.maintenanceType,
      });
    }

    // Apply sorting
    queryBuilder.orderBy(sortBy, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Get results
    const schedules = await queryBuilder.getMany();

    return {
      data: schedules.map((s) => this.transformToDto(s)),
      total,
    };
  }

  /**
   * Find schedule by ID
   */
  async findById(id: number): Promise<MaintenanceScheduleDto | null> {
    const schedule = await this.repository.findOne({
      where: { id },
      relations: ['equipment', 'project'],
    });

    if (!schedule) {
      return null;
    }

    return this.transformToDto(schedule);
  }

  /**
   * Create new maintenance schedule
   */
  async create(dto: CreateMaintenanceScheduleDto): Promise<MaintenanceScheduleDto> {
    const nextDueDate = this.calculateNextDueDate(dto.intervalType || 'hours', dto.intervalValue);

    const schedule = this.repository.create({
      equipmentId: dto.equipmentId,
      projectId: dto.projectId,
      maintenanceType: dto.maintenanceType || 'preventive',
      intervalType: dto.intervalType || 'hours',
      intervalValue: dto.intervalValue,
      description: dto.description,
      notes: dto.notes,
      autoGenerateTasks: dto.autoGenerateTasks !== false,
      nextDueDate,
      status: 'active',
      createdById: dto.createdById,
    });

    const saved = await this.repository.save(schedule);

    // Reload with relations
    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['equipment', 'project'],
    });

    return this.transformToDto(reloaded!);
  }

  /**
   * Update maintenance schedule
   */
  async update(
    id: number,
    dto: UpdateMaintenanceScheduleDto
  ): Promise<MaintenanceScheduleDto | null> {
    const schedule = await this.repository.findOne({ where: { id } });

    if (!schedule) {
      return null;
    }

    // Apply updates
    if (dto.equipmentId !== undefined) schedule.equipmentId = dto.equipmentId;
    if (dto.projectId !== undefined) schedule.projectId = dto.projectId;
    if (dto.maintenanceType !== undefined) schedule.maintenanceType = dto.maintenanceType;
    if (dto.intervalType !== undefined) schedule.intervalType = dto.intervalType;
    if (dto.intervalValue !== undefined) schedule.intervalValue = dto.intervalValue;
    if (dto.description !== undefined) schedule.description = dto.description;
    if (dto.notes !== undefined) schedule.notes = dto.notes;
    if (dto.status !== undefined) schedule.status = dto.status;
    if (dto.autoGenerateTasks !== undefined) schedule.autoGenerateTasks = dto.autoGenerateTasks;
    if (dto.nextDueDate !== undefined) schedule.nextDueDate = dto.nextDueDate;
    if (dto.nextDueHours !== undefined) schedule.nextDueHours = dto.nextDueHours;
    if (dto.lastCompletedDate !== undefined) schedule.lastCompletedDate = dto.lastCompletedDate;
    if (dto.lastCompletedHours !== undefined) schedule.lastCompletedHours = dto.lastCompletedHours;

    const saved = await this.repository.save(schedule);

    // Reload with relations
    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['equipment', 'project'],
    });

    return this.transformToDto(reloaded!);
  }

  /**
   * Delete maintenance schedule
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Find schedules that are due soon
   */
  async findDueSoon(daysAhead: number = 30): Promise<MaintenanceScheduleDto[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const schedules = await this.repository
      .createQueryBuilder('ms')
      .leftJoinAndSelect('ms.equipment', 'e')
      .leftJoinAndSelect('ms.project', 'p')
      .where('ms.status = :status', { status: 'active' })
      .andWhere('ms.autoGenerateTasks = :autoGenerate', { autoGenerate: true })
      .andWhere('ms.nextDueDate <= :futureDate', { futureDate })
      .orderBy('ms.nextDueDate', 'ASC')
      .getMany();

    return schedules.map((s) => this.transformToDto(s));
  }

  /**
   * Complete a maintenance schedule (mark as done and recalculate next due)
   */
  async complete(id: number, completionHours?: number): Promise<MaintenanceScheduleDto | null> {
    const schedule = await this.repository.findOne({ where: { id } });

    if (!schedule) {
      return null;
    }

    const nextDueDate = this.calculateNextDueDate(schedule.intervalType, schedule.intervalValue);
    const nextDueHours = completionHours ? completionHours + schedule.intervalValue : undefined;

    schedule.lastCompletedDate = new Date();
    schedule.lastCompletedHours = completionHours;
    schedule.nextDueDate = nextDueDate;
    schedule.nextDueHours = nextDueHours;

    const saved = await this.repository.save(schedule);

    // Reload with relations
    const reloaded = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['equipment', 'project'],
    });

    return this.transformToDto(reloaded!);
  }
}
