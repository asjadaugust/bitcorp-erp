import { Request, Response } from 'express';
import pool from '../../config/database.config';
import { sendSuccess, sendError } from '../../utils/api-response';

/**
 * Maintenance Schedule Controller
 * Handles API endpoints for maintenance scheduling using raw SQL
 */

/**
 * GET /api/scheduling/maintenance-schedules
 * List all maintenance schedules with optional filters
 */
export const listSchedules = async (req: Request, res: Response) => {
  try {
    const { equipment_id, status, project_id } = req.query;

    let query = `
      SELECT 
        ms.*,
        e.code as equipment_code,
        e.description as equipment_name,
        e.brand as equipment_brand,
        p.name as project_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN projects p ON e.project_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (equipment_id) {
      query += ` AND ms.equipment_id = $${paramIndex++}`;
      params.push(equipment_id);
    }

    if (status) {
      query += ` AND ms.is_active = $${paramIndex++}`;
      params.push(status === 'active');
    }

    if (project_id) {
      query += ` AND e.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    query += ' ORDER BY ms.created_at DESC';

    const result = await pool.query(query, params);

    return sendSuccess(res, result.rows.map(mapSchedule));
  } catch (error: any) {
    console.error('Error listing maintenance schedules:', error);
    // If table doesn't exist, return empty array
    if (error.message?.includes('relation "maintenance_schedules" does not exist')) {
      return sendSuccess(res, [], { message: 'Maintenance schedules table not yet created' });
    }
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_LIST_FAILED',
      'Failed to list maintenance schedules',
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
    const { id } = req.params;

    const query = `
      SELECT 
        ms.*,
        e.code as equipment_code,
        e.description as equipment_name,
        e.brand as equipment_brand,
        p.name as project_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN projects p ON ms.project_id = p.id
      WHERE ms.id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return sendError(
        res,
        404,
        'MAINTENANCE_SCHEDULE_NOT_FOUND',
        'Maintenance schedule not found'
      );
    }

    return sendSuccess(res, mapSchedule(result.rows[0]));
  } catch (error: any) {
    console.error('Error getting maintenance schedule:', error);
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_GET_FAILED',
      'Failed to get maintenance schedule',
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

    // Calculate next due based on interval
    const nextDueDate = calculateNextDueDate(interval_type, interval_value);

    const query = `
      INSERT INTO maintenance_schedules (
        equipment_id, project_id, maintenance_type, interval_type, interval_value,
        description, notes, auto_generate_tasks, next_due_date, status, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      equipment_id,
      project_id || null,
      maintenance_type || 'preventive',
      interval_type || 'hours',
      interval_value || 250,
      description || null,
      notes || null,
      auto_generate_tasks !== false,
      nextDueDate,
      createdBy,
    ]);

    return sendSuccess(res, mapSchedule(result.rows[0]), undefined, 201);
  } catch (error: any) {
    console.error('Error creating maintenance schedule:', error);
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_CREATE_FAILED',
      error.message || 'Failed to create maintenance schedule'
    );
  }
};

