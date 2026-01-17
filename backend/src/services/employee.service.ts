import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Trabajador } from '../models/trabajador.model';
import Logger from '../utils/logger';
import { NotFoundError } from '../errors/http.errors';
import { ConflictError } from '../errors/http.errors';
import {
  EmployeeListDto,
  EmployeeDetailDto,
  EmployeeCreateDto,
  EmployeeUpdateDto,
  EmployeeFiltersDto,
  toEmployeeDetailDto,
  toEmployeeListDtoArray,
  fromEmployeeCreateDto,
  fromEmployeeUpdateDto,
} from '../types/dto/employee.dto';

/**
 * EmployeeService - HR Employee/Worker Management
 *
 * ✅ PHASE 20 STANDARDIZED - Session 6
 * - All methods accept tenantId parameter (multi-tenant ready)
 * - Throws NotFoundError instead of returning null
 * - Comprehensive try/catch with Logger.info and Logger.error
 * - Service-level pagination and sorting (no controller pagination)
 * - Uses ConflictError for duplicate DNI
 * - Returns Spanish snake_case DTOs (EmployeeListDto, EmployeeDetailDto)
 *
 * Database schema: rrhh.trabajador
 * ⚠️ TODO: Add tenant_id column to rrhh.trabajador table for true multi-tenant isolation
 *
 * API compliance: ARCHITECTURE.md 3.2 (Spanish snake_case)
 */
export class EmployeeService {
  private get trabajadorRepository(): Repository<Trabajador> {
    return AppDataSource.getRepository(Trabajador);
  }

  /**
   * Get all active employees with pagination, sorting, and filters
   *
   * ✅ PHASE 20: Added tenantId, pagination, sorting, filters, logging
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param filters - Optional filters (search, cargo, especialidad)
   * @param sortBy - Sort field (default: apellido_paterno)
   * @param sortOrder - Sort order (ASC or DESC)
   * @returns Paginated list of employees with total count
   */
  async getAllEmployees(
    tenantId: number,
    page: number = 1,
    limit: number = 10,
    filters?: EmployeeFiltersDto,
    sortBy: string = 'apellido_paterno',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<{ data: EmployeeListDto[]; total: number }> {
    try {
      Logger.info('Fetching employees', {
        tenantId,
        page,
        limit,
        filters,
        sortBy,
        sortOrder,
        context: 'EmployeeService.getAllEmployees',
      });

      // Build query with filters
      const queryBuilder = this.trabajadorRepository
        .createQueryBuilder('t')
        .where('t.isActive = :isActive', { isActive: true });

      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      // .andWhere('t.tenantId = :tenantId', { tenantId })

      // Apply filters
      if (filters?.search) {
        queryBuilder.andWhere(
          '(t.nombres ILIKE :search OR t.apellidoPaterno ILIKE :search OR t.apellidoMaterno ILIKE :search OR t.dni ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters?.cargo) {
        queryBuilder.andWhere('t.cargo = :cargo', { cargo: filters.cargo });
      }

      if (filters?.especialidad) {
        queryBuilder.andWhere('t.especialidad = :especialidad', {
          especialidad: filters.especialidad,
        });
      }

      if (filters?.fecha_ingreso_desde) {
        queryBuilder.andWhere('t.fechaIngreso >= :fechaDesde', {
          fechaDesde: filters.fecha_ingreso_desde,
        });
      }

      if (filters?.fecha_ingreso_hasta) {
        queryBuilder.andWhere('t.fechaIngreso <= :fechaHasta', {
          fechaHasta: filters.fecha_ingreso_hasta,
        });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply sorting
      const validSortFields = [
        'apellido_paterno',
        'nombres',
        'dni',
        'cargo',
        'especialidad',
        'fecha_ingreso',
      ];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'apellido_paterno';

      // Map snake_case to entity field names
      const fieldMap: Record<string, string> = {
        apellido_paterno: 'apellidoPaterno',
        fecha_ingreso: 'fechaIngreso',
      };
      const entityField = fieldMap[sortField] || sortField;

      queryBuilder.orderBy(`t.${entityField}`, sortOrder);

      // Add secondary sort by nombres for consistent ordering
      if (sortField !== 'nombres') {
        queryBuilder.addOrderBy('t.nombres', 'ASC');
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // Execute query
      const trabajadores = await queryBuilder.getMany();

      // Transform to DTOs
      const data = toEmployeeListDtoArray(trabajadores as unknown as Record<string, unknown>[]);

      Logger.info('Employees fetched successfully', {
        tenantId,
        count: data.length,
        total,
        page,
        limit,
        context: 'EmployeeService.getAllEmployees',
      });

      return { data, total };
    } catch (error) {
      Logger.error('Error fetching employees', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        page,
        limit,
        filters,
        context: 'EmployeeService.getAllEmployees',
      });
      throw error;
    }
  }

  /**
   * Get employee by DNI
   *
   * ✅ PHASE 20: Added tenantId, NotFoundError, logging
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param dni - Employee DNI (national ID number)
   * @returns Employee details
   * @throws NotFoundError if employee not found
   */
  async getEmployeeByDni(tenantId: number, dni: string): Promise<EmployeeDetailDto> {
    try {
      Logger.info('Fetching employee by DNI', {
        tenantId,
        dni,
        context: 'EmployeeService.getEmployeeByDni',
      });

      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      const trabajador = await this.trabajadorRepository.findOne({
        where: { dni, isActive: true },
      });

      if (!trabajador) {
        throw new NotFoundError('Employee', dni, { tenantId });
      }

      Logger.info('Employee fetched successfully', {
        tenantId,
        dni,
        id_trabajador: trabajador.id,
        context: 'EmployeeService.getEmployeeByDni',
      });

      return toEmployeeDetailDto(trabajador as unknown as Record<string, unknown>);
    } catch (error) {
      Logger.error('Error fetching employee by DNI', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        dni,
        context: 'EmployeeService.getEmployeeByDni',
      });
      throw error;
    }
  }

  /**
   * Create new employee
   *
   * ✅ PHASE 20: Added tenantId, ConflictError, logging
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param data - Employee creation data
   * @param user - Username of user creating the employee
   * @returns Created employee details
   * @throws ConflictError if employee with DNI already exists
   */
  async createEmployee(
    tenantId: number,
    data: EmployeeCreateDto,
    user: string
  ): Promise<EmployeeDetailDto> {
    try {
      Logger.info('Creating employee', {
        tenantId,
        dni: data.dni,
        nombres: data.nombres,
        apellido_paterno: data.apellido_paterno,
        user,
        context: 'EmployeeService.createEmployee',
      });

      // Check for duplicate DNI
      if (data.dni) {
        // TODO: Add tenant_id filter when column exists
        const existing = await this.trabajadorRepository.findOne({
          where: { dni: data.dni },
        });

        if (existing) {
          throw new ConflictError('Employee', { dni: data.dni, tenantId });
        }
      }

      // Create employee entity
      const trabajador = this.trabajadorRepository.create(fromEmployeeCreateDto(data));

      // TODO: Set tenant_id when column exists
      // trabajador.tenantId = tenantId;

      // Save to database
      const saved = await this.trabajadorRepository.save(trabajador);

      Logger.info('Employee created successfully', {
        tenantId,
        id_trabajador: saved.id,
        dni: saved.dni,
        user,
        context: 'EmployeeService.createEmployee',
      });

      return toEmployeeDetailDto(saved as unknown as Record<string, unknown>);
    } catch (error) {
      Logger.error('Error creating employee', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        dni: data.dni,
        user,
        context: 'EmployeeService.createEmployee',
      });
      throw error;
    }
  }

  /**
   * Update employee by DNI
   *
   * ✅ PHASE 20: Added tenantId, NotFoundError, logging
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param dni - Employee DNI to update
   * @param data - Partial update data
   * @param user - Username of user updating the employee
   * @returns Updated employee details
   * @throws NotFoundError if employee not found
   */
  async updateEmployee(
    tenantId: number,
    dni: string,
    data: EmployeeUpdateDto,
    user: string
  ): Promise<EmployeeDetailDto> {
    try {
      Logger.info('Updating employee', {
        tenantId,
        dni,
        user,
        updateFields: Object.keys(data),
        context: 'EmployeeService.updateEmployee',
      });

      // TODO: Add tenant_id filter when column exists
      const trabajador = await this.trabajadorRepository.findOne({
        where: { dni, isActive: true },
      });

      if (!trabajador) {
        throw new NotFoundError('Employee', dni, { tenantId });
      }

      // Apply partial updates from DTO
      const updates = fromEmployeeUpdateDto(data);
      Object.assign(trabajador, updates);

      // TypeORM's @UpdateDateColumn will automatically update updated_at
      const updated = await this.trabajadorRepository.save(trabajador);

      Logger.info('Employee updated successfully', {
        tenantId,
        dni,
        id_trabajador: updated.id,
        user,
        context: 'EmployeeService.updateEmployee',
      });

      return toEmployeeDetailDto(updated as unknown as Record<string, unknown>);
    } catch (error) {
      Logger.error('Error updating employee', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        dni,
        user,
        context: 'EmployeeService.updateEmployee',
      });
      throw error;
    }
  }

