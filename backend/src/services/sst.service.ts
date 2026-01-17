import { AppDataSource } from '../config/database.config';
import { Incidente } from '../models/safety-incident.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';

export class SstService {
  private get repository(): Repository<Incidente> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Incidente);
  }

  async findAll(filters?: {
    search?: string;
    estado?: string;
    severidad?: string;
  }): Promise<Incidente[]> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('i');

      if (filters?.estado) {
        queryBuilder.andWhere('i.estado = :estado', { estado: filters.estado });
      }

      if (filters?.severidad) {
        queryBuilder.andWhere('i.severidad = :severidad', { severidad: filters.severidad });
      }

      if (filters?.search) {
        queryBuilder.andWhere(
          '(i.descripcion ILIKE :search OR i.ubicacion ILIKE :search OR i.tipo_incidente ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      queryBuilder.orderBy('i.fecha_incidente', 'DESC');

      return await queryBuilder.getMany();
    } catch (error) {
      Logger.error('Error finding incidents', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'SstService.findAll',
      });
      throw new Error('Error fetching incidents');
    }
  }

  async findById(id: number): Promise<Incidente | null> {
    try {
      return await this.repository.findOne({ where: { id } });
    } catch (error) {
      Logger.error('Error finding incident by id', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SstService.findById',
      });
      throw error;
    }
  }

  async create(data: Partial<Incidente>): Promise<Incidente> {
    try {
      const incidente = this.repository.create(data);
      return await this.repository.save(incidente);
    } catch (error) {
      Logger.error('Error creating incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstService.create',
      });
      throw error;
    }
  }

  async update(id: number, data: Partial<Incidente>): Promise<Incidente> {
    try {
      const incidente = await this.findById(id);
      if (!incidente) {
        throw new Error('Incident not found');
      }

      Object.assign(incidente, data);
      return await this.repository.save(incidente);
    } catch (error) {
      Logger.error('Error updating incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SstService.update',
      });
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      Logger.error('Error deleting incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SstService.delete',
      });
      throw new Error('Failed to delete incident');
    }
  }

  // Backward compatibility methods
  async getAllIncidents(): Promise<Incidente[]> {
    return this.findAll();
  }

  async getIncidentById(id: string): Promise<Incidente | null> {
    return this.findById(parseInt(id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createIncident(data: any): Promise<Incidente> {
    // Map old field names to new Spanish names
    const mappedData: Partial<Incidente> = {
      proyectoId: data.projectId || data.proyectoId,
      fechaIncidente: data.incidentDate || data.fechaIncidente,
      tipoIncidente: data.incidentType || data.injuryType || data.tipoIncidente,
      severidad: data.severity || data.severidad,
      descripcion: data.description || data.descripcion,
      accionesTomadas: data.correctiveActions || data.accionesTomadas,
      estado: data.status || data.estado || 'ABIERTO',
    };
    return this.create(mappedData);
  }
}

export default new SstService();
