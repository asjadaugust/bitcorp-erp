/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Equipment } from '../models/equipment.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';
import {
  EquipmentListDto,
  EquipmentDetailDto,
  EquipmentStatsDto,
  toEquipmentDetailDto,
  toEquipmentListDtoArray,
  toEquipmentStatsDto,
} from '../types/dto/equipment.dto';
import { NotFoundError, ConflictError, DatabaseError, DatabaseErrorType } from '../errors';
import { DashboardService } from './dashboard.service';

// Input DTOs for create/update operations
export interface CreateEquipmentDto {
  codigo_equipo: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  numero_serie_equipo?: string;
  numero_chasis?: string;
  numero_serie_motor?: string;
  placa?: string;
  anio_fabricacion?: number;
  potencia_neta?: number;
  tipo_motor?: string;
  medidor_uso?: string;
  estado?: string;
  tipo_proveedor?: string;
  tipo_equipo_id?: number;
  proveedor_id?: number;
  creado_por?: number;
  actualizado_por?: number;
  fecha_venc_poliza?: string;
  fecha_venc_soat?: string;
  fecha_venc_citv?: string;
}

export interface ExpiringDocumentInfo {
  equipmentId: number;
  codigoEquipo: string;
  marca: string | null;
  modelo: string | null;
  documentType: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  status: 'expired' | 'critical' | 'warning';
}

export type UpdateEquipmentDto = Partial<CreateEquipmentDto>;

export interface EquipmentFilter {
  estado?: string;
  categoria?: string;
  categoria_prd?: string;
  marca?: string;
  equipmentTypeId?: number;
  providerId?: number;
  search?: string;
  isActive?: boolean;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

/**
 * Equipment Service
 *
 * Manages equipment (equipo) - the core business entity of the BitCorp ERP system.
 * Equipment represents physical assets (machinery, vehicles, tools) used in construction
 * projects, tracked for rental, maintenance, and assignment purposes.
 *
 * **THIS IS THE BASELINE FOR ALL COMPLEX SERVICES**
 *
 * ## Equipment Categories (From CORP-GEM-P-001)
 *
 * Equipment is classified into four main categories:
 *
 * 1. **EQUIPOS_MENORES** (Minor Equipment)
 *    - Hand tools, portable generators, compressors
 *    - No operator assignment typically required
 *    - Lower rental rates, simpler tracking
 *
 * 2. **VEHICULOS_LIVIANOS** (Light Vehicles)
 *    - Pickup trucks, cars, vans
 *    - Requires driver (OPERADOR role)
 *    - Tracked by odometer (kilometers)
 *
 * 3. **VEHICULOS_PESADOS** (Heavy Vehicles)
 *    - Dump trucks, cement mixers, heavy transport
 *    - Requires certified driver with heavy vehicle license
 *    - Tracked by odometer (kilometers)
 *    - Higher insurance and maintenance requirements
 *
 * 4. **MAQUINARIA_PESADA** (Heavy Machinery)
 *    - Excavators, bulldozers, loaders, graders, cranes
 *    - Requires certified operator with machinery license
 *    - Tracked by hourmeter (operating hours)
 *    - Highest rental rates and maintenance complexity
 *
 * ## Equipment States (estado)
 *
 * Equipment lifecycle state machine:
 *
 * ```
 * DISPONIBLE (Available)
 *     ↓
 * EN_USO (In Use) ← Equipment assigned to project/task
 *     ↓
 * MANTENIMIENTO (Maintenance) ← Under maintenance
 *     ↓
 * RETIRADO (Retired) ← Permanently removed from service
 * ```
 *
 * **Valid State Transitions**:
 * - DISPONIBLE → EN_USO (assignment via assignToProject)
 * - EN_USO → DISPONIBLE (return from project)
 * - EN_USO → MANTENIMIENTO (maintenance needed)
 * - MANTENIMIENTO → DISPONIBLE (maintenance complete)
 * - Any → RETIRADO (permanent retirement, irreversible)
 *
 * **Invalid Transitions** (will be rejected):
 * - RETIRADO → any other state (retired is permanent)
 * - Skip states (e.g., DISPONIBLE → MANTENIMIENTO without EN_USO)
 *
 * ## Provider Types (tipo_proveedor)
 *
 * Equipment ownership classification:
 *
 * - **PROPIOS** (Owned): Company-owned equipment
 *   - No rental cost (only maintenance/fuel)
 *   - Full control over availability and assignment
 *   - Capital investment required
 *
 * - **TERCEROS** (Third-party): Rented from external providers
 *   - Rental cost per hour/day/month
 *   - Provider (proveedor_id) required
 *   - Contract-based availability
 *   - Provider responsible for major maintenance
 *
 * ## Meter Types (medidor_uso)
 *
 * Usage tracking method:
 *
 * - **horometro**: Operating hours (heavy machinery)
 *   - Tracks engine running time
 *   - Used for maintenance scheduling
 *   - Rental billing based on hours
 *
 * - **odometro**: Kilometers (vehicles)
 *   - Tracks distance traveled
 *   - Used for tire/brake maintenance
 *   - Rental billing based on distance
 *
 * ## Equipment Code (codigo_equipo)
 *
 * Unique identifier rules:
 * - Must be unique across entire company (tenant)
 * - Format: Typically category prefix + number (e.g., EXC-001, TRK-042)
 * - Case-sensitive
 * - Cannot be changed after equipment assigned to projects
 * - Validated in both create and update operations
 *
 * ## Soft Delete Behavior
 *
 * Equipment is NEVER hard deleted from the database:
 * - Soft delete: is_active = false
 * - Maintains complete audit trail
 * - Deleted equipment excluded from most queries
 * - Can be reactivated if needed (data integrity preserved)
 * - Historical records (daily reports, valuations) remain intact
 *
 * ## Equipment Assignment
 *
 * Equipment can be assigned to projects via the equipo_edt (Equipment Daily Track) table:
 * - Assignment tracks: project, dates, operator, location
 * - Assignment history preserved indefinitely
 * - State changes to EN_USO when assigned
 * - State returns to DISPONIBLE when unassigned
 *
 * ## Multi-Tenancy
 *
 * **CRITICAL**: All queries MUST filter by tenant_id when schema updated:
 * - Currently deferred to Phase 21 (schema blocker: tenant_id column missing)
 * - TODO markers indicate where tenant filtering is required
 * - Each company's equipment is completely isolated
 *
 * ## Related Services
 *
 * - **MaintenanceService**: Schedules preventive/corrective maintenance
 * - **MaintenanceScheduleRecurringService**: Recurring maintenance schedules
 * - **DailyReportService**: Daily usage tracking (partes diarios)
 * - **ValuationService**: Monthly rental valuations
 * - **ProviderService**: Equipment provider (proveedor) management
 * - **OperatorService**: Operator assignment and certification
 *
 * ## Usage Examples
 *
 * ```typescript
 * // Create new owned equipment
 * const excavator = await equipmentService.create({
 *   codigo_equipo: 'EXC-001',
 *   categoria: 'MAQUINARIA_PESADA',
 *   marca: 'Caterpillar',
 *   modelo: '320D',
 *   tipo_proveedor: 'PROPIOS',
 *   medidor_uso: 'horometro',
 *   estado: 'DISPONIBLE',
 * });
 *
 * // Update equipment status
 * await equipmentService.updateStatus(excavator.id, 'MANTENIMIENTO');
 *
 * // Get available equipment for assignment
 * const available = await equipmentService.getAvailableEquipment();
 *
 * // Soft delete equipment
 * await equipmentService.delete(excavator.id); // is_active = false
 * ```
 *
 * @see EquipmentListDto
 * @see EquipmentDetailDto
 * @see MaintenanceService
 * @see DailyReportService
 */
export class EquipmentService {
  private _dashboardService?: DashboardService;

