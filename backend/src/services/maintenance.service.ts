/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import {
  MaintenanceSchedule,
  TipoMantenimiento,
  EstadoMantenimiento,
} from '../models/maintenance-schedule.model';
import { Repository } from 'typeorm';
import {
  MaintenanceDto,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  toMaintenanceDto,
  fromMaintenanceDto,
  mapCreateMaintenanceDto,
} from '../types/dto/maintenance.dto';
import { NotFoundError, DatabaseError, DatabaseErrorType } from '../errors';
import { Logger } from '../utils/logger';
import { StatsSummaryDto } from '../types/dto/stats.dto';

interface MaintenanceFilters {
  status?: EstadoMantenimiento;
  type?: TipoMantenimiento;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * MaintenanceService
 *
 * Manages equipment maintenance schedules and tracking for BitCorp ERP.
 * Supports preventive, corrective, and predictive maintenance workflows.
 *
 * ## Maintenance Types
 *
 * - **PREVENTIVO**: Scheduled preventive maintenance based on time or usage intervals
 * - **CORRECTIVO**: Corrective maintenance to fix identified issues or failures
 * - **PREDICTIVO**: Predictive maintenance based on condition monitoring and analysis
 *
 * ## State Machine
 *
 * Maintenance records follow this workflow:
 *
 * ```
 * PROGRAMADO → EN_PROCESO → COMPLETADO
 *                        ↘ CANCELADO
 * ```
 *
 * ### States:
 * - `PROGRAMADO`: Maintenance scheduled, not yet started
 * - `EN_PROCESO`: Maintenance work in progress
 * - `COMPLETADO`: Maintenance completed successfully
 * - `CANCELADO`: Maintenance cancelled (equipment retired, no longer needed, etc.)
 * - `PENDIENTE`: Alternate initial state (pending approval/scheduling)
 *
 * ### Valid Transitions (not enforced by service):
 * - PROGRAMADO → EN_PROCESO (start maintenance)
 * - PROGRAMADO → CANCELADO (cancel before start)
 * - EN_PROCESO → COMPLETADO (finish maintenance)
 * - EN_PROCESO → CANCELADO (cancel during work)
 *
 * **Note**: Current implementation does NOT enforce state transitions.
 * The service allows any state change. State validation should be implemented
 * in a future enhancement (Phase 22+).
 *
 * ## Cost Tracking
 *
 * Each maintenance record tracks:
 * - `costo_estimado`: Estimated cost before maintenance (optional)
 * - `costo_real`: Actual cost after completion (optional)
 *
 * Cost fields are nullable as they may not be known at creation time.
 *
 * ## Responsibility Tracking
 *
 * - `tecnico_responsable`: Person or team responsible for the maintenance
 * - Field is optional and can be assigned when scheduling or during execution
 *
 * ## Business Rules
 *
 * 1. **Equipment Association**: Every maintenance record must be associated with equipment
 * 2. **Date Tracking**: Records can have:
 *    - `fecha_programada`: When maintenance is scheduled
 *    - `fecha_realizada`: When maintenance was actually performed
 * 3. **Cost Validation**: Costs must be >= 0 if provided
 * 4. **Soft Delete**: Deleted maintenance records are marked with estado='ELIMINADO'
 * 5. **Filtering**: Supports filtering by status, type, and search text
 * 6. **Sorting**: Results can be sorted by multiple fields (date, cost, status, etc.)
 *
 * ## Related Entities
 *
 * - `Equipment`: Each maintenance record belongs to one equipment
 * - `MaintenanceScheduleRecurring`: Recurring maintenance schedules (separate service)
 *
 * @example
 * ```typescript
 * // Create preventive maintenance
 * const maintenance = await maintenanceService.createMaintenance({
 *   equipo_id: 123,
 *   tipo_mantenimiento: 'PREVENTIVO',
 *   descripcion: 'Cambio de aceite y filtros',
 *   fecha_programada: '2026-02-01',
 *   costo_estimado: 500.00,
 *   estado: 'PROGRAMADO'
 * }, 'user-123');
 *
 * // Update to in-progress
 * await maintenanceService.updateMaintenance(maintenance.id, {
 *   estado: 'EN_PROCESO',
 *   tecnico_responsable: 'Juan Pérez'
 * }, 'user-123');
 *
 * // Complete maintenance
 * await maintenanceService.updateMaintenance(maintenance.id, {
 *   estado: 'COMPLETADO',
 *   fecha_realizada: '2026-02-01',
 *   costo_real: 520.00,
 *   observaciones: 'Completado sin problemas'
 * }, 'user-123');
 * ```
 *
 * @see MaintenanceDto
 * @see MaintenanceSchedule
 * @see TipoMantenimiento
 * @see EstadoMantenimiento
 */
export class MaintenanceService {
  private repository: Repository<MaintenanceSchedule>;

