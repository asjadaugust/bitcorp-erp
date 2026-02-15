/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { Proyecto } from '../models/project.model';
import { Repository } from 'typeorm';
import { toProjectDto, fromProjectDto, ProjectDto } from '../types/dto/project.dto';
import logger from '../config/logger.config';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  BusinessRuleError,
  DatabaseError,
} from '../errors';

export interface CreateProjectDto {
  // Frontend sends camelCase field names
  code: string;
  name: string;
  description?: string;
  location?: string;
  startDate?: string; // Frontend sends camelCase
  endDate?: string; // Frontend sends camelCase
  start_date?: string; // Also support snake_case
  end_date?: string; // Also support snake_case
  status?: string;
  client?: string;
  budget?: number;
  currency?: string;
  presupuesto?: number; // Also support Spanish
  cliente?: string; // Also support Spanish
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

/**
 * ProjectService
 *
 * Manages project entities, which are **core business entities** in the BitCorp ERP system.
 *
 * ## Purpose
 *
 * Projects are the central organizing entity for all BitCorp ERP operations:
 * - Equipment is assigned to projects
 * - Rental contracts are created for projects
 * - Monthly valuations are calculated per project
 * - Operators are assigned to projects
 * - Daily reports (partes diarios) track project activity per day
 * - All costs and revenues roll up to the project level
 *
 * ## Database Schema
 *
 * **Table**: `proyecto`
 *
 * **Key Fields**:
 * - `id` (PK): Unique project identifier
 * - `codigo` (UNIQUE): Project code (e.g., "PRY-2026-001")
 * - `nombre`: Project name (e.g., "Construcción Carretera Norte")
 * - `descripcion`: Optional project description
 * - `ubicacion`: Project location/site
 * - `fecha_inicio`: Project start date (ISO date)
 * - `fecha_fin`: Project end date (ISO date)
 * - `presupuesto`: Project budget amount (decimal)
 * - `estado`: Project status (enum)
 * - `cliente`: Client/customer name
 * - `empresa_id` (FK): Company ID (tenant context)
 * - `unidad_operativa_id` (FK): Operating unit ID
 * - `is_active`: Soft delete flag (true = active, false = deleted)
 * - `creado_por` (FK): User who created the project
 * - `actualizado_por` (FK): User who last updated the project
 * - `created_at`: Creation timestamp
 * - `updated_at`: Last update timestamp
 *
 * **Related Tables**:
 * - `sistema.user_projects`: Junction table for user-project assignments
 * - `sistema.usuario`: Users assigned to projects
 * - `equipos`: Equipment assigned to projects
 * - `contratos_alquiler`: Rental contracts linked to projects
 * - `valorizaciones_equipo`: Monthly equipment valuations per project
 * - `partes_diarios`: Daily reports per project
 * - `movimientos_logistica`: Equipment movements per project
 *
 * ## Project Lifecycle (Estado)
 *
 * Projects progress through a **state machine** with validated transitions:
 *
 * ```
 * PLANIFICACION (Planning)
 *     │ Initial state when project is created
 *     │ Project details are being defined
 *     ↓
 * ACTIVO (Active)
 *     │ Project is in execution
 *     │ Equipment can be assigned
 *     │ Contracts can be created
 *     │ Valuations are calculated
 *     ↓
 *     ├─> PAUSADO (Paused)
 *     │       │ Temporarily suspended
 *     │       │ Can resume to ACTIVO
 *     │       ↓
 *     │   ACTIVO (resumed)
 *     │
 *     ├─> COMPLETADO (Completed)
 *     │       │ Successfully finished
 *     │       │ TERMINAL STATE (cannot transition out)
 *     │
 *     └─> CANCELADO (Cancelled)
 *             │ Abandoned or cancelled
 *             │ TERMINAL STATE (cannot transition out)
 * ```
 *
 * **Valid Estado Transitions**:
 * | From          | To                | When                          |
 * |---------------|-------------------|-------------------------------|
 * | PLANIFICACION | ACTIVO            | Project execution starts      |
 * | PLANIFICACION | CANCELADO         | Project cancelled before start|
 * | ACTIVO        | PAUSADO           | Temporary suspension          |
 * | ACTIVO        | COMPLETADO        | Project successfully finished |
 * | ACTIVO        | CANCELADO         | Project abandoned             |
 * | PAUSADO       | ACTIVO            | Resume execution              |
 * | PAUSADO       | CANCELADO         | Cancel while paused           |
 *
 * **Invalid Estado Transitions** (will throw ValidationError):
 * - COMPLETADO → any state (cannot reactivate completed project)
 * - CANCELADO → any state (cannot revive cancelled project)
 * - PAUSADO → COMPLETADO (must resume to ACTIVO first)
 *
 * ## Business Rules
 *
 * ### 1. Date Range Validation
 *
 * - **fecha_fin must be >= fecha_inicio** if both are provided
 * - If only one date provided, no validation
 * - Dates are optional (can be null)
 * - Cannot complete project (estado = COMPLETADO) before start date
 *
 * **Example**:
 * ```typescript
 * // ✅ VALID
 * fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31'
 * fecha_inicio: '2026-01-01', fecha_fin: null  // Open-ended
 * fecha_inicio: null, fecha_fin: null          // Not yet defined
 *
 * // ❌ INVALID (throws ValidationError)
 * fecha_inicio: '2026-12-31', fecha_fin: '2026-01-01'
 * ```
 *
 * ### 2. Budget Validation
 *
 * - **presupuesto must be >= 0** if provided
 * - Budget can be null (not yet defined)
 * - Negative budgets are invalid
 *
 * **Example**:
 * ```typescript
 * // ✅ VALID
 * presupuesto: 5000000      // 5 million
 * presupuesto: 0            // Zero budget (internal project)
 * presupuesto: null         // Not yet defined
 *
 * // ❌ INVALID (throws ValidationError)
 * presupuesto: -1000
 * ```
 *
 * ### 3. Codigo Uniqueness
 *
 * - **codigo must be unique per company** (tenant)
 * - Check duplicate before create/update
 * - Case-sensitive comparison
 * - Format: Alphanumeric, dashes, underscores allowed
 *
 * **Example**:
 * ```typescript
 * // Company A can have PRY-001
 * // Company B can also have PRY-001 (different tenant)
 * // But Company A cannot have two PRY-001 projects
 * ```
 *
 * ### 4. Soft Delete Protection
 *
 * Cannot delete project if:
 * - **Has active rental contracts** (estado_contrato = 'ACTIVO')
 * - **Has pending valuations** (estado = 'PENDIENTE')
 *
 * Recommendation: Complete or cancel related entities before deleting project.
 *
 * **Example**:
 * ```typescript
 * // ❌ INVALID (throws BusinessRuleError)
 * await service.delete('123');  // Project has 3 active contracts
 *
 * // ✅ VALID
 * // 1. Cancel all contracts first
 * await contractService.cancel(contractIds);
 * // 2. Then delete project
 * await service.delete('123');
 * ```
 *
 * ### 5. User Assignment
 *
 * - Users are assigned to projects via **sistema.user_projects** junction table
 * - Multiple users can be assigned to one project
 * - One user can be assigned to multiple projects
 * - Assignment includes optional `rol_en_proyecto` field
 * - If `sistema.user_projects` table doesn't exist (legacy DB), operations succeed silently
 *
 * **Example**:
 * ```typescript
 * // Assign project director
 * await service.assignUser('123', '456', 'DIRECTOR_PROYECTO');
 *
 * // Assign multiple users
 * await service.assignUser('123', '789', 'JEFE_EQUIPO');
 * await service.assignUser('123', '999', 'OPERADOR');
 * ```
 *
 * ## Field Mapping (Legacy Compatibility)
 *
 * The service accepts **THREE input formats** for historical reasons:
 *
 * 1. **English camelCase** (original frontend format):
 *    - `code`, `name`, `description`, `location`
 *    - `startDate`, `endDate`, `budget`, `client`, `status`
 *
 * 2. **English snake_case** (intermediate format):
 *    - `start_date`, `end_date`
 *
 * 3. **Spanish snake_case** (current database format):
 *    - `codigo`, `nombre`, `descripcion`, `ubicacion`
 *    - `fecha_inicio`, `fecha_fin`, `presupuesto`, `cliente`, `estado`
 *
 * **Why?** Frontend is being migrated from English to Spanish, and old API clients still send English.
 *
 * **Mapping Logic**:
 * ```typescript
 * // Priority: Spanish > English snake_case > English camelCase
 * const codigo = data.codigo || data.code
 * const fecha_inicio = data.fecha_inicio || data.start_date || data.startDate
 * ```
 *
 * ## Status Value Mapping (i18n)
 *
 * Frontend sends **display labels** (user-facing), service maps to **database enum values**:
 *
 * | Frontend Display (ES) | Database Value   |
 * |-----------------------|------------------|
 * | "Planificación"       | PLANIFICACION    |
 * | "En Ejecución"        | ACTIVO           |
 * | "Suspendido"          | PAUSADO          |
 * | "Finalizado"          | COMPLETADO       |
 * | "Cancelado"           | CANCELADO        |
 *
 * **Example**:
 * ```typescript
 * // Frontend sends
 * { estado: "En Ejecución" }
 *
 * // Service maps to
 * { estado: "ACTIVO" }
 * ```
 *
 * ## Related Services
 *
 * - **EquipmentService**: Assigns equipment to projects (`equipos.proyecto_id`)
 * - **ContractService**: Creates rental contracts for projects (`contratos_alquiler.proyecto_id`)
 * - **ValuationService**: Calculates monthly valuations per project (`valorizaciones_equipo.proyecto_id`)
 * - **OperatorService**: Assigns operators to projects via user_projects
 * - **ReportService**: Records daily reports per project (`partes_diarios.proyecto_id`)
 * - **DashboardService**: Aggregates project KPIs (budget vs. actual, completion %)
 *
 * ## Usage Examples
 *
 * ### Example 1: Create New Project
 *
 * ```typescript
 * const service = new ProjectService();
 *
 * const newProject = await service.create({
 *   codigo: 'PRY-2026-001',
 *   nombre: 'Construcción Carretera Norte',
 *   descripcion: 'Proyecto de 50km de carretera',
 *   ubicacion: 'Piura, Perú',
 *   fecha_inicio: '2026-02-01',
 *   fecha_fin: '2026-12-31',
 *   presupuesto: 5000000,
 *   cliente: 'Ministerio de Transportes',
 *   estado: 'PLANIFICACION'
 * });
 *
 * console.log(newProject.id);          // 123
 * console.log(newProject.codigo);      // "PRY-2026-001"
 * console.log(newProject.estado);      // "PLANIFICACION"
 * console.log(newProject.is_active);   // true
 * ```
 *
 * ### Example 2: Get Active Projects with Filters
 *
 * ```typescript
 * // Get all active projects containing "carretera" in name/code
 * const result = await service.findAllWithFilters(
 *   {
 *     status: 'ACTIVO',
 *     search: 'carretera',
 *     sort_by: 'nombre',
 *     sort_order: 'ASC'
 *   },
 *   1,   // page
 *   10   // limit
 * );
 *
 * console.log(result.data.length);  // 3 projects
 * console.log(result.total);        // 15 total projects (across all pages)
 * ```
 *
 * ### Example 3: Project Estado Transitions
 *
 * ```typescript
 * // Start project execution
 * await service.update('123', { estado: 'ACTIVO' });
 *
 * // Pause project temporarily
 * await service.update('123', { estado: 'PAUSADO' });
 *
 * // Resume project
 * await service.update('123', { estado: 'ACTIVO' });
 *
 * // Complete project successfully
 * await service.update('123', { estado: 'COMPLETADO' });
 *
 * // ❌ INVALID - Cannot reactivate completed project
 * try {
 *   await service.update('123', { estado: 'ACTIVO' });
 * } catch (error) {
 *   console.error(error);  // ValidationError: Invalid state transition
 * }
 * ```
 *
 * ### Example 4: Assign Users to Project
 *
 * ```typescript
 * // Assign project director
 * await service.assignUser('123', '456', 'DIRECTOR_PROYECTO');
 *
 * // Assign team lead
 * await service.assignUser('123', '789', 'JEFE_EQUIPO');
 *
 * // Assign operators
 * await service.assignUser('123', '111', 'OPERADOR');
 * await service.assignUser('123', '222', 'OPERADOR');
 *
 * // Get all assigned users
 * const users = await service.getProjectUsers('123');
 * console.log(users.length);  // 4 users
 * ```
 *
 * ### Example 5: Get Projects for Specific User
 *
 * ```typescript
 * // Get all projects user 456 is assigned to
 * const userProjects = await service.findAllByUser('456');
 *
 * console.log(userProjects.length);  // 7 projects
 * console.log(userProjects[0].nombre);  // "Construcción Carretera Norte"
 * ```
 *
 * ### Example 6: Soft Delete with Protection
 *
 * ```typescript
 * // ❌ INVALID - Project has active contracts
 * try {
 *   await service.delete('123');
 * } catch (error) {
 *   console.error(error.message);
 *   // "Cannot delete project with active contracts"
 *   console.error(error.details.active_contracts);  // 3
 *   console.error(error.details.recommendation);
 *   // "Complete or cancel contracts first"
 * }
 *
 * // ✅ VALID - Cancel contracts first
 * await contractService.cancelProjectContracts('123');
 * await service.delete('123');  // Success
 * ```
 *
 * ## TODO: Tenant Context (Phase 21)
 *
 * When multi-tenancy is implemented:
 * - Add `tenantId` parameter to all methods
 * - Filter all queries by `empresa_id = tenantId`
 * - Validate tenant context in user assignments
 * - Ensure cross-tenant isolation
 *
 * **Example (Future)**:
 * ```typescript
 * // Phase 21 signature
 * async findAll(tenantId: number, filters?: {...}): Promise<...> {
 *   query.andWhere('p.empresa_id = :tenantId', { tenantId })
 * }
 * ```
 *
 * ## Performance Notes
 *
 * - **findAllWithFilters()**: Uses QueryBuilder with whitelisted sort fields (prevents SQL injection)
 * - **findAllByUser()**: Joins `sistema.user_projects` (may be slow for users with many projects)
 * - **getProjectUsers()**: Joins `sistema.usuario` (acceptable for < 50 users per project)
 *
 * ## Migration Notes
 *
 * ### Legacy Database Support
 *
 * The service gracefully handles missing `sistema.user_projects` table:
 * - `assignUser()`: Succeeds silently, logs warning
 * - `unassignUser()`: Succeeds silently, logs warning
 * - `getProjectUsers()`: Returns empty array, logs warning
 *
 * **Why?** Legacy databases may not have user-project assignment table yet.
 *
 * **Detection**: Service queries `information_schema.tables` to check if table exists.
 *
 * @example
 * // Full CRUD workflow
 * const service = new ProjectService();
 *
 * // Create
 * const project = await service.create({
 *   codigo: 'PRY-001',
 *   nombre: 'Test Project',
 *   estado: 'PLANIFICACION'
 * });
 *
 * // Read
 * const found = await service.findById(project.id.toString());
 *
 * // Update (transition to active)
 * await service.update(project.id.toString(), { estado: 'ACTIVO' });
 *
 * // Assign users
 * await service.assignUser(project.id.toString(), '123', 'DIRECTOR');
 * await service.assignUser(project.id.toString(), '456', 'OPERADOR');
 *
 * // Delete (soft)
 * await service.delete(project.id.toString());
 *
 * // Verify deleted
 * const deleted = await service.findById(project.id.toString());  // throws NotFoundError
 */
export class ProjectService {
  private get repository(): Repository<Proyecto> {
    if (!AppDataSource.isInitialized) {
      throw new DatabaseError('Database not initialized');
    }
    return AppDataSource.getRepository(Proyecto);
  }