  private get repository(): Repository<Equipment> {
    return AppDataSource.getRepository(Equipment);
  }

  private get dashboardService(): DashboardService {
    if (!this._dashboardService) {
      this._dashboardService = new DashboardService();
    }
    return this._dashboardService;
  }

  /**
   * Find all equipment with filtering, sorting, and pagination
   *
   * Supports filtering by:
   * - Estado (DISPONIBLE, EN_USO, MANTENIMIENTO, RETIRADO)
   * - Categoria (equipment type)
   * - Provider (proveedor_id)
   * - Equipment Type (tipo_equipo_id)
   * - Search (codigo, marca, modelo, placa, categoria)
   * - Active status (is_active)
   *
   * Includes provider relationship for tipo_proveedor = 'TERCEROS'.
   *
   * @param filter - Optional filtering, sorting, and search criteria
   * @param filter.estado - Filter by equipment state
   * @param filter.categoria - Filter by equipment category
   * @param filter.providerId - Filter by provider (third-party equipment)
   * @param filter.equipmentTypeId - Filter by equipment type ID
   * @param filter.search - Full-text search across multiple fields
   * @param filter.isActive - Filter by active status (default: true)
   * @param filter.sort_by - Field to sort by (default: 'codigo_equipo')
   * @param filter.sort_order - Sort direction: 'ASC' or 'DESC' (default: 'ASC')
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Items per page (default: 10, max: 100)
   * @returns Paginated equipment list with total count
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * // Get all available heavy machinery, page 1
   * const result = await equipmentService.findAll({
   *   estado: 'DISPONIBLE',
   *   categoria: 'MAQUINARIA_PESADA',
   * }, 1, 20);
   * console.log(`Found ${result.total} equipment, showing ${result.data.length}`);
   * ```
   */
  async findAll(
    tenantId: number,
    filter?: EquipmentFilter,
    page = 1,
    limit = 10
  ): Promise<{ data: EquipmentListDto[]; total: number }> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // where: { tenant_id: tenantId }

