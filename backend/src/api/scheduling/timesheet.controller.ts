/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { TimesheetService } from '../../services/timesheet.service';
import {
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
  sendError,
} from '../../utils/api-response';
import Logger from '../../utils/logger';

// Instantiate service
const timesheetService = new TimesheetService();

/**
 * Timesheet Controller
 * Handles API endpoints for timesheet management
 */

/**
 * GET /api/scheduling/timesheets
 * List all timesheets with filters, pagination, and sorting
 * Query params: ?page=1&limit=10&trabajador_id=X&periodo=YYYY-MM&estado=X&creado_por=X&sort_by=periodo&sort_order=DESC
 */
export const listTimesheets = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.id_empresa;

    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 items

    // Sorting parameters
    const sortBy = (req.query.sort_by as string) || 'periodo';
    const sortOrder = (req.query.sort_order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Filters
    const { trabajador_id, periodo, estado, creado_por } = req.query;

    const filters: any = {};
    if (trabajador_id) filters.trabajadorId = parseInt(trabajador_id as string);
    if (periodo) filters.periodo = periodo as string;
    if (estado) filters.estado = estado as string;
    if (creado_por) filters.creadoPor = parseInt(creado_por as string);

    // Get all timesheets from service (tenant-filtered)
    const allTimesheets = await timesheetService.listTimesheets(tenantId, filters);

    // Apply sorting in memory
    const validSortFields = [
      'periodo',
      'trabajador_id',
      'estado',
      'total_dias_trabajados',
      'total_horas',
      'created_at',
      'updated_at',
    ];

    if (validSortFields.includes(sortBy)) {
      allTimesheets.sort((a: any, b: any) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortOrder === 'ASC' ? 1 : -1;
        if (bVal == null) return sortOrder === 'ASC' ? -1 : 1;

        // String comparison (for periodo, estado)
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal, 'es');
          return sortOrder === 'ASC' ? comparison : -comparison;
        }

        // Numeric/Date comparison
        if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    // Paginate in memory after sorting
    const total = allTimesheets.length;
    const offset = (page - 1) * limit;
    const timesheets = allTimesheets.slice(offset, offset + limit);

    return sendPaginatedSuccess(res, timesheets, { page, limit, total });
  } catch (error: any) {
    Logger.error('Error listing timesheets', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'TimesheetController.listTimesheets',
    });
    return sendError(res, 500, 'TIMESHEET_LIST_FAILED', 'Failed to list timesheets', error.message);
  }
};

/**
 * GET /api/scheduling/timesheets/:id
 * Get a single timesheet with details
 */
export const getTimesheetById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.id_empresa;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID invalido');
    }

    const timesheet = await timesheetService.getTimesheetWithDetails(tenantId, id);
    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error getting timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.getTimesheetById',
    });
    if (error.message.includes('no encontrado') || error.message.includes('not found')) {
      return sendError(res, 404, 'TIMESHEET_NOT_FOUND', error.message);
    }
    return sendError(res, 500, 'TIMESHEET_GET_FAILED', 'Error al obtener tareo', error.message);
  }
};

/**
 * POST /api/scheduling/timesheets/generate
 * Generate a new timesheet from daily reports
 */
export const generateTimesheet = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.id_empresa;
    const {
      trabajadorId,
      trabajador_id,
      periodo,
      totalDiasTrabajados,
      total_dias_trabajados,
      totalHoras,
      total_hours, // Handle potential snake_case from frontend if any
      observaciones,
    } = req.body;

    // Normalize inputs
    const tId = trabajadorId || trabajador_id;
    const days = totalDiasTrabajados || total_dias_trabajados;
    const hours = totalHoras || total_hours;

    const creadoPor = req.user!.id_usuario;

    if (!tId || !periodo) {
      return sendError(
        res,
        400,
        'TIMESHEET_MISSING_FIELDS',
        'trabajador_id y periodo son requeridos'
      );
    }

    const timesheet = await timesheetService.generateTimesheet(tenantId, {
      trabajadorId: parseInt(tId),
      periodo,
      totalDiasTrabajados: days ? parseInt(days) : 0,
      totalHoras: hours ? parseFloat(hours) : 0,
      observaciones,
      creadoPor,
    });

    return sendCreated(res, timesheet);
  } catch (error: any) {
    Logger.error('Error generating timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      trabajadorId: req.body.trabajadorId || req.body.trabajador_id,
      periodo: req.body.periodo,
      context: 'TimesheetController.generateTimesheet',
    });

    // Handle specific errors
    if (
      error.name === 'NotFoundError' ||
      error.message.includes('not found') ||
      error.message.includes('no encontrado')
    ) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', error.message);
    }

    if (
      error.name === 'ConflictError' ||
      error.message.includes('exists') ||
      error.message.includes('existe')
    ) {
      return sendError(res, 409, 'RESOURCE_CONFLICT', error.message);
    }

    return sendError(
      res,
      500,
      'TIMESHEET_GENERATE_FAILED',
      error.message || 'Error al generar tareo'
    );
  }
};

