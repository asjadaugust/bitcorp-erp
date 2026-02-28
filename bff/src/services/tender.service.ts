import { AppDataSource } from '../config/database.config';
import { Licitacion, EstadoLicitacion } from '../models/tender.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';
import { NotFoundError, ConflictError } from '../errors';
import {
  TenderDto,
  LicitacionCreateDto,
  LicitacionUpdateDto,
  toTenderDto,
  toTenderDtoArray,
} from '../types/dto/tender.dto';

/**
 * Estado transition rules for tender workflow
 * Defines valid estado transitions for business logic validation
 */
const ESTADO_TRANSITIONS: Record<EstadoLicitacion, EstadoLicitacion[]> = {
  PUBLICADO: ['EVALUACION', 'CANCELADO'],
  EVALUACION: ['ADJUDICADO', 'DESIERTO', 'CANCELADO'],
  ADJUDICADO: [], // Terminal state - no transitions allowed
  DESIERTO: [], // Terminal state - no transitions allowed
  CANCELADO: [], // Terminal state - no transitions allowed
};

/**
 * Validate estado transition according to business rules
 * @throws ConflictError if transition is invalid
 */
function validateEstadoTransition(
  currentEstado: EstadoLicitacion,
  newEstado: EstadoLicitacion
): void {
  if (currentEstado === newEstado) {
    return; // No transition, estado unchanged
  }

  const allowedTransitions = ESTADO_TRANSITIONS[currentEstado];
  if (!allowedTransitions.includes(newEstado)) {
    throw new ConflictError(
      `Invalid estado transition from ${currentEstado} to ${newEstado}. Allowed transitions: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
      {
        currentEstado,
        newEstado,
        allowedTransitions,
      }
    );
  }
}

/**
 * TenderService - Manages tender/bid (licitaciones) workflow
 *
 * Follows ARCHITECTURE.md patterns:
 * - Tenant-aware queries (tenantId parameter in all methods)
 * - Typed errors (NotFoundError, ConflictError)
 * - Comprehensive logging (Logger.info + Logger.error)
 * - DTOs for all responses (no raw entities)
 * - Business validation (estado transitions)
 * - Pagination for list operations
 */
export class TenderService {
  private repository: Repository<Licitacion>;

  constructor() {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    this.repository = AppDataSource.getRepository(Licitacion);
  }

  /**
   * Find all tenders with optional filters and pagination
   * @param tenantId - Company tenant ID
   * @param filters - Optional search and estado filters
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Paginated list of tenders as DTOs
   */
  async findAll(
    tenantId: number,
    filters?: { search?: string; estado?: EstadoLicitacion },
    page = 1,
    limit = 10
  ): Promise<{ data: TenderDto[]; total: number }> {
    try {
      Logger.info('Finding tenders', {
        tenantId,
        filters,
        page,
        limit,
        context: 'TenderService.findAll',
      });

      const queryBuilder = this.repository.createQueryBuilder('l');

      queryBuilder.where('l.tenantId = :tenantId', { tenantId });

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

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      queryBuilder.skip((page - 1) * limit).take(limit);

      const licitaciones = await queryBuilder.getMany();

      Logger.info('Tenders found', {
        tenantId,
        count: licitaciones.length,
        total,
        page,
        limit,
        context: 'TenderService.findAll',
      });

      return {
        data: toTenderDtoArray(licitaciones),
        total,
      };
    } catch (error) {
      Logger.error('Error finding tenders', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        filters,
        page,
        limit,
        context: 'TenderService.findAll',
      });
      throw error;
    }
  }

  /**
   * Find tender by ID
   * @param tenantId - Company tenant ID
   * @param id - Tender ID
   * @returns Tender DTO
   * @throws NotFoundError if tender not found
   */
  async findById(tenantId: number, id: number): Promise<TenderDto> {
    try {
      Logger.info('Fetching tender', { tenantId, id, context: 'TenderService.findById' });

      const licitacion = await this.repository.findOne({ where: { id, tenantId } });

      if (!licitacion) {
        throw new NotFoundError('Tender', id, { tenantId });
      }

      Logger.info('Tender fetched', { tenantId, id, context: 'TenderService.findById' });

      return toTenderDto(licitacion);
    } catch (error) {
      Logger.error('Error fetching tender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'TenderService.findById',
      });
      throw error;
    }
  }

  /**
   * Create new tender
   * @param tenantId - Company tenant ID
   * @param data - Tender creation data
   * @returns Created tender DTO
   * @throws ConflictError if codigo already exists or estado is invalid
   */
  async create(tenantId: number, data: LicitacionCreateDto): Promise<TenderDto> {
    try {
      Logger.info('Creating tender', {
        tenantId,
        codigo: data.codigo,
        context: 'TenderService.create',
      });

      // Validate estado if provided
      if (data.estado) {
        const validEstados: EstadoLicitacion[] = [
          'PUBLICADO',
          'EVALUACION',
          'ADJUDICADO',
          'DESIERTO',
          'CANCELADO',
        ];
        if (!validEstados.includes(data.estado)) {
          throw new ConflictError(
            `Invalid estado: ${data.estado}. Must be one of: ${validEstados.join(', ')}`,
            { estado: data.estado, validEstados }
          );
        }
      }

      // Check if codigo already exists within this tenant
      const existing = await this.repository.findOne({ where: { codigo: data.codigo, tenantId } });

      if (existing) {
        throw new ConflictError(`A tender with codigo '${data.codigo}' already exists`, {
          codigo: data.codigo,
        });
      }

      // Map DTO fields to entity (handle snake_case → camelCase)
      const licitacionData: Partial<Licitacion> = {
        codigo: data.codigo,
        nombre: data.nombre,
        entidadConvocante: data.entidad_convocante,
        montoReferencial: data.monto_referencial,
        fechaConvocatoria: data.fecha_convocatoria ? new Date(data.fecha_convocatoria) : undefined,
        fechaPresentacion: data.fecha_presentacion ? new Date(data.fecha_presentacion) : undefined,
        estado: data.estado || 'PUBLICADO',
        observaciones: data.observaciones,
        tenantId,
      };

      const licitacion = this.repository.create(licitacionData);
      const saved = await this.repository.save(licitacion);

      Logger.info('Tender created', {
        tenantId,
        id: saved.id,
        codigo: saved.codigo,
        context: 'TenderService.create',
      });

      return toTenderDto(saved);
    } catch (error) {
      Logger.error('Error creating tender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        codigo: data.codigo,
        context: 'TenderService.create',
      });
      throw error;
    }
  }

  /**
   * Update tender
   * @param tenantId - Company tenant ID
   * @param id - Tender ID
   * @param data - Tender update data
   * @returns Updated tender DTO
   * @throws NotFoundError if tender not found
   * @throws ConflictError if estado transition is invalid
   */
  async update(tenantId: number, id: number, data: LicitacionUpdateDto): Promise<TenderDto> {
    try {
      Logger.info('Updating tender', { tenantId, id, context: 'TenderService.update' });

      // Fetch existing tender
      const licitacion = await this.repository.findOne({ where: { id, tenantId } });

      if (!licitacion) {
        throw new NotFoundError('Tender', id, { tenantId });
      }

      // Validate estado transition if estado is being changed
      if (data.estado && data.estado !== licitacion.estado) {
        validateEstadoTransition(licitacion.estado, data.estado);
      }

      // Map DTO fields to entity (handle snake_case → camelCase)
      const updateData: Partial<Licitacion> = {};

      if (data.codigo !== undefined) updateData.codigo = data.codigo;
      if (data.nombre !== undefined) updateData.nombre = data.nombre;
      if (data.entidad_convocante !== undefined)
        updateData.entidadConvocante = data.entidad_convocante;
      if (data.monto_referencial !== undefined)
        updateData.montoReferencial = data.monto_referencial;
      if (data.fecha_convocatoria !== undefined) {
        updateData.fechaConvocatoria = new Date(data.fecha_convocatoria);
      }
      if (data.fecha_presentacion !== undefined) {
        updateData.fechaPresentacion = new Date(data.fecha_presentacion);
      }
      if (data.estado !== undefined) updateData.estado = data.estado;
      if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

      Object.assign(licitacion, updateData);
      const saved = await this.repository.save(licitacion);

      Logger.info('Tender updated', { tenantId, id, context: 'TenderService.update' });

      return toTenderDto(saved);
    } catch (error) {
      Logger.error('Error updating tender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'TenderService.update',
      });
      throw error;
    }
  }

  /**
   * Delete tender
   * @param tenantId - Company tenant ID
   * @param id - Tender ID
   * @throws NotFoundError if tender not found
   */
  async delete(tenantId: number, id: number): Promise<void> {
    try {
      Logger.info('Deleting tender', { tenantId, id, context: 'TenderService.delete' });

      // Verify tender exists before deleting
      const licitacion = await this.repository.findOne({ where: { id, tenantId } });

      if (!licitacion) {
        throw new NotFoundError('Tender', id, { tenantId });
      }

      // Hard delete (no soft delete in schema)
      await this.repository.delete(id);

      Logger.info('Tender deleted', { tenantId, id, context: 'TenderService.delete' });
    } catch (error) {
      Logger.error('Error deleting tender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'TenderService.delete',
      });
      throw error;
    }
  }

  // ============================================================================
  // Backward compatibility methods (deprecated, use new methods instead)
  // ============================================================================

  /**
   * @deprecated Use findAll(tenantId, filters, page, limit) instead
   */
  async getAllTenders(): Promise<Licitacion[]> {
    // Return raw entities for backward compatibility (controller expects this)
    return await this.repository.find({ order: { fechaPresentacion: 'ASC' } });
  }

  /**
   * @deprecated Use findById(tenantId, id) instead
   */
  async getTenderById(id: string): Promise<Licitacion | null> {
    const tenantId = 1; // Default tenant for backward compatibility
    try {
      await this.findById(tenantId, parseInt(id));
      // Return raw entity for backward compatibility
      return await this.repository.findOne({ where: { id: parseInt(id) } });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * @deprecated Use create(tenantId, data) instead
   * Maps old English field names to new Spanish names for backward compatibility
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createTender(data: any): Promise<Licitacion> {
    const tenantId = 1; // Default tenant for backward compatibility

    // Map old field names to new Spanish names
    const mappedData: LicitacionCreateDto = {
      codigo: data.tenderNumber || data.codigo,
      nombre: data.title || data.nombre,
      entidad_convocante: data.clientName || data.entidadConvocante || data.entidad_convocante,
      monto_referencial: data.estimatedValue || data.montoReferencial || data.monto_referencial,
      fecha_convocatoria: data.openingDate || data.fechaConvocatoria || data.fecha_convocatoria,
      fecha_presentacion: data.submissionDate || data.fechaPresentacion || data.fecha_presentacion,
      estado: data.status || data.estado || 'PUBLICADO',
      observaciones: data.notes || data.observaciones,
    };

    await this.create(tenantId, mappedData);

    // Return raw entity for backward compatibility (controller expects this)
    return (await this.repository.findOne({ where: { codigo: mappedData.codigo } })) as Licitacion;
  }
}

// Note: Do not export singleton instance - causes "Database not initialized" error at module load time
// Controllers should instantiate: new TenderService() in constructor
