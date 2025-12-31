import { AppDataSource } from '../config/database.config';
import { Provider } from '../models/provider.model';
import { Repository, Like, In } from 'typeorm';

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
    tipo_proveedor?: string;
  }): Promise<Provider[]> {
    try {
      const where: any = {};

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
            '(provider.razon_social ILIKE :search OR provider.ruc ILIKE :search OR provider.email ILIKE :search OR provider.nombre_comercial ILIKE :search)',
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

      return providers;
    } catch (error) {
      console.error('Error finding providers:', error);
      throw new Error('Failed to fetch providers');
    }
  }

  /**
   * Get provider by ID
   */
  async findById(id: number): Promise<Provider> {
    try {
      const provider = await this.providerRepository.findOne({
        where: { id },
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      return provider;
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
  async create(data: Partial<Provider>): Promise<Provider> {
    try {
      if (!data.ruc || !data.razon_social) {
        throw new Error('RUC and razón social are required');
      }

      // Check if RUC already exists
      const existing = await this.findByRuc(data.ruc);
      if (existing) {
        throw new Error('Provider with this RUC already exists');
      }

      const provider = this.providerRepository.create({
        ...data,
        is_active: true,
      });

      return await this.providerRepository.save(provider);
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  /**
   * Update provider
   */
  async update(id: number, data: Partial<Provider>): Promise<Provider> {
    try {
      const provider = await this.findById(id);

      // If updating RUC, check it doesn't exist for another provider
      if (data.ruc && data.ruc !== provider.ruc) {
        const existing = await this.findByRuc(data.ruc);
        if (existing && existing.id !== id) {
          throw new Error('Provider with this RUC already exists');
        }
      }

      // Update fields
      Object.assign(provider, data);

      return await this.providerRepository.save(provider);
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
  async findByType(tipo: string): Promise<Provider[]> {
    try {
      return await this.providerRepository.find({
        where: {
          tipo_proveedor: tipo as any,
          is_active: true,
        },
        order: { razon_social: 'ASC' },
      });
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
