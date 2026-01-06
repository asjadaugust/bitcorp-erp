/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Trabajador } from '../models/trabajador.model';
import { Repository, ILike } from 'typeorm';
import { toOperatorDto, fromOperatorDto, OperatorDto } from '../types/dto/operator.dto';

export interface OperatorFilter {
  search?: string;
  cargo?: string;
  especialidad?: string;
  isActive?: boolean;
  operatingUnitId?: number;
  page?: number;
  limit?: number;
}

// DTOs for create/update operations
// Support both English camelCase (from frontend) and Spanish snake_case (from API)
export interface CreateOperatorDto {
  // Frontend sends camelCase field names
  dni?: string;
  firstName?: string; // nombres
  lastName?: string; // apellido_paterno (combined with apellido_materno)
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  dateOfBirth?: string; // fecha_nacimiento
  phone?: string; // telefono
  email?: string;
  address?: string; // direccion
  contractType?: string; // tipo_contrato
  hireDate?: string; // fecha_ingreso
  terminationDate?: string; // fecha_cese
  position?: string; // cargo
  specialty?: string; // especialidad
  driverLicense?: string; // licencia_conducir
  operatingUnitId?: number;

  // Also support Spanish snake_case
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  fecha_nacimiento?: string;
  telefono?: string;
  direccion?: string;
  tipo_contrato?: string;
  fecha_ingreso?: string;
  fecha_cese?: string;
  cargo?: string;
  especialidad?: string;
  licencia_conducir?: string;
  operating_unit_id?: number;
}

export interface UpdateOperatorDto extends Partial<CreateOperatorDto> {}

