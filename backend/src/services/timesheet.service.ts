import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Timesheet, EstadoTareo } from '../models/timesheet.model';
import { TimesheetDetail } from '../models/timesheet-detail.model';
import { Trabajador } from '../models/trabajador.model';
import {
  TimesheetListDto,
  TimesheetDetailDto,
  TimesheetWithDetailsDto,
  toTimesheetListDtoArray,
  toTimesheetDetailDto,
  toTimesheetWithDetailsDto,
} from '../types/dto/timesheet.dto';

export interface TimesheetGenerationDto {
  trabajadorId: number;
  periodo: string; // Format: YYYY-MM
  totalDiasTrabajados?: number;
  totalHoras?: number;
  observaciones?: string;
  creadoPor?: number;
}

export interface TimesheetFilters {
  trabajadorId?: number;
  periodo?: string;
  estado?: EstadoTareo;
  creadoPor?: number;
}

/**
 * TimesheetService - Employee Timesheet Management
 *
 * ✅ FULLY MIGRATED TO TYPEORM
 * - All 6 raw SQL queries replaced with TypeORM
 * - Uses existing rrhh.tareo and rrhh.detalle_tareo tables
 * - Full type safety with Timesheet and TimesheetDetail entities
 *
 * Migration completed: Phase 3.7
 */
export class TimesheetService {
  private get timesheetRepository(): Repository<Timesheet> {
    return AppDataSource.getRepository(Timesheet);
  }

  private get timesheetDetailRepository(): Repository<TimesheetDetail> {
    return AppDataSource.getRepository(TimesheetDetail);
  }

  private get trabajadorRepository(): Repository<Trabajador> {
    return AppDataSource.getRepository(Trabajador);
  }

  /**
   * Generate/Create a new timesheet
   *
   * ✅ MIGRATED: Changed from checking table existence to actual creation
   */
  async generateTimesheet(dto: TimesheetGenerationDto): Promise<TimesheetDetailDto> {
    // Verify trabajador exists
    const trabajador = await this.trabajadorRepository.findOne({
      where: { id: dto.trabajadorId },
    });

    if (!trabajador) {
      throw new Error('Trabajador no encontrado');
    }

    // Check if timesheet already exists for this period
    const existing = await this.timesheetRepository.findOne({
      where: {
        trabajadorId: dto.trabajadorId,
        periodo: dto.periodo,
      },
    });

    if (existing) {
      throw new Error(`Ya existe un tareo para el periodo ${dto.periodo}`);
    }

    // Create new timesheet
    const timesheet = this.timesheetRepository.create({
      trabajadorId: dto.trabajadorId,
      periodo: dto.periodo,
      totalDiasTrabajados: dto.totalDiasTrabajados || 0,
      totalHoras: dto.totalHoras || 0,
      estado: 'BORRADOR',
      observaciones: dto.observaciones,
      creadoPor: dto.creadoPor,
    });

    const saved = await this.timesheetRepository.save(timesheet);

    // Load relations for DTO
    const timesheetWithRelations = await this.timesheetRepository.findOne({
      where: { id: saved.id },
      relations: ['trabajador', 'creador'],
    });

    return toTimesheetDetailDto(timesheetWithRelations!);
  }