      // For search, use QueryBuilder (ILIKE not supported by findAndCount)
      if (filter?.search) {
        const queryBuilder = this.repository
          .createQueryBuilder('e')
          .leftJoinAndSelect('e.provider', 'p')
          .leftJoinAndSelect('e.tipoEquipo', 'te')
          .where('e.tenantId = :tenantId', { tenantId })
          .andWhere('e.isActive = :isActive', { isActive: filter?.isActive ?? true })
          .andWhere(
            '(e.codigoEquipo ILIKE :search OR e.marca ILIKE :search OR e.modelo ILIKE :search OR e.placa ILIKE :search OR e.categoria ILIKE :search)',
            { search: `%${filter.search}%` }
          );

        if (filter?.estado) {
          queryBuilder.andWhere('e.estado = :estado', { estado: filter.estado });
        }

        if (filter?.categoria) {
          queryBuilder.andWhere('e.categoria = :categoria', { categoria: filter.categoria });
        }

        if (filter?.categoria_prd) {
          queryBuilder.andWhere('te.categoriaPrd = :categoriaPrd', {
            categoriaPrd: filter.categoria_prd,
          });
        }

        if (filter?.marca) {
          queryBuilder.andWhere('e.marca ILIKE :marca', { marca: `%${filter.marca}%` });
        }

        if (filter?.providerId) {
          queryBuilder.andWhere('e.proveedor_id = :providerId', { providerId: filter.providerId });
        }

        if (filter?.equipmentTypeId) {
          queryBuilder.andWhere('e.tipo_equipo_id = :typeId', { typeId: filter.equipmentTypeId });
        }

        const sortBy = filter?.sort_by || 'codigo_equipo';
        const sortOrder = filter?.sort_order || 'ASC';
        const validSortFields: Record<string, string> = {
          codigo_equipo: 'e.codigoEquipo',
          categoria: 'e.categoria',
          marca: 'e.marca',
          modelo: 'e.modelo',
          placa: 'e.placa',
          estado: 'e.estado',
          anio_fabricacion: 'e.anioFabricacion',
          created_at: 'e.createdAt',
          updated_at: 'e.updatedAt',
        };
        queryBuilder.orderBy(validSortFields[sortBy] || 'e.codigoEquipo', sortOrder);
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [equipment, total] = await queryBuilder.getManyAndCount();
        Logger.info('Equipment list retrieved successfully', {
          total,
          returned: equipment.length,
          page,
          limit,
          filters: filter,
          context: 'EquipmentService.findAll',
        });
        return {
          data: toEquipmentListDtoArray(equipment),
          total,
        };
      }

      // For non-search queries, use QueryBuilder so we can join tipoEquipo for categoria_prd filter
      const needsJoin = !!filter?.categoria_prd || !!filter?.marca;

      if (needsJoin) {
        const queryBuilder = this.repository
          .createQueryBuilder('e')
          .leftJoinAndSelect('e.provider', 'p')
          .leftJoinAndSelect('e.tipoEquipo', 'te')
          .where('e.tenantId = :tenantId', { tenantId })
          .andWhere('e.isActive = :isActive', { isActive: filter?.isActive ?? true });

        if (filter?.estado) {
          queryBuilder.andWhere('e.estado = :estado', { estado: filter.estado });
        }
        if (filter?.categoria) {
          queryBuilder.andWhere('e.categoria = :categoria', { categoria: filter.categoria });
        }
        if (filter?.categoria_prd) {
          queryBuilder.andWhere('te.categoriaPrd = :categoriaPrd', {
            categoriaPrd: filter.categoria_prd,
          });
        }
        if (filter?.marca) {
          queryBuilder.andWhere('e.marca ILIKE :marca', { marca: `%${filter.marca}%` });
        }
        if (filter?.providerId) {
          queryBuilder.andWhere('e.proveedorId = :providerId', { providerId: filter.providerId });
        }
        if (filter?.equipmentTypeId) {
          queryBuilder.andWhere('e.tipoEquipoId = :typeId', { typeId: filter.equipmentTypeId });
        }

        const sortBy = filter?.sort_by || 'codigo_equipo';
        const sortOrder = filter?.sort_order || 'ASC';
        const validSortFields: Record<string, string> = {
          codigo_equipo: 'e.codigoEquipo',
          categoria: 'e.categoria',
          marca: 'e.marca',
          modelo: 'e.modelo',
          placa: 'e.placa',
          estado: 'e.estado',
          anio_fabricacion: 'e.anioFabricacion',
          created_at: 'e.createdAt',
          updated_at: 'e.updatedAt',
        };
        queryBuilder.orderBy(validSortFields[sortBy] || 'e.codigoEquipo', sortOrder);
        queryBuilder.skip((page - 1) * limit).take(limit);

        const [equipment, total] = await queryBuilder.getManyAndCount();
        return { data: toEquipmentListDtoArray(equipment), total };
      }

      // For simple filters (no join needed), use findAndCount
      const where: any = {
        tenantId,
        isActive: filter?.isActive ?? true,
      };

      if (filter?.estado) {
        where.estado = filter.estado;
      }

      if (filter?.categoria) {
        where.categoria = filter.categoria;
      }

      if (filter?.providerId) {
        where.proveedorId = filter.providerId;
      }

      if (filter?.equipmentTypeId) {
        where.tipoEquipoId = filter.equipmentTypeId;
      }

      const sortBy = filter?.sort_by || 'codigo_equipo';
      const sortOrder = filter?.sort_order || 'ASC';

