import { AppDataSource } from '../config/database.config';
import { CentroCosto } from '../models/cost-center.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';

export class CostCenterService {
  private get repository(): Repository<CentroCosto> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(CentroCosto);
  }

  async findAll(filters?: {
    search?: string;
    projectId?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Promise<{ data: CentroCosto[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Sortable fields whitelist
      const sortableFields: Record<string, string> = {
        codigo: 'cc.codigo',
        nombre: 'cc.nombre',
        presupuesto: 'cc.presupuesto',
        proyecto_id: 'cc.projectId',
        is_active: 'cc.isActive',
        created_at: 'cc.createdAt',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'cc.codigo';
      const sortOrder = filters?.sort_order === 'DESC' ? 'DESC' : 'ASC';

      const queryBuilder = this.repository
        .createQueryBuilder('cc')
        .where('cc.isActive = :isActive', { isActive: filters?.isActive ?? true });

      if (filters?.projectId) {
        queryBuilder.andWhere('cc.projectId = :projectId', { projectId: filters.projectId });
      }

      if (filters?.search) {
        queryBuilder.andWhere('(cc.codigo ILIKE :search OR cc.nombre ILIKE :search)', {
          search: `%${filters.search}%`,
        });
      }

      queryBuilder.orderBy(sortBy, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated data
      const data = await queryBuilder.skip(skip).take(limit).getMany();

      return { data, total };
    } catch (error) {
      Logger.error('Error finding cost centers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'CostCenterService.findAll',
      });
      throw new Error('Failed to fetch cost centers');
    }
  }

  async findById(id: number): Promise<CentroCosto> {
    try {
      const costCenter = await this.repository.findOne({
        where: { id },
      });

      if (!costCenter) {
        throw new Error('Cost center not found');
      }

      return costCenter;
    } catch (error) {
      Logger.error('Error finding cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'CostCenterService.findById',
      });
      throw error;
    }
  }

  async findByCode(codigo: string): Promise<CentroCosto | null> {
    try {
      return await this.repository.findOne({
        where: { codigo },
      });
    } catch (error) {
      Logger.error('Error finding cost center by code', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        codigo,
        context: 'CostCenterService.findByCode',
      });
      throw error;
    }
  }

  async findByProject(projectId: number): Promise<CentroCosto[]> {
    try {
      return await this.repository.find({
        where: { projectId: projectId, isActive: true },
        order: { codigo: 'ASC' },
      });
    } catch (error) {
      Logger.error('Error finding cost centers by project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'CostCenterService.findByProject',
      });
      throw error;
    }
  }

  async create(data: Partial<CentroCosto>): Promise<CentroCosto> {
    try {
      // Validate required fields
      if (!data.codigo || !data.nombre) {
        throw new Error('codigo and nombre are required');
      }

      // Check if codigo already exists
      const existing = await this.findByCode(data.codigo);
      if (existing) {
        throw new Error('Cost center with this codigo already exists');
      }

      const costCenter = this.repository.create({
        ...data,
        isActive: data.isActive ?? true,
      });

      return await this.repository.save(costCenter);
    } catch (error) {
      Logger.error('Error creating cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        codigo: data.codigo,
        context: 'CostCenterService.create',
      });
      throw error;
    }
  }

  async update(id: number, data: Partial<CentroCosto>): Promise<CentroCosto> {
    try {
      const costCenter = await this.findById(id);

      // If updating codigo, check it doesn't exist
      if (data.codigo && data.codigo !== costCenter.codigo) {
        const existing = await this.findByCode(data.codigo);
        if (existing && existing.id !== id) {
          throw new Error('Cost center with this codigo already exists');
        }
      }

      Object.assign(costCenter, data);
      return await this.repository.save(costCenter);
    } catch (error) {
      Logger.error('Error updating cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'CostCenterService.update',
      });
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.repository.update(id, { isActive: false });
    } catch (error) {
      Logger.error('Error deleting cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'CostCenterService.delete',
      });
      throw new Error('Failed to delete cost center');
    }
  }

  async getTotalBudgetByProject(projectId: number): Promise<number> {
    try {
      const result = await this.repository
        .createQueryBuilder('cc')
        .select('SUM(cc.presupuesto)', 'total')
        .where('cc.projectId = :projectId', { projectId })
        .andWhere('cc.isActive = true')
        .getRawOne();

      return parseFloat(result?.total || '0');
    } catch (error) {
      Logger.error('Error calculating total budget', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'CostCenterService.getTotalBudgetByProject',
      });
      throw error;
    }
  }

  async getActiveCount(): Promise<number> {
    try {
      return await this.repository.count({
        where: { isActive: true },
      });
    } catch (error) {
      Logger.error('Error counting cost centers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'CostCenterService.getActiveCount',
      });
      throw error;
    }
  }
}

export default new CostCenterService();