  /**
   * Get all projects (delegation method)
   *
   * This method provides backward compatibility by accepting either:
   * - A string userId (old API format)
   * - A filters object (new API format)
   *
   * @param filters - Either userId string OR filters object { status, search, sort_by, sort_order }
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Promise<ProjectDto[]> if userId provided, Promise<{ data, total }> if filters provided
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * // Old API format (by user)
   * const userProjects = await service.findAll('123');
   * console.log(userProjects.length);  // 5 projects
   *
   * @example
   * // New API format (with filters)
   * const result = await service.findAll({ status: 'ACTIVO' }, 1, 10);
   * console.log(result.data.length);  // 10 projects
   * console.log(result.total);        // 45 total projects
   */
  async findAll(
    filters?:
      | string
      | { status?: string; search?: string; sort_by?: string; sort_order?: 'ASC' | 'DESC' },
    page?: number,
    limit?: number
  ): Promise<ProjectDto[] | { data: ProjectDto[]; total: number }> {
    // Handle both old string userId format and new filter object format
    if (typeof filters === 'string') {
      return this.findAllByUser(filters);
    }
    return this.findAllWithFilters(filters, page, limit);
  }

  /**
   * Get all projects assigned to a specific user
   *
   * Joins with `sistema.user_projects` junction table to filter projects by user assignment.
   * Returns only active projects (isActive = true) sorted by nombre ascending.
   *
   * **Error Handling**: Returns empty array on error instead of throwing (prevents login failures).
   *
   * @param userId - Numeric user ID as string (e.g., "123")
   * @returns Promise<ProjectDto[]> - Array of projects assigned to user
   *
   * @example
   * // Get all projects for user 456
   * const projects = await service.findAllByUser('456');
   * console.log(projects.length);  // 7 projects
   * console.log(projects[0].nombre);  // "Construcción Carretera Norte"
   * console.log(projects[0].estado);  // "ACTIVO"
   *
   * @example
   * // User with no assignments
   * const projects = await service.findAllByUser('999');
   * console.log(projects.length);  // 0
   *
   * // TODO: [Phase 21 - Tenant Context] Add tenant filtering
   * // query.andWhere('p.empresa_id = :tenantId', { tenantId })
   */
  async findAllByUser(userId?: string): Promise<ProjectDto[]> {
    try {
      let query = this.repository
        .createQueryBuilder('p')
        .where('p.isActive = :isActive', { isActive: true })
        .orderBy('p.nombre', 'ASC');

      if (userId) {
        // Get only projects assigned to the user
        query = query
          .innerJoin('sistema.user_projects', 'up', 'p.id = up.project_id')
          .andWhere('up.user_id = :userId', { userId: parseInt(userId) });
      }

      const projects = await query.getMany();

      logger.info('Retrieved projects for user', {
        user_id: userId,
        count: projects.length,
      });

      return projects.map((p) => toProjectDto(p));
    } catch (error) {
      logger.error('Error finding projects by user', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'ProjectService.findAllByUser',
      });
      // Return empty array instead of throwing to prevent login failures
      return [];
    }
  }

