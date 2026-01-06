import { AppDataSource } from '../config/database.config';
import { Provider, TipoProveedor } from '../models/provider.model';
import { Repository } from 'typeorm';
import { toProviderDto, fromProviderDto, ProviderDto } from '../types/dto/provider.dto';

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
   * Get all providers with optional filters
   */
  async findAll(filters?: {
    search?: string;
    is_active?: boolean;
    tipo_proveedor?: TipoProveedor;
  }): Promise<ProviderDto[]> {
    try {
      const where: Record<string, unknown> = {};

      if (filters?.is_active !== undefined) {
        where.is_active = filters.is_active;
      }

      if (filters?.tipo_proveedor) {
        where.tipo_proveedor = filters.tipo_proveedor;
      }

      let providers: Provider[];

      if (filters?.search) {
        // Search across multiple fields
        providers = await this.providerRepository
          .createQueryBuilder('provider')
          .where('provider.is_active = :is_active', { is_active: filters.is_active ?? true })
          .andWhere(
            '(provider.razon_social ILIKE :search OR provider.ruc ILIKE :search OR provider.correo_electronico ILIKE :search OR provider.nombre_comercial ILIKE :search)',
            { search: `%${filters.search}%` }
          )
          .orderBy('provider.razon_social', 'ASC')
          .getMany();
      } else {
        providers = await this.providerRepository.find({
          where,
          order: { razon_social: 'ASC' },
        });
      }

      return providers.map((p) => toProviderDto(p));
    } catch (error) {
      console.error('Error finding providers:', error);
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
      console.error('Error finding provider:', error);
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
      console.error('Error finding provider by RUC:', error);
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
      const providerData: Partial<ProviderDto> = {
        ruc: data.ruc,
        razon_social: data.razon_social || data.businessName,
        nombre_comercial: data.nombre_comercial || data.tradeName || null,
        tipo_proveedor: data.tipo_proveedor || data.providerType || null,
        direccion: data.direccion || data.address || null,
        telefono: data.telefono || data.phone || null,
        email: data.email,
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
      console.error('Error creating provider:', error);
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
      const updateData: Partial<ProviderDto> = {};

      if (data.ruc !== undefined) updateData.ruc = data.ruc;
      if (data.businessName !== undefined || data.razon_social !== undefined)
        updateData.razon_social = data.razon_social || data.businessName;
      if (data.tradeName !== undefined || data.nombre_comercial !== undefined)
        updateData.nombre_comercial = data.nombre_comercial || data.tradeName;
      if (data.providerType !== undefined || data.tipo_proveedor !== undefined)
        updateData.tipo_proveedor = data.tipo_proveedor || data.providerType;
      if (data.address !== undefined || data.direccion !== undefined)
        updateData.direccion = data.direccion || data.address;
      if (data.phone !== undefined || data.telefono !== undefined)
        updateData.telefono = data.telefono || data.phone;
      if (data.email !== undefined) updateData.email = data.email;

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
      console.error('Error updating provider:', error);
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
      console.error('Error deleting provider:', error);
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
      console.error('Error finding providers by type:', error);
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
      console.error('Error counting providers:', error);
      throw error;
    }
  }
}
