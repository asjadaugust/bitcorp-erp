import { AppDataSource } from '../config/database.config';
import { ScheduledTask } from '../models/scheduled-task.model';
import { Repository } from 'typeorm';
import {
  ScheduledTaskDto,
  CreateScheduledTaskDto,
  UpdateScheduledTaskDto,
  toScheduledTaskDto,
  fromScheduledTaskDto,
  mapCreateScheduledTaskDto,
} from '../types/dto/scheduled-task.dto';
import Logger from '../utils/logger';

export interface TaskFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  type?: string;
  equipmentId?: number;
  operatorId?: number;
  priority?: string;
}

export class SchedulingService {
  private get repository(): Repository<ScheduledTask> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(ScheduledTask);
  }

  async findAll(filter?: TaskFilter): Promise<ScheduledTaskDto[]> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.equipment', 'equipment')
        .leftJoinAndSelect('task.project', 'project');

      if (filter?.startDate && filter?.endDate) {
        queryBuilder.andWhere('task.startDate BETWEEN :start AND :end', {
          start: filter.startDate,
          end: filter.endDate,
        });
      }

      if (filter?.status) {
        if (filter.status !== 'all') {
          queryBuilder.andWhere('task.status = :status', { status: filter.status });
        }
      }

      if (filter?.type) {
        if (filter.type !== 'all') {
          queryBuilder.andWhere('task.taskType = :type', { type: filter.type });
        }
      }

      if (filter?.equipmentId) {
        queryBuilder.andWhere('task.equipmentId = :equipmentId', {
          equipmentId: filter.equipmentId,
        });
      }

      if (filter?.priority) {
        queryBuilder.andWhere('task.priority = :priority', { priority: filter.priority });
      }

      queryBuilder.orderBy('task.startDate', 'ASC').addOrderBy('task.priority', 'DESC');

      const tasks = await queryBuilder.getMany();
      return tasks.map((task) => toScheduledTaskDto(task));
    } catch (error) {
      Logger.error('Error listing tasks', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filter,
        context: 'SchedulingService.findAll',
      });
      throw error;
    }
  }

  async findById(id: number): Promise<ScheduledTaskDto | null> {
    try {
      const task = await this.repository.findOne({
        where: { id },
        relations: ['equipment', 'project'],
      });
      return task ? toScheduledTaskDto(task) : null;
    } catch (error) {
      Logger.error('Error finding task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SchedulingService.findById',
      });
      throw error;
    }
  }

  async create(data: CreateScheduledTaskDto): Promise<ScheduledTaskDto> {
    try {
      // Map dual input format to DTO
      const dtoData = mapCreateScheduledTaskDto(data);

      const task = this.repository.create(fromScheduledTaskDto(dtoData));
      const saved = await this.repository.save(task);

      // Reload with relations
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['equipment', 'project'],
      });

      return toScheduledTaskDto(withRelations!);
    } catch (error) {
      Logger.error('Error creating task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SchedulingService.create',
      });
      throw error;
    }
  }

  async update(id: number, data: UpdateScheduledTaskDto): Promise<ScheduledTaskDto> {
    try {
      const task = await this.repository.findOne({
        where: { id },
        relations: ['equipment', 'project'],
      });
      if (!task) {
        throw new Error('Task not found');
      }

      // Map dual input format to DTO
      const dtoData = mapCreateScheduledTaskDto(data);

      Object.assign(task, fromScheduledTaskDto(dtoData));
      const saved = await this.repository.save(task);

      // Reload with relations
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['equipment', 'project'],
      });

      return toScheduledTaskDto(withRelations!);
    } catch (error) {
      Logger.error('Error updating task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SchedulingService.update',
      });
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      Logger.error('Error deleting task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SchedulingService.delete',
      });
      throw error;
    }
  }

  // Backward compatibility methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTasks(filters: any): Promise<ScheduledTaskDto[]> {
    return this.findAll({
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      status: filters.status,
      type: filters.type,
      equipmentId: filters.equipmentId,
    });
  }

  async getTaskById(id: string): Promise<ScheduledTaskDto | null> {
    return this.findById(parseInt(id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createTask(data: any): Promise<ScheduledTaskDto> {
    // Map fields if necessary
    return this.create({
      ...data,
      start_date: data.scheduledDate || data.start_date || data.startDate,
      startDate: data.scheduledDate || data.startDate,
      task_type: data.type || data.task_type || data.taskType,
      taskType: data.type || data.taskType,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateTask(id: string, data: any): Promise<ScheduledTaskDto> {
    return this.update(parseInt(id), {
      ...data,
      start_date: data.scheduledDate || data.start_date || data.startDate,
      startDate: data.scheduledDate || data.startDate,
    });
  }

  async deleteTask(id: string) {
    return this.delete(parseInt(id));
  }
}

export default new SchedulingService();