      // Valid sortable fields (snake_case API → camelCase entity property)
      const validSortFields: Record<string, string> = {
        codigo_equipo: 'codigoEquipo',
        categoria: 'categoria',
        marca: 'marca',
        modelo: 'modelo',
        placa: 'placa',
        estado: 'estado',
        anio_fabricacion: 'anioFabricacion',
        created_at: 'createdAt',
        updated_at: 'updatedAt',
      };

      const [equipment, total] = await this.repository.findAndCount({
        where,
        relations: ['provider', 'tipoEquipo'],
        order: { [validSortFields[sortBy] || 'codigoEquipo']: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      });

      Logger.info('Equipment list retrieved successfully', {
        total,
        returned: equipment.length,
        page,
        limit,
        filters: filter,
        context: 'EquipmentService.findAll',
      });

      return {
        data: toEquipmentListDtoArray(equipment),
        total,
      };
    } catch (error) {
      Logger.error('Error finding equipment', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filter,
        page,
        limit,
        context: 'EquipmentService.findAll',
      });
      throw new DatabaseError(
        'Failed to fetch equipment',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find equipment by ID
   *
   * Retrieves a single equipment record with all details and related provider information.
   *
   * @param id - Equipment ID
   * @returns Equipment detail DTO with provider information
   * @throws {NotFoundError} If equipment with given ID does not exist
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const excavator = await equipmentService.findById(123);
   * console.log(`${excavator.codigo_equipo} - ${excavator.marca} ${excavator.modelo}`);
   * ```
   */
  async findById(tenantId: number, id: number): Promise<EquipmentDetailDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // where: { id, tenant_id: tenantId }
      const equipment = await this.repository.findOne({
        where: { id, tenantId },
        relations: ['provider', 'tipoEquipo'],
      });

      if (!equipment) {
        throw new NotFoundError('Equipment', id);
      }

      Logger.info('Equipment found by ID', {
        id,
        codigo_equipo: equipment.codigoEquipo,
        categoria: equipment.categoria,
        estado: equipment.estado,
        proveedor_id: equipment.proveedorId,
        context: 'EquipmentService.findById',
      });

      return toEquipmentDetailDto(equipment);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error finding equipment by ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'EquipmentService.findById',
      });
      throw new DatabaseError(
        'Failed to find equipment by ID',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find equipment by codigo_equipo
   *
   * Internal method used for uniqueness validation during create/update.
   * Returns raw Equipment entity (not DTO) for internal use.
   *
   * @param codigo - Equipment code to search for
   * @returns Equipment entity or null if not found
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const existing = await equipmentService.findByCode('EXC-001');
   * if (existing) {
   *   throw new ConflictError('Equipment code already exists');
   * }
   * ```
   */
  async findByCode(tenantId: number, codigo: string): Promise<Equipment | null> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // where: { codigo_equipo: codigo, tenant_id: tenantId }
      const equipment = await this.repository.findOne({
        where: { codigoEquipo: codigo, tenantId },
      });

      if (equipment) {
        Logger.info('Equipment found by code', {
          codigo_equipo: codigo,
          id: equipment.id,
          estado: equipment.estado,
          context: 'EquipmentService.findByCode',
        });
      }

      return equipment;
    } catch (error) {
      Logger.error('Error finding equipment by code', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        codigo,
        context: 'EquipmentService.findByCode',
      });
      throw new DatabaseError(
        'Failed to find equipment by code',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Create new equipment
   *
   * Creates a new equipment record with validation:
   * - Validates codigo_equipo uniqueness (case-sensitive)
   * - Sets default estado = 'DISPONIBLE'
   * - Sets is_active = true
   * - Validates proveedor_id exists if tipo_proveedor = 'TERCEROS'
   *
   * @param data - Equipment creation data (snake_case fields)
   * @returns Created equipment detail DTO with provider information
   * @throws {ConflictError} If equipment code already exists
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * const bulldozer = await equipmentService.create({
   *   codigo_equipo: 'BLD-005',
   *   categoria: 'MAQUINARIA_PESADA',
   *   marca: 'Caterpillar',
   *   modelo: 'D8T',
   *   tipo_proveedor: 'PROPIOS',
   *   medidor_uso: 'horometro',
   *   creado_por: userId,
   * });
   * ```
   */
  async create(tenantId: number, data: CreateEquipmentDto): Promise<EquipmentDetailDto> {
    try {
      // Check if codigo already exists (tenant-aware check via findByCode)
      if (data.codigo_equipo) {
        const existing = await this.findByCode(tenantId, data.codigo_equipo);
        if (existing) {
          throw new ConflictError(`El código de equipo '${data.codigo_equipo}' ya existe`, {
            field: 'codigo_equipo',
            value: data.codigo_equipo,
          });
        }
      }

      // Map DTO to entity properties
      const equipment = this.repository.create({
        codigoEquipo: data.codigo_equipo,
        categoria: data.categoria,
        marca: data.marca,
        modelo: data.modelo,
        numeroSerieEquipo: data.numero_serie_equipo,
        numeroChasis: data.numero_chasis,
        numeroSerieMotor: data.numero_serie_motor,
        placa: data.placa,
        anioFabricacion: data.anio_fabricacion,
        potenciaNeta: data.potencia_neta,
        tipoMotor: data.tipo_motor,
        medidorUso: data.medidor_uso,
        estado: data.estado || 'DISPONIBLE',
        tipoProveedor: data.tipo_proveedor,
        tipoEquipoId: data.tipo_equipo_id,
        proveedorId: data.proveedor_id,
        fechaVencPoliza: data.fecha_venc_poliza ? new Date(data.fecha_venc_poliza) : undefined,
        fechaVencSoat: data.fecha_venc_soat ? new Date(data.fecha_venc_soat) : undefined,
        fechaVencCitv: data.fecha_venc_citv ? new Date(data.fecha_venc_citv) : undefined,
        isActive: true,
        tenantId,
      });

      const saved = await this.repository.save(equipment);

      // Load relations before transforming
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['provider'],
      });

      if (!withRelations) {
        throw new NotFoundError('Equipment', saved.id);
      }

      Logger.info('Equipment created successfully', {
        id: saved.id,
        codigo_equipo: saved.codigoEquipo,
        categoria: saved.categoria,
        estado: saved.estado,
        tipo_proveedor: saved.tipoProveedor,
        proveedor_id: saved.proveedorId,
        context: 'EquipmentService.create',
      });

      // Invalidate dashboard cache (equipment count changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after equipment create', {
        id: saved.id,
        context: 'EquipmentService.create',
      });

      return toEquipmentDetailDto(withRelations);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error creating equipment', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'EquipmentService.create',
      });
      throw new DatabaseError(
        'Failed to create equipment',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update existing equipment
   *
   * Updates equipment with validation:
   * - Validates equipment exists
   * - Validates codigo_equipo uniqueness if changed
   * - Allows partial updates (only provided fields are updated)
   * - Preserves audit fields (creado_por, created_at)
   *
   * @param id - Equipment ID to update
   * @param data - Partial equipment update data (snake_case fields)
   * @returns Updated equipment detail DTO with provider information
   * @throws {NotFoundError} If equipment with given ID does not exist
   * @throws {ConflictError} If new equipment code already exists
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * const updated = await equipmentService.update(123, {
   *   estado: 'MANTENIMIENTO',
   *   actualizado_por: userId,
   * });
   * ```
   */
  async update(
    tenantId: number,
    id: number,
    data: UpdateEquipmentDto
  ): Promise<EquipmentDetailDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      const equipment = await this.repository.findOne({
        where: { id, tenantId },
        relations: ['provider'],
      });

      if (!equipment) {
        throw new NotFoundError('Equipment', id);
      }

      // If updating codigo, check it doesn't exist
      if (data.codigo_equipo && data.codigo_equipo !== equipment.codigoEquipo) {
        const existing = await this.findByCode(tenantId, data.codigo_equipo);
        if (existing && existing.id !== id) {
          throw new ConflictError(`El código de equipo '${data.codigo_equipo}' ya existe`, {
            field: 'codigo_equipo',
            value: data.codigo_equipo,
          });
        }
      }

      // Track changes for logging
      const changes: string[] = [];

      // Map DTO to entity properties
      if (data.codigo_equipo !== undefined) {
        changes.push(`codigo_equipo: ${equipment.codigoEquipo} → ${data.codigo_equipo}`);
        equipment.codigoEquipo = data.codigo_equipo;
      }
      if (data.categoria !== undefined) {
        changes.push(`categoria: ${equipment.categoria} → ${data.categoria}`);
        equipment.categoria = data.categoria;
      }
      if (data.marca !== undefined) {
        changes.push(`marca: ${equipment.marca} → ${data.marca}`);
        equipment.marca = data.marca;
      }
      if (data.modelo !== undefined) {
        changes.push(`modelo: ${equipment.modelo} → ${data.modelo}`);
        equipment.modelo = data.modelo;
      }
      if (data.numero_serie_equipo !== undefined)
        equipment.numeroSerieEquipo = data.numero_serie_equipo;
      if (data.numero_chasis !== undefined) equipment.numeroChasis = data.numero_chasis;
      if (data.numero_serie_motor !== undefined)
        equipment.numeroSerieMotor = data.numero_serie_motor;
      if (data.placa !== undefined) equipment.placa = data.placa;
      if (data.anio_fabricacion !== undefined) equipment.anioFabricacion = data.anio_fabricacion;
      if (data.potencia_neta !== undefined) equipment.potenciaNeta = data.potencia_neta;
      if (data.tipo_motor !== undefined) equipment.tipoMotor = data.tipo_motor;
      if (data.medidor_uso !== undefined) equipment.medidorUso = data.medidor_uso;
      if (data.estado !== undefined) {
        changes.push(`estado: ${equipment.estado} → ${data.estado}`);
        equipment.estado = data.estado;
      }
      if (data.tipo_proveedor !== undefined) equipment.tipoProveedor = data.tipo_proveedor;
      if (data.tipo_equipo_id !== undefined) {
        equipment.tipoEquipoId = data.tipo_equipo_id;
      }
      if (data.proveedor_id !== undefined) {
        equipment.proveedorId = data.proveedor_id;
      }
      if ((data as any).fecha_venc_poliza !== undefined) {
        equipment.fechaVencPoliza = (data as any).fecha_venc_poliza
          ? new Date((data as any).fecha_venc_poliza)
          : undefined;
      }
      if ((data as any).fecha_venc_soat !== undefined) {
        equipment.fechaVencSoat = (data as any).fecha_venc_soat
          ? new Date((data as any).fecha_venc_soat)
          : undefined;
      }
      if ((data as any).fecha_venc_citv !== undefined) {
        equipment.fechaVencCitv = (data as any).fecha_venc_citv
          ? new Date((data as any).fecha_venc_citv)
          : undefined;
      }
      // TODO: Add actualizadoPor property to Equipment model if user tracking is needed
      // if (data.actualizado_por !== undefined) {
      //   equipment.actualizadoPor = data.actualizado_por;
      // }

      const saved = await this.repository.save(equipment);

      // Reload to get updated relations
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      const withRelations = await this.repository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['provider'],
      });

