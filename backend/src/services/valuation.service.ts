/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Valorizacion } from '../models/valuation.model';
import { Contract } from '../models/contract.model';
import { ExcessFuel } from '../models/excess-fuel.model';
import { WorkExpense } from '../models/work-expense.model';
import { AdvanceAmortization } from '../models/advance-amortization.model';
import { Repository } from 'typeorm';
import {
  transformToValuationPage1Dto,
  transformToValuationPage2Dto,
  transformToValuationPage3Dto,
  transformToValuationPage4Dto,
  transformToValuationPage5Dto,
  transformToValuationPage6Dto,
  transformToValuationPage7Dto,
} from '../utils/valuation-pdf-transformer';
import {
  ValuationPage1Dto,
  ValuationPage2Dto,
  ValuationPage3Dto,
  ValuationPage4Dto,
  ValuationPage5Dto,
  ValuationPage6Dto,
  ValuationPage7Dto,
} from '../types/dto/valuation-pdf.dto';

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

      const queryBuilder = this.repository
        .createQueryBuilder('v')
        .leftJoinAndSelect('v.creator', 'creator')
        .leftJoinAndSelect('v.approver', 'approver');

      if (filters?.estado) {
        queryBuilder.andWhere('v.estado = :estado', { estado: filters.estado });
      }

      if (filters?.projectId) {
        queryBuilder.andWhere('v.proyecto_id = :projectId', { projectId: filters.projectId });
      }

      if (filters?.equipmentId) {
        queryBuilder.andWhere('v.equipo_id = :equipmentId', { equipmentId: filters.equipmentId });
      }

      if (filters?.search) {
        queryBuilder.andWhere('(v.periodo ILIKE :search OR v.observaciones ILIKE :search)', {
          search: `%${filters.search}%`,
        });
      }

      queryBuilder.orderBy('v.createdAt', 'DESC');

      const total = await queryBuilder.getCount();
      queryBuilder.skip(skip).take(limit);

      const records = await queryBuilder.getMany();

      // Transform to match frontend expectations (snake_case)
      const data = records.map((v) => ({
        id: v.id,
        contract_id: v.contractId,
        period_start: v.fechaInicio,
        period_end: v.fechaFin,
        amount: v.totalValorizado || 0,
        base_amount: v.costoBase || 0,
        overtime_amount: v.cargosAdicionales || 0,
        fuel_amount: v.costoCombustible || 0,
        status: v.estado.toLowerCase(),
        created_at: v.createdAt,
        updated_at: v.updatedAt,
        // Additional fields for display
        period: v.periodo,
        days_worked: v.diasTrabajados,
        hours_worked: v.horasTrabajadas,
        fuel_consumed: v.combustibleConsumido,
        observations: v.observaciones,
        created_by: v.createdBy,
        approved_by: v.approvedBy,
        approved_at: v.approvedAt,
        creator: v.creator,
        approver: v.approver,
      }));

      return { data, total, page, limit };
    } catch (error) {
      console.error('Error fetching valuations:', error);
      throw new Error('Failed to fetch valuations');
    }
  }

  async findById(id: number): Promise<any | null> {
    try {
      const v = await this.repository.findOne({
        where: { id },
        relations: ['creator', 'approver'],
      });

      if (!v) return null;

      // Transform to match frontend expectations
      return {
        id: v.id,
        contract_id: v.contractId,
        period_start: v.fechaInicio,
        period_end: v.fechaFin,
        amount: v.totalValorizado || 0,
        base_amount: v.costoBase || 0,
        overtime_amount: v.cargosAdicionales || 0,
        fuel_amount: v.costoCombustible || 0,
        status: v.estado.toLowerCase(),
        created_at: v.createdAt,
        updated_at: v.updatedAt,
        period: v.periodo,
        days_worked: v.diasTrabajados,
        hours_worked: v.horasTrabajadas,
        fuel_consumed: v.combustibleConsumido,
        observations: v.observaciones,
        created_by: v.createdBy,
        approved_by: v.approvedBy,
        approved_at: v.approvedAt,
        creator: v.creator,
        approver: v.approver,
      };
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
        status_breakdown: statusStats.map((r) => ({
          status: r.estado || 'PENDIENTE',
          count: parseInt(r.count),
          total: parseFloat(r.total || 0),
        })),
        monthly_trend: monthlyTrend.reverse().map((r) => ({
          period: r.periodo,
          total: parseFloat(r.total || 0),
        })),
        top_equipment: [], // TODO: Implement with equipment join
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
      currency: 'PEN',
    };
  }

  async generateValuationForContract(
    contractId: string,
    month: number,
    year: number,
    userId: string
  ) {
    const calculation = await this.calculateValuation(contractId, month, year);
    const periodo = `${year}-${String(month).padStart(2, '0')}`;
    const fechaInicio = new Date(year, month - 1, 1);
    const fechaFin = new Date(year, month, 0);

    return this.create(
      {
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
      },
      parseInt(userId)
    );
  }

  async generateValuationsForPeriod(month: number, year: number, userId: string) {
    // TODO: Implement batch generation
    return [];
  }

  async getValuationDetailsForPdf(id: string) {
    return this.findById(parseInt(id));
  }

  /**
   * Get complete valuation data for Page 1 PDF generation
   * Returns properly formatted DTO following ARCHITECTURE.md guidelines
   *
   * @param id - Valuation ID
   * @returns ValuationPage1Dto with all data for PDF generation
   */
  async getValuationPage1Data(id: number): Promise<ValuationPage1Dto> {
    try {
      // Fetch valuation with relations
      const valuation = await this.repository
        .createQueryBuilder('v')
        .leftJoinAndSelect('v.creator', 'creator')
        .leftJoinAndSelect('v.approver', 'approver')
        .where('v.id = :id', { id })
        .getOne();

      if (!valuation) {
        throw new Error('Valuation not found');
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.equipo) {
        throw new Error('Equipment not found for contract');
      }

      // Transform entities to DTO using centralized transformer
      return transformToValuationPage1Dto(valuation, contract, contract.equipo);
    } catch (error) {
      console.error('Error fetching valuation Page 1 data:', error);
      throw error;
    }
  }

  /**
   * Get complete valuation data for Page 2 PDF generation (RESUMEN ACUMULADO)
   * Returns properly formatted DTO with historical valuations
   *
   * @param id - Current valuation ID
   * @returns ValuationPage2Dto with historical data for PDF generation
   */
  async getValuationPage2Data(id: number): Promise<ValuationPage2Dto> {
    try {
      // Fetch current valuation
      const currentValuation = await this.repository
        .createQueryBuilder('v')
        .where('v.id = :id', { id })
        .getOne();

      if (!currentValuation) {
        throw new Error('Valuation not found');
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: currentValuation.contractId })
        .getOne();

      if (!contract) {
        throw new Error('Contract not found');
      }

      if (!contract.equipo) {
        throw new Error('Equipment not found for contract');
      }

      // Fetch ALL valuations for the same equipment up to current date (historical)
      const historicalValuations = await this.repository
        .createQueryBuilder('v')
        .where('v.equipo_id = :equipmentId', { equipmentId: contract.equipo.id })
        .andWhere('v.fecha_fin <= :currentEndDate', { currentEndDate: currentValuation.fechaFin })
        .orderBy('v.fecha_inicio', 'ASC')
        .getMany();

      // Fetch contracts for all historical valuations
      const contractIds = [
        ...new Set(historicalValuations.map((v) => v.contractId).filter(Boolean)),
      ];
      const contracts = await this.contractRepository
        .createQueryBuilder('c')
        .whereInIds(contractIds)
        .getMany();

      // Create a map for quick contract lookup
      const contractMap = new Map(contracts.map((c) => [c.id, c]));

      // Attach contracts to valuations
      const valuationsWithContracts = historicalValuations.map((val) => ({
        ...val,
        contract: val.contractId ? contractMap.get(val.contractId) : null,
      }));

      // Transform to Page 2 DTO
      return transformToValuationPage2Dto(
        currentValuation,
        valuationsWithContracts as any,
        contract.equipo
      );
    } catch (error) {
      console.error('Error fetching valuation Page 2 data:', error);
      throw error;
    }
  }

  /**
   * Get complete valuation data for Page 3 PDF generation (DETALLE DE COMBUSTIBLE)
   * Returns properly formatted DTO with fuel consumption details
   *
   * @param id - Valuation ID
   * @returns ValuationPage3Dto with fuel consumption data for PDF generation
   */
  async getValuationPage3Data(id: number): Promise<ValuationPage3Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) throw new Error('Valuation not found');

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract || !contract.equipo) {
        throw new Error('Contract or equipment not found');
      }

      // Fetch fuel consumption records from equipo_combustible table
      const fuelRecords = await AppDataSource.query(
        `SELECT * FROM equipo.equipo_combustible WHERE valorizacion_id = $1 ORDER BY fecha ASC`,
        [id]
      );

      return transformToValuationPage3Dto(valuation, fuelRecords, contract.equipo);
    } catch (error) {
      console.error('Error fetching valuation Page 3 data:', error);
      throw error;
    }
  }

  /**
   * Get complete valuation data for Page 4 PDF generation (EXCESO DE COMBUSTIBLE)
   * Returns properly formatted DTO with excess fuel charges
   *
   * @param id - Valuation ID
   * @returns ValuationPage4Dto with excess fuel data for PDF generation
   */
  async getValuationPage4Data(id: number): Promise<ValuationPage4Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) throw new Error('Valuation not found');

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract || !contract.equipo) {
        throw new Error('Contract or equipment not found');
      }

      // Fetch excess fuel record (should be 0 or 1)
      const excessFuelRepo = AppDataSource.getRepository(ExcessFuel);
      const excessFuel = await excessFuelRepo.findOne({ where: { valorizacionId: id } });

      return transformToValuationPage4Dto(valuation, excessFuel, contract.equipo);
    } catch (error) {
      console.error('Error fetching valuation Page 4 data:', error);
      throw error;
    }
  }

  /**
   * Get complete valuation data for Page 5 PDF generation (GASTOS DE OBRA)
   * Returns properly formatted DTO with work expenses
   *
   * @param id - Valuation ID
   * @returns ValuationPage5Dto with work expenses data for PDF generation
   */
  async getValuationPage5Data(id: number): Promise<ValuationPage5Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) throw new Error('Valuation not found');

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract || !contract.equipo) {
        throw new Error('Contract or equipment not found');
      }

      // Fetch work expenses
      const workExpenseRepo = AppDataSource.getRepository(WorkExpense);
      const workExpenses = await workExpenseRepo.find({
        where: { valorizacionId: id },
        order: { fechaOperacion: 'ASC' },
      });

      return transformToValuationPage5Dto(valuation, workExpenses, contract.equipo);
    } catch (error) {
      console.error('Error fetching valuation Page 5 data:', error);
      throw error;
    }
  }

  /**
   * Get complete valuation data for Page 6 PDF generation (ADELANTOS/AMORTIZACIONES)
   * Returns properly formatted DTO with advances and amortizations
   *
   * @param id - Valuation ID
   * @returns ValuationPage6Dto with advances data for PDF generation
   */
  async getValuationPage6Data(id: number): Promise<ValuationPage6Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) throw new Error('Valuation not found');

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract || !contract.equipo) {
        throw new Error('Contract or equipment not found');
      }

      // Fetch advances/amortizations
      const advanceRepo = AppDataSource.getRepository(AdvanceAmortization);
      const advances = await advanceRepo.find({
        where: { valorizacionId: id },
        order: { fechaOperacion: 'ASC' },
      });

      return transformToValuationPage6Dto(valuation, advances, contract.equipo);
    } catch (error) {
      console.error('Error fetching valuation Page 6 data:', error);
      throw error;
    }
  }

  /**
   * Get complete valuation data for Page 7 PDF generation (RESUMEN Y FIRMAS)
   * Returns properly formatted DTO with financial summary and signatures
   *
   * @param id - Valuation ID
   * @returns ValuationPage7Dto with summary and signature data for PDF generation
   */
  async getValuationPage7Data(id: number): Promise<ValuationPage7Dto> {
    try {
      // Fetch valuation with creator and approver
      const valuation = await this.repository
        .createQueryBuilder('v')
        .leftJoinAndSelect('v.creator', 'creator')
        .leftJoinAndSelect('v.approver', 'approver')
        .where('v.id = :id', { id })
        .getOne();

      if (!valuation) throw new Error('Valuation not found');

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contractId })
        .getOne();

      if (!contract || !contract.equipo) {
        throw new Error('Contract or equipment not found');
      }

      return transformToValuationPage7Dto(valuation, contract, contract.equipo);
    } catch (error) {
      console.error('Error fetching valuation Page 7 data:', error);
      throw error;
    }
  }
}

export default new ValuationService();
