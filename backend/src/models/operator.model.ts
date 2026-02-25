import { AppDataSource } from '../config/database.config';
import { Trabajador } from './trabajador.model';
import { Repository } from 'typeorm';
import { BaseModel } from './base.model';

/**
 * @deprecated Legacy interface - Use Trabajador entity directly
 * Kept for backward compatibility with existing code
 */
export interface Operator extends BaseModel {
  userId?: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  employmentStartDate: string;
  employmentEndDate?: string;
  hourlyRate: number;
  status: 'active' | 'inactive' | 'on_leave';
  performanceRating?: number;
  notes?: string;
  skills?: OperatorSkill[];
  certifications?: OperatorCertification[];
  address?: string;
  city?: string;
  country?: string;
  contractType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  dni?: string;
  dateOfBirth?: string;
  hireDate?: string;
}

export interface OperatorSkill {
  id: string;
  operatorId: string;
  equipmentType: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience: number;
  lastVerified?: string;
}

export interface OperatorCertification {
  id: string;
  operatorId: string;
  certificationName: string;
  certificationNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  status: 'valid' | 'expired' | 'expiring_soon';
}

/**
 * Operator Model - Migrated to TypeORM from raw SQL
 *
 * @deprecated This class is provided for backward compatibility.
 * New code should use TrabajadorRepository directly.
 *
 * Migration completed: backend/src/models/operator.model.ts
 * - Replaced 17 raw SQL queries with TypeORM repository methods
 * - Uses QueryBuilder for complex queries with filters
 * - Maintains backward compatibility with legacy interface
 */
export class OperatorModel {
  private static getRepository(): Repository<Trabajador> {
    return AppDataSource.getRepository(Trabajador);
  }

