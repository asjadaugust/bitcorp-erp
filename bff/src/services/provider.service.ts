import { AppDataSource } from '../config/database.config';
import { Provider, TipoProveedor } from '../models/provider.model';
import { ProviderAuditLog } from '../models/provider-audit-log.model';
import { Repository } from 'typeorm';
import {
  toProviderDto,
  fromProviderDto,
  ProviderDto,
  ProviderCreateDto,
  ProviderUpdateDto,
} from '../types/dto/provider.dto';
import Logger from '../utils/logger';
import { NotFoundError, ValidationError, ConflictError, DatabaseError } from '../errors';

/**
 * Provider Service
 *
 * Manages supplier/vendor data with CRUD operations, filtering, search, and validation.
 *
 * Standards Applied:
 * - Custom error classes (NotFoundError, ValidationError, ConflictError, DatabaseError)
 * - Return DTOs (not raw entities)
 * - Comprehensive logging (info + error)
 * - Business rule documentation
 * - Multi-tenant isolation via tenantId parameter
 *
 * Business Rules:
 * - RUC must be unique per tenant
 * - RUC must be exactly 11 digits (validated in DTO)
 * - razon_social is required
 * - tipo_proveedor must be: EQUIPOS, MATERIALES, SERVICIOS, or MIXTO
 * - Soft delete only (sets is_active = false)
 * - Cannot delete provider with active contracts (not enforced yet - future validation)
 *
 * @see provider.dto.ts for DTO definitions and transformers
 * @see provider.model.ts for entity definition
 */
export class ProviderService {
  private get providerRepository(): Repository<Provider> {
    if (!AppDataSource.isInitialized) {
      throw new DatabaseError('Database connection not established');
    }
    return AppDataSource.getRepository(Provider);
  }

  private get auditLogRepository(): Repository<ProviderAuditLog> {
    if (!AppDataSource.isInitialized) {
      throw new DatabaseError('Database connection not established');
    }
    return AppDataSource.getRepository(ProviderAuditLog);
  }

