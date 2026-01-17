/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import { MaintenanceScheduleRecurringService } from '../../services/maintenance-schedule-recurring.service';
import Logger from '../../utils/logger';

/**
 * Maintenance Schedule Controller
 * Handles API endpoints for recurring maintenance scheduling using TypeORM
 *
 * This controller manages RECURRING maintenance schedules (e.g., "change oil every 250 hours").
 * For one-time maintenance work orders, use MaintenanceScheduleController (programa_mantenimiento).
 *
 * Migration from raw SQL to TypeORM:
 * - Eliminated 16 raw SQL queries
 * - Added service layer separation
 * - Improved type safety and error handling
 */

const service = new MaintenanceScheduleRecurringService();

/**
 * GET /api/scheduling/maintenance-schedules
 * List all maintenance schedules with pagination, sorting, and filters
 */
export const listSchedules = async (req: Request, res: Response) => {
  try {
    // Extract pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    // Extract sorting params
    const sort_by = req.query.sort_by as string;
    const sort_order = req.query.sort_order?.toString().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Extract filters
    const { equipment_id, status, project_id, maintenance_type } = req.query;

    const filters: any = {
      page,
      limit,
      sort_by,
      sort_order,
    };

    if (equipment_id) {
      filters.equipmentId = parseInt(equipment_id as string);
    }

    if (status) {
      filters.status = status === 'active' ? 'active' : status;
    }

    if (project_id) {
      filters.projectId = parseInt(project_id as string);
    }

    if (maintenance_type) {
      filters.maintenanceType = maintenance_type;
    }

    const result = await service.findAll(filters);

    return sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
  } catch (error: any) {
    Logger.error('Error listing maintenance schedules', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'MaintenanceScheduleController.listSchedules',
    });
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_LIST_FAILED',
      'Error al listar programas de mantenimiento',
      error.message
    );
  }
};

/**
 * GET /api/scheduling/maintenance-schedules/:id
 * Get a single maintenance schedule by ID
 */
export const getScheduleById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID inválido');
    }

    const schedule = await service.findById(id);

    if (!schedule) {
      return sendError(
        res,
        404,
        'MAINTENANCE_SCHEDULE_NOT_FOUND',
        'Programa de mantenimiento no encontrado'
      );
    }

    return sendSuccess(res, schedule);
  } catch (error: any) {
    Logger.error('Error getting maintenance schedule', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      scheduleId: req.params.id,
      context: 'MaintenanceScheduleController.getScheduleById',
    });
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_GET_FAILED',
      'Error al obtener programa de mantenimiento',
      error.message
    );
  }
};

/**
 * POST /api/scheduling/maintenance-schedules
 * Create a new maintenance schedule
 */
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const {
      equipment_id,
      project_id,
      maintenance_type,
      interval_type,
      interval_value,
      description,
      notes,
      auto_generate_tasks,
    } = req.body;

    const createdBy = (req as any).user?.id;

    const schedule = await service.create({
      equipmentId: equipment_id,
      projectId: project_id,
      maintenanceType: maintenance_type,
      intervalType: interval_type,
      intervalValue: interval_value,
      description,
      notes,
      autoGenerateTasks: auto_generate_tasks,
      createdById: createdBy,
    });

    return sendCreated(res, schedule.id, 'Programa de mantenimiento creado exitosamente');
  } catch (error: any) {
    Logger.error('Error creating maintenance schedule', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      equipmentId: req.body.equipment_id,
      context: 'MaintenanceScheduleController.createSchedule',
    });
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_CREATE_FAILED',
      error.message || 'Error al crear programa de mantenimiento'
    );
  }
};

