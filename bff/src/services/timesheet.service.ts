import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Timesheet, EstadoTareo } from '../models/timesheet.model';
import { TimesheetDetail } from '../models/timesheet-detail.model';
import { DailyReport } from '../models/daily-report-typeorm.model';
import { Trabajador } from '../models/trabajador.model';
import {
  TimesheetListDto,
  TimesheetDetailDto,
  TimesheetWithDetailsDto,
  toTimesheetListDtoArray,
  toTimesheetDetailDto,
  toTimesheetWithDetailsDto,
} from '../types/dto/timesheet.dto';
import {
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  DatabaseError,
  DatabaseErrorType,
} from '../errors';
import { Logger } from '../utils/logger';

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
 * Manages employee time tracking (tareo system) with monthly timesheets and daily entries.
 * Implements a state machine workflow for timesheet approval.
 *
 * **State Machine**:
 * - BORRADOR (Draft) -> ENVIADO (Submitted) -> APROBADO (Approved) | RECHAZADO (Rejected)
 * - Only BORRADOR can be updated/deleted
 * - Only ENVIADO can be approved/rejected
 * - APROBADO is final state (immutable)
 * - RECHAZADO can be edited (back to BORRADOR)
 *
 * **Business Rules**:
 * - Periodo format: YYYY-MM (e.g., "2026-01")
 * - Trabajador must exist in database
 * - Cannot create duplicate timesheet for same periodo
 * - Timesheet tracks total days worked and total hours
 * - Soft delete preferred (estado='ELIMINADO') over hard delete
 *
 * **Relationships**:
 * - Timesheet belongs to Trabajador (employee)
 * - Timesheet created by Usuario (creadoPor)
 * - Timesheet approved by Usuario (aprobadoPor)
 * - Timesheet has many TimesheetDetail (daily entries)
 * - TimesheetDetail belongs to Proyecto (optional)
 *
 * **Standards Compliance**:
 * - Custom error classes (NotFoundError, ConflictError, BusinessRuleError, DatabaseError)
 * - Return DTOs (snake_case) via imported transformers
 * - Comprehensive logging (info + error)
 * - Business rule documentation
 * - Multi-tenant isolation via tenantId
 *
 * FULLY MIGRATED TO TYPEORM (Phase 3.7)
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
   * Creates a new timesheet for a trabajador in BORRADOR state.
   * Validates trabajador exists and checks for duplicate periodo.
   *
   * **Business Rules**:
   * - Trabajador must exist in database
   * - Cannot create duplicate timesheet for same trabajador + periodo
   * - Initial estado: BORRADOR (draft)
   * - Periodo format: YYYY-MM (e.g., "2026-01")
   *
   * **State Machine**: Creates timesheet in BORRADOR state
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param dto - Timesheet generation data (trabajadorId, periodo, optional fields)
   * @returns TimesheetDetailDto with trabajador and creador relations
   * @throws NotFoundError if trabajador not found
   * @throws ConflictError if timesheet already exists for periodo
   * @throws DatabaseError if database operation fails
   */
  async generateTimesheet(
    tenantId: number,
    dto: TimesheetGenerationDto
  ): Promise<TimesheetDetailDto> {
    try {
      // Verify trabajador exists within tenant
      const trabajador = await this.trabajadorRepository.findOne({
        where: { id: dto.trabajadorId, tenantId },
      });

      if (!trabajador) {
        throw new NotFoundError('Trabajador', dto.trabajadorId);
      }

      // Check if timesheet already exists for this period within tenant
      const existing = await this.timesheetRepository.findOne({
        where: {
          trabajadorId: dto.trabajadorId,
          periodo: dto.periodo,
          tenantId,
        },
      });

      if (existing) {
        throw new ConflictError(`Ya existe un tareo para el periodo ${dto.periodo}`, {
          trabajadorId: dto.trabajadorId,
          periodo: dto.periodo,
          existingTimesheetId: existing.id,
        });
      }

      // Calculate start and end dates for the period
      const [year, month] = dto.periodo.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month

      // Fetch daily reports for the worker in the period
      const dailyReportRepo = AppDataSource.getRepository(DailyReport);
      const dailyReports = await dailyReportRepo.find({
        where: {
          trabajadorId: dto.trabajadorId,
          fecha: Between(startDate, endDate),
        },
        order: { fecha: 'ASC' },
      });

      // Calculate totals
      let totalHours = 0;
      const uniqueDays = new Set<string>();

      dailyReports.forEach((report) => {
        if (report.horasTrabajadas) {
          totalHours += Number(report.horasTrabajadas);
        }
        if (report.fecha) {
          const dateStr =
            report.fecha instanceof Date
              ? report.fecha.toISOString().split('T')[0]
              : String(report.fecha).split('T')[0];
          uniqueDays.add(dateStr);
        }
      });

      // Create new timesheet header with tenant isolation
      const timesheet = this.timesheetRepository.create({
        trabajadorId: dto.trabajadorId,
        periodo: dto.periodo,
        totalDiasTrabajados: dto.totalDiasTrabajados || uniqueDays.size,
        totalHoras: dto.totalHoras || totalHours,
        estado: 'BORRADOR',
        observaciones: dto.observaciones,
        creadoPor: dto.creadoPor,
        tenantId,
      });

      const saved = await this.timesheetRepository.save(timesheet);

      // Create timesheet details from reports
      if (dailyReports.length > 0) {
        const details = dailyReports.map((report) => {
          return this.timesheetDetailRepository.create({
            tareoId: saved.id,
            proyectoId: report.proyectoId,
            fecha: report.fecha,
            horasTrabajadas: report.horasTrabajadas || 0,
            observaciones: report.observaciones,
            tenantId,
          });
        });

        await this.timesheetDetailRepository.save(details);
      }

      // Load relations for DTO
      const timesheetWithRelations = await this.timesheetRepository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['trabajador', 'creador'],
      });

      Logger.info('Timesheet generated successfully', {
        id: saved.id,
        trabajadorId: dto.trabajadorId,
        periodo: dto.periodo,
        estado: saved.estado,
        totalDiasTrabajados: saved.totalDiasTrabajados,
        totalHoras: saved.totalHoras,
        creadoPor: dto.creadoPor,
        tenantId,
        context: 'TimesheetService.generateTimesheet',
      });

      return toTimesheetDetailDto(timesheetWithRelations!);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }

      Logger.error('Failed to generate timesheet', {
        error: error instanceof Error ? error.message : String(error),
        trabajadorId: dto.trabajadorId,
        periodo: dto.periodo,
        tenantId,
        context: 'TimesheetService.generateTimesheet',
      });

      throw new DatabaseError(
        'Failed to generate timesheet',
        DatabaseErrorType.UNKNOWN,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get timesheet by ID with trabajador details and daily entries
   *
   * Retrieves complete timesheet information including all related entities
   * and daily timesheet entries (detalles).
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param id - Timesheet ID
   * @returns TimesheetWithDetailsDto with all relations and daily entries
   * @throws NotFoundError if timesheet not found
   * @throws DatabaseError if database operation fails
   */
  async getTimesheetWithDetails(tenantId: number, id: number): Promise<TimesheetWithDetailsDto> {
    try {
      const timesheet = await this.timesheetRepository.findOne({
        where: { id, tenantId },
        relations: ['trabajador', 'creador', 'aprobador'],
      });

      if (!timesheet) {
        throw new NotFoundError('Timesheet', id);
      }

      // Get timesheet details within tenant
      const detalles = await this.timesheetDetailRepository.find({
        where: { tareoId: id, tenantId },
        relations: ['proyecto'],
        order: { fecha: 'ASC' },
      });

      // Build response with detalles
      const timesheetWithDetalles = {
        ...timesheet,
        detalles,
      };

      Logger.info('Retrieved timesheet with details', {
        id,
        trabajadorId: timesheet.trabajadorId,
        periodo: timesheet.periodo,
        estado: timesheet.estado,
        detallesCount: detalles.length,
        tenantId,
        context: 'TimesheetService.getTimesheetWithDetails',
      });

      return toTimesheetWithDetailsDto(timesheetWithDetalles);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Failed to retrieve timesheet with details', {
        error: error instanceof Error ? error.message : String(error),
        id,
        tenantId,
        context: 'TimesheetService.getTimesheetWithDetails',
      });

      throw new DatabaseError(
        'Failed to retrieve timesheet with details',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Submit timesheet for approval
   *
   * Changes timesheet state from BORRADOR to ENVIADO.
   * Only timesheets in BORRADOR state can be submitted.
   *
   * **State Machine**: BORRADOR -> ENVIADO
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param id - Timesheet ID
   * @param submittedBy - Usuario ID who submitted
   * @returns TimesheetDetailDto with updated estado
   * @throws BusinessRuleError if timesheet not in BORRADOR state
   * @throws DatabaseError if database operation fails
   */
  async submitTimesheet(
    tenantId: number,
    id: number,
    submittedBy: number
  ): Promise<TimesheetDetailDto> {
    try {
      const timesheet = await this.timesheetRepository.findOne({
        where: { id, estado: 'BORRADOR', tenantId },
      });

      if (!timesheet) {
        throw new BusinessRuleError(
          'Tareo no encontrado o no puede ser enviado',
          'INVALID_STATE_TRANSITION',
          {
            id,
            requiredState: 'BORRADOR',
            operation: 'submit',
          }
        );
      }

      // Update to submitted state
      timesheet.estado = 'ENVIADO';
      timesheet.creadoPor = submittedBy; // Track who submitted

      const saved = await this.timesheetRepository.save(timesheet);

      // Load relations for DTO
      const timesheetWithRelations = await this.timesheetRepository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['trabajador', 'creador'],
      });

      Logger.info('Timesheet submitted for approval', {
        id: saved.id,
        trabajadorId: saved.trabajadorId,
        periodo: saved.periodo,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'ENVIADO',
        submittedBy,
        tenantId,
        context: 'TimesheetService.submitTimesheet',
      });

      return toTimesheetDetailDto(timesheetWithRelations!);
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        throw error;
      }

      Logger.error('Failed to submit timesheet', {
        error: error instanceof Error ? error.message : String(error),
        id,
        submittedBy,
        tenantId,
        context: 'TimesheetService.submitTimesheet',
      });

      throw new DatabaseError(
        'Failed to submit timesheet',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Approve timesheet
   *
   * Changes timesheet state from ENVIADO to APROBADO.
   * Only timesheets in ENVIADO state can be approved.
   * APROBADO is a final state (cannot be modified after).
   *
   * **State Machine**: ENVIADO -> APROBADO (final state)
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param id - Timesheet ID
   * @param approvedBy - Usuario ID who approved
   * @returns TimesheetDetailDto with updated estado
   * @throws BusinessRuleError if timesheet not in ENVIADO state
   * @throws DatabaseError if database operation fails
   */
  async approveTimesheet(
    tenantId: number,
    id: number,
    approvedBy: number
  ): Promise<TimesheetDetailDto> {
    try {
      const timesheet = await this.timesheetRepository.findOne({
        where: { id, estado: 'ENVIADO', tenantId },
      });

      if (!timesheet) {
        throw new BusinessRuleError(
          'Tareo no encontrado o no puede ser aprobado',
          'INVALID_STATE_TRANSITION',
          {
            id,
            requiredState: 'ENVIADO',
            operation: 'approve',
          }
        );
      }

      // Update to approved state
      timesheet.estado = 'APROBADO';
      timesheet.aprobadoPor = approvedBy;
      timesheet.aprobadoEn = new Date();

      const saved = await this.timesheetRepository.save(timesheet);

      // Load relations for DTO
      const timesheetWithRelations = await this.timesheetRepository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['trabajador', 'creador', 'aprobador'],
      });

      Logger.info('Timesheet approved', {
        id: saved.id,
        trabajadorId: saved.trabajadorId,
        periodo: saved.periodo,
        estadoAnterior: 'ENVIADO',
        estadoNuevo: 'APROBADO',
        aprobadoPor: approvedBy,
        aprobadoEn: saved.aprobadoEn?.toISOString(),
        tenantId,
        context: 'TimesheetService.approveTimesheet',
      });

      return toTimesheetDetailDto(timesheetWithRelations!);
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        throw error;
      }

      Logger.error('Failed to approve timesheet', {
        error: error instanceof Error ? error.message : String(error),
        id,
        approvedBy,
        tenantId,
        context: 'TimesheetService.approveTimesheet',
      });

      throw new DatabaseError(
        'Failed to approve timesheet',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Reject timesheet
   *
   * Changes timesheet state from ENVIADO to RECHAZADO.
   * Only timesheets in ENVIADO state can be rejected.
   * RECHAZADO timesheets can be edited and resubmitted (back to BORRADOR).
   *
   * **State Machine**: ENVIADO -> RECHAZADO
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param id - Timesheet ID
   * @param rejectedBy - Usuario ID who rejected
   * @param reason - Rejection reason (stored in observaciones)
   * @returns TimesheetDetailDto with updated estado and reason
   * @throws BusinessRuleError if timesheet not in ENVIADO state
   * @throws DatabaseError if database operation fails
   */
  async rejectTimesheet(
    tenantId: number,
    id: number,
    rejectedBy: number,
    reason: string
  ): Promise<TimesheetDetailDto> {
    try {
      const timesheet = await this.timesheetRepository.findOne({
        where: { id, estado: 'ENVIADO', tenantId },
      });

      if (!timesheet) {
        throw new BusinessRuleError(
          'Tareo no encontrado o no puede ser rechazado',
          'INVALID_STATE_TRANSITION',
          {
            id,
            requiredState: 'ENVIADO',
            operation: 'reject',
          }
        );
      }

      // Update to rejected state (back to BORRADOR with observation)
      timesheet.estado = 'RECHAZADO';
      timesheet.observaciones = reason;
      timesheet.aprobadoPor = rejectedBy; // Track who rejected

      const saved = await this.timesheetRepository.save(timesheet);

      // Load relations for DTO
      const timesheetWithRelations = await this.timesheetRepository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['trabajador', 'creador', 'aprobador'],
      });

      Logger.info('Timesheet rejected', {
        id: saved.id,
        trabajadorId: saved.trabajadorId,
        periodo: saved.periodo,
        estadoAnterior: 'ENVIADO',
        estadoNuevo: 'RECHAZADO',
        rechazadoPor: rejectedBy,
        razon: reason,
        tenantId,
        context: 'TimesheetService.rejectTimesheet',
      });

      return toTimesheetDetailDto(timesheetWithRelations!);
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        throw error;
      }

      Logger.error('Failed to reject timesheet', {
        error: error instanceof Error ? error.message : String(error),
        id,
        rejectedBy,
        reason,
        tenantId,
        context: 'TimesheetService.rejectTimesheet',
      });

      throw new DatabaseError(
        'Failed to reject timesheet',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * List timesheets with filters
   *
   * Returns list of timesheets with optional filtering.
   * Results include trabajador, creador, and aprobador relations.
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param filters - Optional filters (trabajadorId, periodo, estado, creadoPor)
   * @returns TimesheetListDto[] array with trabajador relation
   * @throws DatabaseError if database operation fails
   */
  async listTimesheets(tenantId: number, filters: TimesheetFilters): Promise<TimesheetListDto[]> {
    try {
      const queryBuilder = this.timesheetRepository
        .createQueryBuilder('ts')
        .leftJoinAndSelect('ts.trabajador', 't')
        .leftJoinAndSelect('ts.creador', 'c')
        .leftJoinAndSelect('ts.aprobador', 'a')
        .where('ts.tenantId = :tenantId', { tenantId });

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

      Logger.info('Retrieved timesheets list', {
        count: timesheets.length,
        tenantId,
        filters: {
          trabajadorId: filters.trabajadorId || null,
          periodo: filters.periodo || null,
          estado: filters.estado || null,
          creadoPor: filters.creadoPor || null,
        },
        context: 'TimesheetService.listTimesheets',
      });

      // Map to DTOs
      return toTimesheetListDtoArray(timesheets);
    } catch (error) {
      Logger.error('Failed to retrieve timesheets list', {
        error: error instanceof Error ? error.message : String(error),
        filters,
        tenantId,
        context: 'TimesheetService.listTimesheets',
      });

      throw new DatabaseError(
        'Failed to retrieve timesheets list',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get timesheet by trabajador and periodo
   *
   * Retrieves a specific timesheet for an employee in a given month.
   * Returns null if timesheet doesn't exist (no error thrown).
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param trabajadorId - Trabajador ID
   * @param periodo - Period in YYYY-MM format (e.g., "2026-01")
   * @returns TimesheetDetailDto if found, null if not found
   * @throws DatabaseError if database operation fails
   */
  async getByTrabajadorAndPeriodo(
    tenantId: number,
    trabajadorId: number,
    periodo: string
  ): Promise<TimesheetDetailDto | null> {
    try {
      const timesheet = await this.timesheetRepository.findOne({
        where: { trabajadorId, periodo, tenantId },
        relations: ['trabajador', 'creador'],
      });

      if (timesheet) {
        Logger.info('Retrieved timesheet by trabajador and periodo', {
          id: timesheet.id,
          trabajadorId,
          periodo,
          estado: timesheet.estado,
          tenantId,
          context: 'TimesheetService.getByTrabajadorAndPeriodo',
        });
      }

      return timesheet ? toTimesheetDetailDto(timesheet) : null;
    } catch (error) {
      Logger.error('Failed to retrieve timesheet by trabajador and periodo', {
        error: error instanceof Error ? error.message : String(error),
        trabajadorId,
        periodo,
        tenantId,
        context: 'TimesheetService.getByTrabajadorAndPeriodo',
      });

      throw new DatabaseError(
        'Failed to retrieve timesheet by trabajador and periodo',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete timesheet (soft delete - changes estado to ELIMINADO)
   *
   * Soft deletes a timesheet by changing estado to ELIMINADO.
   * Only timesheets in BORRADOR state can be deleted.
   * Preserves data for audit trail.
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param id - Timesheet ID
   * @returns true if deleted successfully
   * @throws BusinessRuleError if timesheet not in BORRADOR state
   * @throws DatabaseError if database operation fails
   */
  async deleteTimesheet(tenantId: number, id: number): Promise<boolean> {
    try {
      const timesheet = await this.timesheetRepository.findOne({
        where: { id, estado: 'BORRADOR', tenantId },
      });

      if (!timesheet) {
        throw new BusinessRuleError(
          'Tareo no encontrado o no puede ser eliminado',
          'INVALID_STATE_TRANSITION',
          {
            id,
            requiredState: 'BORRADOR',
            operation: 'delete',
            note: 'Solo se pueden eliminar borradores',
          }
        );
      }

      // Soft delete: Change estado to ELIMINADO instead of removing from database
      timesheet.estado = 'ELIMINADO' as EstadoTareo;
      await this.timesheetRepository.save(timesheet);

      Logger.info('Timesheet deleted (soft delete)', {
        id,
        trabajadorId: timesheet.trabajadorId,
        periodo: timesheet.periodo,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'ELIMINADO',
        tenantId,
        context: 'TimesheetService.deleteTimesheet',
      });

      return true;
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        throw error;
      }

      Logger.error('Failed to delete timesheet', {
        error: error instanceof Error ? error.message : String(error),
        id,
        tenantId,
        context: 'TimesheetService.deleteTimesheet',
      });

      throw new DatabaseError(
        'Failed to delete timesheet',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update timesheet details
   *
   * Updates timesheet fields. Only timesheets in BORRADOR state can be updated.
   * Applies partial updates (only provided fields are changed).
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param id - Timesheet ID
   * @param updates - Partial timesheet data to update
   * @returns TimesheetDetailDto with updated data
   * @throws BusinessRuleError if timesheet not in BORRADOR state
   * @throws DatabaseError if database operation fails
   */
  async updateTimesheet(
    tenantId: number,
    id: number,
    updates: Partial<Timesheet>
  ): Promise<TimesheetDetailDto> {
    try {
      const timesheet = await this.timesheetRepository.findOne({
        where: { id, estado: 'BORRADOR', tenantId },
      });

      if (!timesheet) {
        throw new BusinessRuleError(
          'Tareo no encontrado o no puede ser actualizado',
          'INVALID_STATE_TRANSITION',
          {
            id,
            requiredState: 'BORRADOR',
            operation: 'update',
            note: 'Solo se pueden actualizar borradores',
          }
        );
      }

      // Apply updates
      Object.assign(timesheet, updates);

      const saved = await this.timesheetRepository.save(timesheet);

      // Load relations for DTO
      const timesheetWithRelations = await this.timesheetRepository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['trabajador', 'creador'],
      });

      const updatedFields = Object.keys(updates);

      Logger.info('Timesheet updated', {
        id: saved.id,
        trabajadorId: saved.trabajadorId,
        periodo: saved.periodo,
        updatedFields,
        tenantId,
        context: 'TimesheetService.updateTimesheet',
      });

      return toTimesheetDetailDto(timesheetWithRelations!);
    } catch (error) {
      if (error instanceof BusinessRuleError) {
        throw error;
      }

      Logger.error('Failed to update timesheet', {
        error: error instanceof Error ? error.message : String(error),
        id,
        updates,
        tenantId,
        context: 'TimesheetService.updateTimesheet',
      });

      throw new DatabaseError(
        'Failed to update timesheet',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }
}
