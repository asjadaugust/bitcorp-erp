import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database.config';
import { ScheduledTask } from '../../models/scheduled-task.model';
import { Between, LessThanOrEqual, MoreThanOrEqual, Not, In } from 'typeorm';

/**
 * Scheduled Task Controller
 * Uses TypeORM for database operations with Spanish schema (equipo.tarea_programada)
 */

/**
 * GET /api/scheduling/tasks
 * List all scheduled tasks with filters
 */
export const listTasks = async (req: Request, res: Response) => {
  try {
    const { equipment_id, operator_id, status, date_from, date_to, task_type, project_id } = req.query;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const queryBuilder = taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.equipment', 'equipment')
      .leftJoinAndSelect('task.project', 'project');

    // Apply filters
    if (equipment_id) {
      queryBuilder.andWhere('task.equipmentId = :equipmentId', { equipmentId: parseInt(equipment_id as string) });
    }

    if (operator_id) {
      queryBuilder.andWhere('task.operatorId = :operatorId', { operatorId: parseInt(operator_id as string) });
    }

    if (status && status !== 'all') {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (task_type) {
      queryBuilder.andWhere('task.taskType = :taskType', { taskType: task_type });
    }

    if (project_id) {
      queryBuilder.andWhere('task.projectId = :projectId', { projectId: parseInt(project_id as string) });
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

    queryBuilder.orderBy('task.startDate', 'ASC').addOrderBy('task.priority', 'DESC');

    const tasks = await queryBuilder.getMany();

    res.json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    console.error('Error listing tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list tasks',
      details: error.message,
    });
  }
};

/**
 * GET /api/scheduling/tasks/:id
 * Get a single task by ID
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const task = await taskRepo.findOne({
      where: { id: parseInt(id) },
      relations: ['equipment', 'project'],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('Error getting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get task',
    });
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

    res.status(201).json({
      success: true,
      data: savedTask,
    });
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      details: error.message,
    });
  }
};

/**
 * PUT /api/scheduling/tasks/:id
 * Update a scheduled task
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const task = await taskRepo.findOne({ where: { id: parseInt(id) } });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
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
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
      });
    }

    const updatedTask = await taskRepo.save(task);

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
    });
  }
};

/**
 * DELETE /api/scheduling/tasks/:id
 * Delete a scheduled task
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const result = await taskRepo.delete(parseInt(id));

    if (!result.affected || result.affected === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
    });
  }
};

/**
 * POST /api/scheduling/tasks/:id/assign
 * Assign operator to a task
 */
export const assignOperator = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operator_id } = req.body;
    const userId = (req as any).user?.id;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    
    // Get the task first to check its date
    const task = await taskRepo.findOne({ where: { id: parseInt(id) } });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Check for conflicts
    const conflicts = await taskRepo.find({
      where: {
        operatorId: operator_id,
        startDate: task.startDate,
        status: Not(In(['completed', 'cancelled'])),
        id: Not(parseInt(id)),
      },
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Operator has conflicting assignments on this date',
        conflicts,
      });
    }

    // Assign operator
    task.operatorId = operator_id;
    task.status = 'assigned';
    task.assignedBy = userId;
    
    const updatedTask = await taskRepo.save(task);

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error: any) {
    console.error('Error assigning operator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign operator',
    });
  }
};

/**
 * POST /api/scheduling/tasks/:id/complete
 * Mark task as completed
 */
export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completion_notes, maintenance_record_id } = req.body;

    const taskRepo = AppDataSource.getRepository(ScheduledTask);
    const task = await taskRepo.findOne({ where: { id: parseInt(id) } });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    task.status = 'completed';
    task.completionDate = new Date();
    task.completionNotes = completion_notes || undefined;
    task.maintenanceRecordId = maintenance_record_id || undefined;

    const updatedTask = await taskRepo.save(task);

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (error: any) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete task',
    });
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
      return res.status(400).json({
        success: false,
        error: 'operator_id and date are required',
      });
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

    res.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
      },
    });
  } catch (error: any) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
    });
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
      queryBuilder.andWhere('task.projectId = :projectId', { projectId: parseInt(project_id as string) });
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

    res.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    console.error('Error getting calendar tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get calendar tasks',
    });
  }
};