  /**
   * Find all operators with optional filters
   * Migrated from raw SQL to TypeORM QueryBuilder
   */
  static async findAll(filters?: { status?: string; search?: string }): Promise<Operator[]> {
    const repository = this.getRepository();
    const queryBuilder = repository.createQueryBuilder('o');

    // Base condition: only active workers
    queryBuilder.where('o.isActive = :isActive', { isActive: true });

    // Status filter (if provided)
    if (filters?.status) {
      queryBuilder.andWhere('o.status = :status', { status: filters.status });
    }

    // Search filter (nombres, apellido, email)
    if (filters?.search) {
      queryBuilder.andWhere(
        '(o.nombres ILIKE :search OR o.apellidoPaterno ILIKE :search OR o.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Order by last name, first name
    queryBuilder.orderBy('o.apellidoPaterno', 'ASC').addOrderBy('o.nombres', 'ASC');

    const workers = await queryBuilder.getMany();

    // Map to legacy Operator interface for backward compatibility
    return workers.map(this.mapToOperatorInterface);
  }

  /**
   * Find operator by ID
   * Migrated from raw SQL with manual JOIN to TypeORM
   */
  static async findById(id: string): Promise<Operator | null> {
    const repository = this.getRepository();
    const worker = await repository.findOne({
      where: { id: parseInt(id), isActive: true },
    });

    if (!worker) return null;

    const operator = this.mapToOperatorInterface(worker);

    // Note: skills and certifications tables don't exist yet
    // When they're created, add proper TypeORM relations to Trabajador entity
    operator.skills = [];
    operator.certifications = [];

    return operator;
  }

  /**
   * Create new operator
   * Migrated from raw INSERT to TypeORM save
   */
  static async create(data: Partial<Operator>): Promise<Operator> {
    const repository = this.getRepository();

    const worker = repository.create({
      // Map camelCase interface fields to entity fields
      nombres: data.firstName || '',
      apellidoPaterno: data.lastName || '',
      email: data.email,
      telefono: data.phone,
      licenciaConducir: data.licenseNumber,
      fechaIngreso: data.employmentStartDate ? new Date(data.employmentStartDate) : undefined,
      fechaCese: data.employmentEndDate ? new Date(data.employmentEndDate) : undefined,
      tipoContrato: data.contractType,
      dni: data.dni || '',
      fechaNacimiento: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      direccion: data.address,
      isActive: true,
    });

    const saved = await repository.save(worker);
    return this.mapToOperatorInterface(saved);
  }

  /**
   * Update operator
   * Migrated from dynamic SQL UPDATE to TypeORM save
   */
  static async update(id: string, data: Partial<Operator>): Promise<Operator | null> {
    const repository = this.getRepository();
    const worker = await repository.findOne({
      where: { id: parseInt(id), isActive: true },
    });

    if (!worker) return null;

    // Map updated fields (camelCase interface → entity properties)
    if (data.firstName !== undefined) worker.nombres = data.firstName;
    if (data.lastName !== undefined) worker.apellidoPaterno = data.lastName;
    if (data.email !== undefined) worker.email = data.email;
    if (data.phone !== undefined) worker.telefono = data.phone;
    if (data.licenseNumber !== undefined) worker.licenciaConducir = data.licenseNumber;
    if (data.employmentStartDate !== undefined)
      worker.fechaIngreso = new Date(data.employmentStartDate);
    if (data.employmentEndDate !== undefined) worker.fechaCese = new Date(data.employmentEndDate);
    if (data.contractType !== undefined) worker.tipoContrato = data.contractType;
    if (data.dni !== undefined) worker.dni = data.dni;
    if (data.dateOfBirth !== undefined) worker.fechaNacimiento = new Date(data.dateOfBirth);
    if (data.address !== undefined) worker.direccion = data.address;

    const updated = await repository.save(worker);
    return this.mapToOperatorInterface(updated);
  }

  /**
   * Soft delete operator
   * Migrated from raw UPDATE to TypeORM save
   */
  static async delete(id: string): Promise<boolean> {
    const repository = this.getRepository();
    const worker = await repository.findOne({ where: { id: parseInt(id) } });

    if (!worker) return false;

    worker.isActive = false;
    await repository.save(worker);
    return true;
  }

  /**
   * Add skill to operator
   * @deprecated Table rrhh.habilidad_trabajador doesn't exist yet
   */
  static async addSkill(
    _operatorId: string,
    _skill: Partial<OperatorSkill>
  ): Promise<OperatorSkill> {
    // TODO: Create OperatorSkill entity and implement with TypeORM
    throw new Error(
      'Skills feature not implemented - table rrhh.habilidad_trabajador needs to be created'
    );
  }

  /**
   * Add certification to operator
   * @deprecated Table rrhh.certificacion_trabajador doesn't exist yet
   */
  static async addCertification(
    _operatorId: string,
    _cert: Partial<OperatorCertification>
  ): Promise<OperatorCertification> {
    // TODO: Create OperatorCertification entity and implement with TypeORM
    throw new Error(
      'Certifications feature not implemented - table rrhh.certificacion_trabajador needs to be created'
    );
  }

  /**
   * Helper method to map Trabajador entity to legacy Operator interface
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static mapToOperatorInterface(worker: Trabajador): Operator {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: worker.id as any, // Legacy interface expects string, entity uses number
      firstName: worker.nombres,
      lastName: worker.apellidoPaterno,
      fullName: worker.nombreCompleto,
      email: worker.email || '',
      phone: worker.telefono || '',
      licenseNumber: worker.licenciaConducir,
      employmentStartDate: worker.fechaIngreso?.toISOString() || '',
      employmentEndDate: worker.fechaCese?.toISOString(),
      hourlyRate: 0, // Not in current schema
      status: 'active', // Default value
      dni: worker.dni,
      dateOfBirth: worker.fechaNacimiento?.toISOString(),
      hireDate: worker.fechaIngreso?.toISOString(),
      address: worker.direccion,
      contractType: worker.tipoContrato,
      isActive: worker.isActive,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createdAt: worker.createdAt.toISOString() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updatedAt: worker.updatedAt.toISOString() as any,
    };
  }
}
