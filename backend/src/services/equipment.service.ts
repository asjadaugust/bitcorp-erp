/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Equipment } from '../models/equipment.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';
import {
  EquipmentListDto,
  EquipmentDetailDto,
  EquipmentStatsDto,
  toEquipmentListDto,
  toEquipmentDetailDto,
  toEquipmentListDtoArray,
  toEquipmentStatsDto,
  fromEquipmentDto,
} from '../types/dto/equipment.dto';

// Input DTOs for create/update operations
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
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export class EquipmentService {
  private get repository(): Repository<Equipment> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Equipment);
  }

  async findAll(
    filter?: EquipmentFilter,
    page = 1,
    limit = 10
  ): Promise<{ data: EquipmentListDto[]; total: number }> {
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
        queryBuilder.andWhere('e.proveedor_id = :providerId', { providerId: filter.providerId });
      }

      if (filter?.equipmentTypeId) {
        queryBuilder.andWhere('e.tipo_equipo_id = :typeId', { typeId: filter.equipmentTypeId });
      }

      if (filter?.search) {
        queryBuilder.andWhere(
          '(e.codigo_equipo ILIKE :search OR e.marca ILIKE :search OR e.modelo ILIKE :search OR e.placa ILIKE :search OR e.categoria ILIKE :search)',
          { search: `%${filter.search}%` }
        );
      }

      // Apply sorting
      const sortBy = filter?.sort_by || 'codigo_equipo';
      const sortOrder = filter?.sort_order || 'ASC';

      // Valid sortable fields (snake_case API → entity property)
      const validSortFields: Record<string, string> = {
        codigo_equipo: 'e.codigo_equipo',
        categoria: 'e.categoria',
        marca: 'e.marca',
        modelo: 'e.modelo',
        placa: 'e.placa',
        estado: 'e.estado',
        anio_fabricacion: 'e.anio_fabricacion',
        created_at: 'e.created_at',
        updated_at: 'e.updated_at',
      };

      const sortField = validSortFields[sortBy] || 'e.codigo_equipo';
      queryBuilder.orderBy(sortField, sortOrder);

      // Add pagination
      queryBuilder.skip((page - 1) * limit).take(limit);

      const [equipment, total] = await queryBuilder.getManyAndCount();

      return {
        data: toEquipmentListDtoArray(equipment),
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

  async findById(id: number): Promise<EquipmentDetailDto> {
    try {
      const equipment = await this.repository.findOne({
        where: { id },
        relations: ['provider'],
      });

      if (!equipment) {
        throw new Error('Equipment not found');
      }

      return toEquipmentDetailDto(equipment);
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

  async create(data: CreateEquipmentDto): Promise<EquipmentDetailDto> {
    try {
      // Check if codigo already exists
      if (data.codigo_equipo) {
        const existing = await this.findByCode(data.codigo_equipo);
        if (existing) {
          throw new Error('Equipment code already exists');
        }
      }

      // Map DTO to entity properties
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
        tipoEquipoId: data.tipo_equipo_id,
        proveedorId: data.proveedor_id,
        creadoPor: data.creado_por,
        is_active: true,
      });

      const saved = await this.repository.save(equipment);

      // Load relations before transforming
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['provider'],
      });

      return toEquipmentDetailDto(withRelations!);
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

  async update(id: number, data: UpdateEquipmentDto): Promise<EquipmentDetailDto> {
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

      // Map DTO to entity properties
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
      if (data.tipo_equipo_id !== undefined) {
        equipment.tipoEquipoId = data.tipo_equipo_id;
      }
      if (data.proveedor_id !== undefined) {
        equipment.proveedorId = data.proveedor_id;
      }
      if (data.actualizado_por !== undefined) {
        equipment.actualizadoPor = data.actualizado_por;
      }

      const saved = await this.repository.save(equipment);

      // Reload to get updated relations
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['provider'],
      });

      return toEquipmentDetailDto(withRelations!);
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

  async updateStatus(id: number, estado: string): Promise<EquipmentDetailDto> {
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

      return toEquipmentDetailDto(saved);
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

  async updateHourmeter(id: number, reading: number): Promise<EquipmentDetailDto> {
    const equipment = await this.repository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    // equipment.medidor_uso = reading.toString(); // assuming medidor_uso stores current reading
    // Logic to update hourmeter
    return toEquipmentDetailDto(equipment);
  }

  async updateOdometer(id: number, reading: number): Promise<EquipmentDetailDto> {
    const equipment = await this.repository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    // equipment.medidor_uso = reading.toString();
    return toEquipmentDetailDto(equipment);
  }

  async getStatistics(): Promise<EquipmentStatsDto> {
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

      return toEquipmentStatsDto(result);
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

  async getAvailableEquipment(): Promise<EquipmentListDto[]> {
    const result = await this.findAll({ estado: 'DISPONIBLE' }, 1, 9999);
    return result.data;
  }

  async getAssignmentHistory(equipmentId: number): Promise<any[]> {
    // TODO: Implement with equipo_edt table
    return [];
  }
}

export default new EquipmentService();