/**
 * PUT /api/scheduling/maintenance-schedules/:id
 * Update an existing maintenance schedule
 */
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID inválido');
    }

    const updates = req.body;

    // Map snake_case from frontend to camelCase for service
    const dto: any = {};

    if (updates.equipment_id !== undefined) dto.equipmentId = updates.equipment_id;
    if (updates.project_id !== undefined) dto.projectId = updates.project_id;
    if (updates.maintenance_type !== undefined) dto.maintenanceType = updates.maintenance_type;
    if (updates.interval_type !== undefined) dto.intervalType = updates.interval_type;
    if (updates.interval_value !== undefined) dto.intervalValue = updates.interval_value;
    if (updates.description !== undefined) dto.description = updates.description;
    if (updates.notes !== undefined) dto.notes = updates.notes;
    if (updates.status !== undefined) dto.status = updates.status;
    if (updates.auto_generate_tasks !== undefined)
      dto.autoGenerateTasks = updates.auto_generate_tasks;
    if (updates.next_due_date !== undefined) dto.nextDueDate = new Date(updates.next_due_date);
    if (updates.next_due_hours !== undefined) dto.nextDueHours = updates.next_due_hours;
    if (updates.last_completed_date !== undefined)
      dto.lastCompletedDate = new Date(updates.last_completed_date);
    if (updates.last_completed_hours !== undefined)
      dto.lastCompletedHours = updates.last_completed_hours;

    if (Object.keys(dto).length === 0) {
      return sendError(res, 400, 'NO_FIELDS', 'No hay campos válidos para actualizar');
    }

    const schedule = await service.update(id, dto);

    if (!schedule) {
      return sendError(
        res,
        404,
        'MAINTENANCE_SCHEDULE_NOT_FOUND',
        'Programa de mantenimiento no encontrado'
      );
    }

    return sendSuccess(res, schedule);
  } catch (error: any) {
    Logger.error('Error updating maintenance schedule', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      scheduleId: req.params.id,
      context: 'MaintenanceScheduleController.updateSchedule',
    });
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_UPDATE_FAILED',
      'Error al actualizar programa de mantenimiento',
      error.message
    );
  }
};

/**
 * DELETE /api/scheduling/maintenance-schedules/:id
 * Delete a maintenance schedule
 */
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID inválido');
    }

    const deleted = await service.delete(id);

    if (!deleted) {
      return sendError(
        res,
        404,
        'MAINTENANCE_SCHEDULE_NOT_FOUND',
        'Programa de mantenimiento no encontrado'
      );
    }

    return res.status(204).send();
  } catch (error: any) {
    Logger.error('Error deleting maintenance schedule', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      scheduleId: req.params.id,
      context: 'MaintenanceScheduleController.deleteSchedule',
    });
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_DELETE_FAILED',
      'Error al eliminar programa de mantenimiento',
      error.message
    );
  }
};

/**
 * POST /api/scheduling/maintenance-schedules/generate-tasks
 * Generate tasks from all active schedules that are due soon
 */
export const generateTasks = async (req: Request, res: Response) => {
  try {
    const { daysAhead = 30 } = req.body;

    const schedules = await service.findDueSoon(daysAhead);

    return sendSuccess(res, {
      tasksGenerated: schedules.length,
      schedules,
    });
  } catch (error: any) {
    Logger.error('Error generating tasks', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      daysAhead: req.body.daysAhead,
      context: 'MaintenanceScheduleController.generateTasks',
    });
    return sendError(res, 500, 'TASK_GENERATION_FAILED', 'Error al generar tareas', error.message);
  }
};

/**
 * POST /api/scheduling/maintenance-schedules/:id/complete
 * Mark a schedule as completed and recalculate next due
 */
export const completeSchedule = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return sendError(res, 400, 'INVALID_ID', 'ID inválido');
    }

    const { completionHours } = req.body;

    const schedule = await service.complete(id, completionHours);

    if (!schedule) {
      return sendError(
        res,
        404,
        'MAINTENANCE_SCHEDULE_NOT_FOUND',
        'Programa de mantenimiento no encontrado'
      );
    }

    return sendSuccess(res, schedule);
  } catch (error: any) {
    Logger.error('Error completing schedule', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      scheduleId: req.params.id,
      context: 'MaintenanceScheduleController.completeSchedule',
    });
    return sendError(
      res,
      500,
      'SCHEDULE_COMPLETE_FAILED',
      error.message || 'Error al completar programa de mantenimiento'
    );
  }
};
