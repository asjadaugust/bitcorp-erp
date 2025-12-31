import { AppDataSource } from '../config/database.config';
import { Trabajador } from '../models/trabajador.model';
import { Repository, ILike } from 'typeorm';

export interface OperatorFilter {
  search?: string;
  cargo?: string;
  especialidad?: string;
  isActive?: boolean;
  operatingUnitId?: number;
  page?: number;
  limit?: number;
}

export class OperatorService {
  private get repository(): Repository<Trabajador> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Trabajador);
  }

  async findAll(filters?: OperatorFilter) {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      const queryBuilder = this.repository.createQueryBuilder('t')
        .where('t.is_active = :isActive', { isActive: filters?.isActive ?? true });

      // Filter by cargo
      if (filters?.cargo) {
        queryBuilder.andWhere('t.cargo = :cargo', { cargo: filters.cargo });
      }

      // Filter by especialidad
      if (filters?.especialidad) {
        queryBuilder.andWhere('t.especialidad = :especialidad', { especialidad: filters.especialidad });
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
      queryBuilder.orderBy('t.apellido_paterno', 'ASC')
        .addOrderBy('t.nombres', 'ASC');

      // Get total count
      const total = await queryBuilder.getCount();

      // Paginate
      queryBuilder.skip(skip).take(limit);

      const trabajadores = await queryBuilder.getMany();

      // Map to response format
      const data = trabajadores.map(t => this.mapToResponse(t));

      return { data, total, page, limit };
    } catch (error) {
      console.error('Error finding operators:', error);
      throw new Error('Failed to fetch operators');
    }
  }

  async findById(id: number): Promise<Trabajador> {
    try {
      const trabajador = await this.repository.findOne({
        where: { id },
      });

      if (!trabajador) {
        throw new Error('Operator not found');
      }

      return trabajador;
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

  async create(data: Partial<Trabajador>): Promise<Trabajador> {
    try {
      // Check if DNI already exists
      if (data.dni) {
        const existing = await this.findByDni(data.dni);
        if (existing) {
          throw new Error('An operator with this DNI already exists');
        }
      }

      const trabajador = this.repository.create({
        ...data,
        isActive: data.isActive ?? true,
      });

      return await this.repository.save(trabajador);
    } catch (error) {
      console.error('Error creating operator:', error);
      throw error;
    }
  }

  async update(id: number, data: Partial<Trabajador>): Promise<Trabajador> {
    try {
      const trabajador = await this.findById(id);

      // If updating DNI, check it doesn't exist
      if (data.dni && data.dni !== trabajador.dni) {
        const existing = await this.findByDni(data.dni);
        if (existing && existing.id !== id) {
          throw new Error('An operator with this DNI already exists');
        }
      }

      Object.assign(trabajador, data);
      return await this.repository.save(trabajador);
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
      cargoResult.forEach(r => {
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
      espResult.forEach(r => {
        if (r.especialidad) porEspecialidad[r.especialidad] = parseInt(r.count);
      });

      return { total, activos, porCargo, porEspecialidad };
    } catch (error) {
      console.error('Error getting operator stats:', error);
      throw error;
    }
  }

  private mapToResponse(t: Trabajador) {
    return {
      id: t.id,
      legacy_id: t.legacyId,
      dni: t.dni,
      nombres: t.nombres,
      apellido_paterno: t.apellidoPaterno,
      apellido_materno: t.apellidoMaterno,
      nombre_completo: t.nombreCompleto,
      // Backward compatible English fields
      first_name: t.nombres,
      last_name: `${t.apellidoPaterno} ${t.apellidoMaterno || ''}`.trim(),
      full_name: t.nombreCompleto,
      email: t.email,
      phone: t.telefono,
      telefono: t.telefono,
      direccion: t.direccion,
      fecha_nacimiento: t.fechaNacimiento,
      fecha_ingreso: t.fechaIngreso,
      fecha_cese: t.fechaCese,
      cargo: t.cargo,
      especialidad: t.especialidad,
      licencia_conducir: t.licenciaConducir,
      tipo_contrato: t.tipoContrato,
      operating_unit_id: t.operatingUnitId,
      is_active: t.isActive,
      status: t.isActive ? 'activo' : 'inactivo',
      created_at: t.createdAt,
      updated_at: t.updatedAt,
    };
  }
}

export default new OperatorService();