  /**
   * Soft delete employee (sets is_active = false)
   *
   * ✅ PHASE 20: Added tenantId, NotFoundError, logging, returns void
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param dni - Employee DNI to delete
   * @throws NotFoundError if employee not found or already inactive
   */
  async deleteEmployee(tenantId: number, dni: string): Promise<void> {
    try {
      Logger.info('Deleting employee', {
        tenantId,
        dni,
        context: 'EmployeeService.deleteEmployee',
      });

      // TODO: Add tenant_id filter when column exists
      const result = await this.trabajadorRepository.update(
        { dni, isActive: true },
        { isActive: false }
      );

      if (!result.affected || result.affected === 0) {
        throw new NotFoundError('Employee', dni, { tenantId });
      }

      Logger.info('Employee deleted successfully', {
        tenantId,
        dni,
        context: 'EmployeeService.deleteEmployee',
      });
    } catch (error) {
      Logger.error('Error deleting employee', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        dni,
        context: 'EmployeeService.deleteEmployee',
      });
      throw error;
    }
  }

  /**
   * Search employees by name or DNI
   *
   * ✅ PHASE 20: Added tenantId, pagination, logging
   * ⚠️ DEPRECATED: Use getAllEmployees with filters.search instead
   *
   * @param tenantId - Company ID for multi-tenant isolation
   * @param query - Search query string
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated search results
   */
  async searchEmployees(
    tenantId: number,
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: EmployeeListDto[]; total: number }> {
    try {
      Logger.info('Searching employees', {
        tenantId,
        query,
        page,
        limit,
        context: 'EmployeeService.searchEmployees',
      });

      // Use getAllEmployees with search filter
      const result = await this.getAllEmployees(
        tenantId,
        page,
        limit,
        { search: query },
        'apellido_paterno',
        'ASC'
      );

      Logger.info('Employee search completed', {
        tenantId,
        query,
        count: result.data.length,
        total: result.total,
        context: 'EmployeeService.searchEmployees',
      });

      return result;
    } catch (error) {
      Logger.error('Error searching employees', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        query,
        context: 'EmployeeService.searchEmployees',
      });
      throw error;
    }
  }
}
