/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Trabajador } from '../models/trabajador.model';
import { Repository, ILike } from 'typeorm';
import {
  toOperatorDto,
  fromOperatorDto,
  OperatorDto,
  OperatorCreateDto,
  OperatorUpdateDto,
  OperatorFiltersDto,
} from '../types/dto/operator.dto';
import Logger from '../utils/logger';
import { NotFoundError, ConflictError } from '../errors/http.errors';

export class OperatorService {
  private get repository(): Repository<Trabajador> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Trabajador);
  }

  async findAll(
    tenantId: number,
    filters?: OperatorFiltersDto,
    page = 1,
    limit = 10
  ): Promise<{
    data: OperatorDto[];
    total: number;
  }> {
    try {
      Logger.info('Fetching operators', {
        tenantId,
        filters,
        page,
        limit,
        context: 'OperatorService.findAll',
      });

      const skip = (page - 1) * limit;

      const queryBuilder = this.repository
        .createQueryBuilder('t')
        .where('t.is_active = :isActive', { isActive: filters?.isActive ?? true });

      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      // .andWhere('t.tenant_id = :tenantId', { tenantId })

      // Filter by cargo
      if (filters?.cargo) {
        queryBuilder.andWhere('t.cargo = :cargo', { cargo: filters.cargo });
      }

      // Filter by especialidad
      if (filters?.especialidad) {
        queryBuilder.andWhere('t.especialidad = :especialidad', {
          especialidad: filters.especialidad,
        });
      }

      // Filter by operating unit
      if (filters?.operatingUnitId) {
        queryBuilder.andWhere('t.operating_unit_id = :unitId', { unitId: filters.operatingUnitId });
      }

      // Search across multiple fields
      if (filters?.search) {
        queryBuilder.andWhere(
          '(t.nombres ILIKE :search OR t.apellido_paterno ILIKE :search OR t.apellido_materno ILIKE :search OR t.dni ILIKE :search OR t.email ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Sorting with whitelist
      const sortableFields: Record<string, string> = {
        nombres: 't.nombres',
        apellido_paterno: 't.apellido_paterno',
        apellido_materno: 't.apellido_materno',
        dni: 't.dni',
        email: 't.email',
        telefono: 't.telefono',
        cargo: 't.cargo',
        especialidad: 't.especialidad',
        fecha_ingreso: 't.fecha_ingreso',
        fecha_nacimiento: 't.fecha_nacimiento',
        created_at: 't.created_at',
        updated_at: 't.updated_at',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 't.apellido_paterno';
      const sortOrder = filters?.sort_order === 'DESC' ? 'DESC' : 'ASC';

      queryBuilder.orderBy(sortBy, sortOrder);
      if (sortBy !== 't.apellido_paterno') {
        queryBuilder.addOrderBy('t.apellido_paterno', 'ASC');
      }
      queryBuilder.addOrderBy('t.nombres', 'ASC');

      // Get total count
      const total = await queryBuilder.getCount();

      // Paginate
      queryBuilder.skip(skip).take(limit);

      const trabajadores = await queryBuilder.getMany();

      // Map to DTO format
      const data = trabajadores.map((t) => toOperatorDto(t));

      Logger.info('Operators fetched successfully', {
        tenantId,
        count: trabajadores.length,
        total,
        context: 'OperatorService.findAll',
      });

      return { data, total };
    } catch (error) {
      Logger.error('Error finding operators', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        filters,
        page,
        limit,
        context: 'OperatorService.findAll',
      });
      throw error;
    }
  }

  async findById(tenantId: number, id: number): Promise<OperatorDto> {
    try {
      Logger.info('Fetching operator by ID', {
        tenantId,
        id,
        context: 'OperatorService.findById',
      });

      const trabajador = await this.repository.findOne({
        where: { id },
      });
      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      // .where({ id, tenant_id: tenantId })

      if (!trabajador) {
        throw new NotFoundError('Operator', id, { tenantId });
      }

      Logger.info('Operator fetched successfully', {
        tenantId,
        id,
        context: 'OperatorService.findById',
      });

      return toOperatorDto(trabajador);
    } catch (error) {
      Logger.error('Error finding operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'OperatorService.findById',
      });
      throw error;
    }
  }

  async findByDni(tenantId: number, dni: string): Promise<OperatorDto> {
    try {
      Logger.info('Fetching operator by DNI', {
        tenantId,
        dni,
        context: 'OperatorService.findByDni',
      });

      const trabajador = await this.repository.findOne({
        where: { dni },
      });
      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      // .where({ dni, tenant_id: tenantId })

      if (!trabajador) {
        throw new NotFoundError('Operator', dni, { tenantId });
      }

      Logger.info('Operator fetched successfully', {
        tenantId,
        dni,
        context: 'OperatorService.findByDni',
      });

      return toOperatorDto(trabajador);
    } catch (error) {
      Logger.error('Error finding operator by DNI', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        dni,
        context: 'OperatorService.findByDni',
      });
      throw error;
    }
  }

  async create(tenantId: number, data: OperatorCreateDto): Promise<OperatorDto> {
    try {
      Logger.info('Creating operator', {
        tenantId,
        dni: data.dni,
        context: 'OperatorService.create',
      });

      // Check for duplicate DNI
      const existing = await this.repository.findOne({ where: { dni: data.dni } });
      if (existing) {
        throw new ConflictError('Operator', { dni: data.dni, tenantId });
      }

      // Create entity using DTO transformer
      const operatorDto: Partial<OperatorDto> = {
        ...data,
        is_active: true,
      };
      const entity = this.repository.create(fromOperatorDto(operatorDto));
      const saved = await this.repository.save(entity);

      Logger.info('Operator created successfully', {
        tenantId,
        id: saved.id,
        context: 'OperatorService.create',
      });

      return toOperatorDto(saved);
    } catch (error) {
      Logger.error('Error creating operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        dni: data.dni,
        context: 'OperatorService.create',
      });
      throw error;
    }
  }

  async update(tenantId: number, id: number, data: OperatorUpdateDto): Promise<OperatorDto> {
    try {
      Logger.info('Updating operator', {
        tenantId,
        id,
        data,
        context: 'OperatorService.update',
      });

      const trabajador = await this.repository.findOne({ where: { id } });
      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      // .where({ id, tenant_id: tenantId })

      if (!trabajador) {
        throw new NotFoundError('Operator', id, { tenantId });
      }

      // Check for duplicate DNI (if DNI is being updated)
      if (data.dni && data.dni !== trabajador.dni) {
        const existing = await this.repository.findOne({ where: { dni: data.dni } });
        if (existing) {
          throw new ConflictError('Operator', { dni: data.dni, tenantId });
        }
      }

      // Merge changes using DTO transformer
      const entityChanges = fromOperatorDto(data);
      Object.assign(trabajador, entityChanges);

      const saved = await this.repository.save(trabajador);

      Logger.info('Operator updated successfully', {
        tenantId,
        id,
        context: 'OperatorService.update',
      });

      return toOperatorDto(saved);
    } catch (error) {
      Logger.error('Error updating operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        data,
        context: 'OperatorService.update',
      });
      throw error;
    }
  }

  async delete(tenantId: number, id: number): Promise<void> {
    try {
      Logger.info('Deleting operator', {
        tenantId,
        id,
        context: 'OperatorService.delete',
      });

      // Verify operator exists
      const trabajador = await this.repository.findOne({ where: { id } });
      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      // .where({ id, tenant_id: tenantId })

      if (!trabajador) {
        throw new NotFoundError('Operator', id, { tenantId });
      }

      // TODO: Business rule - check for active assignments
      // const activeAssignments = await this.assignmentRepository.count({
      //   where: { operator_id: id, status: 'ACTIVE' }
      // });
      // if (activeAssignments > 0) {
      //   throw new BusinessRuleError('Cannot delete operator with active assignments', {
      //     operator_id: id,
      //     active_assignments: activeAssignments
      //   });
      // }

      // Soft delete
      const result = await this.repository.update(id, { isActive: false });

      if (!result.affected || result.affected === 0) {
        throw new NotFoundError('Operator', id, { tenantId });
      }

      Logger.info('Operator deleted successfully', {
        tenantId,
        id,
        context: 'OperatorService.delete',
      });
    } catch (error) {
      Logger.error('Error deleting operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'OperatorService.delete',
      });
      throw error;
    }
  }

  async getStats(tenantId: number): Promise<{
    total: number;
    activos: number;
    porCargo: Record<string, number>;
    porEspecialidad: Record<string, number>;
  }> {
    try {
      Logger.info('Fetching operator statistics', {
        tenantId,
        context: 'OperatorService.getStats',
      });

      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      const total = await this.repository.count();
      const activos = await this.repository.count({ where: { isActive: true } });

      // Get count by cargo
      const cargoResult = await this.repository
        .createQueryBuilder('t')
        .select('t.cargo', 'cargo')
        .addSelect('COUNT(*)', 'count')
        .where('t.is_active = true')
        // TODO: Add tenant_id filter
        // .andWhere('t.tenant_id = :tenantId', { tenantId })
        .groupBy('t.cargo')
        .getRawMany();

      const porCargo: Record<string, number> = {};
      cargoResult.forEach((r) => {
        if (r.cargo) porCargo[r.cargo] = parseInt(r.count);
      });

      // Get count by especialidad
      const espResult = await this.repository
        .createQueryBuilder('t')
        .select('t.especialidad', 'especialidad')
        .addSelect('COUNT(*)', 'count')
        .where('t.is_active = true')
        // TODO: Add tenant_id filter
        // .andWhere('t.tenant_id = :tenantId', { tenantId })
        .groupBy('t.especialidad')
        .getRawMany();

      const porEspecialidad: Record<string, number> = {};
      espResult.forEach((r) => {
        if (r.especialidad) porEspecialidad[r.especialidad] = parseInt(r.count);
      });

      Logger.info('Operator statistics fetched successfully', {
        tenantId,
        total,
        activos,
        context: 'OperatorService.getStats',
      });

      return { total, activos, porCargo, porEspecialidad };
    } catch (error) {
      Logger.error('Error getting operator stats', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        context: 'OperatorService.getStats',
      });
      throw error;
    }
  }
}

// Note: Do not export singleton - causes "Database not initialized" error
// The controller instantiates the service directly: const operatorService = new OperatorService();
