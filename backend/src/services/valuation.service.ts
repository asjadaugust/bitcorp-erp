import { AppDataSource } from '../config/database.config';
import { Valorizacion } from '../models/valuation.model';
import { Contract } from '../models/contract.model';
import { Repository } from 'typeorm';

export class ValuationService {
  private get repository(): Repository<Valorizacion> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Valorizacion);
  }

  private get contractRepository(): Repository<Contract> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Contract);
  }

  async findAll(filters?: {
    estado?: string;
    search?: string;
    projectId?: number;
    equipmentId?: number;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const skip = (page - 1) * limit;

      const queryBuilder = this.repository.createQueryBuilder('v')
        .leftJoinAndSelect('v.creator', 'creator')
        .leftJoinAndSelect('v.approver', 'approver');

      if (filters?.estado) {
        queryBuilder.andWhere('v.estado = :estado', { estado: filters.estado });
      }

      if (filters?.projectId) {
        queryBuilder.andWhere('v.project_id = :projectId', { projectId: filters.projectId });
      }

      if (filters?.equipmentId) {
        queryBuilder.andWhere('v.equipment_id = :equipmentId', { equipmentId: filters.equipmentId });
      }

      if (filters?.search) {
        queryBuilder.andWhere(
          '(v.periodo ILIKE :search OR v.observaciones ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      queryBuilder.orderBy('v.created_at', 'DESC');

      const total = await queryBuilder.getCount();
      queryBuilder.skip(skip).take(limit);

      const data = await queryBuilder.getMany();

      return { data, total, page, limit };
    } catch (error) {
      console.error('Error fetching valuations:', error);
      throw new Error('Failed to fetch valuations');
    }
  }

  async findById(id: number): Promise<Valorizacion | null> {
    try {
      return await this.repository.findOne({
        where: { id },
        relations: ['creator', 'approver'],
      });
    } catch (error) {
      console.error('Error fetching valuation by id:', error);
      throw error;
    }
  }

  async create(data: Partial<Valorizacion>, userId?: number): Promise<Valorizacion> {
    try {
      const valorizacion = this.repository.create({
        ...data,
        estado: data.estado || 'PENDIENTE',
        createdBy: userId,
      });

      return await this.repository.save(valorizacion);
    } catch (error) {
      console.error('Error creating valuation:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<Valorizacion>): Promise<Valorizacion> {
    try {
      const valorizacion = await this.findById(id);
      if (!valorizacion) {
        throw new Error('Valuation not found');
      }

      Object.assign(valorizacion, data);
      return await this.repository.save(valorizacion);
    } catch (error) {
      console.error('Error updating valuation:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      return (result.affected || 0) > 0;
    } catch (error) {
      console.error('Error deleting valuation:', error);
      throw new Error('Failed to delete valuation');
    }
  }

  async approve(id: number, userId: number): Promise<Valorizacion> {
    try {
      const valorizacion = await this.findById(id);
      if (!valorizacion) {
        throw new Error('Valuation not found');
      }

      valorizacion.estado = 'APROBADO';
      valorizacion.approvedBy = userId;
      valorizacion.approvedAt = new Date();

      return await this.repository.save(valorizacion);
    } catch (error) {
      console.error('Error approving valuation:', error);
      throw error;
    }
  }

  async getAnalytics() {
    try {
      const statusStats = await this.repository
        .createQueryBuilder('v')
        .select('v.estado', 'estado')
        .addSelect('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(v.total_valorizado), 0)', 'total')
        .groupBy('v.estado')
        .getRawMany();

      const monthlyTrend = await this.repository
        .createQueryBuilder('v')
        .select('v.periodo', 'periodo')
        .addSelect('COALESCE(SUM(v.total_valorizado), 0)', 'total')
        .groupBy('v.periodo')
        .orderBy('v.periodo', 'DESC')
        .limit(6)
        .getRawMany();

      return {
        status_breakdown: statusStats.map(r => ({
          status: r.estado || 'PENDIENTE',
          count: parseInt(r.count),
          total: parseFloat(r.total || 0)
        })),
        monthly_trend: monthlyTrend.reverse().map(r => ({
          period: r.periodo,
          total: parseFloat(r.total || 0)
        })),
        top_equipment: [] // TODO: Implement with equipment join
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  // Backward compatibility methods
  async getAllValuations(filters?: any) {
    return this.findAll(filters);
  }

  async getValuationById(id: string) {
    return this.findById(parseInt(id));
  }

  async createValuation(data: any, userId: string) {
    return this.create(data, parseInt(userId));
  }

  async updateValuation(id: string, data: any, userId: string) {
    return this.update(parseInt(id), data);
  }

  async deleteValuation(id: string) {
    return this.delete(parseInt(id));
  }

  async calculateValuation(contractId: string, month: number, year: number) {
    // TODO: Implement calculation logic
    return {
      contract_id: contractId,
      period_month: month,
      period_year: year,
      total_hours: 0,
      total_days: 0,
      total_fuel: 0,
      base_cost: 0,
      excess_cost: 0,
      total_estimated: 0,
      currency: 'PEN'
    };
  }

  async generateValuationForContract(contractId: string, month: number, year: number, userId: string) {
    const calculation = await this.calculateValuation(contractId, month, year);
    const periodo = `${year}-${String(month).padStart(2, '0')}`;
    const fechaInicio = new Date(year, month - 1, 1);
    const fechaFin = new Date(year, month, 0);

    return this.create({
      contractId: parseInt(contractId),
      periodo,
      fechaInicio,
      fechaFin,
      diasTrabajados: calculation.total_days,
      horasTrabajadas: calculation.total_hours,
      combustibleConsumido: calculation.total_fuel,
      costoBase: calculation.base_cost,
      totalValorizado: calculation.total_estimated,
      estado: 'PENDIENTE',
      observaciones: `Auto-generado el ${new Date().toISOString()}`,
    }, parseInt(userId));
  }

  async generateValuationsForPeriod(month: number, year: number, userId: string) {
    // TODO: Implement batch generation
    return [];
  }

  async getValuationDetailsForPdf(id: string) {
    return this.findById(parseInt(id));
  }
}

export default new ValuationService();