  constructor() {
    this.repository = AppDataSource.getRepository(MaintenanceSchedule);
  }

  /**
   * Get all maintenance records with filtering, sorting, and pagination
   *
   * Retrieves maintenance schedules with support for:
   * - Status filtering (PROGRAMADO, EN_PROCESO, COMPLETADO, CANCELADO)
   * - Type filtering (PREVENTIVO, CORRECTIVO, PREDICTIVO)
   * - Search by equipment code or description
   * - Pagination with configurable page size
   * - Sorting by multiple fields
   *
   * Includes related equipment data (codigo_equipo) in results.
   *
   * @param filters - Optional filtering, pagination, and sorting options
   * @param filters.status - Filter by maintenance status
   * @param filters.type - Filter by maintenance type
   * @param filters.search - Search in equipment code or description (case-insensitive)
   * @param filters.page - Page number (1-indexed, default: 1)
   * @param filters.limit - Results per page (default: 10, max: 100)
   * @param filters.sort_by - Field to sort by (default: fecha_programada)
   * @param filters.sort_order - Sort direction (ASC or DESC, default: DESC)
   *
   * @returns Object containing:
   *   - data: Array of MaintenanceDto objects with snake_case fields
   *   - total: Total number of matching records (for pagination)
   *
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * // Get all programmed maintenance
   * const result = await maintenanceService.getAllMaintenance({
   *   status: 'PROGRAMADO',
   *   page: 1,
   *   limit: 20,
   *   sort_by: 'fecha_programada',
   *   sort_order: 'ASC'
   * });
   *
   * // Search for maintenance by equipment code
   * const result = await maintenanceService.getAllMaintenance({
   *   search: 'EXC-001'
   * });
   * ```
   */
  async getAllMaintenance(
    tenantId: number,
    filters?: MaintenanceFilters
  ): Promise<{
    data: MaintenanceDto[];
    total: number;
  }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Expected: queryBuilder.andWhere('m.tenant_id = :tenantId', { tenantId })
      const queryBuilder = this.repository
        .createQueryBuilder('m')
        .where('m.tenantId = :tenantId', { tenantId })
        .leftJoinAndSelect('m.equipo', 'e');

      // Apply filters
      if (filters?.status) {
        queryBuilder.andWhere('m.estado = :status', { status: filters.status });
      }

      if (filters?.type) {
        queryBuilder.andWhere('m.tipoMantenimiento = :type', { type: filters.type });
      }

      if (filters?.search) {
        queryBuilder.andWhere('(e.codigo_equipo ILIKE :search OR m.descripcion ILIKE :search)', {
          search: `%${filters.search}%`,
        });
      }

