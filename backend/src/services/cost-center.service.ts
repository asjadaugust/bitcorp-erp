import { AppDataSource } from '../config/database.config';
import { CentroCosto } from '../models/cost-center.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';
import {
  CostCenterListDto,
  CostCenterDetailDto,
  CostCenterCreateDto,
  CostCenterUpdateDto,
  toCostCenterDetailDto,
  toCostCenterListDtoArray,
  fromCostCenterCreateDto,
  fromCostCenterUpdateDto,
} from '../types/dto/cost-center.dto';
import { NotFoundError, ValidationError, ConflictError, DatabaseError } from '../errors';

/**
 * Cost Center Service
 *
 * Manages cost centers (centros de costo) for project budget tracking and cost allocation.
 *
 * Business Rules:
 * - Each cost center must have a unique codigo (code)
 * - codigo and nombre (name) are required fields
 * - Cost centers can be associated with projects
 * - Budget (presupuesto) tracking is optional
 * - Soft delete: Deletion sets isActive = false (not hard delete)
 * - Cost centers are active by default unless specified otherwise
 *
 * @class CostCenterService
 */
export class CostCenterService {
  private get repository(): Repository<CentroCosto> {
    if (!AppDataSource.isInitialized) {
      throw new DatabaseError('Database not initialized');
    }
    return AppDataSource.getRepository(CentroCosto);
  }

