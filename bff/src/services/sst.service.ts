import { AppDataSource } from '../config/database.config';
import { Incidente, EstadoIncidente, SeveridadIncidente } from '../models/safety-incident.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';
import { NotFoundError, ConflictError } from '../errors/http.errors';
import {
  SafetyIncidentDto,
  SafetyIncidentCreateDto,
  SafetyIncidentUpdateDto,
  toSafetyIncidentDto,
  toSafetyIncidentDtoArray,
} from '../types/dto/safety-incident.dto';

export class SstService {
  private repository: Repository<Incidente>;

  constructor() {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    this.repository = AppDataSource.getRepository(Incidente);
  }

  /**
   * Find all safety incidents with filters and pagination
   */
  async findAll(
    tenantId: number,
    filters?: {
      search?: string;
      estado?: string;
      severidad?: string;
    },
    page = 1,
    limit = 10
  ): Promise<{ data: SafetyIncidentDto[]; total: number }> {
    try {
      Logger.info('Finding safety incidents', {
        tenantId,
        filters,
        page,
        limit,
        context: 'SstService.findAll',
      });

      const queryBuilder = this.repository.createQueryBuilder('i');
      queryBuilder.where('i.tenantId = :tenantId', { tenantId });

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

      // Pagination
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [entities, total] = await queryBuilder.getManyAndCount();

      Logger.info('Safety incidents found', {
        tenantId,
        count: entities.length,
        total,
        context: 'SstService.findAll',
      });

      return {
        data: toSafetyIncidentDtoArray(entities),
        total,
      };
    } catch (error) {
      Logger.error('Error finding safety incidents', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        filters,
        context: 'SstService.findAll',
      });
      throw error;
    }
  }

  /**
   * Find safety incident by ID
   */
  async findById(tenantId: number, id: number): Promise<SafetyIncidentDto> {
    try {
      Logger.info('Fetching safety incident', { tenantId, id, context: 'SstService.findById' });

      const entity = await this.repository.findOne({ where: { id, tenantId }, relations: ['reportador'] });

      if (!entity) {
        throw new NotFoundError('Safety incident', id, { tenantId });
      }

      Logger.info('Safety incident fetched', { tenantId, id, context: 'SstService.findById' });
      return toSafetyIncidentDto(entity);
    } catch (error) {
      Logger.error('Error fetching safety incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'SstService.findById',
      });
      throw error;
    }
  }

  /**
   * Create new safety incident
   */
  async create(tenantId: number, data: SafetyIncidentCreateDto): Promise<SafetyIncidentDto> {
    try {
      Logger.info('Creating safety incident', { tenantId, data, context: 'SstService.create' });

      // Business validation: estado must be valid
      const validEstados: EstadoIncidente[] = ['ABIERTO', 'EN_INVESTIGACION', 'CERRADO'];
      if (data.estado && !validEstados.includes(data.estado)) {
        throw new ConflictError('Invalid estado', {
          estado: data.estado,
          valid: validEstados,
          tenantId,
        });
      }

      // Business validation: severidad must be valid
      const validSeveridades: SeveridadIncidente[] = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'];
      if (data.severidad && !validSeveridades.includes(data.severidad)) {
        throw new ConflictError('Invalid severidad', {
          severidad: data.severidad,
          valid: validSeveridades,
          tenantId,
        });
      }

      const entity = this.repository.create({ ...data, tenantId });
      const saved = await this.repository.save(entity);

      Logger.info('Safety incident created', {
        tenantId,
        id: saved.id,
        context: 'SstService.create',
      });
      return toSafetyIncidentDto(saved);
    } catch (error) {
      Logger.error('Error creating safety incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        data,
        context: 'SstService.create',
      });
      throw error;
    }
  }

  /**
   * Update safety incident with estado transition validation
   */
  async update(
    tenantId: number,
    id: number,
    data: SafetyIncidentUpdateDto
  ): Promise<SafetyIncidentDto> {
    try {
      Logger.info('Updating safety incident', { tenantId, id, data, context: 'SstService.update' });

      // Verify existence first
      const existing = await this.findById(tenantId, id);

      // Business validation: estado transitions
      if (data.estado && data.estado !== existing.estado) {
        // Cannot modify closed incident
        if (existing.estado === 'CERRADO') {
          throw new ConflictError('Cannot modify closed incident', {
            currentEstado: existing.estado,
            tenantId,
          });
        }

        // Define valid transitions
        const validTransitions: Record<EstadoIncidente, EstadoIncidente[]> = {
          ABIERTO: ['EN_INVESTIGACION', 'CERRADO'],
          EN_INVESTIGACION: ['CERRADO'],
          CERRADO: [],
        };

        if (!validTransitions[existing.estado].includes(data.estado)) {
          throw new ConflictError('Invalid estado transition', {
            from: existing.estado,
            to: data.estado,
            allowed: validTransitions[existing.estado],
            tenantId,
          });
        }
      }

      // Business validation: severidad if changed
      if (data.severidad) {
        const validSeveridades: SeveridadIncidente[] = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE'];
        if (!validSeveridades.includes(data.severidad)) {
          throw new ConflictError('Invalid severidad', {
            severidad: data.severidad,
            valid: validSeveridades,
            tenantId,
          });
        }
      }

      const entityToUpdate = await this.repository.findOne({ where: { id, tenantId } });
      if (!entityToUpdate) {
        throw new NotFoundError('Safety incident', id, { tenantId });
      }

      Object.assign(entityToUpdate, data);
      const saved = await this.repository.save(entityToUpdate);

      Logger.info('Safety incident updated', { tenantId, id, context: 'SstService.update' });
      return toSafetyIncidentDto(saved);
    } catch (error) {
      Logger.error('Error updating safety incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        data,
        context: 'SstService.update',
      });
      throw error;
    }
  }

  /**
   * Delete safety incident (hard delete)
   */
  async delete(tenantId: number, id: number): Promise<void> {
    try {
      Logger.info('Deleting safety incident', { tenantId, id, context: 'SstService.delete' });

      // Verify existence first
      await this.findById(tenantId, id);

      await this.repository.delete({ id, tenantId });

      Logger.info('Safety incident deleted', { tenantId, id, context: 'SstService.delete' });
    } catch (error) {
      Logger.error('Error deleting safety incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'SstService.delete',
      });
      throw error;
    }
  }

  // ============================================================================
  // Backward Compatibility Methods (DEPRECATED)
  // ============================================================================

  /**
   * @deprecated Use findAll(tenantId, filters, page, limit) instead
   */
  async getAllIncidents(): Promise<Incidente[]> {
    // Convert back to entities (for backward compatibility)
    return this.repository.find({ take: 1000, order: { fechaIncidente: 'DESC' } });
  }

  /**
   * @deprecated Use findById(tenantId, id) instead
   */
  async getIncidentById(id: string): Promise<Incidente | null> {
    try {
      const entity = await this.repository.findOne({ where: { id: parseInt(id) } });
      return entity;
    } catch {
      return null;
    }
  }

  /**
   * @deprecated Use create(tenantId, data) instead
   * Maps old English field names to new Spanish names
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createIncident(data: any): Promise<Incidente> {
    // Map old field names to new Spanish names
    const mappedData: SafetyIncidentCreateDto = {
      fecha_incidente: data.incidentDate || data.fecha_incidente || new Date(),
      tipo_incidente: data.incidentType || data.injuryType || data.tipo_incidente,
      severidad: data.severity || data.severidad,
      ubicacion: data.location || data.ubicacion,
      descripcion: data.description || data.descripcion,
      acciones_tomadas: data.correctiveActions || data.acciones_tomadas,
      proyecto_id: data.projectId || data.proyecto_id,
      reportado_por: data.reportedBy || data.reportado_por,
      estado: data.status || data.estado || 'ABIERTO',
    };

    const createdDto = await this.create(1, mappedData); // Default tenantId = 1
    // Return raw entity for backward compatibility
    const entity = await this.repository.findOne({ where: { id: createdDto.id } });
    return entity!;
  }
}

// Note: Do not export singleton instance - causes "Database not initialized" error at module load time
// Controllers should instantiate: new SstService() in constructor
