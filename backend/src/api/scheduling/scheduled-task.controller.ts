/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database.config';
import { ScheduledTask } from '../../models/scheduled-task.model';
import { Between, LessThanOrEqual, MoreThanOrEqual, Not, In } from 'typeorm';
import Logger from '../../utils/logger';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';

/**
 * Scheduled Task Controller
 * Uses TypeORM for database operations with Spanish schema (equipo.tarea_programada)
 */

/**
 * GET /api/scheduling/tasks
 * List all scheduled tasks with filters, pagination, and sorting
 */
export const listTasks = async (req: Request, res: Response) => {
  try {
    // Extract pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // Extract sorting params
    const sort_by = req.query.sort_by as string;
    const sort_order = req.query.sort_order?.toString().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Define sortable fields (snake_case API → camelCase DB)
    const sortableFields: Record<string, string> = {
      title: 'task.title',
      task_type: 'task.taskType',
      scheduled_date: 'task.startDate',
      status: 'task.status',
      priority: 'task.priority',
      equipment_id: 'task.equipmentId',
      operator_id: 'task.operatorId',
      project_id: 'task.projectId',
      created_at: 'task.createdAt',
      duration_minutes: 'task.durationMinutes',
    };

    const sortBy = sort_by && sortableFields[sort_by] ? sortableFields[sort_by] : 'task.startDate';

    // Extract filters
    const { equipment_id, operator_id, status, date_from, date_to, task_type, project_id } =
      req.query;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const queryBuilder = taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.equipment', 'equipment')
      .leftJoinAndSelect('task.project', 'project');

    // Apply filters
    if (equipment_id) {
      queryBuilder.andWhere('task.equipmentId = :equipmentId', {
        equipmentId: parseInt(equipment_id as string),
      });
    }

    if (operator_id) {
      queryBuilder.andWhere('task.operatorId = :operatorId', {
        operatorId: parseInt(operator_id as string),
      });
    }

    if (status && status !== 'all') {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (task_type) {
      queryBuilder.andWhere('task.taskType = :taskType', { taskType: task_type });
    }

    if (project_id) {
      queryBuilder.andWhere('task.projectId = :projectId', {
        projectId: parseInt(project_id as string),
      });
    }

    if (date_from && date_to) {
      queryBuilder.andWhere('task.startDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: date_from,
        dateTo: date_to,
      });
    } else if (date_from) {
      queryBuilder.andWhere('task.startDate >= :dateFrom', { dateFrom: date_from });
    } else if (date_to) {
      queryBuilder.andWhere('task.startDate <= :dateTo', { dateTo: date_to });
    }

    // Apply sorting
    queryBuilder.orderBy(sortBy, sort_order);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Get results
    const tasks = await queryBuilder.getMany();

    // Use standard response helper
    sendPaginatedSuccess(res, tasks, { page, limit, total });
  } catch (error: any) {
    Logger.error('Error listing tasks', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'ScheduledTaskController.listTasks',
    });
    sendError(res, 500, 'TASK_LIST_FAILED', 'Error al listar tareas', error.message);
  }
};