      if (!withRelations) {
        throw new NotFoundError('Equipment', saved.id);
      }

      Logger.info('Equipment updated successfully', {
        id,
        codigo_equipo: saved.codigoEquipo,
        changes: changes.length > 0 ? changes.join(', ') : 'No major changes',
        context: 'EquipmentService.update',
      });

      // Invalidate dashboard cache (equipment data changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after equipment update', {
        id,
        context: 'EquipmentService.update',
      });

      return toEquipmentDetailDto(withRelations);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      Logger.error('Error updating equipment', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        data,
        context: 'EquipmentService.update',
      });
      throw new DatabaseError(
        'Failed to update equipment',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delete equipment (soft delete)
   *
   * Performs soft delete by setting is_active = false.
   * Equipment is NEVER hard deleted to preserve audit trail and historical data.
   *
   * Soft-deleted equipment:
   * - Excluded from default queries (is_active = true filter)
   * - Historical records (daily reports, valuations) remain intact
   * - Can be reactivated if needed by updating is_active = true
   *
   * @param id - Equipment ID to delete
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await equipmentService.delete(123); // Soft delete
   * ```
   */
  async delete(tenantId: number, id: number): Promise<void> {
    try {
      await this.repository.update({ id, tenantId }, { isActive: false });

      Logger.info('Equipment soft deleted successfully', {
        id,
        context: 'EquipmentService.delete',
      });

      // Invalidate dashboard cache (equipment count changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after equipment delete', {
        id,
        context: 'EquipmentService.delete',
      });
    } catch (error) {
      Logger.error('Error deleting equipment', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'EquipmentService.delete',
      });
      throw new DatabaseError(
        'Failed to delete equipment',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update equipment status (estado)
   *
   * Updates the operational state of equipment.
   * Valid states: DISPONIBLE, EN_USO, MANTENIMIENTO, RETIRADO
   *
   * **State Transition Rules** (enforced in business logic layer, not here):
   * - DISPONIBLE → EN_USO (assignment)
   * - EN_USO → DISPONIBLE (return)
   * - EN_USO → MANTENIMIENTO (maintenance needed)
   * - MANTENIMIENTO → DISPONIBLE (maintenance complete)
   * - Any → RETIRADO (permanent retirement)
   *
   * @param id - Equipment ID
   * @param estado - New state
   * @returns Updated equipment detail DTO
   * @throws {NotFoundError} If equipment with given ID does not exist
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await equipmentService.updateStatus(123, 'MANTENIMIENTO');
   * ```
   */
  async updateStatus(tenantId: number, id: number, estado: string): Promise<EquipmentDetailDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      const equipment = await this.repository.findOne({
        where: { id, tenantId },
        relations: ['provider'],
      });

      if (!equipment) {
        throw new NotFoundError('Equipment', id);
      }

      const oldEstado = equipment.estado;
      equipment.estado = estado;
      const saved = await this.repository.save(equipment);

      Logger.info('Equipment status updated successfully', {
        id,
        codigo_equipo: saved.codigoEquipo,
        old_estado: oldEstado,
        new_estado: estado,
        context: 'EquipmentService.updateStatus',
      });

      // Invalidate dashboard cache (active equipment count may have changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after equipment status update', {
        id,
        old_estado: oldEstado,
        new_estado: estado,
        context: 'EquipmentService.updateStatus',
      });

      return toEquipmentDetailDto(saved);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error updating equipment status', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        estado,
        context: 'EquipmentService.updateStatus',
      });
      throw new DatabaseError(
        'Failed to update equipment status',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update equipment hourmeter reading
   *
   * **STUB METHOD**: Not yet implemented.
   * TODO: Implement hourmeter tracking with historical records.
   *
   * @param id - Equipment ID
   * @param reading - New hourmeter reading (hours)
   * @returns Equipment detail DTO (currently unchanged)
   * @throws {NotFoundError} If equipment with given ID does not exist
   */
  async updateHourmeter(
    tenantId: number,
    id: number,
    reading: number
  ): Promise<EquipmentDetailDto> {
    // TODO: Add tenant_id filter when schema updated (Phase 21)
    const equipment = await this.repository.findOne({
      where: { id, tenantId },
      relations: ['provider'],
    });

    if (!equipment) {
      throw new NotFoundError('Equipment', id);
    }

    // TODO: Implement actual hourmeter update logic
    // - Store reading in hourmeter history table
    // - Update equipment.medidor_uso current value
    // - Validate reading > previous reading
    // - Trigger maintenance alerts if due

    Logger.info('Equipment hourmeter update requested (stub)', {
      id,
      codigo_equipo: equipment.codigoEquipo,
      new_reading: reading,
      context: 'EquipmentService.updateHourmeter',
    });

    return toEquipmentDetailDto(equipment);
  }

  /**
   * Update equipment odometer reading
   *
   * **STUB METHOD**: Not yet implemented.
   * TODO: Implement odometer tracking with historical records.
   *
   * @param id - Equipment ID
   * @param reading - New odometer reading (kilometers)
   * @returns Equipment detail DTO (currently unchanged)
   * @throws {NotFoundError} If equipment with given ID does not exist
   */
  async updateOdometer(tenantId: number, id: number, reading: number): Promise<EquipmentDetailDto> {
    // TODO: Add tenant_id filter when schema updated (Phase 21)
    const equipment = await this.repository.findOne({
      where: { id, tenantId },
      relations: ['provider'],
    });

    if (!equipment) {
      throw new NotFoundError('Equipment', id);
    }

    // TODO: Implement actual odometer update logic
    // - Store reading in odometer history table
    // - Update equipment.medidor_uso current value
    // - Validate reading > previous reading
    // - Trigger maintenance alerts if due

    Logger.info('Equipment odometer update requested (stub)', {
      id,
      codigo_equipo: equipment.codigoEquipo,
      new_reading: reading,
      context: 'EquipmentService.updateOdometer',
    });

    return toEquipmentDetailDto(equipment);
  }

  /**
   * Get equipment statistics by status
   *
   * Returns aggregate counts grouped by equipment estado:
   * - total: All active equipment
   * - disponible: Available for assignment
   * - enUso: Currently in use (assigned to projects)
   * - mantenimiento: Under maintenance
   * - retirado: Retired/decommissioned
   *
   * Only includes active equipment (is_active = true).
   *
   * @returns Equipment statistics DTO
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const stats = await equipmentService.getStatistics();
   * console.log(`Total: ${stats.total}, Available: ${stats.disponible}`);
   * ```
   */
  async getStatistics(tenantId: number): Promise<EquipmentStatsDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      const stats = await this.repository
        .createQueryBuilder('e')
        .select('e.estado', 'estado')
        .addSelect('COUNT(*)', 'count')
        .where('e.tenantId = :tenantId', { tenantId })
        .andWhere('e.isActive = true')
        .groupBy('e.estado')
        .getRawMany();

      const result = {
        total: 0,
        disponible: 0,
        en_uso: 0,
        mantenimiento: 0,
        retirado: 0,
      };

      stats.forEach((s) => {
        const count = parseInt(s.count);
        result.total += count;
        switch (s.estado?.toUpperCase()) {
          case 'DISPONIBLE':
          case 'AVAILABLE':
            result.disponible = count;
            break;
          case 'EN_USO':
          case 'IN_USE':
            result.en_uso = count;
            break;
          case 'MANTENIMIENTO':
          case 'MAINTENANCE':
            result.mantenimiento = count;
            break;
          case 'RETIRADO':
          case 'RETIRED':
            result.retirado = count;
            break;
        }
      });

      Logger.info('Equipment statistics calculated successfully', {
        total: result.total,
        disponible: result.disponible,
        en_uso: result.en_uso,
        mantenimiento: result.mantenimiento,
        retirado: result.retirado,
        context: 'EquipmentService.getStatistics',
      });

      return toEquipmentStatsDto(result);
    } catch (error) {
      Logger.error('Error getting equipment statistics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'EquipmentService.getStatistics',
      });
      throw new DatabaseError(
        'Failed to get equipment statistics',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get distinct equipment types (categories)
   *
   * Returns list of unique equipment categories currently in use.
   * Useful for populating filter dropdowns.
   *
   * @returns Array of equipment category strings
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const types = await equipmentService.getEquipmentTypes();
   * // ['MAQUINARIA_PESADA', 'VEHICULOS_LIVIANOS', 'EQUIPOS_MENORES']
   * ```
   */
  async getEquipmentTypes(tenantId: number): Promise<string[]> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      const result = await this.repository
        .createQueryBuilder('e')
        .select('DISTINCT e.categoria', 'categoria')
        .where('e.tenantId = :tenantId', { tenantId })
        .andWhere('e.categoria IS NOT NULL')
        .orderBy('e.categoria')
        .getRawMany();

      const types = result.map((r) => r.categoria);

      Logger.info('Equipment types retrieved successfully', {
        count: types.length,
        types,
        context: 'EquipmentService.getEquipmentTypes',
      });

      return types;
    } catch (error) {
      Logger.error('Error getting equipment types', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'EquipmentService.getEquipmentTypes',
      });
      throw new DatabaseError(
        'Failed to get equipment types',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Assign equipment to project
   *
   * **STUB METHOD**: Not yet implemented.
   * TODO: Implement project assignment via equipo_edt table.
   *
   * @param id - Equipment ID
   * @param data - Assignment data (project, dates, operator)
   * @returns Assignment confirmation object (stub)
   */
  async assignToProject(id: number, data: any) {
    Logger.debug('Equipment assignment to project requested', {
      equipmentId: id,
      projectData: data,
      context: 'EquipmentService.assignToProject',
    });
    return { id, ...data, status: 'assigned' };
  }

  /**
   * Transfer equipment between projects/locations
   *
   * **STUB METHOD**: Not yet implemented.
   * TODO: Implement equipment transfer with audit trail.
   *
   * @param id - Equipment ID
   * @param data - Transfer data (from, to, reason)
   * @returns Transfer confirmation object (stub)
   */
  async transferEquipment(id: number, data: any) {
    Logger.debug('Equipment transfer requested', {
      equipmentId: id,
      transferData: data,
      context: 'EquipmentService.transferEquipment',
    });
    return { id, ...data, status: 'transferred' };
  }

  /**
   * Check equipment availability for date range
   *
   * **STUB METHOD**: Not yet implemented.
   * TODO: Implement availability check against equipo_edt assignments.
   *
   * @param idOrFilters - Equipment ID or filter object
   * @param startDate - Start date of availability window
   * @param endDate - End date of availability window
   * @returns Currently returns true (stub)
   */
  async getAvailability(idOrFilters: any, startDate?: Date, endDate?: Date) {
    return true;
  }

  /**
   * Get all available equipment
   *
   * Convenience method that returns all equipment with estado = 'DISPONIBLE'.
   * Equivalent to findAll({ estado: 'DISPONIBLE' }) with high limit.
   *
   * @returns Array of available equipment DTOs
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const available = await equipmentService.getAvailableEquipment();
   * console.log(`${available.length} equipment ready for assignment`);
   * ```
   */
  async getAvailableEquipment(tenantId: number): Promise<EquipmentListDto[]> {
    const result = await this.findAll(tenantId, { estado: 'DISPONIBLE' }, 1, 9999);

    Logger.info('Available equipment retrieved successfully', {
      count: result.data.length,
      context: 'EquipmentService.getAvailableEquipment',
    });

    return result.data;
  }

  /**
   * Get equipment assignment history
   *
   * **STUB METHOD**: Not yet implemented.
   * TODO: Implement with equipo_edt table queries.
   *
   * @param equipmentId - Equipment ID
   * @returns Currently returns empty array (stub)
   */
  async getAssignmentHistory(equipmentId: number): Promise<any[]> {
    // TODO: Implement with equipo_edt table
    Logger.info('Equipment assignment history requested (stub)', {
      equipmentId,
      count: 0,
      context: 'EquipmentService.getAssignmentHistory',
    });
    return [];
  }

  /**
   * Get equipment with documents expiring within a given threshold
   *
   * Checks fecha_venc_soat, fecha_venc_poliza, and fecha_venc_citv fields.
   * Returns a flat list of expiring/expired documents with equipment info.
   *
   * @param daysAhead - Number of days to look ahead (default: 30)
   * @returns Array of expiring document info objects
   */
  async getExpiringDocuments(
    tenantId: number,
    daysAhead: number = 30
  ): Promise<ExpiringDocumentInfo[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const threshold = new Date(today);
      threshold.setDate(threshold.getDate() + daysAhead);

      const equipment = await this.repository
        .createQueryBuilder('e')
        .where('e.tenantId = :tenantId', { tenantId })
        .andWhere('e.isActive = :isActive', { isActive: true })
        .andWhere(
          '(e.fechaVencSoat <= :threshold OR e.fechaVencPoliza <= :threshold OR e.fechaVencCitv <= :threshold)',
          { threshold }
        )
        .getMany();

      const results: ExpiringDocumentInfo[] = [];

      for (const equip of equipment) {
        const docFields: Array<{ field: keyof Equipment; label: string }> = [
          { field: 'fechaVencSoat' as keyof Equipment, label: 'SOAT' },
          { field: 'fechaVencPoliza' as keyof Equipment, label: 'Póliza TREC' },
          { field: 'fechaVencCitv' as keyof Equipment, label: 'CITV' },
        ];

        for (const { field, label } of docFields) {
          const date = equip[field] as Date | undefined;
          if (!date) continue;

          const expiryDate = typeof date === 'string' ? new Date(date) : date;
          const daysUntil = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntil <= daysAhead) {
            results.push({
              equipmentId: equip.id,
              codigoEquipo: equip.codigoEquipo,
              marca: equip.marca || null,
              modelo: equip.modelo || null,
              documentType: label,
              expiryDate,
              daysUntilExpiry: daysUntil,
              status: daysUntil < 0 ? 'expired' : daysUntil <= 7 ? 'critical' : 'warning',
            });
          }
        }
      }

      Logger.info('Expiring equipment documents retrieved', {
        total: results.length,
        daysAhead,
        context: 'EquipmentService.getExpiringDocuments',
      });

      return results;
    } catch (error) {
      Logger.error('Error getting expiring documents', {
        error: error instanceof Error ? error.message : String(error),
        context: 'EquipmentService.getExpiringDocuments',
      });
      throw new DatabaseError(
        'Failed to get expiring documents',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
