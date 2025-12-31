import { AppDataSource } from '../config/database.config';
import { Licitacion } from '../models/tender.model';
import { Repository } from 'typeorm';

export class TenderService {
  private get repository(): Repository<Licitacion> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Licitacion);
  }

  async findAll(filters?: { search?: string; estado?: string }): Promise<Licitacion[]> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('l');

      if (filters?.estado) {
        queryBuilder.andWhere('l.estado = :estado', { estado: filters.estado });
      }

      if (filters?.search) {
        queryBuilder.andWhere(
          '(l.nombre ILIKE :search OR l.codigo ILIKE :search OR l.entidad_convocante ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      queryBuilder.orderBy('l.fecha_presentacion', 'ASC');

      return await queryBuilder.getMany();
    } catch (error) {
      console.error('Error finding tenders:', error);
      throw new Error('Failed to fetch tenders');
    }
  }

  async findById(id: number): Promise<Licitacion | null> {
    try {
      return await this.repository.findOne({ where: { id } });
    } catch (error) {
      console.error('Error finding tender by id:', error);
      throw error;
    }
  }

  async create(data: Partial<Licitacion>): Promise<Licitacion> {
    try {
      // Check if codigo already exists
      if (data.codigo) {
        const existing = await this.repository.findOne({ where: { codigo: data.codigo } });
        if (existing) {
          throw new Error('A tender with this codigo already exists');
        }
      }

      const licitacion = this.repository.create(data);
      return await this.repository.save(licitacion);
    } catch (error) {
      console.error('Error creating tender:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<Licitacion>): Promise<Licitacion> {
    try {
      const licitacion = await this.findById(id);
      if (!licitacion) {
        throw new Error('Tender not found');
      }

      Object.assign(licitacion, data);
      return await this.repository.save(licitacion);
    } catch (error) {
      console.error('Error updating tender:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      console.error('Error deleting tender:', error);
      throw new Error('Failed to delete tender');
    }
  }

  // Backward compatibility method names
  async getAllTenders(): Promise<Licitacion[]> {
    return this.findAll();
  }

  async getTenderById(id: string): Promise<Licitacion | null> {
    return this.findById(parseInt(id));
  }

  async createTender(data: any): Promise<Licitacion> {
    // Map old field names to new Spanish names
    const mappedData: Partial<Licitacion> = {
      codigo: data.tenderNumber || data.codigo,
      nombre: data.title || data.nombre,
      entidadConvocante: data.clientName || data.entidadConvocante,
      montoReferencial: data.estimatedValue || data.montoReferencial,
      fechaPresentacion: data.submissionDate || data.fechaPresentacion,
      fechaConvocatoria: data.openingDate || data.fechaConvocatoria,
      estado: data.status || data.estado || 'PUBLICADO',
      observaciones: data.notes || data.observaciones,
    };
    return this.create(mappedData);
  }
}

export default new TenderService();