  /**
   * Get timesheet by ID with trabajador details
   *
   * ✅ MIGRATED: SELECT with JOIN → TypeORM relations
   */
  async getTimesheetWithDetails(id: number): Promise<TimesheetWithDetailsDto> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { id },
      relations: ['trabajador', 'creador', 'aprobador'],
    });

    if (!timesheet) {
      throw new Error('Tareo no encontrado');
    }

    // Get timesheet details
    const detalles = await this.timesheetDetailRepository.find({
      where: { tareoId: id },
      relations: ['proyecto'],
      order: { fecha: 'ASC' },
    });

    // Build response with detalles
    const timesheetWithDetalles = {
      ...timesheet,
      detalles,
    };

    return toTimesheetWithDetailsDto(timesheetWithDetalles);
  }

  /**
   * Submit timesheet for approval
   *
   * ✅ MIGRATED: UPDATE with RETURNING → TypeORM update + findOne
   */
  async submitTimesheet(id: number, submittedBy: number): Promise<TimesheetDetailDto> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { id, estado: 'BORRADOR' },
    });

    if (!timesheet) {
      throw new Error('Tareo no encontrado o no puede ser enviado (debe estar en estado BORRADOR)');
    }

    // Update to submitted state
    timesheet.estado = 'ENVIADO';
    timesheet.creadoPor = submittedBy; // Track who submitted

    const saved = await this.timesheetRepository.save(timesheet);

    // Load relations for DTO
    const timesheetWithRelations = await this.timesheetRepository.findOne({
      where: { id: saved.id },
      relations: ['trabajador', 'creador'],
    });

    return toTimesheetDetailDto(timesheetWithRelations!);
  }

  /**
   * Approve timesheet
   *
   * ✅ MIGRATED: UPDATE with RETURNING → TypeORM update + findOne
   */
  async approveTimesheet(id: number, approvedBy: number): Promise<TimesheetDetailDto> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { id, estado: 'ENVIADO' },
    });

    if (!timesheet) {
      throw new Error('Tareo no encontrado o no puede ser aprobado (debe estar en estado ENVIADO)');
    }

    // Update to approved state
    timesheet.estado = 'APROBADO';
    timesheet.aprobadoPor = approvedBy;
    timesheet.aprobadoEn = new Date();

    const saved = await this.timesheetRepository.save(timesheet);

    // Load relations for DTO
    const timesheetWithRelations = await this.timesheetRepository.findOne({
      where: { id: saved.id },
      relations: ['trabajador', 'creador', 'aprobador'],
    });

    return toTimesheetDetailDto(timesheetWithRelations!);
  }

  /**
   * Reject timesheet
   *
   * ✅ MIGRATED: UPDATE with RETURNING → TypeORM update + findOne
   */
  async rejectTimesheet(
    id: number,
    rejectedBy: number,
    reason: string
  ): Promise<TimesheetDetailDto> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { id, estado: 'ENVIADO' },
    });

    if (!timesheet) {
      throw new Error(
        'Tareo no encontrado o no puede ser rechazado (debe estar en estado ENVIADO)'
      );
    }

    // Update to rejected state (back to BORRADOR with observation)
    timesheet.estado = 'RECHAZADO';
    timesheet.observaciones = reason;
    timesheet.aprobadoPor = rejectedBy; // Track who rejected

    const saved = await this.timesheetRepository.save(timesheet);

    // Load relations for DTO
    const timesheetWithRelations = await this.timesheetRepository.findOne({
      where: { id: saved.id },
      relations: ['trabajador', 'creador', 'aprobador'],
    });

    return toTimesheetDetailDto(timesheetWithRelations!);
  }

  /**
   * List timesheets with filters
   *
   * ✅ MIGRATED: Dynamic SELECT with JOINs → TypeORM QueryBuilder
   */
  async listTimesheets(filters: TimesheetFilters): Promise<TimesheetListDto[]> {
    const queryBuilder = this.timesheetRepository
      .createQueryBuilder('ts')
      .leftJoinAndSelect('ts.trabajador', 't')
      .leftJoinAndSelect('ts.creador', 'c')
      .leftJoinAndSelect('ts.aprobador', 'a');

    // Apply filters
    if (filters.trabajadorId) {
      queryBuilder.andWhere('ts.trabajador_id = :trabajadorId', {
        trabajadorId: filters.trabajadorId,
      });
    }

    if (filters.periodo) {
      queryBuilder.andWhere('ts.periodo = :periodo', {
        periodo: filters.periodo,
      });
    }

    if (filters.estado) {
      queryBuilder.andWhere('ts.estado = :estado', {
        estado: filters.estado,
      });
    }

    if (filters.creadoPor) {
      queryBuilder.andWhere('ts.creado_por = :creadoPor', {
        creadoPor: filters.creadoPor,
      });
    }

    queryBuilder.orderBy('ts.created_at', 'DESC');

    const timesheets = await queryBuilder.getMany();

    // Map to DTOs
    return toTimesheetListDtoArray(timesheets);
  }

  /**
   * Get timesheet by trabajador and periodo
   */
  async getByTrabajadorAndPeriodo(
    trabajadorId: number,
    periodo: string
  ): Promise<TimesheetDetailDto | null> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { trabajadorId, periodo },
      relations: ['trabajador', 'creador'],
    });

    return timesheet ? toTimesheetDetailDto(timesheet) : null;
  }

  /**
   * Delete timesheet (only if in BORRADOR state)
   */
  async deleteTimesheet(id: number): Promise<boolean> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { id, estado: 'BORRADOR' },
    });

    if (!timesheet) {
      throw new Error(
        'Tareo no encontrado o no puede ser eliminado (solo se pueden eliminar borradores)'
      );
    }

    await this.timesheetRepository.remove(timesheet);
    return true;
  }

  /**
   * Update timesheet details
   */
  async updateTimesheet(id: number, updates: Partial<Timesheet>): Promise<TimesheetDetailDto> {
    const timesheet = await this.timesheetRepository.findOne({
      where: { id, estado: 'BORRADOR' },
    });

    if (!timesheet) {
      throw new Error(
        'Tareo no encontrado o no puede ser actualizado (solo se pueden actualizar borradores)'
      );
    }

    // Apply updates
    Object.assign(timesheet, updates);

    const saved = await this.timesheetRepository.save(timesheet);

    // Load relations for DTO
    const timesheetWithRelations = await this.timesheetRepository.findOne({
      where: { id: saved.id },
      relations: ['trabajador', 'creador'],
    });

    return toTimesheetDetailDto(timesheetWithRelations!);
  }
}

export default new TimesheetService();