/**
 * GET /api/scheduling/tasks/:id
 * Get a single task by ID
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendError(res, 400, 'INVALID_ID', 'ID inválido');
      return;
    }

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const task = await taskRepo.findOne({
      where: { id },
      relations: ['equipment', 'project'],
    });

    if (!task) {
      sendError(res, 404, 'TASK_NOT_FOUND', 'Tarea no encontrada');
      return;
    }

    sendSuccess(res, task);
  } catch (error: any) {
    Logger.error('Error getting task', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      taskId: req.params.id,
      context: 'ScheduledTaskController.getTaskById',
    });
    sendError(res, 500, 'TASK_GET_FAILED', 'Error al obtener tarea', error.message);
  }
};

/**
 * POST /api/scheduling/tasks
 * Create a new scheduled task
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const {
      schedule_id,
      equipment_id,
      operator_id,
      project_id,
      task_type,
      title,
      description,
      scheduled_date,
      scheduled_time,
      duration_minutes,
      priority,
      status,
    } = req.body;

    const userId = (req as any).user?.id;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const task = taskRepo.create({
      scheduleId: schedule_id || undefined,
      equipmentId: equipment_id || undefined,
      operatorId: operator_id || undefined,
      projectId: project_id || undefined,
      taskType: task_type || 'maintenance',
      title,
      description: description || undefined,
      startDate: new Date(scheduled_date),
      startTime: scheduled_time || undefined,
      durationMinutes: duration_minutes || 60,
      priority: priority || 'normal',
      status: status || 'pending',
      createdBy: userId,
    });

    const savedTask = await taskRepo.save(task);

    sendCreated(res, savedTask.id, 'Tarea programada creada exitosamente');
  } catch (error: any) {
    Logger.error('Error creating task', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'ScheduledTaskController.createTask',
    });
    sendError(res, 500, 'TASK_CREATE_FAILED', 'Error al crear tarea', error.message);
  }
};

/**
 * PUT /api/scheduling/tasks/:id
 * Update a scheduled task
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendError(res, 400, 'INVALID_ID', 'ID inválido');
      return;
    }

    const updates = req.body;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const task = await taskRepo.findOne({ where: { id } });

    if (!task) {
      sendError(res, 404, 'TASK_NOT_FOUND', 'Tarea no encontrada');
      return;
    }

    // Update allowed fields
    const allowedFields = [
      'scheduleId',
      'equipmentId',
      'operatorId',
      'projectId',
      'taskType',
      'title',
      'description',
      'startDate',
      'scheduledTime',
      'durationMinutes',
      'priority',
      'status',
      'completionNotes',
    ];

    let hasUpdates = false;
    for (const field of allowedFields) {
      // Convert snake_case to camelCase for backwards compatibility
      const snakeField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
      const value = updates[field] || updates[snakeField];

      if (value !== undefined) {
        (task as any)[field] = value;
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      sendError(res, 400, 'NO_FIELDS', 'No hay campos válidos para actualizar');
      return;
    }

    const updatedTask = await taskRepo.save(task);

    sendSuccess(res, updatedTask);
  } catch (error: any) {
    Logger.error('Error updating task', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      taskId: req.params.id,
      context: 'ScheduledTaskController.updateTask',
    });
    sendError(res, 500, 'TASK_UPDATE_FAILED', 'Error al actualizar tarea', error.message);
  }
};

/**
 * DELETE /api/scheduling/tasks/:id
 * Delete a scheduled task
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendError(res, 400, 'INVALID_ID', 'ID inválido');
      return;
    }

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const result = await taskRepo.delete(id);

    if (!result.affected || result.affected === 0) {
      sendError(res, 404, 'TASK_NOT_FOUND', 'Tarea no encontrada');
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    Logger.error('Error deleting task', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      taskId: req.params.id,
      context: 'ScheduledTaskController.deleteTask',
    });
    sendError(res, 500, 'TASK_DELETE_FAILED', 'Error al eliminar tarea', error.message);
  }
};

/**
 * POST /api/scheduling/tasks/:id/assign
 * Assign operator to a task
 */
export const assignOperator = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendError(res, 400, 'INVALID_ID', 'ID inválido');
      return;
    }

    const { operator_id } = req.body;
    const userId = (req as any).user?.id;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);

    // Get the task first to check its date
    const task = await taskRepo.findOne({ where: { id } });

    if (!task) {
      sendError(res, 404, 'TASK_NOT_FOUND', 'Tarea no encontrada');
      return;
    }

    // Check for conflicts
    const conflicts = await taskRepo.find({
      where: {
        operatorId: operator_id,
        startDate: task.startDate,
        status: Not(In(['completed', 'cancelled'])),
        id: Not(id),
      },
    });

    if (conflicts.length > 0) {
      sendError(
        res,
        409,
        'OPERATOR_CONFLICT',
        'El operador tiene asignaciones conflictivas en esta fecha',
        conflicts
      );
      return;
    }

    // Assign operator
    task.operatorId = operator_id;
    task.status = 'assigned';
    task.assignedBy = userId;

    const updatedTask = await taskRepo.save(task);

    sendSuccess(res, updatedTask);
  } catch (error: any) {
    Logger.error('Error assigning operator', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      taskId: req.params.id,
      operatorId: req.body.operator_id,
      context: 'ScheduledTaskController.assignOperator',
    });
    sendError(res, 500, 'TASK_ASSIGN_FAILED', 'Error al asignar operador', error.message);
  }
};