  /**
   * Get all providers with optional filters, pagination, and sorting
   *
   * Business Rules:
   * - Defaults to active providers only (is_active = true)
   * - Search across: razon_social, ruc, email, nombre_comercial (case-insensitive)
   * - Filters by tipo_proveedor if provided
   * - Sortable by: razon_social, ruc, nombre_comercial, tipo_proveedor, created_at, updated_at
   * - Returns paginated results with total count
   * - Filtered by tenant_id for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param filters - Optional filters (search, is_active, tipo_proveedor, sort_by, sort_order)
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Paginated provider list with total count
   * @throws DatabaseError if query fails
   */
  async findAll(
    tenantId: number,
    filters?: {
      search?: string;
      is_active?: boolean;
      tipo_proveedor?: TipoProveedor;
      sort_by?: string;
      sort_order?: 'ASC' | 'DESC';
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: ProviderDto[]; total: number }> {
    try {
      const queryBuilder = this.providerRepository.createQueryBuilder('provider');

      // Multi-tenant isolation
      queryBuilder.where('provider.tenantId = :tenantId', { tenantId });

      // Apply is_active filter (default to true)
      queryBuilder.andWhere('provider.isActive = :isActive', {
        isActive: filters?.is_active ?? true,
      });

      // Apply tipo_proveedor filter (model now stores Spanish uppercase values directly)
      if (filters?.tipo_proveedor) {
        queryBuilder.andWhere('provider.tipoProveedor = :tipoProveedor', {
          tipoProveedor: filters.tipo_proveedor,
        });
      }

      // Apply search filter
      if (filters?.search) {
        queryBuilder.andWhere(
          '(provider.razonSocial ILIKE :search OR provider.ruc ILIKE :search OR provider.email ILIKE :search OR provider.nombreComercial ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'razon_social';
      const sortOrder = filters?.sort_order || 'ASC';

      // Valid sortable fields (snake_case API -> entity property)
      const validSortFields: Record<string, string> = {
        razon_social: 'provider.razonSocial',
        ruc: 'provider.ruc',
        nombre_comercial: 'provider.nombreComercial',
        tipo_proveedor: 'provider.tipoProveedor',
        email: 'provider.email',
        telefono: 'provider.telefono',
        created_at: 'provider.createdAt',
        updated_at: 'provider.updatedAt',
      };

      const sortField = validSortFields[sortBy] || 'provider.razonSocial';
      queryBuilder.orderBy(sortField, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Get total and data
      const [providers, total] = await queryBuilder.getManyAndCount();

      const data = providers.map((p) => toProviderDto(p));

      Logger.info('Providers fetched successfully', {
        count: data.length,
        total,
        filters,
        page,
        limit,
        tenantId,
        context: 'ProviderService.findAll',
      });

      return { data, total };
    } catch (error) {
      Logger.error('Error finding providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        page,
        limit,
        tenantId,
        context: 'ProviderService.findAll',
      });
      throw new DatabaseError('Failed to fetch providers');
    }
  }

  /**
   * Get provider by ID
   *
   * Business Rules:
   * - Returns provider regardless of is_active status
   * - Maps entity to DTO with Spanish field names
   * - Filtered by tenant_id for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Provider unique identifier
   * @returns ProviderDto with Spanish snake_case fields
   * @throws NotFoundError if provider doesn't exist
   * @throws DatabaseError if query fails
   */
  async findById(tenantId: number, id: number): Promise<ProviderDto> {
    try {
      const provider = await this.providerRepository.findOne({
        where: { id, tenantId },
      });

      if (!provider) {
        throw new NotFoundError('Provider', id);
      }

      const dto = toProviderDto(provider);

      Logger.info('Provider fetched successfully', {
        id,
        ruc: dto.ruc,
        razon_social: dto.razon_social,
        tenantId,
        context: 'ProviderService.findById',
      });

      return dto;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error finding provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        tenantId,
        context: 'ProviderService.findById',
      });
      throw new DatabaseError('Failed to fetch provider');
    }
  }

  /**
   * Get provider by RUC
   *
   * Business Rules:
   * - RUC is unique identifier (11 digits)
   * - Returns provider regardless of is_active status
   * - Used for duplicate validation during create/update
   * - Filtered by tenant_id (RUC unique per tenant)
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param ruc - Provider RUC (11 digits)
   * @returns ProviderDto if found, null otherwise
   * @throws DatabaseError if query fails
   */
  async findByRuc(tenantId: number, ruc: string): Promise<ProviderDto | null> {
    try {
      const provider = await this.providerRepository.findOne({
        where: { ruc, tenantId },
      });

      if (!provider) {
        return null;
      }

      const dto = toProviderDto(provider);

      Logger.info('Provider found by RUC', {
        ruc,
        id: dto.id,
        razon_social: dto.razon_social,
        tenantId,
        context: 'ProviderService.findByRuc',
      });

      return dto;
    } catch (error) {
      Logger.error('Error finding provider by RUC', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ruc,
        tenantId,
        context: 'ProviderService.findByRuc',
      });
      throw new DatabaseError('Failed to fetch provider by RUC');
    }
  }

