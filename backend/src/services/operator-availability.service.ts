import { AppDataSource } from '../config/database.config';
import { OperatorAvailability } from '../models/operator-availability.model';
import { Repository } from 'typeorm';
import { NotFoundError, ConflictError } from '../errors/http.errors';
import Logger from '../utils/logger';
import { OperatorAvailabilityDto } from '../types/dto/operator-availability.dto';

export class OperatorAvailabilityService {
  private repository: Repository<OperatorAvailability>;

  constructor() {
    this.repository = AppDataSource.getRepository(OperatorAvailability);
  }

  // Transform entity to DTO with snake_case fields
  private transformToDto(entity: OperatorAvailability): OperatorAvailabilityDto {
    return {
      id: entity.id,
      trabajador_id: entity.trabajadorId,
      fecha_inicio: entity.fechaInicio,
      fecha_fin: entity.fechaFin,
      disponible: entity.disponible,
      motivo: entity.motivo || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      // Include trabajador info if loaded
      trabajador_nombre: entity.trabajador?.nombres,
      trabajador_apellido: entity.trabajador
        ? `${entity.trabajador.apellidoPaterno} ${entity.trabajador.apellidoMaterno || ''}`.trim()
        : undefined,
    };
  }

  /**
   * Find all operator availabilities with optional filters and pagination
   */
  async findAll(
    tenantId: number,
    filters?: {
      trabajadorId?: number;
      disponible?: boolean;
      fechaInicio?: Date;
      fechaFin?: Date;
    },
    page = 1,
    limit = 10
  ): Promise<{ data: OperatorAvailabilityDto[]; total: number }> {
    try {
      Logger.info('Finding operator availabilities', {
        tenantId,
        filters,
        page,
        limit,
        context: 'OperatorAvailabilityService.findAll',
      });

      const skip = (page - 1) * limit;

      const query = this.repository
        .createQueryBuilder('avail')
        .leftJoinAndSelect('avail.trabajador', 'trabajador');
      // TODO: Add tenant_id filter when column exists in rrhh.disponibilidad_trabajador table
      // .where('avail.tenant_id = :tenantId', { tenantId })

      if (filters?.trabajadorId) {
        query.andWhere('avail.trabajadorId = :trabajadorId', {
          trabajadorId: filters.trabajadorId,
        });
      }

      if (filters?.disponible !== undefined) {
        query.andWhere('avail.disponible = :disponible', { disponible: filters.disponible });
      }

      if (filters?.fechaInicio && filters?.fechaFin) {
        query.andWhere('(avail.fechaInicio <= :fechaFin AND avail.fechaFin >= :fechaInicio)', {
          fechaInicio: filters.fechaInicio,
          fechaFin: filters.fechaFin,
        });
      }

      const [entities, total] = await query
        .orderBy('avail.fechaInicio', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      Logger.info('Operator availabilities found', {
        tenantId,
        count: entities.length,
        total,
        page,
        context: 'OperatorAvailabilityService.findAll',
      });

      return {
        data: entities.map((e) => this.transformToDto(e)),
        total,
      };
    } catch (error) {
      Logger.error('Error finding operator availabilities', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        filters,
        page,
        limit,
        context: 'OperatorAvailabilityService.findAll',
      });
      throw error;
    }
  }