/**
 * POST /api/scheduling/tasks/:id/complete
 * Mark task as completed
 */
export const completeTask = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      sendError(res, 400, 'INVALID_ID', 'ID inválido');
      return;
    }

    const { completion_notes, maintenance_record_id } = req.body;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const task = await taskRepo.findOne({ where: { id } });

    if (!task) {
      sendError(res, 404, 'TASK_NOT_FOUND', 'Tarea no encontrada');
      return;
    }

    task.status = 'completed';
    task.completionDate = new Date();
    task.completionNotes = completion_notes || undefined;
    task.maintenanceRecordId = maintenance_record_id || undefined;

    const updatedTask = await taskRepo.save(task);

    sendSuccess(res, updatedTask);
  } catch (error: any) {
    Logger.error('Error completing task', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      taskId: req.params.id,
      context: 'ScheduledTaskController.completeTask',
    });
    sendError(res, 500, 'TASK_COMPLETE_FAILED', 'Error al completar tarea', error.message);
  }
};

/**
 * GET /api/scheduling/tasks/check-conflicts
 * Check for scheduling conflicts for an operator
 */
export const checkConflicts = async (req: Request, res: Response) => {
  try {
    const { operator_id, date, exclude_task_id } = req.query;

    if (!operator_id || !date) {
      sendError(res, 400, 'MISSING_PARAMS', 'operator_id y date son requeridos');
      return;
    }

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const whereConditions: any = {
      operatorId: parseInt(operator_id as string),
      startDate: new Date(date as string),
      status: Not(In(['completed', 'cancelled'])),
    };

    if (exclude_task_id) {
      whereConditions.id = Not(parseInt(exclude_task_id as string));
    }

    const conflicts = await taskRepo.find({ where: whereConditions });

    sendSuccess(res, {
      hasConflicts: conflicts.length > 0,
      conflicts,
    });
  } catch (error: any) {
    Logger.error('Error checking conflicts', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operatorId: req.query.operator_id,
      date: req.query.date,
      context: 'ScheduledTaskController.checkConflicts',
    });
    sendError(res, 500, 'CONFLICT_CHECK_FAILED', 'Error al verificar conflictos', error.message);
  }
};

/**
 * GET /api/scheduling/calendar
 * Get tasks formatted for calendar view
 */
export const getCalendarTasks = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, project_id } = req.query;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const queryBuilder = taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.equipment', 'equipment');

    if (start_date) {
      queryBuilder.andWhere('task.startDate >= :startDate', { startDate: start_date });
    }

    if (end_date) {
      queryBuilder.andWhere('task.startDate <= :endDate', { endDate: end_date });
    }

    if (project_id) {
      queryBuilder.andWhere('task.projectId = :projectId', {
        projectId: parseInt(project_id as string),
      });
    }

    queryBuilder.orderBy('task.startDate', 'ASC');

    const tasks = await queryBuilder.getMany();

    // Format for calendar display
    const events = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      start: task.startDate,
      end: task.endDate || task.startDate,
      allDay: task.allDay || true,
      extendedProps: {
        status: task.status,
        priority: task.priority,
        taskType: task.taskType,
        equipmentCode: task.equipment?.codigo_equipo,
        operatorId: task.operatorId,
      },
      className: `task-${task.status} priority-${task.priority}`,
    }));

    sendSuccess(res, events);
  } catch (error: any) {
    Logger.error('Error getting calendar tasks', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
      context: 'ScheduledTaskController.getCalendarTasks',
    });
    sendError(res, 500, 'CALENDAR_GET_FAILED', 'Error al obtener calendario', error.message);
  }
};
