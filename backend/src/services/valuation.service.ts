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
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  BusinessRuleError,
  DatabaseError,
  DatabaseErrorType,
} from '../errors';
import logger from '../config/logger.config';

/**
 *
 * @see backend/src/models/valuation.model.ts - Entity definition
 * @see backend/src/types/dto/valuation.dto.ts - Response DTOs
 * @see backend/src/types/dto/valuation-pdf.dto.ts - PDF page DTOs
 * @see backend/src/services/valuation-email-notifier.ts - Email notifications
 * @see backend/SERVICE_LAYER_STANDARDS.md - Service development standards
 *
 * @author BitCorp ERP Development Team
 * @version 2.0.0 (Phase 20 refactor)
 * @since 1.0.0
 */
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

  /**
   * Retrieves a paginated list of valuations with optional filtering and sorting.
   *
   * Supports filtering by estado, search text, project, equipment, and provides
   * pagination with configurable page size. Results include creator and approver
   * relations via LEFT JOIN.
   *
   * TODO: [Phase 21] Add tenant context - filter by req.tenantContext.tenantId
   *
   * @param filters - Optional query filters
   * @param filters.estado - Filter by estado (PENDIENTE, EN_REVISION, APROBADO, RECHAZADO, PAGADO)
   * @param filters.search - Search in periodo and observaciones (ILIKE)
   * @param filters.projectId - Filter by proyecto_id
   * @param filters.equipmentId - Filter by equipo_id
   * @param filters.page - Page number (default: 1)
   * @param filters.limit - Results per page (default: 20)
   * @param filters.sort_by - Field to sort by (snake_case, default: created_at)
   * @param filters.sort_order - Sort direction (ASC/DESC, default: DESC)
   *
   * @returns Object with { data: ValuationDto[], total: number }
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * // Get approved valuations for project 10, page 1, sorted by period
   * const result = await valuationService.findAll({
   *   estado: 'APROBADO',
   *   projectId: 10,
   *   page: 1,
   *   limit: 20,
   *   sort_by: 'periodo',
   *   sort_order: 'DESC'
   * });
   * console.log(`Found ${result.total} valuations, showing ${result.data.length}`);
   * ```
   */
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
        equipo_id: 'v.equipoId',
        contrato_id: 'v.contratoId',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'v.createdAt';
      const sortOrder = filters?.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const queryBuilder = this.repository
        .createQueryBuilder('v')
        .leftJoinAndSelect('v.creator', 'creator')
        .leftJoinAndSelect('v.approver', 'approver')
        .leftJoinAndSelect('v.contrato', 'contrato')
        .leftJoinAndSelect('v.equipo', 'equipo');

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

      logger.info('Valuations fetched successfully', {
        count: data.length,
        total,
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        filters: {
          estado: filters?.estado,
          project_id: filters?.projectId,
          equipment_id: filters?.equipmentId,
          search: filters?.search,
        },
      });

      return { data, total };
    } catch (error) {
      Logger.error('Error fetching valuations', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'ValuationService.findAll',
      });
      throw new DatabaseError(
        'Failed to fetch valuations',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { filters }
      );
    }
  }

  /**
   * Retrieves a single valuation by ID with creator and approver relations.
   *
   * Returns null if valuation not found (does not throw error).
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationDto if found, null otherwise
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const valuation = await valuationService.findById(123);
   * if (!valuation) {
   *   throw new NotFoundError('Valuation', 123);
   * }
   * console.log(`Valuation ${valuation.numero_valorizacion}, estado: ${valuation.estado}`);
   * ```
   */
  async findById(id: number): Promise<ValuationDto | null> {
    try {
      const v = await this.repository.findOne({
        where: { id },
        relations: ['creator', 'approver'],
      });

      if (!v) return null;

      // Transform to DTO (Spanish snake_case)
      const result = toValuationDto(v);

      logger.info('Valuation fetched by ID successfully', {
        valuation_id: id,
        numero_valorizacion: v.numeroValorizacion,
        estado: v.estado,
        has_creator: !!v.creator,
        has_approver: !!v.approver,
      });

      return result;
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

  /**
   * Creates a new valuation with estado = PENDIENTE.
   *
   * Validates business rules:
   * - numero_valorizacion uniqueness (should check, currently missing)
   * - fecha_fin >= fecha_inicio (should validate, currently missing)
   * - All required fields present (should validate, currently missing)
   *
   * TODO: [Phase 21] Add tenant context - set tenant_id on creation
   * TODO: Add numero_valorizacion uniqueness validation
   * TODO: Add date range validation
   *
   * @param data - Valuation data (Partial allows optional fields)
   * @param userId - ID of user creating the valuation (optional)
   *
   * @returns Created Valorizacion entity (raw, not DTO)
   *
   * @throws {ConflictError} If numero_valorizacion already exists (should throw, currently missing)
   * @throws {ValidationError} If date range invalid or required fields missing (should throw, currently missing)
   * @throws {DatabaseError} If database insert fails
   *
   * @example
   * ```typescript
   * const valuation = await valuationService.create({
   *   numero_valorizacion: 'VAL-2026-001',
   *   periodo: '2026-01',
   *   fecha_inicio: new Date('2026-01-01'),
   *   fecha_fin: new Date('2026-01-31'),
   *   contrato_id: 123,
   *   equipo_id: 45,
   *   proyecto_id: 10,
   *   total_valorizado: 8000.00,
   *   total_con_igv: 9440.00
   * }, userId);
   * // Estado automatically set to PENDIENTE
   * ```
   */
  async create(data: Partial<Valorizacion>, userId?: number): Promise<Valorizacion> {
    try {
      // Business rule 1: Check numero_valorizacion uniqueness
      if (data.numeroValorizacion) {
        const existing = await this.repository.findOne({
          where: { numeroValorizacion: data.numeroValorizacion },
        });
        if (existing) {
          throw new ConflictError(
            `Valuation with numero '${data.numeroValorizacion}' already exists`,
            {
              field: 'numero_valorizacion',
              value: data.numeroValorizacion,
              existing_id: existing.id,
            }
          );
        }
      }

      // Business rule 2: Validate date range
      if (data.fechaInicio && data.fechaFin) {
        if (data.fechaFin < data.fechaInicio) {
          throw new ValidationError('End date must be >= start date', [
            {
              field: 'fecha_fin',
              rule: 'dateRange',
              message: `End date (${data.fechaFin.toISOString().split('T')[0]}) must be on or after start date (${data.fechaInicio.toISOString().split('T')[0]})`,
              value: data.fechaFin,
            },
          ]);
        }
      }

      const valuationData = data as any;
      const valorizacion = this.repository.create({
        ...data,
        equipoId: valuationData.equipo_id || data.equipoId,
        contratoId: valuationData.contrato_id || data.contratoId,
        proyectoId: valuationData.proyecto_id || data.proyectoId,
        fechaInicio: valuationData.fecha_inicio || data.fechaInicio,
        fechaFin: valuationData.fecha_fin || data.fechaFin,
        diasTrabajados: valuationData.dias_trabajados || data.diasTrabajados,
        horasTrabajadas: valuationData.horas_trabajadas || data.horasTrabajadas,
        combustibleConsumido: valuationData.combustible_consumido || data.combustibleConsumido,
        costoBase: valuationData.costo_base || data.costoBase,
        costoCombustible: valuationData.costo_combustible || data.costoCombustible,
        cargosAdicionales: valuationData.cargos_adicionales || data.cargosAdicionales,
        totalValorizado: valuationData.total_valorizado || data.totalValorizado,
        numeroValorizacion: valuationData.numero_valorizacion || data.numeroValorizacion,
        estado: data.estado || 'PENDIENTE',
        creadoPor: userId,
      });

      const saved = await this.repository.save(valorizacion);

      logger.info('Valuation created successfully', {
        valuation_id: saved.id,
        numero_valorizacion: saved.numeroValorizacion,
        periodo: saved.periodo,
        estado: saved.estado,
        total_valorizado: saved.totalValorizado,
        created_by: userId,
      });

      return saved;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error;
      }

      Logger.error('Error creating valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'ValuationService.create',
      });

      throw new DatabaseError(
        'Failed to create valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { user_id: userId }
      );
    }
  }

  /**
   * Updates an existing valuation with partial data.
   *
   * WARNING: Currently allows updating terminal states (PAGADO, RECHAZADO).
   * This violates business rules and should be fixed.
   *
   * TODO: Add terminal state protection
   * TODO: Add estado transition validation if estado changed
   * TODO: [Phase 21] Add tenant context - verify ownership before update
   *
   * @param id - Valuation ID
   * @param data - Partial valuation data to update
   *
   * @returns Updated ValuationDto
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If attempting to modify terminal state (should throw, currently missing)
   * @throws {ValidationError} If date range becomes invalid (should throw, currently missing)
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const updated = await valuationService.update(123, {
   *   total_valorizado: 8500.00,
   *   total_con_igv: 10030.00,
   *   observaciones: 'Ajuste por horas extras'
   * });
   * ```
   */
  async update(id: number, data: Partial<Valorizacion>): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      // Business rule: Prevent modification of terminal states
      const terminalStates = ['PAGADO', 'RECHAZADO', 'ELIMINADO'];
      if (terminalStates.includes(valorizacion.estado)) {
        throw new BusinessRuleError(
          `Cannot modify valuation in terminal state ${valorizacion.estado}`,
          'VALUATION_TERMINAL_STATE',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            attempted_action: 'update',
          },
          'Terminal states (PAGADO, RECHAZADO, ELIMINADO) cannot be modified'
        );
      }

      // Business rule: Validate uniqueness if numero_valorizacion changed
      const numVal = data.numeroValorizacion || (data as any).numero_valorizacion;
      if (numVal && numVal !== valorizacion.numeroValorizacion) {
        const existing = await this.repository.findOne({
          where: { numeroValorizacion: numVal },
        });
        if (existing) {
          throw new ConflictError(
            `Valuation with numero '${numVal}' already exists`,
            {
              field: 'numero_valorizacion',
              value: numVal,
              existing_id: existing.id,
            }
          );
        }
      }

      // Business rule: Validate date range if dates changed
      const newFechaInicio = data.fechaInicio || valorizacion.fechaInicio;
      const newFechaFin = data.fechaFin || valorizacion.fechaFin;

      if (newFechaInicio && newFechaFin) {
        if (newFechaFin < newFechaInicio) {
          throw new ValidationError('End date must be >= start date', [
            {
              field: 'fecha_fin',
              rule: 'dateRange',
              message: `End date (${newFechaFin.toISOString().split('T')[0]}) must be on or after start date (${newFechaInicio.toISOString().split('T')[0]})`,
              value: newFechaFin,
            },
          ]);
        }
      }

      // Apply updates safely (handle both camelCase and snake_case)
      const mergeIfDefined = (targetKey: string, sourceKeys: string[]) => {
        for (const key of sourceKeys) {
          if ((data as any)[key] !== undefined) {
            (valorizacion as any)[targetKey] = (data as any)[key];
            break;
          }
        }
      };

      mergeIfDefined('contratoId', ['contratoId', 'contrato_id']);
      mergeIfDefined('equipoId', ['equipoId', 'equipo_id']);
      mergeIfDefined('periodo', ['periodo']);
      mergeIfDefined('fechaInicio', ['fechaInicio', 'fecha_inicio']);
      mergeIfDefined('fechaFin', ['fechaFin', 'fecha_fin']);
      mergeIfDefined('totalValorizado', ['totalValorizado', 'total_valorizado']);
      mergeIfDefined('numeroValorizacion', ['numeroValorizacion', 'numero_valorizacion']);
      mergeIfDefined('estado', ['estado']);
      mergeIfDefined('observaciones', ['observaciones']);
      mergeIfDefined('cargosAdicionales', ['cargosAdicionales', 'cargos_adicionales']);
      mergeIfDefined('costoBase', ['costoBase', 'costo_base']);
      mergeIfDefined('costoCombustible', ['costoCombustible', 'costo_combustible']);
      mergeIfDefined('tipoCambio', ['tipoCambio', 'tipo_cambio']);
      mergeIfDefined('descuentoPorcentaje', ['descuentoPorcentaje', 'descuento_porcentaje']);
      mergeIfDefined('descuentoMonto', ['descuentoMonto', 'descuento_monto']);
      mergeIfDefined('igvPorcentaje', ['igvPorcentaje', 'igv_porcentaje']);
      mergeIfDefined('igvMonto', ['igvMonto', 'igv_monto']);
      mergeIfDefined('totalConIgv', ['totalConIgv', 'total_con_igv']);

      const updated = await this.repository.save(valorizacion);

      logger.info('Valuation updated successfully', {
        valuation_id: id,
        numero_valorizacion: updated.numeroValorizacion,
        changed_fields: Object.keys(data),
      });

      return toValuationDto(updated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BusinessRuleError) {
        throw error;
      }
      Logger.error('Error updating valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.update',
      });
      throw new DatabaseError(
        'Failed to update valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id }
      );
    }
  }

  /**
   * Soft deletes a valuation by setting estado = ELIMINADO.
   *
   * CHANGED: Previously performed hard delete (data destruction).
   * Now performs soft delete to preserve audit trail.
   *
   * TODO: [Phase 21] Add tenant context - verify ownership before delete
   *
   * @param id - Valuation ID to soft delete
   *
   * @returns true if deleted, false if not found
   *
   * @throws {NotFoundError} If valuation not found (should throw, currently returns false)
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const deleted = await valuationService.delete(123);
   * if (deleted) {
   *   logger.info('Valuation soft deleted', { id: 123 });
   * }
   * ```
   */
  async delete(id: number): Promise<boolean> {
    try {
      // Find valuation first
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      // Soft delete: Set estado to ELIMINADO
      valorizacion.estado = 'ELIMINADO';
      valorizacion.updatedAt = new Date();
      await this.repository.save(valorizacion);

      logger.info('Soft deleted valuation', {
        id,
        numero_valorizacion: valorizacion.numeroValorizacion,
        old_estado: valorizacion.estado,
        new_estado: 'ELIMINADO',
      });

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error soft deleting valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.delete',
      });
      throw new DatabaseError(
        'Failed to soft delete valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id }
      );
    }
  }

  /**
   * Approves a valuation in EN_REVISION state.
   *
   * State transition: EN_REVISION → APROBADO
   * Sets approvedBy, approvedAt timestamps.
   * Sends email notification (non-blocking).
   *
   * Business rules enforced:
   * - Current estado must be EN_REVISION
   * - Only DIRECTOR+ roles can approve (should check, currently missing)
   *
   * TODO: Add role-based access control (DIRECTOR+ only)
   * TODO: [Phase 21] Add tenant context
   *
   * @param id - Valuation ID to approve
   * @param userId - ID of user approving (must be DIRECTOR+)
   *
   * @returns Updated ValuationDto with estado = APROBADO
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If estado is not EN_REVISION
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const approved = await valuationService.approve(123, directorId);
   * // Estado: EN_REVISION → APROBADO
   * // Email sent to creator and provider
   * console.log(`Approved by user ${approved.approved_by} at ${approved.approved_at}`);
   * ```
   */
  async approve(id: number, userId: number): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      // Validate state transition: Only EN_REVISION can be approved
      if (valorizacion.estado !== 'EN_REVISION') {
        throw new BusinessRuleError(
          `Cannot approve valuation in state ${valorizacion.estado}. Must be EN_REVISION.`,
          'STATE_TRANSITION_INVALID',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            required_estado: 'EN_REVISION',
          },
          'Valuation must be in EN_REVISION state to be approved'
        );
      }

      valorizacion.estado = 'APROBADO';
      valorizacion.aprobadoPor = userId;
      valorizacion.aprobadoEn = new Date();

      const approved = await this.repository.save(valorizacion);

      logger.info('Valuation approved successfully', {
        valuation_id: id,
        numero_valorizacion: approved.numeroValorizacion,
        approved_by: userId,
        approved_at: approved.aprobadoEn,
        new_estado: approved.estado,
      });

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifyApproved(approved, userId).catch((err) => {
        Logger.error('Failed to send approved email', { error: err, valuationId: id });
      });

      return toValuationDto(approved);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BusinessRuleError) {
        throw error;
      }
      Logger.error('Error approving valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        context: 'ValuationService.approve',
      });
      throw new DatabaseError(
        'Failed to approve valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, user_id: userId }
      );
    }
  }

  /**
   * Submits a PENDIENTE valuation for review.
   *
   * State transition: PENDIENTE → EN_REVISION
   * Sends email notification to DIRECTOR/ADMIN users (non-blocking).
   *
   * Business rules enforced:
   * - Current estado must be PENDIENTE
   *
   * TODO: Validate all required data present before submission
   * TODO: [Phase 21] Add tenant context
   *
   * @param id - Valuation ID to submit
   * @param userId - ID of user submitting
   *
   * @returns Updated ValuationDto with estado = EN_REVISION
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If estado is not PENDIENTE
   * @throws {ValidationError} If required data missing (should throw, currently missing)
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const submitted = await valuationService.submitForReview(123, userId);
   * // Estado: PENDIENTE → EN_REVISION
   * // Email sent to directors for approval
   * ```
   */
  async submitForReview(id: number, userId: number): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      if (valorizacion.estado !== 'PENDIENTE') {
        throw new BusinessRuleError(
          `Cannot submit valuation in state ${valorizacion.estado}. Must be PENDIENTE.`,
          'STATE_TRANSITION_INVALID',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            required_estado: 'PENDIENTE',
          },
          'Valuation must be in PENDIENTE state to submit for review'
        );
      }

      valorizacion.estado = 'EN_REVISION';
      valorizacion.updatedAt = new Date();

      const updated = await this.repository.save(valorizacion);

      logger.info('Valuation submitted for review successfully', {
        valuation_id: id,
        numero_valorizacion: updated.numeroValorizacion,
        submitted_by: userId,
        new_estado: updated.estado,
      });

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifySubmitted(updated).catch((err) => {
        Logger.error('Failed to send submitted email', { error: err, valuationId: id });
      });

      return toValuationDto(updated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BusinessRuleError) {
        throw error;
      }
      Logger.error('Error submitting valuation for review', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        context: 'ValuationService.submitForReview',
      });
      throw new DatabaseError(
        'Failed to submit valuation for review',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, user_id: userId }
      );
    }
  }

  /**
   * Rejects a valuation with a required reason.
   *
   * State transition: EN_REVISION → RECHAZADO (terminal state)
   * Appends rejection reason to observaciones.
   * Sends email notification (non-blocking).
   *
   * Business rules enforced:
   * - Cannot reject PAGADO valuation
   * - Reason must be non-empty
   * - RECHAZADO is terminal (cannot transition out)
   *
   * WARNING: Currently allows rejecting RECHAZADO valuation.
   * Should prevent all transitions from terminal states.
   *
   * TODO: Add terminal state protection (check RECHAZADO too)
   * TODO: [Phase 21] Add tenant context
   *
   * @param id - Valuation ID to reject
   * @param userId - ID of user rejecting
   * @param reason - Rejection reason (required, non-empty)
   *
   * @returns Updated ValuationDto with estado = RECHAZADO
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If valuation is PAGADO or RECHAZADO
   * @throws {ValidationError} If reason is empty or whitespace-only
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const rejected = await valuationService.reject(
   *   123,
   *   directorId,
   *   'Horas trabajadas del día 15 no coinciden con parte diario. Verificar.'
   * );
   * // Estado: EN_REVISION → RECHAZADO (terminal)
   * // Cannot be modified or re-submitted
   * ```
   */
  async reject(id: number, userId: number, reason: string): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      // Check terminal states (PAGADO and RECHAZADO are immutable)
      const terminalStates = ['PAGADO', 'RECHAZADO'];
      if (terminalStates.includes(valorizacion.estado)) {
        throw new BusinessRuleError(
          `Cannot reject valuation in terminal state ${valorizacion.estado}`,
          'VALUATION_TERMINAL_STATE',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            attempted_action: 'reject',
          },
          'Terminal states (PAGADO, RECHAZADO) cannot transition to other states'
        );
      }

      if (!reason || reason.trim().length === 0) {
        throw new ValidationError('Rejection reason is required', [
          {
            field: 'reason',
            rule: 'required',
            message: 'Rejection reason cannot be empty or whitespace-only',
            value: reason,
          },
        ]);
      }

      valorizacion.estado = 'RECHAZADO';
      valorizacion.observaciones = valorizacion.observaciones
        ? `${valorizacion.observaciones}\n\nRECHAZADO: ${reason}`
        : `RECHAZADO: ${reason}`;
      valorizacion.updatedAt = new Date();

      const rejected = await this.repository.save(valorizacion);

      logger.info('Valuation rejected successfully', {
        valuation_id: id,
        numero_valorizacion: rejected.numeroValorizacion,
        previous_estado: 'EN_REVISION',
        new_estado: rejected.estado,
        rejected_by: userId,
        reason_length: reason.length,
      });

      // Send email notification (non-blocking)
      valuationEmailNotifier.notifyRejected(rejected, reason, userId).catch((err) => {
        Logger.error('Failed to send rejected email', { error: err, valuationId: id });
      });

      return toValuationDto(rejected);
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof NotFoundError ||
        error instanceof BusinessRuleError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      Logger.error('Error rejecting valuation', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        reason,
        context: 'ValuationService.reject',
      });

      throw new DatabaseError(
        'Failed to reject valuation',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, user_id: userId }
      );
    }
  }

  /**
   * Marks an APROBADO valuation as paid with payment details.
   *
   * State transition: APROBADO → PAGADO (terminal state)
   * Records fechaPago, referenciaPago, metodoPago.
   * Appends payment info to observaciones.
   * Sends email notification (non-blocking).
   *
   * Business rules enforced:
   * - Current estado must be APROBADO
   * - PAGADO is terminal (cannot transition out)
   *
   * TODO: Validate fechaPago not in future
   * TODO: [Phase 21] Add tenant context
   *
   * @param id - Valuation ID to mark as paid
   * @param userId - ID of user recording payment
   * @param paymentData - Payment details
   * @param paymentData.fechaPago - Payment date (default: today)
   * @param paymentData.referenciaPago - Payment reference (optional)
   * @param paymentData.metodoPago - Payment method (optional, e.g., TRANSFERENCIA, CHEQUE)
   *
   * @returns Updated ValuationDto with estado = PAGADO
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {BusinessRuleError} If estado is not APROBADO
   * @throws {ValidationError} If fechaPago is in future (should throw, currently missing)
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const paid = await valuationService.markAsPaid(123, accountingId, {
   *   fechaPago: new Date('2026-02-15'),
   *   metodoPago: 'TRANSFERENCIA',
   *   referenciaPago: 'TRF-2026-0045'
   * });
   * // Estado: APROBADO → PAGADO (terminal)
   * // Email sent to provider
   * ```
   */
  async markAsPaid(
    id: number,
    userId: number,
    paymentData: { fechaPago?: Date; referenciaPago?: string; metodoPago?: string }
  ): Promise<ValuationDto> {
    try {
      const valorizacion = await this.repository.findOne({ where: { id } });
      if (!valorizacion) {
        throw new NotFoundError('Valuation', id);
      }

      if (valorizacion.estado !== 'APROBADO') {
        throw new BusinessRuleError(
          `Cannot mark as paid valuation in state ${valorizacion.estado}. Must be APROBADO.`,
          'VALUATION_INVALID_STATE_TRANSITION',
          {
            valuation_id: id,
            current_estado: valorizacion.estado,
            required_estado: 'APROBADO',
            attempted_action: 'markAsPaid',
          },
          'Only APROBADO valuations can be marked as PAGADO'
        );
      }

      valorizacion.estado = 'PAGADO';
      // TODO: Add fechaPago property to Valorizacion model if payment date tracking is needed
      // valorizacion.fechaPago = paymentData.fechaPago || new Date();
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

      logger.info('Valuation marked as paid successfully', {
        valuation_id: id,
        numero_valorizacion: paid.numeroValorizacion,
        previous_estado: 'APROBADO',
        new_estado: paid.estado,
        // TODO: Add fechaPago property to Valuation model for payment date tracking
        // fecha_pago: paid.fechaPago?.toISOString().split('T')[0],
        metodo_pago: paymentData.metodoPago || 'No especificado',
        referencia_pago: paymentData.referenciaPago,
        marked_by: userId,
      });

      // Send email notification (non-blocking)
      const emailPaymentData = {
        // TODO: Add fechaPago property to Valuation model for payment date tracking
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: paymentData.metodoPago || 'No especificado',
        referencia_pago: paymentData.referenciaPago,
      };
      valuationEmailNotifier.notifyPaid(paid, emailPaymentData).catch((err) => {
        Logger.error('Failed to send paid email', { error: err, valuationId: id });
      });

      return toValuationDto(paid);
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof BusinessRuleError) {
        throw error;
      }

      Logger.error('Error marking valuation as paid', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        userId,
        paymentData,
        context: 'ValuationService.markAsPaid',
      });

      throw new DatabaseError(
        'Failed to mark valuation as paid',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, user_id: userId }
      );
    }
  }

  /**
   * Get analytics data for valuation dashboard.
   *
   * Provides two datasets:
   * 1. Status breakdown - Count and total by estado (PENDIENTE, EN_REVISION, APROBADO, etc.)
   * 2. Monthly trend - Last 6 months of valuation totals
   *
   * TODO: Implement top_equipment (currently returns empty array)
   * TODO: [Phase 21] Add tenant context - filter by tenant
   *
   * @returns Object with status_breakdown, monthly_trend, top_equipment
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const analytics = await valuationService.getAnalytics();
   * // Returns: {
   * //   status_breakdown: [{ status: 'APROBADO', count: 45, total: 123000 }, ...],
   * //   monthly_trend: [{ period: '2026-01', total: 50000 }, ...],
   * //   top_equipment: [] // TODO
   * // }
   * ```
   */
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

      const result = {
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

      logger.info('Analytics fetched successfully', {
        status_breakdown_count: result.status_breakdown.length,
        monthly_trend_count: result.monthly_trend.length,
        top_equipment_count: result.top_equipment.length,
      });

      return result;
    } catch (error) {
      Logger.error('Error fetching analytics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ValuationService.getAnalytics',
      });

      throw new DatabaseError(
        'Failed to fetch analytics',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { context: 'getAnalytics' }
      );
    }
  }

  // Backward compatibility methods (DEPRECATED - use new method names)

  /**
   * Get all valuations with filters (DEPRECATED).
   *
   * @deprecated Use findAll() instead. This method is for backward compatibility only.
   *
   * @param filters - Optional filters (same as findAll)
   *
   * @returns { data: ValuationDto[], total: number }
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const result = await valuationService.getAllValuations({ estado: 'APROBADO' });
   *
   * // ✅ NEW (recommended)
   * const result = await valuationService.findAll({ estado: 'APROBADO' });
   * ```
   */
  async getAllValuations(filters?: any) {
    return this.findAll(filters);
  }

  /**
   * Get valuation by ID (DEPRECATED).
   *
   * @deprecated Use findById() instead. This method is for backward compatibility only.
   *
   * @param id - Valuation ID (string)
   *
   * @returns ValuationDto if found, null otherwise
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const valuation = await valuationService.getValuationById('123');
   *
   * // ✅ NEW (recommended)
   * const valuation = await valuationService.findById(123);
   * ```
   */
  async getValuationById(id: string) {
    return this.findById(parseInt(id));
  }

  /**
   * Create valuation (DEPRECATED).
   *
   * @deprecated Use create() instead. This method is for backward compatibility only.
   *
   * @param data - Valuation data (any type for legacy compatibility)
   * @param userId - User ID (string)
   *
   * @returns Created valuation (Valorizacion entity)
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const valuation = await valuationService.createValuation(data, '5');
   *
   * // ✅ NEW (recommended)
   * const valuation = await valuationService.create(data, 5);
   * ```
   */
  async createValuation(data: any, userId: string) {
    return this.create(data, userId ? parseInt(userId) : undefined);
  }

  /**
   * Update valuation (DEPRECATED).
   *
   * @deprecated Use update() instead. This method is for backward compatibility only.
   *
   * @param id - Valuation ID (string)
   * @param data - Partial valuation data (any type for legacy compatibility)
   * @param userId - User ID (string, unused in new implementation)
   *
   * @returns Updated ValuationDto
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const updated = await valuationService.updateValuation('123', data, '5');
   *
   * // ✅ NEW (recommended)
   * const updated = await valuationService.update(123, data);
   * ```
   */
  async updateValuation(id: string, data: any, userId: string) {
    return this.update(parseInt(id), data);
  }

  /**
   * Delete valuation (DEPRECATED).
   *
   * @deprecated Use delete() instead. This method is for backward compatibility only.
   *
   * Note: After Phase 20 refactor, delete() will perform soft delete (estado = ELIMINADO)
   * instead of hard delete.
   *
   * @param id - Valuation ID (string)
   *
   * @returns true if deleted, false if not found
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const deleted = await valuationService.deleteValuation('123');
   *
   * // ✅ NEW (recommended)
   * const deleted = await valuationService.delete(123);
   * ```
   */
  async deleteValuation(id: string) {
    return this.delete(parseInt(id));
  }

  /**
   * Calculate valuation totals for a contract period (STUB - NOT IMPLEMENTED).
   *
   * TODO: Implement actual calculation logic based on:
   * - Daily reports (partes_diarios) for the period
   * - Contract pricing model (Anexo B variant)
   * - Equipment hours/days worked
   * - Fuel consumption
   * - Work expenses
   * - Advance deductions
   *
   * @param contractId - Contract ID
   * @param month - Month (1-12)
   * @param year - Year (YYYY)
   *
   * @returns Stub calculation result (all zeros)
   *
   * @example
   * ```typescript
   * const calc = await valuationService.calculateValuation('123', 1, 2026);
   * // Currently returns stub data with zeros
   * // TODO: Implement real calculation based on partes_diarios
   * ```
   */
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

  /**
   * Generate a valuation for a specific contract and period.
   *
   * Creates a new valuation with estado = PENDIENTE:
   * 1. Calls calculateValuation() to get totals (currently stub)
   * 2. Creates periodo string (YYYY-MM)
   * 3. Sets fecha_inicio (first day of month) and fecha_fin (last day)
   * 4. Populates valuation with calculated values
   *
   * TODO: [Phase 21] Add tenant context
   * TODO: Wait for calculateValuation() implementation
   *
   * @param contractId - Contract ID (string)
   * @param month - Month (1-12)
   * @param year - Year (YYYY)
   * @param userId - User ID creating the valuation (string)
   *
   * @returns Created valuation (Valorizacion entity)
   *
   * @throws {ConflictError} If valuation already exists for period
   * @throws {NotFoundError} If contract not found
   * @throws {DatabaseError} If database insert fails
   *
   * @example
   * ```typescript
   * const valuation = await valuationService.generateValuationForContract(
   *   '123', 1, 2026, '5'
   * );
   * // Creates valuation for January 2026
   * // Estado: PENDIENTE
   * // Observaciones: "Auto-generado el 2026-01-15T10:30:00Z"
   * ```
   */
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
        contratoId: parseInt(contractId),
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

  /**
   * Generate valuations for all active contracts in a period (STUB - NOT IMPLEMENTED).
   *
   * TODO: Implement bulk valuation generation:
   * - Query all active contracts for the period
   * - For each contract, call generateValuationForContract()
   * - Handle conflicts (already generated)
   * - Return array of generated valuations
   *
   * @param month - Month (1-12)
   * @param year - Year (YYYY)
   * @param userId - User ID creating the valuations (string)
   *
   * @returns Empty array (stub implementation)
   *
   * @example
   * ```typescript
   * const valuations = await valuationService.generateValuationsForPeriod(1, 2026, '5');
   * // Currently returns []
   * // TODO: Implement bulk generation for all active contracts
   * ```
   */
  async generateValuationsForPeriod(month: number, year: number, userId: string) {
    // TODO: Implement batch generation
    return [];
  }

  /**
   * Get valuation details for PDF generation (DEPRECATED).
   *
   * @deprecated Use findById() instead. This method is a legacy wrapper.
   *
   * @param id - Valuation ID (string)
   *
   * @returns ValuationDto if found, null otherwise
   *
   * @example
   * ```typescript
   * // ❌ OLD (deprecated)
   * const valuation = await valuationService.getValuationDetailsForPdf('123');
   *
   * // ✅ NEW (recommended)
   * const valuation = await valuationService.findById(123);
   * ```
   */
  async getValuationDetailsForPdf(id: string) {
    return this.findById(parseInt(id));
  }

  /**
   * Get complete valuation data for Page 1 PDF generation.
   *
   * Page 1 contains header information and contract details:
   * - Valuation number, period, dates
   * - Contract information (number, type, pricing model)
   * - Equipment details (code, type, model, plate)
   * - Provider information (name, RUC, contact)
   * - Project information
   *
   * Performs JOINs:
   * - valuation.creator (usuarios)
   * - valuation.approver (usuarios)
   * - contract.equipo (equipos)
   * - equipo.provider (proveedores)
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage1Dto with all data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract not found
   * @throws {NotFoundError} If equipment not found in contract
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page1 = await valuationService.getValuationPage1Data(123);
   * // Returns: { valuation, contract, equipment, provider, ... }
   * // Use for PDF header generation
   * ```
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
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contratoId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contratoId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contratoId}`);
      }

      // Fetch financial totals for Page 1 summary
      const financialTotals = await this.getFinancialTotals(id);

      // Transform entities to DTO using centralized transformer
      const result = transformToValuationPage1Dto(valuation, contract, contract.equipo, financialTotals);

      logger.info('Page 1 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 1,
        contract_id: valuation.contratoId,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 1 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage1Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 1 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 1 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 2 PDF generation (RESUMEN ACUMULADO).
   *
   * Page 2 is the MOST COMPLEX query - shows historical accumulation:
   * - All valuations for the same equipment up to current date
   * - Cumulative totals (hours, days, amounts)
   * - Contract evolution over time
   * - Timeline of valorizations
   *
   * Performance Note: This query can be expensive for equipment with many valuations.
   * Fetches multiple entities:
   * 1. Current valuation
   * 2. Contract with equipment and provider (JOINs)
   * 3. ALL historical valuations for equipment (WHERE equipo_id + date range)
   * 4. All contracts for historical valuations (IN query)
   * 5. Maps contracts to valuations
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   * TODO: Consider caching for equipment with 100+ valuations
   *
   * @param id - Current valuation ID
   *
   * @returns ValuationPage2Dto with historical data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract not found
   * @throws {NotFoundError} If equipment not found in contract
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page2 = await valuationService.getValuationPage2Data(123);
   * // Returns: { current_valuation, historical_valuations[], cumulative_totals, equipment }
   * // Historical valuations ordered by fecha_inicio ASC
   * // Use for PDF historical accumulation table
   * ```
   */
  async getValuationPage2Data(id: number): Promise<ValuationPage2Dto> {
    try {
      // Fetch current valuation
      const currentValuation = await this.repository
        .createQueryBuilder('v')
        .where('v.id = :id', { id })
        .getOne();

      if (!currentValuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: currentValuation.contratoId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', currentValuation.contratoId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${currentValuation.contratoId}`);
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
        ...new Set(historicalValuations.map((v) => v.contratoId).filter(Boolean)),
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
        contract: val.contratoId ? contractMap.get(val.contratoId) : null,
      }));

      // Transform to Page 2 DTO
      const result = transformToValuationPage2Dto(
        currentValuation,
        valuationsWithContracts as any,
        contract.equipo
      );

      logger.info('Page 2 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: currentValuation.numeroValorizacion,
        page_number: 2,
        historical_count: historicalValuations.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 2 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage2Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 2 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 2 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 3 PDF generation (DETALLE DE COMBUSTIBLE).
   *
   * Page 3 contains fuel consumption detail:
   * - Daily fuel consumption records
   * - Fuel type (diesel, gasoline)
   * - Quantity, cost per gallon
   * - Source: equipo.equipo_combustible table
   *
   * Performs JOINs:
   * - valuation
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage3Dto with fuel consumption data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page3 = await valuationService.getValuationPage3Data(123);
   * // Returns: { valuation, fuel_records[], equipment, total_fuel }
   * // fuel_records ordered by fecha ASC
   * ```
   */
  async getValuationPage3Data(id: number): Promise<ValuationPage3Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contratoId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contratoId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contratoId}`);
      }

      // Fetch fuel consumption records from equipo_combustible table
      const fuelRecords = await AppDataSource.query(
        `SELECT * FROM equipo.equipo_combustible WHERE valorizacion_id = $1 ORDER BY fecha ASC`,
        [id]
      );

      const result = transformToValuationPage3Dto(valuation, fuelRecords, contract.equipo);

      logger.info('Page 3 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 3,
        fuel_records_count: fuelRecords.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 3 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage3Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 3 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 3 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 4 PDF generation (EXCESO DE COMBUSTIBLE).
   *
   * Page 4 contains excess fuel charges:
   * - Charges for fuel consumption above contract limit
   * - Calculation: (actual - budgeted) * price_per_gallon
   * - Source: excess_fuel table (0 or 1 record per valuation)
   *
   * Performs JOINs:
   * - valuation
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage4Dto with excess fuel data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page4 = await valuationService.getValuationPage4Data(123);
   * // Returns: { valuation, excess_fuel_record?, equipment, total_excess }
   * // excess_fuel_record may be null if no excess charges
   * ```
   */
  async getValuationPage4Data(id: number): Promise<ValuationPage4Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contratoId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contratoId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contratoId}`);
      }

      // Fetch excess fuel record (should be 0 or 1)
      const excessFuelRepo = AppDataSource.getRepository(ExcessFuel);
      const excessFuel = await excessFuelRepo.findOne({ where: { valorizacionId: id } });

      const result = transformToValuationPage4Dto(valuation, excessFuel, contract.equipo);

      logger.info('Page 4 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 4,
        has_excess_fuel: !!excessFuel,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 4 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage4Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 4 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 4 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 5 PDF generation (GASTOS DE OBRA).
   *
   * Page 5 contains work expenses:
   * - Maintenance, repairs, parts, transportation
   * - Multiple line items with descriptions and amounts
   * - Source: work_expenses table (0 to many records)
   *
   * Performs JOINs:
   * - valuation
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage5Dto with work expenses data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page5 = await valuationService.getValuationPage5Data(123);
   * // Returns: { valuation, work_expenses[], equipment, total_expenses }
   * // work_expenses ordered by fechaOperacion ASC
   * ```
   */
  async getValuationPage5Data(id: number): Promise<ValuationPage5Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contratoId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contratoId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contratoId}`);
      }

      // Fetch work expenses
      const workExpenseRepo = AppDataSource.getRepository(WorkExpense);
      const workExpenses = await workExpenseRepo.find({
        where: { valorizacionId: id },
        order: { fechaOperacion: 'ASC' },
      });

      const result = transformToValuationPage5Dto(valuation, workExpenses, contract.equipo);

      logger.info('Page 5 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 5,
        work_expenses_count: workExpenses.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 5 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage5Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 5 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 5 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 6 PDF generation (ADELANTOS/AMORTIZACIONES).
   *
   * Page 6 contains advance amortizations:
   * - Deductions for advance payments
   * - Multiple line items with dates and amounts
   * - Source: advance_amortizations table (0 to many records)
   *
   * Performs JOINs:
   * - valuation
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage6Dto with advances data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page6 = await valuationService.getValuationPage6Data(123);
   * // Returns: { valuation, advances[], equipment, total_advances }
   * // advances ordered by fechaOperacion ASC
   * ```
   */
  async getValuationPage6Data(id: number): Promise<ValuationPage6Dto> {
    try {
      // Fetch valuation
      const valuation = await this.repository.findOne({ where: { id } });
      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contratoId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contratoId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contratoId}`);
      }

      // Fetch advances/amortizations
      const advanceRepo = AppDataSource.getRepository(AdvanceAmortization);
      const advances = await advanceRepo.find({
        where: { valorizacionId: id },
        order: { fechaOperacion: 'ASC' },
      });

      const result = transformToValuationPage6Dto(valuation, advances, contract.equipo);

      logger.info('Page 6 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 6,
        advances_count: advances.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 6 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage6Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 6 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 6 }
      );
    }
  }

  /**
   * Get complete valuation data for Page 7 PDF generation (RESUMEN Y FIRMAS).
   *
   * Page 7 contains financial summary and signatures:
   * - Total valorizado (base amount)
   * - Total descuentos (deductions)
   * - Subtotal
   * - IGV (18%)
   * - Total con IGV (final amount)
   * - Signature blocks (creator, approver, provider)
   *
   * Performs JOINs:
   * - valuation.creator (usuarios)
   * - valuation.approver (usuarios)
   * - contract.equipo
   * - equipo.provider
   *
   * TODO: [Phase 21] Add tenant context - verify valuation belongs to tenant
   *
   * @param id - Valuation ID
   *
   * @returns ValuationPage7Dto with summary and signature data for PDF generation
   *
   * @throws {NotFoundError} If valuation not found
   * @throws {NotFoundError} If contract or equipment not found
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * const page7 = await valuationService.getValuationPage7Data(123);
   * // Returns: { valuation, financial_summary, signatures, equipment, contract }
   * // Use for PDF final page with totals and signature blocks
   * ```
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

      if (!valuation) {
        throw new NotFoundError('Valuation', id);
      }

      // Get contract with equipment and provider
      const contract = await this.contractRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('c.id = :contractId', { contractId: valuation.contratoId })
        .getOne();

      if (!contract) {
        throw new NotFoundError('Contract', valuation.contratoId);
      }

      if (!contract.equipo) {
        throw new NotFoundError('Equipment', `in contract ${valuation.contratoId}`);
      }

      // Fetch financial totals for Page 7 summary
      const financialTotals = await this.getFinancialTotals(id);

      const result = transformToValuationPage7Dto(valuation, contract, contract.equipo, financialTotals);

      logger.info('Page 7 data fetched successfully', {
        valuation_id: id,
        numero_valorizacion: valuation.numeroValorizacion,
        page_number: 7,
        has_creator: !!valuation.creator,
        has_approver: !!valuation.approver,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error fetching valuation Page 7 data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ValuationService.getValuationPage7Data',
      });

      throw new DatabaseError(
        'Failed to fetch Page 7 data',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { valuation_id: id, page: 7 }
      );
    }
  }

  /**
   * Helper: Calculate and fetch financial totals from all detail tables.
   */
  private async getFinancialTotals(valuationId: number) {
    const [workExpenses, advances, excessFuel] = await Promise.all([
      AppDataSource.getRepository(WorkExpense).find({
        where: { valorizacionId: valuationId },
      }),
      AppDataSource.getRepository(AdvanceAmortization).find({
        where: { valorizacionId: valuationId },
      }),
      AppDataSource.getRepository(ExcessFuel).findOne({
        where: { valorizacionId: valuationId },
      }),
    ]);

    const totalGastoObra = workExpenses.reduce(
      (sum, item) => sum + Number(item.importeSinIgv || 0),
      0
    );

    const totalAdelantos = advances
      .filter((a) => a.tipoOperacion === 'ADELANTO')
      .reduce((sum, item) => sum + Number(item.monto || 0), 0);

    const totalAmortizaciones = advances
      .filter((a) => a.tipoOperacion === 'AMORTIZACION')
      .reduce((sum, item) => sum + Number(item.monto || 0), 0);

    // net impact of advances
    const importeAdelanto = totalAdelantos - totalAmortizaciones;

    const importeExcesoCombustible = excessFuel ? Number(excessFuel.importeExcesoCombustible || 0) : 0;

    return {
      importe_gasto_obra: totalGastoObra,
      importe_adelanto: importeAdelanto,
      importe_exceso_combustible: importeExcesoCombustible,
    };
  }
}

export default new ValuationService();
