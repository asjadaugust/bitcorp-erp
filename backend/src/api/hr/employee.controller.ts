/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { EmployeeService } from '../../services/employee.service';
import {
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
  sendError,
} from '../../utils/api-response';

const employeeService = new EmployeeService();

/**
 * GET /api/employees
 * List all employees with pagination and optional search
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10, max: 100)
 * @query search - Search by name, DNI, or cargo
 * @returns EmployeeListDto[] with Spanish snake_case fields and pagination
 */
export const getEmployees = async (req: Request, res: Response) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100
    const search = req.query.search as string;

    let employees;
    let total;

    if (search) {
      // Search mode - get all matching, then paginate in memory
      const allEmployees = await employeeService.searchEmployees(search);
      total = allEmployees.length;
      const offset = (page - 1) * limit;
      employees = allEmployees.slice(offset, offset + limit);
    } else {
      // List mode - get all, then paginate in memory
      // TODO: Update service to support pagination at DB level for better performance
      const allEmployees = await employeeService.getAllEmployees();
      total = allEmployees.length;
      const offset = (page - 1) * limit;
      employees = allEmployees.slice(offset, offset + limit);
    }

    return sendPaginatedSuccess(res, employees, { page, limit, total });
  } catch (error: any) {
    return sendError(res, 500, 'FETCH_ERROR', 'Failed to fetch employees', error.message);
  }
};

/**
 * GET /api/employees/:dni
 * Get single employee by DNI
 * @returns EmployeeDetailDto with Spanish snake_case fields
 */
export const getEmployee = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    const employee = await employeeService.getEmployeeByDni(dni);

    if (!employee) {
      return sendError(res, 404, 'NOT_FOUND', 'Employee not found');
    }

    return sendSuccess(res, employee);
  } catch (error: any) {
    return sendError(res, 500, 'FETCH_ERROR', 'Failed to fetch employee', error.message);
  }
};

/**
 * POST /api/employees
 * Create new employee
 * @body EmployeeCreateDto (Spanish snake_case fields)
 * @returns EmployeeDetailDto with created employee
 */
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user?.username || 'SYSTEM';
    const employee = await employeeService.createEmployee(req.body, user);
    return sendCreated(res, employee);
  } catch (error: any) {
    return sendError(res, 400, 'CREATE_ERROR', 'Failed to create employee', error.message);
  }
};

/**
 * PUT /api/employees/:dni
 * Update employee
 * @body EmployeeUpdateDto (Spanish snake_case fields, partial)
 * @returns EmployeeDetailDto with updated employee
 */
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    const user = (req as any).user?.username || 'SYSTEM';
    const employee = await employeeService.updateEmployee(dni, req.body, user);

    if (!employee) {
      return sendError(res, 404, 'NOT_FOUND', 'Employee not found');
    }

    return sendSuccess(res, employee);
  } catch (error: any) {
    return sendError(res, 400, 'UPDATE_ERROR', 'Failed to update employee', error.message);
  }
};

/**
 * DELETE /api/employees/:dni
 * Soft delete employee (sets esta_activo = false)
 * @returns 204 No Content on success
 */
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    const success = await employeeService.deleteEmployee(dni);

    if (!success) {
      return sendError(res, 404, 'NOT_FOUND', 'Employee not found');
    }

    return res.status(204).send(); // 204 No Content is correct for DELETE
  } catch (error: any) {
    return sendError(res, 500, 'DELETE_ERROR', 'Failed to delete employee', error.message);
  }
};
