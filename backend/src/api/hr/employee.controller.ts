/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { EmployeeService } from '../../services/employee.service';
import { NotFoundError, ConflictError } from '../../errors/http.errors';
import {
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
  sendError,
} from '../../utils/api-response';
import { EmployeeFiltersDto } from '../../types/dto/employee.dto';

const employeeService = new EmployeeService();

/**
 * GET /api/employees
 * List all employees with pagination, sorting, and optional search/filters
 *
 * ✅ PHASE 20 STANDARDIZED - Session 6
 * - Pagination now handled by service layer
 * - Sorting done by database (SQL ORDER BY)
 * - Passes tenantId to service
 * - No manual in-memory sorting
 *
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 * @query search - Search by name, DNI, or cargo
 * @query cargo - Filter by position
 * @query especialidad - Filter by specialty
 * @query fecha_ingreso_desde - Filter by hire date (from)
 * @query fecha_ingreso_hasta - Filter by hire date (to)
 * @query sort_by - Sort field (default: 'apellido_paterno')
 * @query sort_order - Sort order 'ASC' or 'DESC' (default: 'ASC')
 * @returns EmployeeListDto[] with Spanish snake_case fields and pagination
 */
export const getEmployees = async (req: Request, res: Response) => {
  try {
    // Get tenant ID from context
    const tenantId = (req as any).tenantContext?.id_empresa || 1; // Default to 1 for testing

    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100

    // Parse filters
    const filters: EmployeeFiltersDto = {
      search: req.query.search as string | undefined,
      cargo: req.query.cargo as string | undefined,
      especialidad: req.query.especialidad as string | undefined,
      fecha_ingreso_desde: req.query.fecha_ingreso_desde as string | undefined,
      fecha_ingreso_hasta: req.query.fecha_ingreso_hasta as string | undefined,
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) =>
        filters[key as keyof EmployeeFiltersDto] === undefined &&
        delete filters[key as keyof EmployeeFiltersDto]
    );

    // Parse sorting parameters
    const sortBy = (req.query.sort_by as string) || 'apellido_paterno';
    const sortOrder = (req.query.sort_order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Service handles pagination, sorting, and filtering
    const result = await employeeService.getAllEmployees(
      tenantId,
      page,
      limit,
      Object.keys(filters).length > 0 ? filters : undefined,
      sortBy,
      sortOrder
    );

    return sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
  } catch (error: any) {
    return sendError(res, 500, 'FETCH_ERROR', 'Failed to fetch employees', error.message);
  }
};

/**
 * GET /api/employees/:dni
 * Get single employee by DNI
 *
 * ✅ PHASE 20 STANDARDIZED - Session 6
 * - Passes tenantId to service
 * - Catches NotFoundError instead of checking null
 *
 * @returns EmployeeDetailDto with Spanish snake_case fields
 */
export const getEmployee = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantContext?.id_empresa || 1;
    const { dni } = req.params;

    const employee = await employeeService.getEmployeeByDni(tenantId, dni);
    return sendSuccess(res, employee);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    return sendError(res, 500, 'FETCH_ERROR', 'Failed to fetch employee', error.message);
  }
};

/**
 * POST /api/employees
 * Create new employee
 *
 * ✅ PHASE 20 STANDARDIZED - Session 6
 * - Passes tenantId to service
 * - Catches ConflictError for duplicate DNI
 *
 * @body EmployeeCreateDto (Spanish snake_case fields)
 * @returns EmployeeDetailDto with created employee
 */
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantContext?.id_empresa || 1;
    const user = (req as any).user?.username || 'SYSTEM';

    const employee = await employeeService.createEmployee(tenantId, req.body, user);
    return sendCreated(res, employee);
  } catch (error: any) {
    if (error instanceof ConflictError) {
      return sendError(res, 409, 'CONFLICT', error.message);
    }
    return sendError(res, 400, 'CREATE_ERROR', 'Failed to create employee', error.message);
  }
};

/**
 * PUT /api/employees/:dni
 * Update employee
 *
 * ✅ PHASE 20 STANDARDIZED - Session 6
 * - Passes tenantId to service
 * - Catches NotFoundError instead of checking null
 *
 * @body EmployeeUpdateDto (Spanish snake_case fields, partial)
 * @returns EmployeeDetailDto with updated employee
 */
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantContext?.id_empresa || 1;
    const { dni } = req.params;
    const user = (req as any).user?.username || 'SYSTEM';

    const employee = await employeeService.updateEmployee(tenantId, dni, req.body, user);
    return sendSuccess(res, employee);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    return sendError(res, 400, 'UPDATE_ERROR', 'Failed to update employee', error.message);
  }
};

/**
 * DELETE /api/employees/:dni
 * Soft delete employee (sets esta_activo = false)
 *
 * ✅ PHASE 20 STANDARDIZED - Session 6
 * - Passes tenantId to service
 * - Catches NotFoundError instead of checking success boolean
 *
 * @returns 204 No Content on success
 */
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantContext?.id_empresa || 1;
    const { dni } = req.params;

    await employeeService.deleteEmployee(tenantId, dni);
    return res.status(204).send(); // 204 No Content is correct for DELETE
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return sendError(res, 404, 'NOT_FOUND', error.message);
    }
    return sendError(res, 500, 'DELETE_ERROR', 'Failed to delete employee', error.message);
  }
};
