/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import {
  MaintenanceSchedule,
  TipoMantenimiento,
  EstadoMantenimiento,
} from '../models/maintenance-schedule.model';
import { Repository, ILike } from 'typeorm';
import {
  MaintenanceDto,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  toMaintenanceDto,
  fromMaintenanceDto,
  mapCreateMaintenanceDto,
} from '../types/dto/maintenance.dto';

interface MaintenanceFilters {
  status?: EstadoMantenimiento;
  type?: TipoMantenimiento;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export class MaintenanceService {
  private repository: Repository<MaintenanceSchedule>;

  constructor() {
    this.repository = AppDataSource.getRepository(MaintenanceSchedule);
  }

  async getAllMaintenance(filters?: MaintenanceFilters): Promise<{
    data: MaintenanceDto[];
    total: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('m').leftJoinAndSelect('m.equipo', 'e');

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('m.estado = :status', { status: filters.status });
    }

    if (filters?.type) {
      queryBuilder.andWhere('m.tipoMantenimiento = :type', { type: filters.type });
    }

    if (filters?.search) {
      queryBuilder.andWhere('(e.codigo_equipo ILIKE :search OR m.descripcion ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    // Sorting with whitelist
    const sortableFields: Record<string, string> = {
      fecha_programada: 'm.fechaProgramada',
      fecha_realizada: 'm.fechaRealizada',
      tipo_mantenimiento: 'm.tipoMantenimiento',
      estado: 'm.estado',
      costo_estimado: 'm.costoEstimado',
      costo_real: 'm.costoReal',
      tecnico_responsable: 'm.tecnicoResponsable',
      equipo_codigo: 'e.codigo_equipo',
      created_at: 'm.createdAt',
      updated_at: 'm.updatedAt',
    };

    const sortBy =
      filters?.sort_by && sortableFields[filters.sort_by]
        ? sortableFields[filters.sort_by]
        : 'm.fechaProgramada';
    const sortOrder = filters?.sort_order === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(sortBy, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const data = await queryBuilder.skip(offset).take(limit).getMany();

    return {
      data: data.map((m) => toMaintenanceDto(m)),
      total,
    };
  }

  async getMaintenanceById(id: number): Promise<MaintenanceDto | null> {
    const maintenance = await this.repository.findOne({
      where: { id },
      relations: ['equipo'],
    });
    return maintenance ? toMaintenanceDto(maintenance) : null;
  }

  async createMaintenance(data: CreateMaintenanceDto, userId: string): Promise<MaintenanceDto> {
    // Map dual input format to DTO
    const dtoData = mapCreateMaintenanceDto(data);

    const maintenance = this.repository.create(fromMaintenanceDto(dtoData));
    const saved = await this.repository.save(maintenance);

    // Reload with relations
    const withRelations = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['equipo'],
    });

    return toMaintenanceDto(withRelations!);
  }

  async updateMaintenance(
    id: number,
    data: UpdateMaintenanceDto,
    userId: string
  ): Promise<MaintenanceDto | null> {
    const maintenance = await this.repository.findOne({
      where: { id },
      relations: ['equipo'],
    });

    if (!maintenance) {
      return null;
    }

    // Map dual input format to DTO
    const dtoData = mapCreateMaintenanceDto(data);

    Object.assign(maintenance, fromMaintenanceDto(dtoData));
    const saved = await this.repository.save(maintenance);

    // Reload with relations
    const withRelations = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['equipo'],
    });

    return toMaintenanceDto(withRelations!);
  }

  async deleteMaintenance(id: number) {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }
}
