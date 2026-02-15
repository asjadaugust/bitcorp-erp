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
 * - Tenant context deferred (Phase 21 - Provider model lacks tenant_id field)
 *
 * Business Rules:
 * - RUC must be unique across system (future: unique per tenant)
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
   *
   * TODO: Add tenant_id filter when schema updated (Phase 21)
   * Current: No tenant isolation (all providers visible)
   * Should be: WHERE provider.tenant_id = :tenantId
   *
   * @param filters - Optional filters (search, is_active, tipo_proveedor, sort_by, sort_order)
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Paginated provider list with total count
   * @throws DatabaseError if query fails
   *
   * @example
   * const result = await service.findAll({ search: 'ACME', tipo_proveedor: 'EQUIPOS' }, 1, 10);
   * // Returns: { data: [ProviderDto, ...], total: 45 }
   */
  async findAll(
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

      // TODO: Add tenant_id filter when schema updated
      // queryBuilder.where('provider.tenant_id = :tenantId', { tenantId });

      // Apply is_active filter (default to true)
      queryBuilder.where('provider.isActive = :isActive', {
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

      // Valid sortable fields (snake_case API → entity property)
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
   *
   * TODO: Add tenant_id validation when schema updated (Phase 21)
   * Current: No tenant validation
   * Should be: WHERE provider.id = :id AND provider.tenant_id = :tenantId
   *
   * @param id - Provider unique identifier
   * @returns ProviderDto with Spanish snake_case fields
   * @throws NotFoundError if provider doesn't exist
   * @throws DatabaseError if query fails
   *
   * @example
   * const provider = await service.findById(456);
   * // Returns: { id: 456, ruc: '12345678901', razon_social: 'ACME SAC', ... }
   */
  async findById(id: number): Promise<ProviderDto> {
    try {
      // TODO: Add tenant_id filter when schema updated
      // const provider = await this.providerRepository.findOne({
      //   where: { id, tenant_id: tenantId },
      // });

      const provider = await this.providerRepository.findOne({
        where: { id },
      });

      if (!provider) {
        throw new NotFoundError('Provider', id);
      }

      const dto = toProviderDto(provider);

      Logger.info('Provider fetched successfully', {
        id,
        ruc: dto.ruc,
        razon_social: dto.razon_social,
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
   *
   * TODO: Add tenant_id filter when schema updated (Phase 21)
   * Current: No tenant isolation (RUC unique globally)
   * Should be: WHERE provider.ruc = :ruc AND provider.tenant_id = :tenantId
   *
   * @param ruc - Provider RUC (11 digits)
   * @returns ProviderDto if found, null otherwise
   * @throws DatabaseError if query fails
   *
   * @example
   * const provider = await service.findByRuc('12345678901');
   * // Returns: ProviderDto or null
   */
  async findByRuc(ruc: string): Promise<ProviderDto | null> {
    try {
      // TODO: Add tenant_id filter when schema updated
      // const provider = await this.providerRepository.findOne({
      //   where: { ruc, tenant_id: tenantId },
      // });

      const provider = await this.providerRepository.findOne({
        where: { ruc },
      });

      if (!provider) {
        return null;
      }

      const dto = toProviderDto(provider);

      Logger.info('Provider found by RUC', {
        ruc,
        id: dto.id,
        razon_social: dto.razon_social,
        context: 'ProviderService.findByRuc',
      });

      return dto;
    } catch (error) {
      Logger.error('Error finding provider by RUC', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ruc,
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
   * - RUC must be unique (future: unique per tenant)
   * - tipo_proveedor must be: EQUIPOS, MATERIALES, SERVICIOS, or MIXTO
   * - New providers default to is_active = true
   *
   * Validation:
   * - DTO validation runs before this method (class-validator)
   * - Service validates RUC uniqueness
   * - Service validates required fields (defense in depth)
   *
   * TODO: Add tenant_id to provider data when schema updated (Phase 21)
   * Current: No tenant_id assignment
   * Should be: providerData.tenant_id = tenantId
   *
   * @param data - Provider creation data (ProviderCreateDto)
   * @returns Created provider as ProviderDto
   * @throws ValidationError if required fields missing
   * @throws ConflictError if RUC already exists
   * @throws DatabaseError if save fails
   *
   * @example
   * const provider = await service.create({
   *   ruc: '12345678901',
   *   razon_social: 'ACME SAC',
   *   tipo_proveedor: 'EQUIPOS',
   *   correo_electronico: 'contact@acme.com'
   * });
   */
  async create(data: ProviderCreateDto): Promise<ProviderDto> {
    try {
      // Validate required fields (defense in depth - DTO validation should catch this first)
      if (!data.ruc || !data.razon_social) {
        throw new ValidationError('ruc and razon_social are required');
      }

      // Check if RUC already exists
      // TODO: Add tenant_id to uniqueness check when schema updated
      const existing = await this.findByRuc(data.ruc);
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

      // TODO: Add tenant_id when schema updated
      // providerData.tenant_id = tenantId;

      const entity = this.providerRepository.create(fromProviderDto(providerData));
      const saved = await this.providerRepository.save(entity);
      const dto = toProviderDto(saved);

      Logger.info('Provider created successfully', {
        id: dto.id,
        ruc: dto.ruc,
        razon_social: dto.razon_social,
        tipo_proveedor: dto.tipo_proveedor,
        context: 'ProviderService.create',
      });

      // Record audit log
      try {
        await this.auditLogRepository.save({
          providerId: dto.id,
          action: 'CREATE',
          observations: `Proveedor ${dto.razon_social} creado`,
          // userId: userId // TODO: Get from context in Phase 2
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
   * - If updating RUC, must be unique (future: unique per tenant)
   * - Must preserve legacy_id if present
   * - Only fields provided in update data are changed
   *
   * TODO: Add tenant_id validation when schema updated (Phase 21)
   * Current: No tenant validation
   * Should be: Validate provider belongs to tenant before update
   *
   * @param id - Provider unique identifier
   * @param data - Partial provider update data
   * @returns Updated provider as ProviderDto
   * @throws NotFoundError if provider doesn't exist
   * @throws ConflictError if updated RUC already exists
   * @throws DatabaseError if update fails
   *
   * @example
   * const updated = await service.update(456, {
   *   razon_social: 'ACME SAC Updated',
   *   telefono: '987654321'
   * });
   */
  async update(id: number, data: ProviderUpdateDto): Promise<ProviderDto> {
    try {
      // TODO: Add tenant_id filter when schema updated
      // const provider = await this.providerRepository.findOne({
      //   where: { id, tenant_id: tenantId },
      // });

      const provider = await this.providerRepository.findOne({
        where: { id },
      });

      if (!provider) {
        throw new NotFoundError('Provider', id);
      }

      // If updating RUC, check it doesn't exist for another provider
      // TODO: Add tenant_id to uniqueness check when schema updated
      if (data.ruc && data.ruc !== provider.ruc) {
        const existing = await this.findByRuc(data.ruc);
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
               observations: `Estado cambiado a ${newValue ? 'Activo' : 'Inactivo'}`
             });
          }
        }
        
        if (auditLogs.length === 0) {
          auditLogs.push({
            providerId: id,
            action: 'UPDATE',
            observations: `Datos del proveedor actualizados: ${Object.keys(updateData).join(', ')}`
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
   * - Should validate no active contracts before deletion (not implemented yet)
   *
   * TODO: Add tenant_id validation when schema updated (Phase 21)
   * Current: No tenant validation
   * Should be: Validate provider belongs to tenant before delete
   *
   * TODO: Add active contracts validation (future enhancement)
   * Should check: No contracts with estado_contrato IN ('ACTIVO', 'LEGALIZADO')
   *
   * @param id - Provider unique identifier
   * @returns true if deleted successfully
   * @throws NotFoundError if provider doesn't exist
   * @throws DatabaseError if delete fails
   *
   * @example
   * const success = await service.delete(456);
   * // Returns: true
   */
  async delete(id: number): Promise<boolean> {
    try {
      // TODO: Add tenant_id filter when schema updated
      // const provider = await this.providerRepository.findOne({
      //   where: { id, tenant_id: tenantId },
      // });

      // Verify provider exists before soft delete
      const provider = await this.providerRepository.findOne({
        where: { id },
      });

      if (!provider) {
        throw new NotFoundError('Provider', id);
      }

      // TODO: Validate no active contracts (future enhancement)
      // const activeContracts = await contractRepository.count({
      //   where: {
      //     id_proveedor: id,
      //     estado_contrato: In(['ACTIVO', 'LEGALIZADO']),
      //   },
      // });
      // if (activeContracts > 0) {
      //   throw new BusinessRuleError(
      //     `Cannot delete provider with ${activeContracts} active contracts`
      //   );
      // }

      // Soft delete
      await this.providerRepository.update(id, {
        isActive: false,
      });

      Logger.info('Provider deleted successfully', {
        id,
        ruc: provider.ruc,
        razon_social: provider.razonSocial,
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
          observations: 'Proveedor desactivado (soft delete)'
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
   *
   * TODO: Add tenant_id filter when schema updated (Phase 21)
   * Current: No tenant isolation
   * Should be: WHERE tipo_proveedor = :tipo AND tenant_id = :tenantId
   *
   * @param tipo - Provider type (EQUIPOS, MATERIALES, SERVICIOS, MIXTO)
   * @returns Array of providers matching type
   * @throws DatabaseError if query fails
   *
   * @example
   * const equipmentProviders = await service.findByType('EQUIPOS');
   * // Returns: [ProviderDto, ...]
   */
  async findByType(tipo: TipoProveedor): Promise<ProviderDto[]> {
    try {
      // TODO: Add tenant_id filter when schema updated
      // const providers = await this.providerRepository.find({
      //   where: { tipo_proveedor: tipo, is_active: true, tenant_id: tenantId },
      //   order: { razon_social: 'ASC' },
      // });

      const providers = await this.providerRepository.find({
        where: {
          tipoProveedor: tipo,
          isActive: true,
        },
        order: { razonSocial: 'ASC' },
      });

      const data = providers.map((p) => toProviderDto(p));

      Logger.info('Providers fetched by type', {
        tipo,
        count: data.length,
        context: 'ProviderService.findByType',
      });

      return data;
    } catch (error) {
      Logger.error('Error finding providers by type', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tipo,
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
   *
   * TODO: Add tenant_id filter when schema updated (Phase 21)
   * Current: No tenant isolation
   * Should be: WHERE is_active = true AND tenant_id = :tenantId
   *
   * @returns Total count of active providers
   * @throws DatabaseError if query fails
   *
   * @example
   * const count = await service.getActiveCount();
   * // Returns: 45
   */
  async getActiveCount(): Promise<number> {
    try {
      // TODO: Add tenant_id filter when schema updated
      // const count = await this.providerRepository.count({
      //   where: { is_active: true, tenant_id: tenantId },
      // });

      const count = await this.providerRepository.count({
        where: { isActive: true },
      });

      Logger.info('Active providers counted', {
        count,
        context: 'ProviderService.getActiveCount',
      });

      return count;
    } catch (error) {
      Logger.error('Error counting providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProviderService.getActiveCount',
      });
      throw new DatabaseError('Failed to count active providers');
    }
  }

  /**
   * Get audit logs for a provider
   */
  async getLogs(providerId: number): Promise<ProviderAuditLog[]> {
    try {
      return await this.auditLogRepository.find({
        where: { providerId },
        order: { createdAt: 'DESC' },
        relations: ['user'],
      });
    } catch (error) {
      Logger.error('Error fetching provider logs', {
        providerId,
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