/**
 * POST /api/scheduling/timesheets/:id/submit
 * Submit a timesheet for approval
 */
export const submitTimesheet = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.id_empresa;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID invalido');
    }

    const submittedBy = req.user!.id_usuario;

    const timesheet = await timesheetService.submitTimesheet(tenantId, id, submittedBy);
    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error submitting timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.submitTimesheet',
    });
    if (
      error.message.includes('not found') ||
      error.message.includes('encontrado') ||
      error.message.includes('puede')
    ) {
      return sendError(res, 400, 'TIMESHEET_SUBMIT_INVALID', error.message);
    }
    return sendError(res, 500, 'TIMESHEET_SUBMIT_FAILED', 'Error al enviar tareo', error.message);
  }
};

/**
 * POST /api/scheduling/timesheets/:id/approve
 * Approve a timesheet
 */
export const approveTimesheet = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.id_empresa;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID invalido');
    }

    const approvedBy = req.user!.id_usuario;

    const timesheet = await timesheetService.approveTimesheet(tenantId, id, approvedBy);
    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error approving timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.approveTimesheet',
    });
    if (
      error.message.includes('not found') ||
      error.message.includes('encontrado') ||
      error.message.includes('puede')
    ) {
      return sendError(res, 400, 'TIMESHEET_APPROVE_INVALID', error.message);
    }
    return sendError(res, 500, 'TIMESHEET_APPROVE_FAILED', 'Error al aprobar tareo', error.message);
  }
};

/**
 * POST /api/scheduling/timesheets/:id/reject
 * Reject a timesheet
 */
export const rejectTimesheet = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.id_empresa;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID invalido');
    }

    const { reason } = req.body;
    const rejectedBy = req.user!.id_usuario;

    if (!reason) {
      return sendError(
        res,
        400,
        'TIMESHEET_REJECT_REASON_REQUIRED',
        'La razon de rechazo es requerida'
      );
    }

    const timesheet = await timesheetService.rejectTimesheet(tenantId, id, rejectedBy, reason);

    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error rejecting timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.rejectTimesheet',
    });
    if (
      error.message.includes('not found') ||
      error.message.includes('encontrado') ||
      error.message.includes('puede')
    ) {
      return sendError(res, 400, 'TIMESHEET_REJECT_INVALID', error.message);
    }
    return sendError(res, 500, 'TIMESHEET_REJECT_FAILED', 'Error al rechazar tareo', error.message);
  }
};

/**
 * PUT /api/scheduling/timesheets/:id
 * Update a timesheet
 */
export const updateTimesheet = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.id_empresa;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID invalido');
    }

    const timesheet = await timesheetService.updateTimesheet(tenantId, id, req.body);
    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error updating timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.updateTimesheet',
    });
    if (error.name === 'BusinessRuleError') {
      return sendError(res, 400, 'TIMESHEET_UPDATE_NOT_ALLOWED', error.message);
    }
    if (error.message.includes('no encontrado') || error.message.includes('not found')) {
      return sendError(res, 404, 'TIMESHEET_NOT_FOUND', error.message);
    }
    return sendError(
      res,
      500,
      'TIMESHEET_UPDATE_FAILED',
      'Error al actualizar tareo',
      error.message
    );
  }
};

/**
 * DELETE /api/scheduling/timesheets/:id
 * Delete a timesheet
 */
export const deleteTimesheet = async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.id_empresa;
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID invalido');
    }

    await timesheetService.deleteTimesheet(tenantId, id);

    return res.status(204).send();
  } catch (error: any) {
    Logger.error('Error deleting timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.deleteTimesheet',
    });
    if (error.name === 'BusinessRuleError') {
      return sendError(res, 400, 'TIMESHEET_DELETE_NOT_ALLOWED', error.message);
    }
    return sendError(res, 500, 'TIMESHEET_DELETE_FAILED', 'Error al eliminar tareo', error.message);
  }
};