  /**
   * Find all cost centers with filtering, search, pagination, and sorting
   *
   * Business Rules:
   * - Returns only active cost centers by default (isActive = true)
   * - Can filter by project (proyecto_id)
   * - Supports search by codigo or nombre (case-insensitive)
   * - Default pagination: page=1, limit=20
   * - Supports sorting by: codigo, nombre, presupuesto, proyecto_id, created_at
   *
   * TODO: Add tenant_id filter when schema migration complete
   * Current: No tenant isolation (all cost centers visible across companies)
   *
   * @param filters - Query filters (search, projectId, isActive, pagination, sorting)
   * @returns Paginated list of cost centers with total count
   * @throws {DatabaseError} If query fails
   *
   * @example
   * ```typescript
   * const result = await service.findAll({
   *   search: 'Operaciones',
   *   projectId: 123,
   *   page: 1,
   *   limit: 20
   * });
   * ```
   */
  async findAll(filters?: {
    search?: string;
    projectId?: number;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Promise<{ data: CostCenterListDto[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Sortable fields whitelist (prevents SQL injection)
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

      // TODO: Add tenant_id filter when schema updated
      // .where('cc.tenantId = :tenantId', { tenantId })
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
      const entities = await queryBuilder.skip(skip).take(limit).getMany();

      // Transform to DTOs
      const data = toCostCenterListDtoArray(entities as unknown as Record<string, unknown>[]);

      Logger.info('Cost centers retrieved successfully', {
        context: 'CostCenterService.findAll',
        total,
        page,
        limit,
        search: filters?.search,
        projectId: filters?.projectId,
      });

      return { data, total };
    } catch (error) {
      Logger.error('Error finding cost centers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'CostCenterService.findAll',
      });
      throw new DatabaseError('Failed to fetch cost centers');
    }
  }

  /**
   * Find cost center by ID
   *
   * Business Rules:
   * - Returns full cost center details
   * - Throws NotFoundError if cost center doesn't exist
   *
   * TODO: Add tenant_id filter when schema updated
   * Current: No tenant isolation check
   *
   * @param id - Cost center ID
   * @returns Cost center detail DTO
   * @throws {NotFoundError} If cost center not found
   * @throws {DatabaseError} If query fails
   */
  async findById(id: number): Promise<CostCenterDetailDto> {
    try {
      // TODO: Add tenant_id filter: where: { id, tenantId }
      const costCenter = await this.repository.findOne({
        where: { id },
      });

      if (!costCenter) {
        throw new NotFoundError('CentroCosto', id);
      }

      Logger.info('Cost center retrieved successfully', {
        context: 'CostCenterService.findById',
        costCenterId: id,
        codigo: costCenter.codigo,
      });

      return toCostCenterDetailDto(costCenter as unknown as Record<string, unknown>);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error finding cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'CostCenterService.findById',
      });
      throw new DatabaseError(`Failed to fetch cost center with id ${id}`);
    }
  }

  /**
   * Find cost center by unique code
   *
   * Business Rules:
   * - codigo is unique within tenant (future: within tenant when schema updated)
   * - Returns null if not found (not an error)
   *
   * TODO: Add tenant_id filter when schema updated
   * Current: codigo unique globally (should be per tenant)
   *
   * @param codigo - Cost center unique code
   * @returns Cost center detail DTO or null if not found
   * @throws {DatabaseError} If query fails
   */
  async findByCode(codigo: string): Promise<CostCenterDetailDto | null> {
    try {
      // TODO: Add tenant_id filter: where: { codigo, tenantId }
      const costCenter = await this.repository.findOne({
        where: { codigo },
      });

      if (!costCenter) {
        return null;
      }

      Logger.info('Cost center found by code', {
        context: 'CostCenterService.findByCode',
        codigo,
        costCenterId: costCenter.id,
      });

      return toCostCenterDetailDto(costCenter as unknown as Record<string, unknown>);
    } catch (error) {
      Logger.error('Error finding cost center by code', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        codigo,
        context: 'CostCenterService.findByCode',
      });
      throw new DatabaseError(`Failed to fetch cost center with codigo ${codigo}`);
    }
  }

  /**
   * Find all cost centers for a specific project
   *
   * Business Rules:
   * - Returns only active cost centers (isActive = true)
   * - Ordered by codigo ascending
   *
   * TODO: Add tenant_id filter when schema updated
   * Current: No tenant isolation
   *
   * @param projectId - Project ID to filter by
   * @returns Array of cost center list DTOs
   * @throws {DatabaseError} If query fails
   */
  async findByProject(projectId: number): Promise<CostCenterListDto[]> {
    try {
      // TODO: Add tenant_id filter: where: { projectId, tenantId, isActive: true }
      const costCenters = await this.repository.find({
        where: { projectId: projectId, isActive: true },
        order: { codigo: 'ASC' },
      });

      Logger.info('Cost centers retrieved by project', {
        context: 'CostCenterService.findByProject',
        projectId,
        count: costCenters.length,
      });

      return toCostCenterListDtoArray(costCenters as unknown as Record<string, unknown>[]);
    } catch (error) {
      Logger.error('Error finding cost centers by project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'CostCenterService.findByProject',
      });
      throw new DatabaseError(`Failed to fetch cost centers for project ${projectId}`);
    }
  }

  /**
   * Create a new cost center
   *
   * Business Rules:
   * - codigo and nombre are required
   * - codigo must be unique (within tenant when schema updated)
   * - Cost centers are active by default (isActive = true)
   * - presupuesto (budget) is optional
   * - Can be associated with a project (proyecto_id)
   *
   * TODO: Add tenant_id when schema updated
   * Current: No tenant association on create
   *
   * @param data - Cost center creation data
   * @returns Created cost center detail DTO
   * @throws {ValidationError} If required fields missing or invalid
   * @throws {ConflictError} If codigo already exists
   * @throws {DatabaseError} If save operation fails
   *
   * @example
   * ```typescript
   * const costCenter = await service.create({
   *   codigo: 'CC-OPS-001',
   *   nombre: 'Operaciones',
   *   presupuesto: 50000,
   *   proyecto_id: 123
   * });
   * ```
   */
  async create(data: CostCenterCreateDto): Promise<CostCenterDetailDto> {
    try {
      // Validate required fields
      if (!data.codigo || data.codigo.trim() === '') {
        throw new ValidationError('codigo is required and cannot be empty');
      }

      if (!data.nombre || data.nombre.trim() === '') {
        throw new ValidationError('nombre is required and cannot be empty');
      }

      // Check if codigo already exists
      // TODO: Add tenant_id check when schema updated (unique per tenant)
      const existing = await this.findByCode(data.codigo);
      if (existing) {
        throw new ConflictError(`Cost center with codigo '${data.codigo}' already exists`, {
          field: 'codigo',
          value: data.codigo,
        });
      }

      // Transform DTO to entity data
      const entityData = fromCostCenterCreateDto(data);

      // Create and save cost center
      const costCenter = this.repository.create(entityData);
      const saved = await this.repository.save(costCenter);

      Logger.info('Cost center created successfully', {
        context: 'CostCenterService.create',
        costCenterId: saved.id,
        codigo: saved.codigo,
        nombre: saved.nombre,
      });

      return toCostCenterDetailDto(saved as unknown as Record<string, unknown>);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      Logger.error('Error creating cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        codigo: data.codigo,
        context: 'CostCenterService.create',
      });
      throw new DatabaseError('Failed to create cost center');
    }
  }

  /**
   * Update an existing cost center
   *
   * Business Rules:
   * - Can update any field (partial update)
   * - If updating codigo, must verify uniqueness (within tenant when schema updated)
   * - Cannot update to null/empty codigo or nombre
   *
   * TODO: Add tenant_id check when schema updated
   * Current: No tenant isolation on update
   *
   * @param id - Cost center ID to update
   * @param data - Partial cost center update data
   * @returns Updated cost center detail DTO
   * @throws {NotFoundError} If cost center not found
   * @throws {ConflictError} If new codigo already exists
   * @throws {ValidationError} If update data invalid
   * @throws {DatabaseError} If update operation fails
   */
  async update(id: number, data: CostCenterUpdateDto): Promise<CostCenterDetailDto> {
    try {
      // Find existing cost center (throws NotFoundError if not found)
      const existing = await this.findById(id);

      // If updating codigo, check uniqueness
      if (data.codigo && data.codigo !== existing.codigo) {
        // TODO: Add tenant_id check when schema updated
        const duplicate = await this.findByCode(data.codigo);
        if (duplicate && duplicate.id !== id) {
          throw new ConflictError(`Cost center with codigo '${data.codigo}' already exists`, {
            field: 'codigo',
            value: data.codigo,
          });
        }
      }

      // Transform DTO to entity updates
      const updates = fromCostCenterUpdateDto(data);

      // Apply updates
      const costCenter = await this.repository.findOne({ where: { id } });
      if (!costCenter) {
        throw new NotFoundError('CentroCosto', id);
      }

      Object.assign(costCenter, updates);
      const saved = await this.repository.save(costCenter);

      Logger.info('Cost center updated successfully', {
        context: 'CostCenterService.update',
        costCenterId: id,
        updatedFields: Object.keys(updates),
      });

      return toCostCenterDetailDto(saved as unknown as Record<string, unknown>);
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ConflictError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      Logger.error('Error updating cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'CostCenterService.update',
      });
      throw new DatabaseError(`Failed to update cost center with id ${id}`);
    }
  }

  /**
   * Delete a cost center (soft delete)
   *
   * Business Rules:
   * - Soft delete: Sets isActive = false (does not remove from database)
   * - Preserves data for audit trail
   * - Can be reactivated by updating isActive to true
   *
   * TODO: Add tenant_id check when schema updated
   * Current: No tenant isolation on delete
   *
   * @param id - Cost center ID to delete
   * @returns void
   * @throws {NotFoundError} If cost center not found
   * @throws {DatabaseError} If delete operation fails
   */
  async delete(id: number): Promise<void> {
    try {
      // Verify cost center exists (throws NotFoundError if not found)
      await this.findById(id);

      // Soft delete: set isActive = false
      // TODO: Add tenant_id check when schema updated
      await this.repository.update(id, { isActive: false });

      Logger.info('Cost center deleted successfully (soft delete)', {
        context: 'CostCenterService.delete',
        costCenterId: id,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error deleting cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'CostCenterService.delete',
      });
      throw new DatabaseError(`Failed to delete cost center with id ${id}`);
    }
  }

  /**
   * Calculate total budget for all cost centers in a project
   *
   * Business Rules:
   * - Sums presupuesto (budget) for all active cost centers in the project
   * - Only includes active cost centers (isActive = true)
   * - Returns 0 if no cost centers or no budgets defined
   *
   * TODO: Add tenant_id filter when schema updated
   * Current: No tenant isolation
   *
   * @param projectId - Project ID to calculate budget for
   * @returns Total budget sum
   * @throws {DatabaseError} If query fails
   */
  async getTotalBudgetByProject(projectId: number): Promise<number> {
    try {
      // TODO: Add tenant_id filter: .andWhere('cc.tenantId = :tenantId', { tenantId })
      const result = await this.repository
        .createQueryBuilder('cc')
        .select('SUM(cc.presupuesto)', 'total')
        .where('cc.projectId = :projectId', { projectId })
        .andWhere('cc.isActive = true')
        .getRawOne();

      const total = parseFloat(result?.total || '0');

      Logger.info('Total budget calculated for project', {
        context: 'CostCenterService.getTotalBudgetByProject',
        projectId,
        totalBudget: total,
      });

      return total;
    } catch (error) {
      Logger.error('Error calculating total budget', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'CostCenterService.getTotalBudgetByProject',
      });
      throw new DatabaseError(`Failed to calculate total budget for project ${projectId}`);
    }
  }

  /**
   * Get count of active cost centers
   *
   * Business Rules:
   * - Counts only active cost centers (isActive = true)
   *
   * TODO: Add tenant_id filter when schema updated
   * Current: Counts all cost centers globally (should be per tenant)
   *
   * @returns Count of active cost centers
   * @throws {DatabaseError} If query fails
   */
  async getActiveCount(): Promise<number> {
    try {
      // TODO: Add tenant_id filter: where: { isActive: true, tenantId }
      const count = await this.repository.count({
        where: { isActive: true },
      });

      Logger.info('Active cost centers counted', {
        context: 'CostCenterService.getActiveCount',
        count,
      });

      return count;
    } catch (error) {
      Logger.error('Error counting cost centers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'CostCenterService.getActiveCount',
      });
      throw new DatabaseError('Failed to count active cost centers');
    }
  }
}

// NOTE: Removed singleton export to prevent "Database not initialized" errors
// Controllers should instantiate the service lazily (after database connects)
// See: Session 12 singleton bug fix (SST, Tender, Operator services)