  /**
   * Find operator availability by ID
   */
  async findById(tenantId: number, id: number): Promise<OperatorAvailabilityDto> {
    try {
      Logger.info('Fetching operator availability', {
        tenantId,
        id,
        context: 'OperatorAvailabilityService.findById',
      });

      const entity = await this.repository.findOne({
        where: {
          id,
          // TODO: Add tenant_id filter when column exists
          // tenant_id: tenantId,
        },
        relations: ['trabajador'],
      });

      if (!entity) {
        throw new NotFoundError('Operator availability', id, { tenantId });
      }

      Logger.info('Operator availability fetched', {
        tenantId,
        id,
        context: 'OperatorAvailabilityService.findById',
      });

      return this.transformToDto(entity);
    } catch (error) {
      Logger.error('Error fetching operator availability', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'OperatorAvailabilityService.findById',
      });
      throw error;
    }
  }

  /**
   * Find all availabilities for a specific operator with optional date range filter
   */
  async findByOperator(
    tenantId: number,
    operatorId: number,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 10
  ): Promise<{ data: OperatorAvailabilityDto[]; total: number }> {
    try {
      Logger.info('Finding operator availabilities by operator', {
        tenantId,
        operatorId,
        startDate,
        endDate,
        page,
        limit,
        context: 'OperatorAvailabilityService.findByOperator',
      });

      const skip = (page - 1) * limit;

      const query = this.repository
        .createQueryBuilder('avail')
        .leftJoinAndSelect('avail.trabajador', 'trabajador')
        .where('avail.trabajadorId = :trabajadorId', { trabajadorId: operatorId });
      // TODO: Add tenant_id filter when column exists

      if (startDate && endDate) {
        query.andWhere('(avail.fechaInicio <= :endDate AND avail.fechaFin >= :startDate)', {
          startDate,
          endDate,
        });
      }

      const [entities, total] = await query
        .orderBy('avail.fechaInicio', 'ASC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      Logger.info('Operator availabilities by operator found', {
        tenantId,
        operatorId,
        count: entities.length,
        total,
        context: 'OperatorAvailabilityService.findByOperator',
      });

      return {
        data: entities.map((e) => this.transformToDto(e)),
        total,
      };
    } catch (error) {
      Logger.error('Error finding operator availabilities by operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        operatorId,
        startDate,
        endDate,
        context: 'OperatorAvailabilityService.findByOperator',
      });
      throw error;
    }
  }

  /**
   * Find available operators in a date range
   */
  async findAvailableOperators(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    page = 1,
    limit = 10
  ): Promise<{ data: OperatorAvailabilityDto[]; total: number }> {
    try {
      Logger.info('Finding available operators', {
        tenantId,
        startDate,
        endDate,
        page,
        limit,
        context: 'OperatorAvailabilityService.findAvailableOperators',
      });

      const skip = (page - 1) * limit;

      const [entities, total] = await this.repository
        .createQueryBuilder('avail')
        .leftJoinAndSelect('avail.trabajador', 'trabajador')
        .where('avail.disponible = :disponible', { disponible: true })
        .andWhere('(avail.fechaInicio <= :endDate AND avail.fechaFin >= :startDate)', {
          startDate,
          endDate,
        })
        // TODO: Add tenant_id filter when column exists
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      Logger.info('Available operators found', {
        tenantId,
        count: entities.length,
        total,
        context: 'OperatorAvailabilityService.findAvailableOperators',
      });

      return {
        data: entities.map((e) => this.transformToDto(e)),
        total,
      };
    } catch (error) {
      Logger.error('Error finding available operators', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        startDate,
        endDate,
        context: 'OperatorAvailabilityService.findAvailableOperators',
      });
      throw error;
    }
  }

  /**
   * Create a new operator availability record
   */
  async create(
    tenantId: number,
    data: Partial<OperatorAvailability>
  ): Promise<OperatorAvailabilityDto> {
    try {
      Logger.info('Creating operator availability', {
        tenantId,
        data,
        context: 'OperatorAvailabilityService.create',
      });

      // Business validation: Date range check
      if (data.fechaInicio && data.fechaFin) {
        const startDate = new Date(data.fechaInicio);
        const endDate = new Date(data.fechaFin);

        if (startDate >= endDate) {
          throw new ConflictError('Date range invalid: fecha_inicio must be before fecha_fin', {
            fecha_inicio: data.fechaInicio,
            fecha_fin: data.fechaFin,
            tenantId,
          });
        }
      }

      // Business validation: Check for overlapping availability
      const overlaps = await this.repository
        .createQueryBuilder('avail')
        .where('avail.trabajadorId = :trabajadorId', { trabajadorId: data.trabajadorId })
        .andWhere('avail.fechaInicio <= :fechaFin', { fechaFin: data.fechaFin })
        .andWhere('avail.fechaFin >= :fechaInicio', { fechaInicio: data.fechaInicio })
        // TODO: Add tenant_id filter when column exists
        .getCount();

      if (overlaps > 0) {
        throw new ConflictError('Availability period overlaps with existing record', {
          trabajador_id: data.trabajadorId,
          fecha_inicio: data.fechaInicio,
          fecha_fin: data.fechaFin,
          existing_overlaps: overlaps,
          tenantId,
        });
      }

      const availability = this.repository.create(data);
      // TODO: Set tenant_id when creating
      // availability.tenant_id = tenantId;

      const saved = await this.repository.save(availability);

      // Reload with relations
      const entity = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['trabajador'],
      });

      Logger.info('Operator availability created', {
        tenantId,
        id: saved.id,
        trabajadorId: data.trabajadorId,
        context: 'OperatorAvailabilityService.create',
      });

      return this.transformToDto(entity!);
    } catch (error) {
      Logger.error('Error creating operator availability', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        data,
        context: 'OperatorAvailabilityService.create',
      });
      throw error;
    }
  }

  /**
   * Update operator availability record
   */
  async update(
    tenantId: number,
    id: number,
    data: Partial<OperatorAvailability>
  ): Promise<OperatorAvailabilityDto> {
    try {
      Logger.info('Updating operator availability', {
        tenantId,
        id,
        data,
        context: 'OperatorAvailabilityService.update',
      });

      // Verify existence first (throws NotFoundError if not found)
      const existing = await this.findById(tenantId, id);

      // Business validation: Date range check (if dates are being updated)
      if (data.fechaInicio || data.fechaFin) {
        const startDate = new Date(data.fechaInicio || existing.fecha_inicio);
        const endDate = new Date(data.fechaFin || existing.fecha_fin);

        if (startDate >= endDate) {
          throw new ConflictError('Date range invalid: fecha_inicio must be before fecha_fin', {
            fecha_inicio: startDate,
            fecha_fin: endDate,
            tenantId,
          });
        }
      }

      // Business validation: Check for overlapping availability (exclude current record)
      if (data.fechaInicio || data.fechaFin || data.trabajadorId) {
        const trabajadorId = data.trabajadorId || existing.trabajador_id;
        const fechaInicio = data.fechaInicio || existing.fecha_inicio;
        const fechaFin = data.fechaFin || existing.fecha_fin;

        const overlaps = await this.repository
          .createQueryBuilder('avail')
          .where('avail.trabajadorId = :trabajadorId', { trabajadorId })
          .andWhere('avail.id != :currentId', { currentId: id })
          .andWhere('avail.fechaInicio <= :fechaFin', { fechaFin })
          .andWhere('avail.fechaFin >= :fechaInicio', { fechaInicio })
          // TODO: Add tenant_id filter when column exists
          .getCount();

        if (overlaps > 0) {
          throw new ConflictError('Updated availability period overlaps with existing record', {
            trabajador_id: trabajadorId,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            existing_overlaps: overlaps,
            tenantId,
          });
        }
      }

      await this.repository.update(id, data);

      const updated = await this.findById(tenantId, id);

      Logger.info('Operator availability updated', {
        tenantId,
        id,
        context: 'OperatorAvailabilityService.update',
      });

      return updated;
    } catch (error) {
      Logger.error('Error updating operator availability', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        data,
        context: 'OperatorAvailabilityService.update',
      });
      throw error;
    }
  }

  /**
   * Delete operator availability record
   */
  async delete(tenantId: number, id: number): Promise<void> {
    try {
      Logger.info('Deleting operator availability', {
        tenantId,
        id,
        context: 'OperatorAvailabilityService.delete',
      });

      // Verify existence (throws NotFoundError if not found)
      await this.findById(tenantId, id);

      await this.repository.delete(id);

      Logger.info('Operator availability deleted', {
        tenantId,
        id,
        context: 'OperatorAvailabilityService.delete',
      });
    } catch (error) {
      Logger.error('Error deleting operator availability', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'OperatorAvailabilityService.delete',
      });
      throw error;
    }
  }

  /**
   * Bulk create operator availability records
   */
  async bulkCreate(
    tenantId: number,
    availabilities: Partial<OperatorAvailability>[]
  ): Promise<OperatorAvailabilityDto[]> {
    try {
      Logger.info('Bulk creating operator availabilities', {
        tenantId,
        count: availabilities.length,
        context: 'OperatorAvailabilityService.bulkCreate',
      });

      // Validate each record before creating
      for (const data of availabilities) {
        // Date range validation
        if (data.fechaInicio && data.fechaFin) {
          const startDate = new Date(data.fechaInicio);
          const endDate = new Date(data.fechaFin);

          if (startDate >= endDate) {
            throw new ConflictError(
              'Date range invalid in bulk data: fecha_inicio must be before fecha_fin',
              {
                fecha_inicio: data.fechaInicio,
                fecha_fin: data.fechaFin,
                trabajador_id: data.trabajadorId,
                tenantId,
              }
            );
          }
        }

        // Check for overlaps (this could be optimized with a single query)
        const overlaps = await this.repository
          .createQueryBuilder('avail')
          .where('avail.trabajadorId = :trabajadorId', { trabajadorId: data.trabajadorId })
          .andWhere('avail.fechaInicio <= :fechaFin', { fechaFin: data.fechaFin })
          .andWhere('avail.fechaFin >= :fechaInicio', { fechaInicio: data.fechaInicio })
          // TODO: Add tenant_id filter when column exists
          .getCount();

        if (overlaps > 0) {
          throw new ConflictError(
            'Availability period in bulk data overlaps with existing record',
            {
              trabajador_id: data.trabajadorId,
              fecha_inicio: data.fechaInicio,
              fecha_fin: data.fechaFin,
              existing_overlaps: overlaps,
              tenantId,
            }
          );
        }
      }

      const entities = availabilities.map((data) => this.repository.create(data));
      const saved = await this.repository.save(entities);

      // Reload with relations
      const ids = saved.map((e) => e.id);
      const reloaded = await this.repository.find({
        where: ids.map((id) => ({ id })),
        relations: ['trabajador'],
      });

      Logger.info('Operator availabilities bulk created', {
        tenantId,
        count: saved.length,
        context: 'OperatorAvailabilityService.bulkCreate',
      });

      return reloaded.map((e) => this.transformToDto(e));
    } catch (error) {
      Logger.error('Error bulk creating operator availabilities', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        count: availabilities.length,
        context: 'OperatorAvailabilityService.bulkCreate',
      });
      throw error;
    }
  }
}