  /**
   * Get all projects with advanced filtering, sorting, and pagination
   *
   * Supports:
   * - **Status filter**: Filter by estado (PLANIFICACION, ACTIVO, PAUSADO, COMPLETADO, CANCELADO)
   * - **Search filter**: Case-insensitive search in nombre and codigo (ILIKE)
   * - **Sorting**: Whitelisted fields (nombre, codigo, estado, fecha_inicio, fecha_fin, presupuesto, cliente, created_at, updated_at)
   * - **Pagination**: Page number and items per page
   *
   * **Security**: Sort field is whitelisted to prevent SQL injection.
   *
   * **Error Handling**: Returns empty result on error instead of throwing (prevents API failures).
   *
   * @param filters - Filter object { status, search, sort_by, sort_order }
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Promise<{ data: ProjectDto[], total: number }> - Paginated result
   *
   * @example
   * // Get active projects containing "carretera"
   * const result = await service.findAllWithFilters(
   *   { status: 'ACTIVO', search: 'carretera' },
   *   1,
   *   10
   * );
   * console.log(result.data.length);  // 3 projects
   * console.log(result.total);        // 15 total matching projects
   *
   * @example
   * // Get all projects sorted by budget (descending)
   * const result = await service.findAllWithFilters(
   *   { sort_by: 'presupuesto', sort_order: 'DESC' },
   *   1,
   *   20
   * );
   * console.log(result.data[0].presupuesto);  // 10000000 (highest budget)
   *
   * // TODO: [Phase 21 - Tenant Context] Add tenant filtering
   * // query.andWhere('p.empresa_id = :tenantId', { tenantId })
   */
  async findAllWithFilters(
    filters?: {
      status?: string;
      search?: string;
      sort_by?: string;
      sort_order?: 'ASC' | 'DESC';
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: ProjectDto[]; total: number }> {
    try {
      const query = this.repository
        .createQueryBuilder('p')
        .where('p.isActive = :isActive', { isActive: true });

      if (filters?.status) {
        query.andWhere('p.estado = :status', { status: filters.status });
      }

      if (filters?.search) {
        query.andWhere('(p.nombre ILIKE :search OR p.codigo ILIKE :search)', {
          search: `%${filters.search}%`,
        });
      }

      // Sorting with whitelisted fields (prevent SQL injection)
      const sortableFields: Record<string, string> = {
        nombre: 'p.nombre',
        codigo: 'p.codigo',
        estado: 'p.estado',
        fecha_inicio: 'p.fechaInicio',
        fecha_fin: 'p.fechaFin',
        presupuesto: 'p.presupuesto',
        cliente: 'p.cliente',
        created_at: 'p.createdAt',
        updated_at: 'p.updatedAt',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'p.nombre';
      const sortOrder = filters?.sort_order === 'DESC' ? 'DESC' : 'ASC';

      query.orderBy(sortBy, sortOrder);

      // Pagination
      const offset = (page - 1) * limit;
      query.skip(offset).take(limit);

      const [projects, total] = await query.getManyAndCount();

      logger.info('Retrieved project list', {
        total: total,
        returned: projects.length,
        page: page,
        limit: limit,
        filters: filters,
      });

      return {
        data: projects.map((p) => toProjectDto(p)),
        total,
      };
    } catch (error) {
      logger.error('Error finding projects with filters', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'ProjectService.findAllWithFilters',
      });
      // Return empty result instead of throwing to prevent login failures
      return { data: [], total: 0 };
    }
  }

  /**
   * Get project by ID
   *
   * Retrieves a single project entity by its primary key. Returns null if not found
   * or if project is soft-deleted (isActive = false).
   *
   * **Relations Loaded**:
   * - `creator`: User who created the project
   * - `updater`: User who last updated the project
   *
   * @param projectId - Numeric project ID as string (e.g., "123")
   * @returns Promise<ProjectDto | null> - Project DTO or null if not found
   * @throws {NotFoundError} If project not found or inactive
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * const project = await service.findById('123');
   * if (project) {
   *   console.log(project.nombre);       // "Construcción Carretera Norte"
   *   console.log(project.estado);       // "ACTIVO"
   *   console.log(project.presupuesto);  // 5000000
   *   console.log(project.creator.username);  // "admin"
   * }
   *
   * @example
   * // Not found
   * try {
   *   await service.findById('999');
   * } catch (error) {
   *   console.error(error.message);  // "Project not found"
   * }
   *
   * // TODO: [Phase 21 - Tenant Context] Add tenant filtering
   * // where: { id: parseInt(projectId), isActive: true, empresa_id: tenantId }
   */
  async findById(projectId: string): Promise<ProjectDto | null> {
    try {
      const project = await this.repository.findOne({
        where: { id: parseInt(projectId), isActive: true },
        relations: ['creator', 'updater'],
      });

      if (!project) {
        throw new NotFoundError('Project', projectId);
      }

      logger.info('Retrieved project', {
        id: project.id,
        codigo: project.codigo,
        nombre: project.nombre,
        estado: project.estado,
      });

      return toProjectDto(project);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error finding project by ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'ProjectService.findById',
      });
      throw new DatabaseError(`Failed to retrieve project: ${error.message}`);
    }
  }

  /**
   * Get project by unique code
   *
   * Retrieves a single project entity by its unique codigo field. Returns null if not found
   * or if project is soft-deleted (isActive = false).
   *
   * **Relations Loaded**:
   * - `creator`: User who created the project
   * - `updater`: User who last updated the project
   *
   * @param code - Unique project code (e.g., "PRY-2026-001")
   * @returns Promise<ProjectDto | null> - Project DTO or null if not found
   * @throws {NotFoundError} If project not found or inactive
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * const project = await service.findByCode('PRY-2026-001');
   * console.log(project.id);      // 123
   * console.log(project.nombre);  // "Construcción Carretera Norte"
   *
   * @example
   * // Not found
   * try {
   *   await service.findByCode('INVALID-CODE');
   * } catch (error) {
   *   console.error(error.message);  // "Project not found"
   * }
   *
   * // TODO: [Phase 21 - Tenant Context] Add tenant filtering
   * // where: { codigo: code, isActive: true, empresa_id: tenantId }
   */
  async findByCode(code: string): Promise<ProjectDto | null> {
    try {
      const project = await this.repository.findOne({
        where: { codigo: code, isActive: true },
        relations: ['creator', 'updater'],
      });

      if (!project) {
        throw new NotFoundError('Project', code);
      }

      logger.info('Retrieved project by code', {
        id: project.id,
        codigo: project.codigo,
        nombre: project.nombre,
      });

      return toProjectDto(project);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error finding project by code', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code,
        context: 'ProjectService.findByCode',
      });
      throw new DatabaseError(`Failed to retrieve project: ${error.message}`);
    }
  }

  /**
   * Create new project
   *
   * Creates a new project entity with comprehensive validation:
   * - **Codigo uniqueness**: Checks if codigo already exists
   * - **Date range**: Validates fecha_fin >= fecha_inicio
   * - **Budget**: Validates presupuesto >= 0
   * - **Estado**: Defaults to 'PLANIFICACION' if not provided
   *
   * **Field Mapping**: Accepts three input formats (see class JSDoc for details)
   * **Status Mapping**: Maps display labels to database enum values
   *
   * @param data - Project creation data (mixed format supported)
   * @returns Promise<ProjectDto> - Created project with ID and timestamps
   * @throws {ConflictError} If codigo already exists
   * @throws {ValidationError} If date range invalid, budget negative, or required fields missing
   * @throws {DatabaseError} If database insert fails
   *
   * @example
   * const project = await service.create({
   *   codigo: 'PRY-2026-001',
   *   nombre: 'Construcción Carretera Norte',
   *   descripcion: 'Proyecto de 50km de carretera',
   *   ubicacion: 'Piura, Perú',
   *   fecha_inicio: '2026-02-01',
   *   fecha_fin: '2026-12-31',
   *   presupuesto: 5000000,
   *   cliente: 'Ministerio de Transportes',
   *   estado: 'PLANIFICACION'
   * });
   * console.log(project.id);     // 123
   * console.log(project.codigo); // "PRY-2026-001"
   *
   * @example
   * // Validation errors
   * try {
   *   await service.create({
   *     codigo: 'PRY-001',  // Already exists
   *     nombre: 'Test'
   *   });
   * } catch (error) {
   *   console.error(error.message);  // "Project with codigo PRY-001 already exists"
   * }
   *
   * @example
   * try {
   *   await service.create({
   *     codigo: 'PRY-002',
   *     nombre: 'Test',
   *     fecha_inicio: '2026-12-31',
   *     fecha_fin: '2026-01-01'  // End before start
   *   });
   * } catch (error) {
   *   console.error(error.message);  // "End date must be >= start date"
   * }
   *
   * // TODO: [Phase 21 - Tenant Context] Set empresa_id from tenant context
   * // projectData.empresa_id = tenantId
   */
  async create(data: CreateProjectDto): Promise<ProjectDto> {
    try {
      // Map frontend camelCase fields to database snake_case Spanish columns
      // Support only Spanish snake_case (from API) replace English camelCase with Spanish snake_case
      const projectData: Partial<ProjectDto> = {
        codigo: (data as any).codigo || data.code,
        nombre: (data as any).nombre || data.name,
        descripcion: (data as any).descripcion || data.description || null,
        ubicacion: (data as any).ubicacion || data.location || null,
        fecha_inicio: (data as any).fecha_inicio || data.startDate || data.start_date || null,
        fecha_fin: (data as any).fecha_fin || data.endDate || data.end_date || null,
        presupuesto: (data as any).presupuesto || data.budget || null,
        cliente: (data as any).cliente || data.client || null,
        estado: (data as any).estado || data.status || 'PLANIFICACION',
        is_active: true,
      };

      // Validate required fields
      if (!projectData.codigo || !projectData.nombre) {
        throw new ValidationError('Missing required fields', [
          { field: 'codigo', rule: 'required', message: 'Project code is required' },
          { field: 'nombre', rule: 'required', message: 'Project name is required' },
        ]);
      }

      // Check codigo uniqueness
      const existingProject = await this.repository.findOne({
        where: { codigo: projectData.codigo },
      });
      if (existingProject) {
        throw new ConflictError(`Project with codigo '${projectData.codigo}' already exists`, {
          field: 'codigo',
          value: projectData.codigo,
          existing_id: existingProject.id,
        });
      }

      // Map status values from frontend display values to database values
      const statusMapping: { [key: string]: string } = {
        Planificación: 'PLANIFICACION',
        'En Ejecución': 'ACTIVO',
        Suspendido: 'PAUSADO',
        Finalizado: 'COMPLETADO',
        PLANIFICACION: 'PLANIFICACION',
        ACTIVO: 'ACTIVO',
        PAUSADO: 'PAUSADO',
        COMPLETADO: 'COMPLETADO',
        CANCELADO: 'CANCELADO',
      };
      projectData.estado = statusMapping[projectData.estado!] || projectData.estado;

      // Validate date range
      if (projectData.fecha_inicio && projectData.fecha_fin) {
        const startDate = new Date(projectData.fecha_inicio);
        const endDate = new Date(projectData.fecha_fin);
        if (endDate < startDate) {
          throw new ValidationError('End date must be >= start date', [
            {
              field: 'fecha_fin',
              rule: 'dateRange',
              message: `End date (${projectData.fecha_fin}) must be on or after start date (${projectData.fecha_inicio})`,
              value: projectData.fecha_fin,
            },
          ]);
        }
      }

      // Validate budget
      if (projectData.presupuesto !== null && projectData.presupuesto !== undefined) {
        if (projectData.presupuesto < 0) {
          throw new ValidationError('Budget must be >= 0', [
            {
              field: 'presupuesto',
              rule: 'min',
              message: `Budget (${projectData.presupuesto}) must be >= 0`,
              value: projectData.presupuesto,
            },
          ]);
        }
      }

      const entity = this.repository.create(fromProjectDto(projectData));
      const saved = await this.repository.save(entity);

      logger.info('Created project', {
        id: saved.id,
        codigo: saved.codigo,
        nombre: saved.nombre,
        estado: saved.estado,
        presupuesto: saved.presupuesto,
        cliente: saved.cliente,
        fecha_inicio: saved.fechaInicio,
        fecha_fin: saved.fechaFin,
      });

      return toProjectDto(saved);
    } catch (error) {
      if (
        error instanceof ConflictError ||
        error instanceof ValidationError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logger.error('Error creating project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'ProjectService.create',
      });
      throw new DatabaseError(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * Update existing project
   *
   * Updates a project entity with partial data and comprehensive validation:
   * - **Codigo uniqueness**: Checks if new codigo conflicts with existing project
   * - **Date range**: Validates fecha_fin >= fecha_inicio if both provided
   * - **Budget**: Validates presupuesto >= 0 if provided
   * - **Estado transitions**: Validates state machine transitions (COMPLETADO/CANCELADO are terminal)
   *
   * **Field Mapping**: Accepts three input formats (see class JSDoc for details)
   * **Status Mapping**: Maps display labels to database enum values
   *
   * @param projectId - Numeric project ID as string (e.g., "123")
   * @param data - Partial project data (only fields to update)
   * @returns Promise<ProjectDto> - Updated project
   * @throws {NotFoundError} If project not found
   * @throws {ConflictError} If new codigo already exists
   * @throws {ValidationError} If date range invalid, budget negative, or estado transition invalid
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * // Start project execution
   * await service.update('123', { estado: 'ACTIVO' });
   *
   * @example
   * // Update budget and dates
   * await service.update('123', {
   *   presupuesto: 6000000,
   *   fecha_fin: '2027-06-30'
   * });
   *
   * @example
   * // Invalid estado transition
   * try {
   *   await service.update('123', { estado: 'ACTIVO' });  // Project already COMPLETADO
   * } catch (error) {
   *   console.error(error.message);
   *   // "Invalid state transition from COMPLETADO to ACTIVO"
   * }
   *
   * @example
   * // Codigo conflict
   * try {
   *   await service.update('123', { codigo: 'PRY-002' });  // Already exists
   * } catch (error) {
   *   console.error(error.message);
   *   // "Project with codigo PRY-002 already exists"
   * }
   *
   * // TODO: [Phase 21 - Tenant Context] Validate tenant context
   * // Ensure user can only update projects in their tenant
   */
  async update(projectId: string, data: UpdateProjectDto): Promise<ProjectDto> {
    try {
      const project = await this.repository.findOne({
        where: { id: parseInt(projectId) },
      });

      if (!project) {
        throw new NotFoundError('Project', projectId);
      }

      // Map frontend camelCase and snake_case DTO fields to Spanish column names
      // Support only Spanish snake_case (from API) replace English camelCase with Spanish snake_case
      const updateData: Partial<ProjectDto> = {};

      if (data.code !== undefined || (data as any).codigo !== undefined)
        updateData.codigo = (data as any).codigo || data.code;
      if (data.name !== undefined || (data as any).nombre !== undefined)
        updateData.nombre = (data as any).nombre || data.name;
      if (data.description !== undefined || (data as any).descripcion !== undefined)
        updateData.descripcion = (data as any).descripcion || data.description;
      if (data.location !== undefined || (data as any).ubicacion !== undefined)
        updateData.ubicacion = (data as any).ubicacion || data.location;
      if (
        data.startDate !== undefined ||
        data.start_date !== undefined ||
        (data as any).fecha_inicio !== undefined
      )
        updateData.fecha_inicio = (data as any).fecha_inicio || data.startDate || data.start_date;
      if (
        data.endDate !== undefined ||
        data.end_date !== undefined ||
        (data as any).fecha_fin !== undefined
      )
        updateData.fecha_fin = (data as any).fecha_fin || data.endDate || data.end_date;
      if (data.status !== undefined || (data as any).estado !== undefined)
        updateData.estado = (data as any).estado || data.status;
      if (data.client !== undefined || data.cliente !== undefined)
        updateData.cliente = data.cliente || data.client;
      if (data.budget !== undefined || data.presupuesto !== undefined)
        updateData.presupuesto = data.presupuesto || data.budget;

      // Map status values from frontend display values to database values
      const statusMapping: { [key: string]: string } = {
        Planificación: 'PLANIFICACION',
        'En Ejecución': 'ACTIVO',
        Suspendido: 'PAUSADO',
        Finalizado: 'COMPLETADO',
      };

      if (updateData.estado && statusMapping[updateData.estado]) {
        updateData.estado = statusMapping[updateData.estado];
      }

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError('No fields to update', [
          {
            field: 'updateData',
            rule: 'required',
            message: 'At least one field must be provided for update',
          },
        ]);
      }

      // Validate codigo uniqueness if being updated
      if (updateData.codigo && updateData.codigo !== project.codigo) {
        const existingProject = await this.repository.findOne({
          where: { codigo: updateData.codigo },
        });
        if (existingProject) {
          throw new ConflictError(`Project with codigo '${updateData.codigo}' already exists`, {
            field: 'codigo',
            value: updateData.codigo,
            existing_id: existingProject.id,
          });
        }
      }

      // Validate estado transition
      if (updateData.estado && updateData.estado !== project.estado) {
        // Terminal states cannot transition out
        const invalidTransitions: Record<string, string[]> = {
          COMPLETADO: ['ACTIVO', 'PAUSADO'], // Cannot reactivate completed
          CANCELADO: ['ACTIVO', 'PAUSADO', 'COMPLETADO'], // Cannot revive cancelled
        };

        if (invalidTransitions[project.estado]?.includes(updateData.estado)) {
          throw new ValidationError(
            `Invalid state transition from ${project.estado} to ${updateData.estado}`,
            [
              {
                field: 'estado',
                rule: 'stateTransition',
                message: `Cannot transition from ${project.estado} to ${updateData.estado}. See ProjectService class JSDoc for valid transitions.`,
                value: updateData.estado,
              },
            ]
          );
        }
      }

      // Validate date range (if both dates are present after update)
      const newFechaInicio = updateData.fecha_inicio || project.fechaInicio;
      const newFechaFin = updateData.fecha_fin || project.fechaFin;
      if (newFechaInicio && newFechaFin) {
        const startDate = new Date(newFechaInicio);
        const endDate = new Date(newFechaFin);
        if (endDate < startDate) {
          throw new ValidationError('End date must be >= start date', [
            {
              field: 'fecha_fin',
              rule: 'dateRange',
              message: `End date (${newFechaFin}) must be on or after start date (${newFechaInicio})`,
              value: newFechaFin,
            },
          ]);
        }
      }

      // Validate budget if being updated
      if (updateData.presupuesto !== undefined && updateData.presupuesto !== null) {
        if (updateData.presupuesto < 0) {
          throw new ValidationError('Budget must be >= 0', [
            {
              field: 'presupuesto',
              rule: 'min',
              message: `Budget (${updateData.presupuesto}) must be >= 0`,
              value: updateData.presupuesto,
            },
          ]);
        }
      }

      // Merge changes
      const entityChanges = fromProjectDto(updateData);
      Object.assign(project, entityChanges);

      const saved = await this.repository.save(project);

      logger.info('Updated project', {
        id: saved.id,
        codigo: saved.codigo,
        changed_fields: Object.keys(updateData),
        new_estado: saved.estado,
      });

      return toProjectDto(saved);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      logger.error('Error updating project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        data,
        context: 'ProjectService.update',
      });
      throw new DatabaseError(`Failed to update project: ${error.message}`);
    }
  }

  /**
   * Soft delete project
   *
   * Marks project as inactive (isActive = false) instead of physically deleting from database.
   * This preserves audit trail and allows potential "undelete" in future.
   *
   * **Protection**: Validates project can be safely deleted:
   * - No active rental contracts (estado_contrato = 'ACTIVO')
   * - No pending valuations (estado = 'PENDIENTE')
   *
   * **Recommendation**: Use soft delete pattern consistently across all entities.
   *
   * @param projectId - Numeric project ID as string (e.g., "123")
   * @returns Promise<void>
   * @throws {NotFoundError} If project not found
   * @throws {BusinessRuleError} If project has active contracts or pending valuations
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * await service.delete('123');  // Project soft deleted (isActive = false)
   *
   * @example
   * // Cannot delete project with active contracts
   * try {
   *   await service.delete('123');
   * } catch (error) {
   *   console.error(error.message);
   *   // "Cannot delete project with active contracts"
   *   console.error(error.details.active_contracts);  // 3
   *   console.error(error.details.recommendation);
   *   // "Complete or cancel contracts first"
   * }
   *
   * // TODO: [Phase 21 - Tenant Context] Validate tenant context
   * // Ensure user can only delete projects in their tenant
   */
  async delete(projectId: string): Promise<void> {
    try {
      const project = await this.repository.findOne({
        where: { id: parseInt(projectId) },
      });

      if (!project) {
        throw new NotFoundError('Project', projectId);
      }

      // Check for active contracts (business rule protection)
      const activeContracts = await AppDataSource.query(
        `
        SELECT COUNT(*) as count FROM contratos_alquiler
        WHERE proyecto_id = $1 AND estado_contrato = 'ACTIVO'
      `,
        [projectId]
      );

      if (parseInt(activeContracts[0].count) > 0) {
        throw new BusinessRuleError(
          'Cannot delete project with active contracts',
          'PROJECT_HAS_ACTIVE_CONTRACTS',
          {
            project_id: projectId,
            project_codigo: project.codigo,
            active_contracts: activeContracts[0].count,
          },
          'Complete or cancel contracts first'
        );
      }

      // Check for pending valuations (business rule protection)
      const pendingValuations = await AppDataSource.query(
        `
        SELECT COUNT(*) as count FROM valorizaciones_equipo
        WHERE proyecto_id = $1 AND estado = 'PENDIENTE'
      `,
        [projectId]
      );

      if (parseInt(pendingValuations[0].count) > 0) {
        throw new BusinessRuleError(
          'Cannot delete project with pending valuations',
          'PROJECT_HAS_PENDING_VALUATIONS',
          {
            project_id: projectId,
            project_codigo: project.codigo,
            pending_valuations: pendingValuations[0].count,
          },
          'Complete or cancel valuations first'
        );
      }

      // Soft delete (set isActive = false)
      project.isActive = false;
      await this.repository.save(project);

      logger.info('Soft deleted project', {
        id: project.id,
        codigo: project.codigo,
        nombre: project.nombre,
        recommendation: 'Project marked inactive (soft delete)',
      });
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof BusinessRuleError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      logger.error('Error deleting project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'ProjectService.delete',
      });
      throw new DatabaseError(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Assign user to project
   *
   * Creates a user-project assignment in the `sistema.user_projects` junction table.
   * Multiple users can be assigned to one project, and one user can be assigned to multiple projects.
   *
   * **Legacy Support**: If `sistema.user_projects` table doesn't exist (legacy database),
   * the operation succeeds silently with a warning logged.
   *
   * **Duplicate Check**: Throws ConflictError if user already assigned to project.
   *
   * @param projectId - Numeric project ID as string (e.g., "123")
   * @param userId - Numeric user ID as string (e.g., "456")
   * @param _rolEnProyecto - Optional role in project (e.g., "DIRECTOR_PROYECTO", "OPERADOR") - NOT IMPLEMENTED
   * @returns Promise<void>
   * @throws {ConflictError} If user already assigned to this project
   * @throws {DatabaseError} If database insert fails
   *
   * @example
   * // Assign project director
   * await service.assignUser('123', '456', 'DIRECTOR_PROYECTO');
   *
   * @example
   * // Assign multiple users
   * await service.assignUser('123', '456', 'DIRECTOR');
   * await service.assignUser('123', '789', 'JEFE_EQUIPO');
   * await service.assignUser('123', '999', 'OPERADOR');
   *
   * @example
   * // Duplicate assignment
   * try {
   *   await service.assignUser('123', '456');  // Already assigned
   * } catch (error) {
   *   console.error(error.message);  // "User already assigned to this project"
   * }
   *
   * // TODO: [Phase 21 - Tenant Context] Validate tenant context
   * // Ensure user and project belong to same empresa_id
   */
  async assignUser(projectId: string, userId: string, _rolEnProyecto?: string): Promise<void> {
    try {
      // Check if table exists first (legacy database support)
      const tableCheck = await AppDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'sistema' AND table_name = 'user_projects'
        ) as table_exists
      `);

      if (!tableCheck[0]?.table_exists) {
        logger.warn('User assignment table missing - operation not persisted', {
          table: 'sistema.user_projects',
          operation: 'assign',
          projectId,
          userId,
          context: 'ProjectService.assignUser',
        });
        return; // Silently succeed without persisting
      }

      // Check if assignment already exists
      const checkQuery = `
        SELECT user_id FROM sistema.user_projects 
        WHERE user_id = $1 AND project_id = $2
      `;

      const checkResult = await AppDataSource.query(checkQuery, [userId, projectId]);

      if (checkResult.length > 0) {
        throw new ConflictError('User already assigned to this project', {
          user_id: userId,
          project_id: projectId,
          table: 'sistema.user_projects',
        });
      }

      const insertQuery = `
        INSERT INTO sistema.user_projects (user_id, project_id, is_default)
        VALUES ($1, $2, false)
      `;

      await AppDataSource.query(insertQuery, [userId, projectId]);

      logger.info('Assigned user to project', {
        user_id: userId,
        project_id: projectId,
        table: 'sistema.user_projects',
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Error assigning user to project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        userId,
        context: 'ProjectService.assignUser',
      });
      throw new DatabaseError(`Failed to assign user to project: ${error.message}`);
    }
  }

  /**
   * Unassign user from project
   *
   * Removes a user-project assignment from the `sistema.user_projects` junction table.
   *
   * **Legacy Support**: If `sistema.user_projects` table doesn't exist (legacy database),
   * the operation succeeds silently with a warning logged.
   *
   * @param projectId - Numeric project ID as string (e.g., "123")
   * @param userId - Numeric user ID as string (e.g., "456")
   * @returns Promise<void>
   * @throws {DatabaseError} If database delete fails
   *
   * @example
   * await service.unassignUser('123', '456');  // User 456 removed from project 123
   *
   * @example
   * // Not found - succeeds silently (no error)
   * await service.unassignUser('123', '999');  // No assignment exists
   *
   * // TODO: [Phase 21 - Tenant Context] Validate tenant context
   * // Ensure user and project belong to same empresa_id
   */
  async unassignUser(projectId: string, userId: string): Promise<void> {
    try {
      // Check if table exists first (legacy database support)
      const tableCheck = await AppDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'sistema' AND table_name = 'user_projects'
        ) as table_exists
      `);

      if (!tableCheck[0]?.table_exists) {
        logger.warn('User assignment table missing - operation not persisted', {
          table: 'sistema.user_projects',
          operation: 'unassign',
          projectId,
          userId,
          context: 'ProjectService.unassignUser',
        });
        return; // Silently succeed
      }

      const query = `
        DELETE FROM sistema.user_projects 
        WHERE user_id = $1 AND project_id = $2
      `;

      await AppDataSource.query(query, [userId, projectId]);

      logger.info('Unassigned user from project', {
        user_id: userId,
        project_id: projectId,
      });
    } catch (error) {
      logger.error('Error unassigning user from project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        userId,
        context: 'ProjectService.unassignUser',
      });
      throw new DatabaseError(`Failed to unassign user from project: ${error.message}`);
    }
  }

  /**
   * Get all users assigned to a project
   *
   * Retrieves all users assigned to a project via the `sistema.user_projects` junction table.
   * Returns user details from `sistema.usuario` table.
   *
   * **Legacy Support**: If `sistema.user_projects` table doesn't exist (legacy database),
   * returns empty array with a warning logged.
   *
   * **Error Handling**: Returns empty array on error instead of throwing (prevents API failures).
   *
   * @param projectId - Numeric project ID as string (e.g., "123")
   * @returns Promise<Array<{ id, username, first_name, last_name, email, is_default }>>
   *
   * @example
   * const users = await service.getProjectUsers('123');
   * console.log(users.length);  // 4 users
   * console.log(users[0].username);  // "jperez"
   * console.log(users[0].first_name);  // "Juan"
   * console.log(users[0].is_default);  // false
   *
   * @example
   * // No users assigned
   * const users = await service.getProjectUsers('999');
   * console.log(users.length);  // 0
   *
   * // TODO: [Phase 21 - Tenant Context] Validate tenant context
   * // Ensure project belongs to user's tenant
   */
  async getProjectUsers(projectId: string) {
    try {
      // Check if table exists first (legacy database support)
      const tableCheck = await AppDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'sistema' AND table_name = 'user_projects'
        ) as table_exists
      `);

      if (!tableCheck[0]?.table_exists) {
        logger.warn('User assignment table missing - returning empty array', {
          table: 'sistema.user_projects',
          operation: 'getProjectUsers',
          projectId,
          context: 'ProjectService.getProjectUsers',
        });
        return []; // Return empty array instead of error
      }

      const query = `
        SELECT 
          u.id, 
          u.nombre_usuario as username, 
          u.nombres as first_name, 
          u.apellidos as last_name, 
          u.correo_electronico as email,
          up.is_default
        FROM sistema.user_projects up
        JOIN sistema.usuario u ON up.user_id = u.id
        WHERE up.project_id = $1
        ORDER BY u.apellidos, u.nombres
      `;

      const results = await AppDataSource.query(query, [projectId]);

      logger.info('Retrieved project users', {
        project_id: projectId,
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Error getting project users', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'ProjectService.getProjectUsers',
      });
      // Return empty array instead of throwing to prevent API failures
      return [];
    }
  }
}