  /**
   * Create new provider
   *
   * Business Rules:
   * - RUC must be exactly 11 digits (validated in DTO)
   * - razon_social is required
   * - RUC must be unique per tenant
   * - tipo_proveedor must be: EQUIPOS, MATERIALES, SERVICIOS, or MIXTO
   * - New providers default to is_active = true
   * - tenant_id is set from authenticated user context
   *
   * Validation:
   * - DTO validation runs before this method (class-validator)
   * - Service validates RUC uniqueness per tenant
   * - Service validates required fields (defense in depth)
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param data - Provider creation data (ProviderCreateDto)
   * @returns Created provider as ProviderDto
   * @throws ValidationError if required fields missing
   * @throws ConflictError if RUC already exists
   * @throws DatabaseError if save fails
   */
  async create(tenantId: number, data: ProviderCreateDto): Promise<ProviderDto> {
    try {
      // Validate required fields (defense in depth - DTO validation should catch this first)
      if (!data.ruc || !data.razon_social) {
        throw new ValidationError('ruc and razon_social are required');
      }

      // Check if RUC already exists within this tenant
      const existing = await this.findByRuc(tenantId, data.ruc);
      if (existing) {
        throw new ConflictError(`Provider with RUC '${data.ruc}' already exists`, {
          field: 'ruc',
          value: data.ruc,
        });
      }

      // Map DTO to entity data
      const providerData: Partial<ProviderDto> = {
        ruc: data.ruc,
        razon_social: data.razon_social,
        nombre_comercial: data.nombre_comercial || null,
        tipo_proveedor: data.tipo_proveedor || null,
        direccion: data.direccion || null,
        telefono: data.telefono || null,
        correo_electronico: data.correo_electronico || null,
        is_active: data.is_active ?? true,
      };

      const entity = this.providerRepository.create(fromProviderDto(providerData));
      entity.tenantId = tenantId;
      const saved = await this.providerRepository.save(entity);
      const dto = toProviderDto(saved);

      Logger.info('Provider created successfully', {
        id: dto.id,
        ruc: dto.ruc,
        razon_social: dto.razon_social,
        tipo_proveedor: dto.tipo_proveedor,
        tenantId,
        context: 'ProviderService.create',
      });

      // Record audit log
      try {
        await this.auditLogRepository.save({
          providerId: dto.id,
          action: 'CREATE',
          observations: `Proveedor ${dto.razon_social} creado`,
        });
      } catch (logError) {
        Logger.error('Failed to save provider audit log (CREATE)', { error: String(logError) });
      }

      return dto;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }

      Logger.error('Error creating provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ruc: data.ruc,
        tenantId,
        context: 'ProviderService.create',
      });
      throw new DatabaseError('Failed to create provider');
    }
  }

  /**
   * Update provider
   *
   * Business Rules:
   * - Can update all fields except id and tenant_id
   * - If updating RUC, must be unique per tenant
   * - Must preserve legacy_id if present
   * - Only fields provided in update data are changed
   * - Validates provider belongs to tenant before update
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Provider unique identifier
   * @param data - Partial provider update data
   * @returns Updated provider as ProviderDto
   * @throws NotFoundError if provider doesn't exist
   * @throws ConflictError if updated RUC already exists
   * @throws DatabaseError if update fails
   */
  async update(tenantId: number, id: number, data: ProviderUpdateDto): Promise<ProviderDto> {
    try {
      const provider = await this.providerRepository.findOne({
        where: { id, tenantId },
      });

      if (!provider) {
        throw new NotFoundError('Provider', id);
      }

      // If updating RUC, check it doesn't exist for another provider in this tenant
      if (data.ruc && data.ruc !== provider.ruc) {
        const existing = await this.findByRuc(tenantId, data.ruc);
        if (existing && existing.id !== id) {
          throw new ConflictError(`Provider with RUC '${data.ruc}' already exists`, {
            field: 'ruc',
            value: data.ruc,
          });
        }
      }

      // Map update DTO to entity changes
      const updateData: Partial<ProviderDto> = {};
      if (data.ruc !== undefined) updateData.ruc = data.ruc;
      if (data.razon_social !== undefined) updateData.razon_social = data.razon_social;
      if (data.nombre_comercial !== undefined) updateData.nombre_comercial = data.nombre_comercial;
      if (data.tipo_proveedor !== undefined) updateData.tipo_proveedor = data.tipo_proveedor;
      if (data.direccion !== undefined) updateData.direccion = data.direccion;
      if (data.telefono !== undefined) updateData.telefono = data.telefono;
      if (data.correo_electronico !== undefined)
        updateData.correo_electronico = data.correo_electronico;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      // Merge changes
      const entityChanges = fromProviderDto(updateData);
      Object.assign(provider, entityChanges);

      const saved = await this.providerRepository.save(provider);
      const dto = toProviderDto(saved);

      Logger.info('Provider updated successfully', {
        id,
        ruc: dto.ruc,
        razon_social: dto.razon_social,
        updated_fields: Object.keys(updateData),
        tenantId,
        context: 'ProviderService.update',
      });

      // Record audit log for each changed field
      try {
        const auditLogs: Partial<ProviderAuditLog>[] = [];
        for (const [field, newValue] of Object.entries(updateData)) {
          // Simplified audit log for now: one entry for the update
          if (field === 'is_active') {
            auditLogs.push({
              providerId: id,
              action: newValue ? 'ACTIVATE' : 'DEACTIVATE',
              field: 'is_active',
              oldValue: (!newValue).toString(),
              newValue: newValue.toString(),
              observations: `Estado cambiado a ${newValue ? 'Activo' : 'Inactivo'}`,
            });
          }
        }

        if (auditLogs.length === 0) {
          auditLogs.push({
            providerId: id,
            action: 'UPDATE',
            observations: `Datos del proveedor actualizados: ${Object.keys(updateData).join(', ')}`,
          });
        }

        await this.auditLogRepository.save(auditLogs);
      } catch (logError) {
        Logger.error('Failed to save provider audit log (UPDATE)', { error: String(logError) });
      }

      return dto;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }

      Logger.error('Error updating provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        tenantId,
        context: 'ProviderService.update',
      });
      throw new DatabaseError('Failed to update provider');
    }
  }

  /**
   * Soft delete provider
   *
   * Business Rules:
   * - Soft delete only (sets is_active = false)
   * - No hard deletes allowed (preserve audit trail)
   * - Validates provider belongs to tenant before delete
   * - Should validate no active contracts before deletion (not implemented yet)
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Provider unique identifier
   * @returns true if deleted successfully
   * @throws NotFoundError if provider doesn't exist
   * @throws DatabaseError if delete fails
   */
  async delete(tenantId: number, id: number): Promise<boolean> {
    try {
      // Verify provider exists and belongs to this tenant before soft delete
      const provider = await this.providerRepository.findOne({
        where: { id, tenantId },
      });

      if (!provider) {
        throw new NotFoundError('Provider', id);
      }

      // Soft delete
      await this.providerRepository.update(id, {
        isActive: false,
      });

      Logger.info('Provider deleted successfully', {
        id,
        ruc: provider.ruc,
        razon_social: provider.razonSocial,
        tenantId,
        context: 'ProviderService.delete',
      });

      // Record audit log
      try {
        await this.auditLogRepository.save({
          providerId: id,
          action: 'DEACTIVATE',
          field: 'is_active',
          oldValue: 'true',
          newValue: 'false',
          observations: 'Proveedor desactivado (soft delete)',
        });
      } catch (logError) {
        Logger.error('Failed to save provider audit log (DELETE)', { error: String(logError) });
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error deleting provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        tenantId,
        context: 'ProviderService.delete',
      });
      throw new DatabaseError('Failed to delete provider');
    }
  }

  /**
   * Get providers by type
   *
   * Business Rules:
   * - Returns only active providers (is_active = true)
   * - tipo_proveedor must be: EQUIPOS, MATERIALES, SERVICIOS, or MIXTO
   * - Results sorted by razon_social ascending
   * - Filtered by tenant_id for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param tipo - Provider type (EQUIPOS, MATERIALES, SERVICIOS, MIXTO)
   * @returns Array of providers matching type
   * @throws DatabaseError if query fails
   */
  async findByType(tenantId: number, tipo: TipoProveedor): Promise<ProviderDto[]> {
    try {
      const providers = await this.providerRepository.find({
        where: {
          tipoProveedor: tipo,
          isActive: true,
          tenantId,
        },
        order: { razonSocial: 'ASC' },
      });

      const data = providers.map((p) => toProviderDto(p));

      Logger.info('Providers fetched by type', {
        tipo,
        count: data.length,
        tenantId,
        context: 'ProviderService.findByType',
      });

      return data;
    } catch (error) {
      Logger.error('Error finding providers by type', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tipo,
        tenantId,
        context: 'ProviderService.findByType',
      });
      throw new DatabaseError('Failed to fetch providers by type');
    }
  }

  /**
   * Get active providers count
   *
   * Business Rules:
   * - Counts only active providers (is_active = true)
   * - Used for dashboard statistics
   * - Filtered by tenant_id for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @returns Total count of active providers
   * @throws DatabaseError if query fails
   */
  async getActiveCount(tenantId: number): Promise<number> {
    try {
      const count = await this.providerRepository.count({
        where: { isActive: true, tenantId },
      });

      Logger.info('Active providers counted', {
        count,
        tenantId,
        context: 'ProviderService.getActiveCount',
      });

      return count;
    } catch (error) {
      Logger.error('Error counting providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        context: 'ProviderService.getActiveCount',
      });
      throw new DatabaseError('Failed to count active providers');
    }
  }

  /**
   * Get audit logs for a provider
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param providerId - Provider ID to get logs for
   */
  async getLogs(tenantId: number, providerId: number): Promise<ProviderAuditLog[]> {
    try {
      // Verify the provider belongs to this tenant first
      const provider = await this.providerRepository.findOne({
        where: { id: providerId, tenantId },
      });
      if (!provider) {
        throw new NotFoundError('Provider', providerId);
      }

      return await this.auditLogRepository.find({
        where: { providerId },
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      Logger.error('Error fetching provider logs', {
        providerId,
        tenantId,
        error: error instanceof Error ? error.message : String(error),
        context: 'ProviderService.getLogs',
      });
      throw new DatabaseError('Failed to fetch provider logs');
    }
  }
}

// NOTE: Removed singleton export to prevent "Database not initialized" errors
// Controllers should instantiate the service lazily (after database connects)
// See: Session 12 singleton bug fix (SST, Tender, Operator services)