/**
 * PUT /api/scheduling/maintenance-schedules/:id
 * Update an existing maintenance schedule
 */
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'equipment_id',
      'project_id',
      'maintenance_type',
      'interval_type',
      'interval_value',
      'description',
      'notes',
      'status',
      'auto_generate_tasks',
      'next_due_date',
      'next_due_hours',
      'last_completed_date',
      'last_completed_hours',
    ];

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`);
        values.push(updates[field]);
      }
    });

    if (fields.length === 0) {
      return sendError(res, 400, 'MAINTENANCE_SCHEDULE_NO_FIELDS', 'No valid fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE maintenance_schedules 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return sendError(
        res,
        404,
        'MAINTENANCE_SCHEDULE_NOT_FOUND',
        'Maintenance schedule not found'
      );
    }

    return sendSuccess(res, mapSchedule(result.rows[0]));
  } catch (error: any) {
    console.error('Error updating maintenance schedule:', error);
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_UPDATE_FAILED',
      'Failed to update maintenance schedule',
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
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM maintenance_schedules WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return sendError(
        res,
        404,
        'MAINTENANCE_SCHEDULE_NOT_FOUND',
        'Maintenance schedule not found'
      );
    }

    return sendSuccess(res, { message: 'Maintenance schedule deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting maintenance schedule:', error);
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_DELETE_FAILED',
      'Failed to delete maintenance schedule',
      error.message
    );
  }
};

/**
 * POST /api/scheduling/maintenance-schedules/generate-tasks
 * Generate tasks from all active schedules
 */
export const generateTasks = async (req: Request, res: Response) => {
  try {
    const { daysAhead = 30 } = req.body;

    // Find schedules that are due soon
    const query = `
      SELECT * FROM maintenance_schedules
      WHERE status = 'active'
      AND auto_generate_tasks = true
      AND next_due_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
    `;

    const result = await pool.query(query);

    // For now, just return the schedules that would generate tasks
    return sendSuccess(res, {
      tasksGenerated: result.rows.length,
      schedules: result.rows.map(mapSchedule),
    });
  } catch (error: any) {
    console.error('Error generating tasks:', error);
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_TASK_GENERATION_FAILED',
      'Failed to generate tasks',
      error.message
    );
  }
};

/**
 * POST /api/scheduling/maintenance-schedules/:id/complete
 * Mark a schedule as completed and recalculate next due
 */
export const completeSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completionHours } = req.body;

    // First get the schedule
    const getResult = await pool.query('SELECT * FROM maintenance_schedules WHERE id = $1', [id]);

    if (getResult.rows.length === 0) {
      return sendError(
        res,
        404,
        'MAINTENANCE_SCHEDULE_NOT_FOUND',
        'Maintenance schedule not found'
      );
    }

    const schedule = getResult.rows[0];
    const nextDueDate = calculateNextDueDate(schedule.interval_type, schedule.interval_value);
    const nextDueHours = completionHours ? completionHours + (schedule.interval_value || 0) : null;

    const updateQuery = `
      UPDATE maintenance_schedules
      SET 
        last_completed_date = CURRENT_TIMESTAMP,
        last_completed_hours = $1,
        next_due_date = $2,
        next_due_hours = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      completionHours || null,
      nextDueDate,
      nextDueHours,
      id,
    ]);

    return sendSuccess(res, mapSchedule(result.rows[0]));
  } catch (error: any) {
    console.error('Error completing schedule:', error);
    return sendError(
      res,
      500,
      'MAINTENANCE_SCHEDULE_COMPLETE_FAILED',
      error.message || 'Failed to complete schedule'
    );
  }
};

// Helper function to calculate next due date
function calculateNextDueDate(intervalType: string, intervalValue: number): Date {
  const now = new Date();

  switch (intervalType) {
    case 'days':
      now.setDate(now.getDate() + intervalValue);
      break;
    case 'weeks':
      now.setDate(now.getDate() + intervalValue * 7);
      break;
    case 'months':
      now.setMonth(now.getMonth() + intervalValue);
      break;
    case 'hours':
    default:
      // For hours-based schedules, set a default 30 days
      now.setDate(now.getDate() + 30);
      break;
  }

  return now;
}

// Helper function to map database row to response format
function mapSchedule(row: any) {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    projectId: row.project_id,
    maintenanceType: row.maintenance_type,
    intervalType: row.interval_type,
    intervalValue: row.interval_value,
    description: row.description,
    notes: row.notes,
    status: row.status,
    autoGenerateTasks: row.auto_generate_tasks,
    lastCompletedDate: row.last_completed_date,
    lastCompletedHours: row.last_completed_hours,
    nextDueDate: row.next_due_date,
    nextDueHours: row.next_due_hours,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Joined fields
    equipment: row.equipment_code
      ? {
          id: row.equipment_id,
          code: row.equipment_code,
          name: row.equipment_name,
          brand: row.equipment_brand,
        }
      : undefined,
    project: row.project_name
      ? {
          id: row.project_id,
          name: row.project_name,
        }
      : undefined,
  };
}