export class OperatorService {
  private get repository(): Repository<Trabajador> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Trabajador);
  }

  async findAll(filters?: OperatorFilter): Promise<{
    data: OperatorDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      const queryBuilder = this.repository
        .createQueryBuilder('t')
        .where('t.is_active = :isActive', { isActive: filters?.isActive ?? true });

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

      // Order by apellido_paterno, nombres
      queryBuilder.orderBy('t.apellido_paterno', 'ASC').addOrderBy('t.nombres', 'ASC');

      // Get total count
      const total = await queryBuilder.getCount();

      // Paginate
      queryBuilder.skip(skip).take(limit);

      const trabajadores = await queryBuilder.getMany();

      // Map to DTO format
      const data = trabajadores.map((t) => toOperatorDto(t));

      return { data, total, page, limit };
    } catch (error) {
      console.error('Error finding operators:', error);
      throw new Error('Failed to fetch operators');
    }
  }

  async findById(id: number): Promise<OperatorDto> {
    try {
      const trabajador = await this.repository.findOne({
        where: { id },
      });

      if (!trabajador) {
        throw new Error('Operator not found');
      }

      return toOperatorDto(trabajador);
    } catch (error) {
      console.error('Error finding operator:', error);
      throw error;
    }
  }

  async findByDni(dni: string): Promise<Trabajador | null> {
    try {
      return await this.repository.findOne({
        where: { dni },
      });
    } catch (error) {
      console.error('Error finding operator by DNI:', error);
      throw error;
    }
  }

  async create(data: CreateOperatorDto): Promise<OperatorDto> {
    try {
      // Map frontend camelCase and Spanish snake_case to DTO format
      const operatorData: Partial<OperatorDto> = {
        dni: data.dni,
        nombres: data.nombres || data.firstName,
        apellido_paterno: data.apellido_paterno || data.apellidoPaterno,
        apellido_materno: data.apellido_materno || data.apellidoMaterno || null,
        fecha_nacimiento: data.fecha_nacimiento || data.dateOfBirth || null,
        telefono: data.telefono || data.phone || null,
        email: data.email,
        direccion: data.direccion || data.address || null,
        tipo_contrato: data.tipo_contrato || data.contractType || null,
        fecha_ingreso: data.fecha_ingreso || data.hireDate || null,
        fecha_cese: data.fecha_cese || data.terminationDate || null,
        cargo: data.cargo || data.position || null,
        especialidad: data.especialidad || data.specialty || null,
        licencia_conducir: data.licencia_conducir || data.driverLicense || null,
        operating_unit_id: data.operating_unit_id || data.operatingUnitId || null,
        is_active: true,
      };

      // Check if DNI already exists
      if (operatorData.dni) {
        const existing = await this.findByDni(operatorData.dni);
        if (existing) {
          throw new Error('An operator with this DNI already exists');
        }
      }

      const entity = this.repository.create(fromOperatorDto(operatorData));
      const saved = await this.repository.save(entity);

      return toOperatorDto(saved);
    } catch (error) {
      console.error('Error creating operator:', error);
      throw error;
    }
  }

  async update(id: number, data: UpdateOperatorDto): Promise<OperatorDto> {
    try {
      const trabajador = await this.repository.findOne({ where: { id } });

      if (!trabajador) {
        throw new Error('Operator not found');
      }

      // Map frontend camelCase and Spanish snake_case to DTO format
      const updateData: Partial<OperatorDto> = {};

      if (data.dni !== undefined) updateData.dni = data.dni;
      if (data.nombres !== undefined || data.firstName !== undefined)
        updateData.nombres = data.nombres || data.firstName;
      if (data.apellido_paterno !== undefined || data.apellidoPaterno !== undefined)
        updateData.apellido_paterno = data.apellido_paterno || data.apellidoPaterno;
      if (data.apellido_materno !== undefined || data.apellidoMaterno !== undefined)
        updateData.apellido_materno = data.apellido_materno || data.apellidoMaterno;
      if (data.fecha_nacimiento !== undefined || data.dateOfBirth !== undefined)
        updateData.fecha_nacimiento = data.fecha_nacimiento || data.dateOfBirth;
      if (data.telefono !== undefined || data.phone !== undefined)
        updateData.telefono = data.telefono || data.phone;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.direccion !== undefined || data.address !== undefined)
        updateData.direccion = data.direccion || data.address;
      if (data.tipo_contrato !== undefined || data.contractType !== undefined)
        updateData.tipo_contrato = data.tipo_contrato || data.contractType;
      if (data.fecha_ingreso !== undefined || data.hireDate !== undefined)
        updateData.fecha_ingreso = data.fecha_ingreso || data.hireDate;
      if (data.fecha_cese !== undefined || data.terminationDate !== undefined)
        updateData.fecha_cese = data.fecha_cese || data.terminationDate;
      if (data.cargo !== undefined || data.position !== undefined)
        updateData.cargo = data.cargo || data.position;
      if (data.especialidad !== undefined || data.specialty !== undefined)
        updateData.especialidad = data.especialidad || data.specialty;
      if (data.licencia_conducir !== undefined || data.driverLicense !== undefined)
        updateData.licencia_conducir = data.licencia_conducir || data.driverLicense;
      if (data.operating_unit_id !== undefined || data.operatingUnitId !== undefined)
        updateData.operating_unit_id = data.operating_unit_id || data.operatingUnitId;

      // If updating DNI, check it doesn't exist
      if (updateData.dni && updateData.dni !== trabajador.dni) {
        const existing = await this.findByDni(updateData.dni);
        if (existing && existing.id !== id) {
          throw new Error('An operator with this DNI already exists');
        }
      }

      // Merge changes
      const entityChanges = fromOperatorDto(updateData);
      Object.assign(trabajador, entityChanges);

      const saved = await this.repository.save(trabajador);
      return toOperatorDto(saved);
    } catch (error) {
      console.error('Error updating operator:', error);
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.repository.update(id, { isActive: false });
    } catch (error) {
      console.error('Error deleting operator:', error);
      throw new Error('Failed to delete operator');
    }
  }

  async getStats(): Promise<{
    total: number;
    activos: number;
    porCargo: Record<string, number>;
    porEspecialidad: Record<string, number>;
  }> {
    try {
      const total = await this.repository.count();
      const activos = await this.repository.count({ where: { isActive: true } });

      // Get count by cargo
      const cargoResult = await this.repository
        .createQueryBuilder('t')
        .select('t.cargo', 'cargo')
        .addSelect('COUNT(*)', 'count')
        .where('t.is_active = true')
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
        .groupBy('t.especialidad')
        .getRawMany();

      const porEspecialidad: Record<string, number> = {};
      espResult.forEach((r) => {
        if (r.especialidad) porEspecialidad[r.especialidad] = parseInt(r.count);
      });

      return { total, activos, porCargo, porEspecialidad };
    } catch (error) {
      console.error('Error getting operator stats:', error);
      throw error;
    }
  }
}

export default new OperatorService();
