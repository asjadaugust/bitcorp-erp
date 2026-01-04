import { AppDataSource } from '../config/database.config';
import { OperatorAvailability } from '../models/operator-availability.model';
import { Repository, Between } from 'typeorm';

// DTO with snake_case fields for API responses
export interface OperatorAvailabilityDto {
  id: number;
  trabajador_id: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  disponible: boolean;
  motivo: string | null;
  created_at: Date;
  updated_at: Date;
  // Optional relation fields
  trabajador_nombre?: string;
  trabajador_apellido?: string;
}

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

  async findAll(filters?: {
    trabajadorId?: number;
    disponible?: boolean;
    fechaInicio?: Date;
    fechaFin?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    data: OperatorAvailabilityDto[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.repository
      .createQueryBuilder('avail')
      .leftJoinAndSelect('avail.trabajador', 'trabajador');

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

    return {
      data: entities.map((e) => this.transformToDto(e)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<OperatorAvailabilityDto | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    return entity ? this.transformToDto(entity) : null;
  }

  async findByOperator(
    operatorId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<OperatorAvailabilityDto[]> {
    const query = this.repository
      .createQueryBuilder('avail')
      .leftJoinAndSelect('avail.trabajador', 'trabajador')
      .where('avail.trabajadorId = :trabajadorId', { trabajadorId: operatorId });

    if (startDate && endDate) {
      query.andWhere('(avail.fechaInicio <= :endDate AND avail.fechaFin >= :startDate)', {
        startDate,
        endDate,
      });
    }

    const entities = await query.orderBy('avail.fechaInicio', 'ASC').getMany();
    return entities.map((e) => this.transformToDto(e));
  }

  async findAvailableOperators(startDate: Date, endDate: Date): Promise<OperatorAvailabilityDto[]> {
    const entities = await this.repository
      .createQueryBuilder('avail')
      .leftJoinAndSelect('avail.trabajador', 'trabajador')
      .where('avail.disponible = :disponible', { disponible: true })
      .andWhere('(avail.fechaInicio <= :endDate AND avail.fechaFin >= :startDate)', {
        startDate,
        endDate,
      })
      .getMany();

    return entities.map((e) => this.transformToDto(e));
  }

  async create(data: Partial<OperatorAvailability>): Promise<OperatorAvailabilityDto> {
    const availability = this.repository.create(data);
    const saved = await this.repository.save(availability);
    // Reload with relations
    const entity = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['trabajador'],
    });
    return this.transformToDto(entity!);
  }

  async update(
    id: number,
    data: Partial<OperatorAvailability>
  ): Promise<OperatorAvailabilityDto | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async bulkCreate(
    availabilities: Partial<OperatorAvailability>[]
  ): Promise<OperatorAvailabilityDto[]> {
    const entities = availabilities.map((data) => this.repository.create(data));
    const saved = await this.repository.save(entities);
    // Reload with relations
    const ids = saved.map((e) => e.id);
    const reloaded = await this.repository.find({
      where: ids.map((id) => ({ id })),
      relations: ['trabajador'],
    });
    return reloaded.map((e) => this.transformToDto(e));
  }
}
