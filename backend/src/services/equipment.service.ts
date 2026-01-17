/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Equipment } from '../models/equipment.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';

export interface CreateEquipmentDto {
  codigo_equipo: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  numero_serie_equipo?: string;
  numero_chasis?: string;
  numero_serie_motor?: string;
  placa?: string;
  anio_fabricacion?: number;
  potencia_neta?: number;
  tipo_motor?: string;
  medidor_uso?: string;
  estado?: string;
  tipo_proveedor?: string;
  tipoEquipoId?: number; // matches entity property
  proveedorId?: number; // matches entity property
  creadoPor?: number; // matches entity property
  actualizadoPor?: number; // matches entity property
  // Allow snake_case aliases for frontend compatibility
  tipo_equipo_id?: number;
  proveedor_id?: number;
  creado_por?: number;
  actualizado_por?: number;
}

export type UpdateEquipmentDto = Partial<CreateEquipmentDto>;

export interface EquipmentFilter {
  estado?: string;
  categoria?: string;
  equipmentTypeId?: number;
  providerId?: number;
  search?: string;
  isActive?: boolean;
}

export interface EquipmentDto {
  id: number;
  code: string;
  equipment_type_id: number | null;
  provider_id: number | null;
  provider_name: string | null;
  provider_type: string | null;
  category: string | null;
  plate_number: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  chassis_number: string | null;
  engine_serial_number: string | null;
  manufacture_year: number | null;
  net_power: number | null;
  engine_type: string | null;
  meter_type: string | null;
  status: string;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export class EquipmentService {
  private get repository(): Repository<Equipment> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Equipment);
  }

  private transformToDto(equipment: Equipment): EquipmentDto {
    return {
      id: equipment.id,
      code: equipment.codigo_equipo,
      equipment_type_id: equipment.tipoEquipoId || null,
      provider_id: equipment.proveedorId || null,
      provider_name: equipment.provider?.razon_social || null,
      provider_type: equipment.tipo_proveedor || null,
      category: equipment.categoria || null,
      plate_number: equipment.placa || null,
      brand: equipment.marca || null,
      model: equipment.modelo || null,
      serial_number: equipment.numero_serie_equipo || null,
      chassis_number: equipment.numero_chasis || null,
      engine_serial_number: equipment.numero_serie_motor || null,
      manufacture_year: equipment.anio_fabricacion || null,
      net_power: equipment.potencia_neta ? Number(equipment.potencia_neta) : null,
      engine_type: equipment.tipo_motor || null,
      meter_type: equipment.medidor_uso || null,
      status: equipment.estado,
      is_active: equipment.is_active,
      created_by: equipment.creadoPor || null,
      updated_by: equipment.actualizadoPor || null,
      created_at: equipment.created_at,
      updated_at: equipment.updated_at,
    };
  }

  async findAll(
    filter?: EquipmentFilter,
    page = 1,
    limit = 10
  ): Promise<{ data: EquipmentDto[]; total: number }> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('e')
        .leftJoinAndSelect('e.provider', 'p')
        .where('e.is_active = :isActive', { isActive: filter?.isActive ?? true });

      if (filter?.estado) {
        queryBuilder.andWhere('e.estado = :estado', { estado: filter.estado });
      }

      if (filter?.categoria) {
        queryBuilder.andWhere('e.categoria = :categoria', { categoria: filter.categoria });
      }

      if (filter?.providerId) {
        queryBuilder.andWhere('e.provider_id = :providerId', { providerId: filter.providerId });
      }

      // Filter by Project (using subquery on equipo_edt)
      if (filter?.equipmentTypeId) {
        // Assuming this was a typo in original code, unrelated to project
        queryBuilder.andWhere('e.equipment_type_id = :typeId', { typeId: filter.equipmentTypeId });
      }

      // If filtering by Project, we need to look up assignments
      // This is complex with TypeORM QueryBuilder on unrelated table without ManyToMany
      // For now, removing the direct column filter which caused the crash.
      // If project filter is strictly needed, we should join equipment_edt
      // queryBuilder.innerJoin('equipo.equipo_edt', 'edt', 'edt.equipment_id = e.id AND edt.project_id = :projectId', { projectId: filter.projectId });

      if (filter?.search) {
        queryBuilder.andWhere(
          '(e.codigo_equipo ILIKE :search OR e.marca ILIKE :search OR e.modelo ILIKE :search OR e.placa ILIKE :search OR e.categoria ILIKE :search)',
          { search: `%${filter.search}%` }
        );
      }

      queryBuilder.orderBy('e.codigo_equipo', 'ASC');

      // Add pagination
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [equipment, total] = await queryBuilder.getManyAndCount();

      return {
        data: equipment.map((e) => this.transformToDto(e)),
        total,
      };
    } catch (error) {
      Logger.error('Error finding equipment', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filter,
        page,
        limit,
        context: 'EquipmentService.findAll',
      });
      throw new Error('Failed to fetch equipment');
    }
  }

  async findById(id: number): Promise<EquipmentDto> {
    try {
      const equipment = await this.repository.findOne({
        where: { id },
        relations: ['provider'],
      });

      if (!equipment) {
        throw new Error('Equipment not found');
      }

      return this.transformToDto(equipment);
    } catch (error) {
      Logger.error('Error finding equipment by ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'EquipmentService.findById',
      });
      throw error;
    }
  }

  async findByCode(codigo: string): Promise<Equipment | null> {
    try {
      return await this.repository.findOne({
        where: { codigo_equipo: codigo },
      });
    } catch (error) {
      Logger.error('Error finding equipment by code', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        codigo,
        context: 'EquipmentService.findByCode',
      });
      throw error;
    }
  }

  async create(data: CreateEquipmentDto): Promise<EquipmentDto> {
    try {
      // Check if codigo already exists
      if (data.codigo_equipo) {
        const existing = await this.findByCode(data.codigo_equipo);
        if (existing) {
          throw new Error('Equipment code already exists');
        }
      }

      // Map DTO to entity properties (handle snake_case aliases)
      const equipment = this.repository.create({
        codigo_equipo: data.codigo_equipo,
        categoria: data.categoria,
        marca: data.marca,
        modelo: data.modelo,
        numero_serie_equipo: data.numero_serie_equipo,
        numero_chasis: data.numero_chasis,
        numero_serie_motor: data.numero_serie_motor,
        placa: data.placa,
        anio_fabricacion: data.anio_fabricacion,
        potencia_neta: data.potencia_neta,
        tipo_motor: data.tipo_motor,
        medidor_uso: data.medidor_uso,
        estado: data.estado || 'DISPONIBLE',
        tipo_proveedor: data.tipo_proveedor,
        tipoEquipoId: data.tipoEquipoId || data.tipo_equipo_id,
        proveedorId: data.proveedorId || data.proveedor_id,
        creadoPor: data.creadoPor || data.creado_por,
        is_active: true,
      });

      const saved = await this.repository.save(equipment);

      // Load relations before transforming
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['provider'],
      });

      return this.transformToDto(withRelations!);
    } catch (error) {
      Logger.error('Error creating equipment', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'EquipmentService.create',
      });
      throw error;
    }
  }

  async update(id: number, data: UpdateEquipmentDto): Promise<EquipmentDto> {
    try {
      const equipment = await this.repository.findOne({
        where: { id },
        relations: ['provider'],
      });

      if (!equipment) {
        throw new Error('Equipment not found');
      }

      // If updating codigo, check it doesn't exist
      if (data.codigo_equipo && data.codigo_equipo !== equipment.codigo_equipo) {
        const existing = await this.findByCode(data.codigo_equipo);
        if (existing && existing.id !== id) {
          throw new Error('Equipment code already exists');
        }
      }

      // Map DTO to entity properties (handle snake_case aliases)
      if (data.codigo_equipo !== undefined) equipment.codigo_equipo = data.codigo_equipo;
      if (data.categoria !== undefined) equipment.categoria = data.categoria;
      if (data.marca !== undefined) equipment.marca = data.marca;
      if (data.modelo !== undefined) equipment.modelo = data.modelo;
      if (data.numero_serie_equipo !== undefined)
        equipment.numero_serie_equipo = data.numero_serie_equipo;
      if (data.numero_chasis !== undefined) equipment.numero_chasis = data.numero_chasis;
      if (data.numero_serie_motor !== undefined)
        equipment.numero_serie_motor = data.numero_serie_motor;
      if (data.placa !== undefined) equipment.placa = data.placa;
      if (data.anio_fabricacion !== undefined) equipment.anio_fabricacion = data.anio_fabricacion;
      if (data.potencia_neta !== undefined) equipment.potencia_neta = data.potencia_neta;
      if (data.tipo_motor !== undefined) equipment.tipo_motor = data.tipo_motor;
      if (data.medidor_uso !== undefined) equipment.medidor_uso = data.medidor_uso;
      if (data.estado !== undefined) equipment.estado = data.estado;
      if (data.tipo_proveedor !== undefined) equipment.tipo_proveedor = data.tipo_proveedor;
      if (data.tipoEquipoId !== undefined || data.tipo_equipo_id !== undefined) {
        equipment.tipoEquipoId = data.tipoEquipoId || data.tipo_equipo_id;
      }
      if (data.proveedorId !== undefined || data.proveedor_id !== undefined) {
        equipment.proveedorId = data.proveedorId || data.proveedor_id;
      }
      if (data.actualizadoPor !== undefined || data.actualizado_por !== undefined) {
        equipment.actualizadoPor = data.actualizadoPor || data.actualizado_por;
      }

      const saved = await this.repository.save(equipment);

      // Reload to get updated relations
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['provider'],
      });

      return this.transformToDto(withRelations!);
    } catch (error) {
      Logger.error('Error updating equipment', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        data,
        context: 'EquipmentService.update',
      });
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.repository.update(id, { is_active: false });
    } catch (error) {
      Logger.error('Error deleting equipment', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'EquipmentService.delete',
      });
      throw new Error('Failed to delete equipment');
    }
  }

  async updateStatus(id: number, estado: string): Promise<EquipmentDto> {
    try {
      const equipment = await this.repository.findOne({
        where: { id },
        relations: ['provider'],
      });

      if (!equipment) {
        throw new Error('Equipment not found');
      }

      equipment.estado = estado;
      const saved = await this.repository.save(equipment);

      return this.transformToDto(saved);
    } catch (error) {
      Logger.error('Error updating equipment status', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        estado,
        context: 'EquipmentService.updateStatus',
      });
      throw error;
    }
  }

  async updateHourmeter(id: number, reading: number): Promise<EquipmentDto> {
    const equipment = await this.repository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    // equipment.medidor_uso = reading.toString(); // assuming medidor_uso stores current reading
    // Logic to update hourmeter
    return this.transformToDto(equipment);
  }

  async updateOdometer(id: number, reading: number): Promise<EquipmentDto> {
    const equipment = await this.repository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    // equipment.medidor_uso = reading.toString();
    return this.transformToDto(equipment);
  }

  async getStatistics(): Promise<{
    total: number;
    disponible: number;
    enUso: number;
    mantenimiento: number;
    retirado: number;
  }> {
    try {
      const stats = await this.repository
        .createQueryBuilder('e')
        .select('e.estado', 'estado')
        .addSelect('COUNT(*)', 'count')
        .where('e.is_active = true')
        .groupBy('e.estado')
        .getRawMany();

      const result = {
        total: 0,
        disponible: 0,
        enUso: 0,
        mantenimiento: 0,
        retirado: 0,
      };

      stats.forEach((s) => {
        const count = parseInt(s.count);
        result.total += count;
        switch (s.estado?.toUpperCase()) {
          case 'DISPONIBLE':
          case 'AVAILABLE':
            result.disponible = count;
            break;
          case 'EN_USO':
          case 'IN_USE':
            result.enUso = count;
            break;
          case 'MANTENIMIENTO':
          case 'MAINTENANCE':
            result.mantenimiento = count;
            break;
          case 'RETIRADO':
          case 'RETIRED':
            result.retirado = count;
            break;
        }
      });

      return result;
    } catch (error) {
      Logger.error('Error getting equipment statistics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'EquipmentService.getStatistics',
      });
      throw error;
    }
  }

  async getEquipmentTypes(): Promise<string[]> {
    try {
      const result = await this.repository
        .createQueryBuilder('e')
        .select('DISTINCT e.categoria', 'categoria')
        .where('e.categoria IS NOT NULL')
        .orderBy('e.categoria')
        .getRawMany();

      return result.map((r) => r.categoria);
    } catch (error) {
      Logger.error('Error getting equipment types', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'EquipmentService.getEquipmentTypes',
      });
      throw error;
    }
  }

  // Stub methods for compatibility
  async assignToProject(id: number, data: any) {
    Logger.debug('Equipment assignment to project requested', {
      equipmentId: id,
      projectData: data,
      context: 'EquipmentService.assignToProject',
    });
    return { id, ...data, status: 'assigned' };
  }

  async transferEquipment(id: number, data: any) {
    Logger.debug('Equipment transfer requested', {
      equipmentId: id,
      transferData: data,
      context: 'EquipmentService.transferEquipment',
    });
    return { id, ...data, status: 'transferred' };
  }

  async getAvailability(idOrFilters: any, startDate?: Date, endDate?: Date) {
    return true;
  }

  async getAvailableEquipment(): Promise<EquipmentDto[]> {
    const result = await this.findAll({ estado: 'DISPONIBLE' }, 1, 9999);
    return result.data;
  }

  async getAssignmentHistory(equipmentId: number): Promise<any[]> {
    // TODO: Implement with equipo_edt table
    return [];
  }
}

export default new EquipmentService();
