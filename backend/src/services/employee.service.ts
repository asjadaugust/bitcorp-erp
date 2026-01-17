import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Trabajador } from '../models/trabajador.model';
import Logger from '../utils/logger';
import {
  EmployeeListDto,
  EmployeeDetailDto,
  EmployeeCreateDto,
  EmployeeUpdateDto,
  toEmployeeDetailDto,
  toEmployeeListDtoArray,
  fromEmployeeCreateDto,
  fromEmployeeUpdateDto,
} from '../types/dto/employee.dto';

/**
 * EmployeeService - HR Employee/Worker Management
 *
 * ✅ FULLY MIGRATED TO TYPEORM + DTOs
 * - All 6 methods return Spanish snake_case DTOs
 * - Uses EmployeeListDto for list views
 * - Uses EmployeeDetailDto for single views
 * - Maps Trabajador entity (Spanish camelCase) to DTOs (Spanish snake_case)
 *
 * API compliance: ARCHITECTURE.md 3.2 (Spanish snake_case)
 */
export class EmployeeService {
  private get trabajadorRepository(): Repository<Trabajador> {
    return AppDataSource.getRepository(Trabajador);
  }

  /**
   * Get all active employees
   *
   * ✅ MIGRATED: Returns EmployeeListDto[] with Spanish snake_case fields
   */
  async getAllEmployees(): Promise<EmployeeListDto[]> {
    try {
      const trabajadores = await this.trabajadorRepository.find({
        where: { isActive: true },
        order: {
          apellidoPaterno: 'ASC',
          nombres: 'ASC',
        },
      });
      return toEmployeeListDtoArray(trabajadores as unknown as Record<string, unknown>[]);
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
   * ✅ MIGRATED: Returns EmployeeDetailDto with Spanish snake_case fields
   */
  async getEmployeeByDni(dni: string): Promise<EmployeeDetailDto | null> {
    const trabajador = await this.trabajadorRepository.findOne({
      where: { dni, isActive: true },
    });
    return trabajador
      ? toEmployeeDetailDto(trabajador as unknown as Record<string, unknown>)
      : null;
  }

  /**
   * Create new employee
   *
   * ✅ MIGRATED: Returns EmployeeDetailDto with Spanish snake_case fields
   */
  async createEmployee(data: EmployeeCreateDto, _user: string): Promise<EmployeeDetailDto> {
    if (data.dni) {
      const existing = await this.getEmployeeByDni(data.dni);
      if (existing) {
        throw new Error('Operator with this DNI already exists');
      }
    }

    const trabajador = this.trabajadorRepository.create(fromEmployeeCreateDto(data));

    const saved = await this.trabajadorRepository.save(trabajador);
    return toEmployeeDetailDto(saved as unknown as Record<string, unknown>);
  }

  /**
   * Update employee by DNI
   *
   * ✅ MIGRATED: Returns EmployeeDetailDto with Spanish snake_case fields
   */
  async updateEmployee(
    dni: string,
    data: EmployeeUpdateDto,
    _user: string
  ): Promise<EmployeeDetailDto | null> {
    const trabajador = await this.trabajadorRepository.findOne({
      where: { dni, isActive: true },
    });

    if (!trabajador) return null;

    // Apply partial updates from DTO
    const updates = fromEmployeeUpdateDto(data);
    Object.assign(trabajador, updates);

    // TypeORM's @UpdateDateColumn will automatically update updated_at
    const updated = await this.trabajadorRepository.save(trabajador);
    return toEmployeeDetailDto(updated as unknown as Record<string, unknown>);
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
   * ✅ MIGRATED: Returns EmployeeListDto[] with Spanish snake_case fields
   */
  async searchEmployees(query: string): Promise<EmployeeListDto[]> {
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

    return toEmployeeListDtoArray(trabajadores as unknown as Record<string, unknown>[]);
  }
}