      // Sorting with whitelist
      const sortableFields: Record<string, string> = {
        fecha_programada: 'm.fechaProgramada',
        fecha_realizada: 'm.fechaRealizada',
        tipo_mantenimiento: 'm.tipoMantenimiento',
        estado: 'm.estado',
        costo_estimado: 'm.costoEstimado',
        costo_real: 'm.costoReal',
        tecnico_responsable: 'm.tecnicoResponsable',
        equipo_codigo: 'e.codigo_equipo',
        created_at: 'm.createdAt',
        updated_at: 'm.updatedAt',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'm.fechaProgramada';
      const sortOrder = filters?.sort_order === 'ASC' ? 'ASC' : 'DESC';

      queryBuilder.orderBy(sortBy, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated results
      const data = await queryBuilder.skip(offset).take(limit).getMany();

      Logger.info('Maintenance records retrieved successfully', {
        total,
        returned: data.length,
        page,
        limit,
        filters: {
          status: filters?.status,
          type: filters?.type,
          search: filters?.search,
        },
        context: 'MaintenanceService.getAllMaintenance',
      });

      return {
        data: data.map((m) => toMaintenanceDto(m)),
        total,
      };
    } catch (error) {
      Logger.error('Failed to retrieve maintenance records', {
        error: error instanceof Error ? error.message : String(error),
        filters,
        context: 'MaintenanceService.getAllMaintenance',
      });

      throw new DatabaseError(
        'Failed to retrieve maintenance records',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get maintenance record by ID
   *
   * Retrieves a single maintenance record with its related equipment data.
   * Returns null if the maintenance record does not exist.
   *
   * @param id - Maintenance record ID
   *
   * @returns MaintenanceDto with snake_case fields, or null if not found
   *
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const maintenance = await maintenanceService.getMaintenanceById(123);
   * if (maintenance) {
   *   console.log(`Maintenance ${maintenance.id} is ${maintenance.estado}`);
   * }
   * ```
   */
  async getMaintenanceById(tenantId: number, id: number): Promise<MaintenanceDto | null> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Expected: where: { id, tenant_id: tenantId }
      const maintenance = await this.repository.findOne({
        where: { id, tenantId },
        relations: ['equipo'],
      });

      if (!maintenance) {
        Logger.info('Maintenance record not found', {
          id,
          context: 'MaintenanceService.getMaintenanceById',
        });
        return null;
      }

      Logger.info('Maintenance record retrieved successfully', {
        id: maintenance.id,
        equipo_id: maintenance.equipoId,
        tipo_mantenimiento: maintenance.tipoMantenimiento,
        estado: maintenance.estado,
        context: 'MaintenanceService.getMaintenanceById',
      });

      return toMaintenanceDto(maintenance);
    } catch (error) {
      Logger.error('Failed to retrieve maintenance record', {
        error: error instanceof Error ? error.message : String(error),
        id,
        context: 'MaintenanceService.getMaintenanceById',
      });

      throw new DatabaseError(
        'Failed to retrieve maintenance record',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create new maintenance record
   *
   * Creates a maintenance schedule for equipment. Supports dual input format
   * (English camelCase and Spanish snake_case) for backward compatibility.
   *
   * The created record includes:
   * - Required: equipo_id, tipo_mantenimiento, estado
   * - Optional: descripcion, fecha_programada, fecha_realizada, costos, tecnico, observaciones
   *
   * @param data - Maintenance data (supports dual format)
   * @param userId - ID of user creating the maintenance record
   *
   * @returns Created MaintenanceDto with snake_case fields
   *
   * @throws {DatabaseError} If database operation fails
   * @throws {NotFoundError} If created record cannot be reloaded (should never happen)
   *
   * @example
   * ```typescript
   * // Spanish snake_case (preferred)
   * const maintenance = await maintenanceService.createMaintenance({
   *   equipo_id: 123,
   *   tipo_mantenimiento: 'PREVENTIVO',
   *   descripcion: 'Mantenimiento programado mensual',
   *   fecha_programada: '2026-02-15',
   *   costo_estimado: 1500.00,
   *   estado: 'PROGRAMADO'
   * }, 'user-123');
   *
   * // English camelCase (backward compatibility)
   * const maintenance = await maintenanceService.createMaintenance({
   *   equipment_id: 123,
   *   maintenance_type: 'CORRECTIVO',
   *   description: 'Fix hydraulic leak',
   *   status: 'PROGRAMADO'
   * }, 'user-123');
   * ```
   */
  async createMaintenance(
    tenantId: number,
    data: CreateMaintenanceDto,
    userId: string
  ): Promise<MaintenanceDto> {
    try {
      // Map dual input format to DTO
      const dtoData = mapCreateMaintenanceDto(data);

      const maintenance = this.repository.create({
        ...fromMaintenanceDto(dtoData),
        tenantId,
      });
      const saved = await this.repository.save(maintenance);

      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Expected: where: { id: saved.id, tenant_id: tenantId }
      // Reload with relations
      const withRelations = await this.repository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['equipo'],
      });

      if (!withRelations) {
        throw new NotFoundError('Maintenance', saved.id);
      }

      Logger.info('Maintenance record created successfully', {
        id: withRelations.id,
        equipo_id: withRelations.equipoId,
        tipo_mantenimiento: withRelations.tipoMantenimiento,
        estado: withRelations.estado,
        fecha_programada:
          withRelations.fechaProgramada instanceof Date
            ? withRelations.fechaProgramada.toISOString().split('T')[0]
            : withRelations.fechaProgramada,
        costo_estimado: withRelations.costoEstimado,
        userId,
        context: 'MaintenanceService.createMaintenance',
      });

      return toMaintenanceDto(withRelations);
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Failed to create maintenance record', {
        error: error instanceof Error ? error.message : String(error),
        data,
        userId,
        context: 'MaintenanceService.createMaintenance',
      });

      throw new DatabaseError(
        'Failed to create maintenance record',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update maintenance record
   *
   * Updates an existing maintenance record. Supports partial updates (only provided fields).
   * Supports dual input format (English camelCase and Spanish snake_case).
   *
   * Common update scenarios:
   * - Start maintenance: Update estado to 'EN_PROCESO', assign tecnico_responsable
   * - Complete maintenance: Update estado to 'COMPLETADO', set fecha_realizada, costo_real
   * - Cancel maintenance: Update estado to 'CANCELADO', add observaciones
   * - Update costs: Modify costo_estimado or costo_real
   *
   * @param id - Maintenance record ID
   * @param data - Partial maintenance data (supports dual format)
   * @param userId - ID of user updating the maintenance record
   *
   * @returns Updated MaintenanceDto with snake_case fields
   *
   * @throws {NotFoundError} If maintenance record does not exist
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * // Start maintenance
   * const updated = await maintenanceService.updateMaintenance(123, {
   *   estado: 'EN_PROCESO',
   *   tecnico_responsable: 'Carlos Rodríguez'
   * }, 'user-456');
   *
   * // Complete maintenance
   * const completed = await maintenanceService.updateMaintenance(123, {
   *   estado: 'COMPLETADO',
   *   fecha_realizada: '2026-02-16',
   *   costo_real: 1650.00,
   *   observaciones: 'Completado. Se reemplazaron filtros adicionales.'
   * }, 'user-456');
   * ```
   */
  async updateMaintenance(
    tenantId: number,
    id: number,
    data: UpdateMaintenanceDto,
    userId: string
  ): Promise<MaintenanceDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Expected: where: { id, tenant_id: tenantId }
      const maintenance = await this.repository.findOne({
        where: { id, tenantId },
        relations: ['equipo'],
      });

      if (!maintenance) {
        throw new NotFoundError('Maintenance', id);
      }

      // Store original values for logging
      const originalEstado = maintenance.estado;
      const originalTecnico = maintenance.tecnicoResponsable;

      // Map dual input format to DTO
      const dtoData = mapCreateMaintenanceDto(data);

      Object.assign(maintenance, fromMaintenanceDto(dtoData));
      const saved = await this.repository.save(maintenance);

      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Expected: where: { id: saved.id, tenant_id: tenantId }
      // Reload with relations
      const withRelations = await this.repository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['equipo'],
      });

      if (!withRelations) {
        throw new NotFoundError('Maintenance', saved.id);
      }

      Logger.info('Maintenance record updated successfully', {
        id: withRelations.id,
        equipo_id: withRelations.equipoId,
        tipo_mantenimiento: withRelations.tipoMantenimiento,
        estado: withRelations.estado,
        estado_anterior: originalEstado,
        tecnico_responsable: withRelations.tecnicoResponsable,
        tecnico_anterior: originalTecnico,
        fecha_realizada:
          withRelations.fechaRealizada instanceof Date
            ? withRelations.fechaRealizada.toISOString().split('T')[0]
            : withRelations.fechaRealizada,
        costo_real: withRelations.costoReal,
        userId,
        context: 'MaintenanceService.updateMaintenance',
      });

      return toMaintenanceDto(withRelations);
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Failed to update maintenance record', {
        error: error instanceof Error ? error.message : String(error),
        id,
        data,
        userId,
        context: 'MaintenanceService.updateMaintenance',
      });

