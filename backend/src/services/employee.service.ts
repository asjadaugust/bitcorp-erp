import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Employee } from '../models/employee.model';
import { Trabajador } from '../models/trabajador.model';
import Logger from '../utils/logger';

/**
 * EmployeeService - HR Employee/Worker Management
 *
 * ✅ FULLY MIGRATED TO TYPEORM
 * - All 8 raw SQL queries replaced with TypeORM
 * - Uses existing rrhh.trabajador table via Trabajador entity
 * - Provides English DTO (Employee) for API layer
 * - Maps Spanish database fields to English API fields
 *
 * Migration completed: Phase 3.9
 */
export class EmployeeService {
  private get trabajadorRepository(): Repository<Trabajador> {
    return AppDataSource.getRepository(Trabajador);
  }

  /**
   * Map Trabajador entity to Employee DTO
   * Converts Spanish field names to English for API responses
   */
  private mapToEmployee(trabajador: Trabajador): Employee {
    return {
      id: trabajador.id,
      employeeNumber: trabajador.legacyId, // Using legacyId as employee number
      firstName: trabajador.nombres,
      lastName: `${trabajador.apellidoPaterno} ${trabajador.apellidoMaterno || ''}`.trim(),
      documentType: 'DNI',
      documentNumber: trabajador.dni,
      birthDate: trabajador.fechaNacimiento,
      address: trabajador.direccion,
      phone: trabajador.telefono,
      email: trabajador.email,
      hireDate: trabajador.fechaIngreso,
      position: trabajador.cargo,
      department: trabajador.especialidad,
      contractType: trabajador.tipoContrato,
      terminationDate: trabajador.fechaCese,
      driverLicense: trabajador.licenciaConducir,
      operatingUnitId: trabajador.operatingUnitId,
      isActive: trabajador.isActive,
      createdAt: trabajador.createdAt,
      updatedAt: trabajador.updatedAt,
      fullName: trabajador.nombreCompleto, // Using computed property from entity
    };
  }

  /**
   * Get all active employees
   *
   * ✅ MIGRATED: FROM pool.query SELECT * WHERE is_active = true ORDER BY apellido_paterno, nombres
   */
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const trabajadores = await this.trabajadorRepository.find({
        where: { isActive: true },
        order: {
          apellidoPaterno: 'ASC',
          nombres: 'ASC',
        },
      });
      return trabajadores.map((t) => this.mapToEmployee(t));
    } catch (error) {
      Logger.error('Error in getAllEmployees', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'EmployeeService.getAllEmployees',
      });
      throw error;
    }
  }

  /**
   * Get employee by DNI
   *
   * ✅ MIGRATED: FROM pool.query SELECT * WHERE dni = $1 AND is_active = true
   */
  async getEmployeeByDni(dni: string): Promise<Employee | null> {
    const trabajador = await this.trabajadorRepository.findOne({
      where: { dni, isActive: true },
    });
    return trabajador ? this.mapToEmployee(trabajador) : null;
  }

  /**
   * Create new employee
   *
   * ✅ MIGRATED: FROM pool.query INSERT INTO ... RETURNING *
   */
  async createEmployee(data: Partial<Employee>, _user: string): Promise<Employee> {
    if (data.documentNumber) {
      const existing = await this.getEmployeeByDni(data.documentNumber);
      if (existing) {
        throw new Error('Operator with this DNI already exists');
      }
    }

    // Parse lastName into paterno/materno
    const lastNameParts = (data.lastName || '').split(' ');
    const apellidoPaterno = lastNameParts[0] || '';
    const apellidoMaterno = lastNameParts.slice(1).join(' ') || undefined;

    const trabajador = this.trabajadorRepository.create({
      legacyId: data.employeeNumber,
      nombres: data.firstName!,
      apellidoPaterno: apellidoPaterno,
      apellidoMaterno: apellidoMaterno,
      dni: data.documentNumber!,
      fechaNacimiento: data.birthDate,
      direccion: data.address,
      telefono: data.phone,
      email: data.email,
      fechaIngreso: data.hireDate,
      cargo: data.position,
      especialidad: data.department,
      tipoContrato: data.contractType,
      licenciaConducir: data.driverLicense,
      operatingUnitId: data.operatingUnitId,
      isActive: true,
    });

    const saved = await this.trabajadorRepository.save(trabajador);
    return this.mapToEmployee(saved);
  }

  /**
   * Update employee by DNI
   *
   * ✅ MIGRATED: FROM dynamic SQL UPDATE with multiple conditions
   */
  async updateEmployee(
    dni: string,
    data: Partial<Employee>,
    _user: string
  ): Promise<Employee | null> {
    const trabajador = await this.trabajadorRepository.findOne({
      where: { dni, isActive: true },
    });

    if (!trabajador) return null;

    // Map Employee DTO fields to Trabajador entity fields
    if (data.firstName !== undefined) {
      trabajador.nombres = data.firstName;
    }
    if (data.lastName !== undefined) {
      const parts = data.lastName.split(' ');
      trabajador.apellidoPaterno = parts[0] || '';
      trabajador.apellidoMaterno = parts.slice(1).join(' ') || undefined;
    }
    if (data.documentNumber !== undefined) {
      trabajador.dni = data.documentNumber;
    }
    if (data.phone !== undefined) {
      trabajador.telefono = data.phone;
    }
    if (data.email !== undefined) {
      trabajador.email = data.email;
    }
    if (data.position !== undefined) {
      trabajador.cargo = data.position;
    }
    if (data.address !== undefined) {
      trabajador.direccion = data.address;
    }
    if (data.birthDate !== undefined) {
      trabajador.fechaNacimiento = data.birthDate;
    }
    if (data.hireDate !== undefined) {
      trabajador.fechaIngreso = data.hireDate;
    }
    if (data.department !== undefined) {
      trabajador.especialidad = data.department;
    }
    if (data.contractType !== undefined) {
      trabajador.tipoContrato = data.contractType;
    }
    if (data.terminationDate !== undefined) {
      trabajador.fechaCese = data.terminationDate;
    }
    if (data.driverLicense !== undefined) {
      trabajador.licenciaConducir = data.driverLicense;
    }
    if (data.operatingUnitId !== undefined) {
      trabajador.operatingUnitId = data.operatingUnitId;
    }

    // TypeORM's @UpdateDateColumn will automatically update updated_at
    const updated = await this.trabajadorRepository.save(trabajador);
    return this.mapToEmployee(updated);
  }

  /**
   * Soft delete employee (sets is_active = false)
   *
   * ✅ MIGRATED: FROM pool.query UPDATE SET is_active = false
   */
  async deleteEmployee(dni: string): Promise<boolean> {
    const result = await this.trabajadorRepository.update({ dni }, { isActive: false });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Search employees by name or DNI
   *
   * ✅ MIGRATED: FROM pool.query with ILIKE searches
   */
  async searchEmployees(query: string): Promise<Employee[]> {
    const trabajadores = await this.trabajadorRepository
      .createQueryBuilder('t')
      .where('t.isActive = :isActive', { isActive: true })
      .andWhere(
        '(t.nombres ILIKE :query OR t.apellidoPaterno ILIKE :query OR t.apellidoMaterno ILIKE :query OR t.dni ILIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('t.apellidoPaterno', 'ASC')
      .addOrderBy('t.nombres', 'ASC')
      .getMany();

    return trabajadores.map((t) => this.mapToEmployee(t));
  }
}
