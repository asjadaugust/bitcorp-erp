import { AppDataSource } from '../config/database.config';
import { Licitacion } from '../models/tender.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';

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
      Logger.error('Error finding tenders', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'TenderService.findAll',
      });
      throw new Error('Failed to fetch tenders');
    }
  }

  async findById(id: number): Promise<Licitacion | null> {
    try {
      return await this.repository.findOne({ where: { id } });
    } catch (error) {
      Logger.error('Error finding tender by id', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenderId: id,
        context: 'TenderService.findById',
      });
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
      Logger.error('Error creating tender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        codigo: data.codigo,
        context: 'TenderService.create',
      });
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
      Logger.error('Error updating tender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenderId: id,
        context: 'TenderService.update',
      });
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      Logger.error('Error deleting tender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenderId: id,
        context: 'TenderService.delete',
      });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
