import { AppDataSource } from '../config/database.config';
import { ScheduledTask } from '../models/scheduled-task.model';
import { Repository, Between } from 'typeorm';

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

  async findAll(filter?: TaskFilter): Promise<ScheduledTask[]> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('task')
        .leftJoinAndSelect('task.equipment', 'equipment')
        .leftJoinAndSelect('task.project', 'project');

      if (filter?.startDate && filter?.endDate) {
        queryBuilder.andWhere('task.start_date BETWEEN :start AND :end', { 
          start: filter.startDate, 
          end: filter.endDate 
        });
      }

      if (filter?.status) {
        if (filter.status !== 'all') {
          queryBuilder.andWhere('task.status = :status', { status: filter.status });
        }
      }

      if (filter?.type) {
        if (filter.type !== 'all') {
          queryBuilder.andWhere('task.task_type = :type', { type: filter.type });
        }
      }

      if (filter?.equipmentId) {
        queryBuilder.andWhere('task.equipment_id = :equipmentId', { equipmentId: filter.equipmentId });
      }

      if (filter?.priority) {
        queryBuilder.andWhere('task.priority = :priority', { priority: filter.priority });
      }

      queryBuilder.orderBy('task.start_date', 'ASC')
        .addOrderBy('task.priority', 'DESC');

      return await queryBuilder.getMany();
    } catch (error) {
      console.error('Error listing tasks:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<ScheduledTask | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['equipment', 'project'],
      });
    } catch (error) {
      console.error('Error finding task:', error);
      throw error;
    }
  }

  async create(data: Partial<ScheduledTask>): Promise<ScheduledTask> {
    try {
      const task = this.repository.create({
        ...data,
      });
      return await this.repository.save(task);
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<ScheduledTask>): Promise<ScheduledTask> {
    try {
      const task = await this.findById(id);
      if (!task) {
        throw new Error('Task not found');
      }
      Object.assign(task, data);
      return await this.repository.save(task);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Backward compatibility methods
  async getTasks(filters: any) {
    return this.findAll({
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      status: filters.status,
      type: filters.type,
      equipmentId: filters.equipmentId,
    });
  }

  async getTaskById(id: string) {
    return this.findById(parseInt(id));
  }

  async createTask(data: any) {
    // Map fields if necessary
    return this.create({
      ...data,
      startDate: data.scheduledDate || data.startDate, // Map scheduledDate to startDate
      taskType: data.type || data.taskType,
    });
  }

  async updateTask(id: string, data: any) {
    return this.update(parseInt(id), {
      ...data,
      startDate: data.scheduledDate || data.startDate,
    });
  }

  async deleteTask(id: string) {
    return this.delete(parseInt(id));
  }
}

export default new SchedulingService();