      throw new DatabaseError(
        'Failed to update maintenance record',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete maintenance record (soft delete)
   *
   * Marks a maintenance record as deleted by setting estado='ELIMINADO'.
   * This is a soft delete - the record remains in the database for audit purposes.
   *
   * Hard deletes are not allowed to maintain data integrity and audit trail.
   *
   * @param id - Maintenance record ID
   *
   * @returns true if record was marked as deleted, false if not found
   *
   * @throws {NotFoundError} If maintenance record does not exist
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * const deleted = await maintenanceService.deleteMaintenance(123);
   * if (deleted) {
   *   console.log('Maintenance record marked as deleted');
   * }
   * ```
   */
  async deleteMaintenance(tenantId: number, id: number): Promise<boolean> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Expected: where: { id, tenant_id: tenantId }
      const maintenance = await this.repository.findOne({
        where: { id, tenantId },
      });

      if (!maintenance) {
        throw new NotFoundError('Maintenance', id);
      }

      // Soft delete: mark as ELIMINADO
      maintenance.estado = 'ELIMINADO' as EstadoMantenimiento;
      await this.repository.save(maintenance);

      Logger.info('Maintenance record deleted (soft delete)', {
        id: maintenance.id,
        equipo_id: maintenance.equipoId,
        tipo_mantenimiento: maintenance.tipoMantenimiento,
        estado_anterior: 'ELIMINADO', // Now ELIMINADO
        context: 'MaintenanceService.deleteMaintenance',
      });

      return true;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Failed to delete maintenance record', {
        error: error instanceof Error ? error.message : String(error),
        id,
        context: 'MaintenanceService.deleteMaintenance',
      });

      throw new DatabaseError(
        'Failed to delete maintenance record',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getStats(
    tenantId: number,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<StatsSummaryDto> {
    try {
      const query = this.repository
        .createQueryBuilder('m')
        .where('m.tenantId = :tenantId', { tenantId })
        .andWhere('m.estado != :deleted', { deleted: 'ELIMINADO' });

      if (filters?.startDate) {
        query.andWhere('m.createdAt >= :startDate', { startDate: new Date(filters.startDate) });
      }
      if (filters?.endDate) {
        query.andWhere('m.createdAt <= :endDate', { endDate: new Date(filters.endDate) });
      }

      const records = await query.getMany();

      const summary = {
        total: records.length,
        completed: records.filter((r) => r.estado === 'COMPLETADO').length,
        pending: records.filter((r) => r.estado === 'PROGRAMADO' || r.estado === 'PENDIENTE')
          .length,
        inProgress: records.filter((r) => r.estado === 'EN_PROCESO').length,
        totalCost: records.reduce((acc, r) => acc + (Number(r.costoReal) || 0), 0),
      };

      const distribution = {
        status: [
          { label: 'Completado', value: summary.completed, color: '#10b981' },
          { label: 'Pendiente', value: summary.pending, color: '#3b82f6' },
          { label: 'En Proceso', value: summary.inProgress, color: '#f59e0b' },
          {
            label: 'Cancelado',
            value: records.filter((r) => r.estado === 'CANCELADO').length,
            color: '#ef4444',
          },
        ].filter((d) => d.value > 0),
        type: [
          {
            label: 'Preventivo',
            value: records.filter((r) => r.tipoMantenimiento === 'PREVENTIVO').length,
            color: '#6366f1',
          },
          {
            label: 'Correctivo',
            value: records.filter((r) => r.tipoMantenimiento === 'CORRECTIVO').length,
            color: '#f43f5e',
          },
          {
            label: 'Predictivo',
            value: records.filter((r) => r.tipoMantenimiento === 'PREDICTIVO').length,
            color: '#8b5cf6',
          },
        ].filter((d) => d.value > 0),
      };

      return {
        summary,
        distribution,
        metadata: {
          ...filters,
          generated_at: new Date().toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Error getting maintenance stats', {
        error: error instanceof Error ? error.message : String(error),
        context: 'MaintenanceService.getStats',
      });
      throw new DatabaseError('Failed to get maintenance statistics');
    }
  }
}
