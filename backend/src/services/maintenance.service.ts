/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import {
  MaintenanceSchedule,
  TipoMantenimiento,
  EstadoMantenimiento,
} from '../models/maintenance-schedule.model';
import { Repository, ILike } from 'typeorm';

interface MaintenanceFilters {
  status?: EstadoMantenimiento;
  type?: TipoMantenimiento;
  search?: string;
  page?: number;
  limit?: number;
}

export class MaintenanceService {
  private repository: Repository<MaintenanceSchedule>;

  constructor() {
    this.repository = AppDataSource.getRepository(MaintenanceSchedule);
  }

  async getAllMaintenance(filters?: MaintenanceFilters) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.equipo', 'e')
      .orderBy('m.fechaProgramada', 'DESC');

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('m.estado = :status', { status: filters.status });
    }

    if (filters?.type) {
      queryBuilder.andWhere('m.tipoMantenimiento = :type', { type: filters.type });
    }

    if (filters?.search) {
      queryBuilder.andWhere('(e.codigo ILIKE :search OR m.descripcion ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const data = await queryBuilder.skip(offset).take(limit).getMany();

    return {
      data,
      total,
    };
  }

  async getMaintenanceById(id: number) {
    return await this.repository.findOne({
      where: { id },
      relations: ['equipo'],
    });
  }

  async createMaintenance(data: any, userId: string) {
    const maintenance = this.repository.create({
      equipoId: data.equipment_id || data.equipoId,
      tipoMantenimiento: data.maintenance_type || data.tipoMantenimiento,
      descripcion: data.description || data.descripcion,
      fechaProgramada: data.maintenance_date || data.start_date || data.fechaProgramada,
      costoEstimado: data.cost || data.costoEstimado,
      estado: (data.status || data.estado || 'PROGRAMADO') as EstadoMantenimiento,
      observaciones: data.notes || data.observaciones,
      tecnicoResponsable: data.tecnicoResponsable,
    });

    return await this.repository.save(maintenance);
  }

  async updateMaintenance(id: number, data: any, userId: string) {
    const maintenance = await this.repository.findOne({ where: { id } });

    if (!maintenance) {
      return null;
    }

    // Update fields if provided
    if (data.equipment_id !== undefined) maintenance.equipoId = data.equipment_id;
    if (data.equipoId !== undefined) maintenance.equipoId = data.equipoId;
    if (data.maintenance_type !== undefined) maintenance.tipoMantenimiento = data.maintenance_type;
    if (data.tipoMantenimiento !== undefined)
      maintenance.tipoMantenimiento = data.tipoMantenimiento;
    if (data.description !== undefined) maintenance.descripcion = data.description;
    if (data.descripcion !== undefined) maintenance.descripcion = data.descripcion;
    if (data.maintenance_date !== undefined) maintenance.fechaProgramada = data.maintenance_date;
    if (data.start_date !== undefined) maintenance.fechaProgramada = data.start_date;
    if (data.fechaProgramada !== undefined) maintenance.fechaProgramada = data.fechaProgramada;
    if (data.fechaRealizada !== undefined) maintenance.fechaRealizada = data.fechaRealizada;
    if (data.cost !== undefined) maintenance.costoEstimado = data.cost;
    if (data.costoEstimado !== undefined) maintenance.costoEstimado = data.costoEstimado;
    if (data.costoReal !== undefined) maintenance.costoReal = data.costoReal;
    if (data.status !== undefined) maintenance.estado = data.status;
    if (data.estado !== undefined) maintenance.estado = data.estado;
    if (data.notes !== undefined) maintenance.observaciones = data.notes;
    if (data.observaciones !== undefined) maintenance.observaciones = data.observaciones;
    if (data.tecnicoResponsable !== undefined)
      maintenance.tecnicoResponsable = data.tecnicoResponsable;

    return await this.repository.save(maintenance);
  }

  async deleteMaintenance(id: number) {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }
}
