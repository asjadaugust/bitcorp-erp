import { AppDataSource } from '../config/database.config';
import { Provider, TipoProveedor } from '../models/provider.model';
import { Repository } from 'typeorm';
import { toProviderDto, fromProviderDto, ProviderDto } from '../types/dto/provider.dto';
import Logger from '../utils/logger';

// DTOs for create/update operations
// Support both English camelCase (from frontend) and Spanish snake_case (from API)
export interface CreateProviderDto {
  // Frontend sends camelCase field names
  ruc?: string;
  businessName?: string; // razon_social
  tradeName?: string; // nombre_comercial
  providerType?: TipoProveedor; // tipo_proveedor
  address?: string; // direccion
  phone?: string; // telefono
  email?: string;

  // Also support Spanish snake_case
  razon_social?: string;
  nombre_comercial?: string;
  tipo_proveedor?: TipoProveedor;
  direccion?: string;
  telefono?: string;
}

export interface UpdateProviderDto extends Partial<CreateProviderDto> {}

export class ProviderService {
  private get providerRepository(): Repository<Provider> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Provider);
  }

  /**
   * Get all providers with optional filters, pagination, and sorting
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

      // Apply is_active filter (default to true)
      queryBuilder.where('provider.is_active = :is_active', {
        is_active: filters?.is_active ?? true,
      });

      // Apply tipo_proveedor filter
      if (filters?.tipo_proveedor) {
        queryBuilder.andWhere('provider.tipo_proveedor = :tipo_proveedor', {
          tipo_proveedor: filters.tipo_proveedor,
        });
      }

      // Apply search filter
      if (filters?.search) {
        queryBuilder.andWhere(
          '(provider.razon_social ILIKE :search OR provider.ruc ILIKE :search OR provider.email ILIKE :search OR provider.nombre_comercial ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Apply sorting
      const sortBy = filters?.sort_by || 'razon_social';
      const sortOrder = filters?.sort_order || 'ASC';

      // Valid sortable fields (snake_case API → entity property)
      const validSortFields: Record<string, string> = {
        razon_social: 'provider.razon_social',
        ruc: 'provider.ruc',
        nombre_comercial: 'provider.nombre_comercial',
        tipo_proveedor: 'provider.tipo_proveedor',
        email: 'provider.email',
        telefono: 'provider.telefono',
        created_at: 'provider.created_at',
        updated_at: 'provider.updated_at',
      };

      const sortField = validSortFields[sortBy] || 'provider.razon_social';
      queryBuilder.orderBy(sortField, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Get total and data
      const [providers, total] = await queryBuilder.getManyAndCount();

      return {
        data: providers.map((p) => toProviderDto(p)),
        total,
      };
    } catch (error) {
      Logger.error('Error finding providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        page,
        limit,
        context: 'ProviderService.findAll',
      });
      throw new Error('Failed to fetch providers');
    }
  }

  /**
   * Get provider by ID
   */
  async findById(id: number): Promise<ProviderDto> {
    try {
      const provider = await this.providerRepository.findOne({
        where: { id },
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      return toProviderDto(provider);
    } catch (error) {
      Logger.error('Error finding provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ProviderService.findById',
      });
      throw error;
    }
  }

  /**
   * Get provider by RUC
   */
  async findByRuc(ruc: string): Promise<Provider | null> {
    try {
      return await this.providerRepository.findOne({
        where: { ruc },
      });
    } catch (error) {
      Logger.error('Error finding provider by RUC', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ruc,
        context: 'ProviderService.findByRuc',
      });
      throw error;
    }
  }

  /**
   * Create new provider
   */
  async create(data: CreateProviderDto): Promise<ProviderDto> {
    try {
      // Map frontend camelCase and Spanish snake_case to DTO format
      // Support both English camelCase and Spanish snake_case input
      const providerData = {
        ruc: data.ruc as string,
        razon_social: (data.razon_social || data.businessName || '') as string,
        nombre_comercial: (data.nombre_comercial || data.tradeName || null) as string | null,
        tipo_proveedor: (data.tipo_proveedor || data.providerType || null) as string | null,
        direccion: (data.direccion || data.address || null) as string | null,
        telefono: (data.telefono || data.phone || null) as string | null,
        correo_electronico: data.email as string,
        is_active: true,
      };

      if (!providerData.ruc || !providerData.razon_social) {
        throw new Error('RUC and razón social are required');
      }

      // Check if RUC already exists
      const existing = await this.findByRuc(providerData.ruc);
      if (existing) {
        throw new Error('Provider with this RUC already exists');
      }

      const entity = this.providerRepository.create(fromProviderDto(providerData));
      const saved = await this.providerRepository.save(entity);

      return toProviderDto(saved);
    } catch (error) {
      Logger.error('Error creating provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ruc: data.ruc,
        context: 'ProviderService.create',
      });
      throw error;
    }
  }

  /**
   * Update provider
   */
  async update(id: number, data: UpdateProviderDto): Promise<ProviderDto> {
    try {
      const provider = await this.providerRepository.findOne({
        where: { id },
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      // Map frontend camelCase and Spanish snake_case to DTO format
      // Support both English camelCase and Spanish snake_case input
      const updateData: {
        ruc?: string;
        razon_social?: string;
        nombre_comercial?: string | null;
        tipo_proveedor?: string | null;
        direccion?: string | null;
        telefono?: string | null;
        correo_electronico?: string;
      } = {};

      if (data.ruc !== undefined) updateData.ruc = data.ruc as string;
      if (data.businessName !== undefined || data.razon_social !== undefined)
        updateData.razon_social = (data.razon_social || data.businessName) as string;
      if (data.tradeName !== undefined || data.nombre_comercial !== undefined)
        updateData.nombre_comercial = (data.nombre_comercial || data.tradeName) as string | null;
      if (data.providerType !== undefined || data.tipo_proveedor !== undefined)
        updateData.tipo_proveedor = (data.tipo_proveedor || data.providerType) as string | null;
      if (data.address !== undefined || data.direccion !== undefined)
        updateData.direccion = (data.direccion || data.address) as string | null;
      if (data.phone !== undefined || data.telefono !== undefined)
        updateData.telefono = (data.telefono || data.phone) as string | null;
      if (data.email !== undefined) updateData.correo_electronico = data.email as string;

      // If updating RUC, check it doesn't exist for another provider
      if (updateData.ruc && updateData.ruc !== provider.ruc) {
        const existing = await this.findByRuc(updateData.ruc);
        if (existing && existing.id !== id) {
          throw new Error('Provider with this RUC already exists');
        }
      }

      // Merge changes
      const entityChanges = fromProviderDto(updateData);
      Object.assign(provider, entityChanges);

      const saved = await this.providerRepository.save(provider);
      return toProviderDto(saved);
    } catch (error) {
      Logger.error('Error updating provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ProviderService.update',
      });
      throw error;
    }
  }

  /**
   * Soft delete provider
   */
  async delete(id: number): Promise<void> {
    try {
      await this.providerRepository.update(id, {
        is_active: false,
      });
    } catch (error) {
      Logger.error('Error deleting provider', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ProviderService.delete',
      });
      throw new Error('Failed to delete provider');
    }
  }

  /**
   * Get providers by type
   */
  async findByType(tipo: TipoProveedor): Promise<ProviderDto[]> {
    try {
      const providers = await this.providerRepository.find({
        where: {
          tipo_proveedor: tipo,
          is_active: true,
        },
        order: { razon_social: 'ASC' },
      });
      return providers.map((p) => toProviderDto(p));
    } catch (error) {
      Logger.error('Error finding providers by type', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tipo,
        context: 'ProviderService.findByType',
      });
      throw error;
    }
  }

  /**
   * Get active providers count
   */
  async getActiveCount(): Promise<number> {
    try {
      return await this.providerRepository.count({
        where: { is_active: true },
      });
    } catch (error) {
      Logger.error('Error counting providers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProviderService.getActiveCount',
      });
      throw error;
    }
  }
}
