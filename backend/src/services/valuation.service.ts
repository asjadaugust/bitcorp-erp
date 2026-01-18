/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Valorizacion } from '../models/valuation.model';
import { Contract } from '../models/contract.model';
import { ExcessFuel } from '../models/excess-fuel.model';
import { WorkExpense } from '../models/work-expense.model';
import { AdvanceAmortization } from '../models/advance-amortization.model';
import { Repository } from 'typeorm';
import { valuationEmailNotifier } from './valuation-email-notifier';
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
import { toValuationDto, fromValuationDto, ValuationDto } from '../types/dto/valuation.dto';
import Logger from '../utils/logger';

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
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Define sortable fields (snake_case API → camelCase DB mapping)
      const sortableFields: Record<string, string> = {
        numero_valorizacion: 'v.numeroValorizacion',
        periodo: 'v.periodo',
        fecha_inicio: 'v.fechaInicio',
        fecha_fin: 'v.fechaFin',
        total_valorizado: 'v.totalValorizado',
        total_con_igv: 'v.totalConIgv',
        estado: 'v.estado',
        created_at: 'v.createdAt',
        equipo_id: 'v.equipmentId',
        contrato_id: 'v.contractId',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'v.createdAt';
      const sortOrder = filters?.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

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

      queryBuilder.orderBy(sortBy, sortOrder);

      const total = await queryBuilder.getCount();
      queryBuilder.skip(skip).take(limit);

      const records = await queryBuilder.getMany();

      // Transform to DTO (Spanish snake_case)
      const data = records.map((v) => toValuationDto(v));

      return { data, total };
    } catch (error) {
      Logger.error('Error fetching valuations', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'ValuationService.findAll',
      });
      throw new Error('Failed to fetch valuations');
    }
  }

  async findById(id: number): Promise<ValuationDto | null> {
    try {
      const v = await this.repository.findOne({
        where: { id },
        relations: ['creator', 'approver'],
      });

      if (!v) return null;

      // Transform to DTO (Spanish snake_case)
      return toValuationDto(v);
    } catch (error) {
      Logger.error('Error fetching valuation by id', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.findById',
      });
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
      Logger.error('Error creating valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'ValuationService.create',
      });
      throw error;
    }
  }

  async update(id: number, data: Partial<Valorizacion>): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new Error('Valuation not found');
      }

      Object.assign(valorizacion, data);
      const updated = await this.repository.save(valorizacion);
      return toValuationDto(updated);
    } catch (error) {
      Logger.error('Error updating valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.update',
      });
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      return (result.affected || 0) > 0;
    } catch (error) {
      Logger.error('Error deleting valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.delete',
      });
      throw new Error('Failed to delete valuation');
    }
  }

  async approve(id: number, userId: number): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new Error('Valuation not found');
      }

      // Validate state transition: Only EN_REVISION can be approved
      if (valorizacion.estado !== 'EN_REVISION') {
        throw new Error(
          `Cannot approve valuation in state ${valorizacion.estado}. Must be EN_REVISION.`
        );
      }

      valorizacion.estado = 'APROBADO';
      valorizacion.approvedBy = userId;
      valorizacion.approvedAt = new Date();

      const approved = await this.repository.save(valorizacion);

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifyApproved(approved, userId).catch((err) => {
        Logger.error('Failed to send approved email', { error: err, valuationId: id });
      });

      return toValuationDto(approved);
    } catch (error) {
      Logger.error('Error approving valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        context: 'ValuationService.approve',
      });
      throw error;
    }
  }

  async submitForReview(id: number, userId: number): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new Error('Valuation not found');
      }

      if (valorizacion.estado !== 'PENDIENTE') {
        throw new Error(
          `Cannot submit valuation in state ${valorizacion.estado}. Must be PENDIENTE.`
        );
      }

      valorizacion.estado = 'EN_REVISION';
      valorizacion.updatedAt = new Date();

      const updated = await this.repository.save(valorizacion);

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifySubmitted(updated).catch((err) => {
        Logger.error('Failed to send submitted email', { error: err, valuationId: id });
      });

      return toValuationDto(updated);
    } catch (error) {
      Logger.error('Error submitting valuation for review', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        context: 'ValuationService.submitForReview',
      });
      throw error;
    }
  }

  async reject(id: number, userId: number, reason: string): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new Error('Valuation not found');
      }

      if (valorizacion.estado === 'PAGADO') {
        throw new Error('Cannot reject valuation that has been paid');
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      valorizacion.estado = 'RECHAZADO';
      valorizacion.observaciones = valorizacion.observaciones
        ? `${valorizacion.observaciones}\n\nRECHAZADO: ${reason}`
        : `RECHAZADO: ${reason}`;
      valorizacion.updatedAt = new Date();

      const rejected = await this.repository.save(valorizacion);

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifyRejected(rejected, reason, userId).catch((err) => {
        Logger.error('Failed to send rejected email', { error: err, valuationId: id });
      });

      return toValuationDto(rejected);
    } catch (error) {
      Logger.error('Error rejecting valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        reason,
        context: 'ValuationService.reject',
      });
      throw error;
    }
  }

  async markAsPaid(
    id: number,
    userId: number,
    paymentData: { fechaPago?: Date; referenciaPago?: string; metodoPago?: string }
  ): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new Error('Valuation not found');
      }

      if (valorizacion.estado !== 'APROBADO') {
        throw new Error(
          `Cannot mark as paid valuation in state ${valorizacion.estado}. Must be APROBADO.`
        );
      }

      valorizacion.estado = 'PAGADO';
      valorizacion.fechaPago = paymentData.fechaPago || new Date();
      valorizacion.updatedAt = new Date();

      if (paymentData.referenciaPago || paymentData.metodoPago) {
        const paymentInfo = [
          paymentData.metodoPago && `Método: ${paymentData.metodoPago}`,
          paymentData.referenciaPago && `Referencia: ${paymentData.referenciaPago}`,
        ]
          .filter(Boolean)
          .join(' | ');

        valorizacion.observaciones = valorizacion.observaciones
          ? `${valorizacion.observaciones}\n\nPAGO: ${paymentInfo}`
          : `PAGO: ${paymentInfo}`;
      }

      const paid = await this.repository.save(valorizacion);

      // Send email notification (non-blocking)
      const emailPaymentData = {
        fecha_pago:
          paymentData.fechaPago?.toISOString().split('T')[0] ||
          new Date().toISOString().split('T')[0],
        metodo_pago: paymentData.metodoPago || 'No especificado',
        referencia_pago: paymentData.referenciaPago,
      };
      valuationEmailNotifier.notifyPaid(paid, emailPaymentData).catch((err) => {
        Logger.error('Failed to send paid email', { error: err, valuationId: id });
      });

      return toValuationDto(paid);
    } catch (error) {
      Logger.error('Error marking valuation as paid', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        paymentData,
        context: 'ValuationService.markAsPaid',
      });
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
      Logger.error('Error fetching analytics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ValuationService.getAnalytics',
      });
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
      Logger.error('Error fetching valuation Page 1 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage1Data',
      });
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
      Logger.error('Error fetching valuation Page 2 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage2Data',
      });
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
      Logger.error('Error fetching valuation Page 3 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage3Data',
      });
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
      Logger.error('Error fetching valuation Page 4 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage4Data',
      });
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
      Logger.error('Error fetching valuation Page 5 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage5Data',
      });
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
      Logger.error('Error fetching valuation Page 6 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage6Data',
      });
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
      Logger.error('Error fetching valuation Page 7 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage7Data',
      });
      throw error;
    }
  }
}

export default new ValuationService();
