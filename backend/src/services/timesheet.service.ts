import pool from '../config/database.config';
import { DailyReportModel } from '../models/daily-report.model';

interface TimesheetGenerationDto {
  operatorId: string;
  projectId?: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
}

interface Timesheet {
  id: string;
  timesheet_code: string;
  operator_id: string;
  project_id?: string;
  period_start: Date;
  period_end: Date;
  total_hours: number;
  total_days: number;
  regular_hours?: number;
  overtime_hours?: number;
  status: string;
  generated_from_reports: boolean;
  notes?: string;
  submitted_at?: Date;
  submitted_by?: string;
  approved_at?: Date;
  approved_by?: string;
  rejected_at?: Date;
  rejected_by?: string;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Timesheet Service
 * Note: This is a placeholder service. Timesheets table doesn't exist yet.
 * Returns mock data until the timesheets feature is fully implemented.
 */
export class TimesheetService {
  /**
   * Check if timesheets table exists
   */
  private async tableExists(): Promise<boolean> {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'timesheets'
        );
      `);
      return result.rows[0].exists;
    } catch {
      return false;
    }
  }

  /**
   * Calculate hours from time strings
   */
  private calculateHours(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(0, Math.round(diff * 100) / 100);
  }

  /**
   * Generate timesheet from daily reports (placeholder)
   */
  async generateTimesheet(dto: TimesheetGenerationDto): Promise<any> {
    const tableExists = await this.tableExists();
    if (!tableExists) {
      // Return a mock timesheet
      return {
        id: 'mock-timesheet-id',
        timesheet_code: `TS-${new Date().getFullYear()}-001`,
        operator_id: dto.operatorId,
        project_id: dto.projectId,
        period_start: dto.periodStart,
        period_end: dto.periodEnd,
        total_hours: 0,
        total_days: 0,
        status: 'draft',
        message: 'Timesheets feature not yet implemented. Table does not exist.',
      };
    }

    // Full implementation when table exists
    return null;
  }

  /**
   * Get timesheet with details
   */
  async getTimesheetWithDetails(id: string): Promise<any> {
    const tableExists = await this.tableExists();
    if (!tableExists) {
      throw new Error('Timesheets feature not yet implemented');
    }

    const result = await pool.query(
      `SELECT ts.*, 
              o.first_name || ' ' || o.last_name as operator_name
       FROM timesheets ts
       LEFT JOIN operators o ON ts.operator_id = o.id
       WHERE ts.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Timesheet not found');
    }

    return result.rows[0];
  }

  /**
   * Submit timesheet for approval
   */
  async submitTimesheet(id: string, submittedBy: string): Promise<any> {
    const tableExists = await this.tableExists();
    if (!tableExists) {
      throw new Error('Timesheets feature not yet implemented');
    }

    const result = await pool.query(
      `UPDATE timesheets 
       SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP, submitted_by = $1
       WHERE id = $2 AND status = 'draft'
       RETURNING *`,
      [submittedBy, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Timesheet not found or cannot be submitted');
    }

    return result.rows[0];
  }

  /**
   * Approve timesheet
   */
  async approveTimesheet(id: string, approvedBy: string): Promise<any> {
    const tableExists = await this.tableExists();
    if (!tableExists) {
      throw new Error('Timesheets feature not yet implemented');
    }

    const result = await pool.query(
      `UPDATE timesheets 
       SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = $1
       WHERE id = $2 AND status = 'submitted'
       RETURNING *`,
      [approvedBy, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Timesheet not found or cannot be approved');
    }

    return result.rows[0];
  }

  /**
   * Reject timesheet
   */
  async rejectTimesheet(id: string, rejectedBy: string, reason: string): Promise<any> {
    const tableExists = await this.tableExists();
    if (!tableExists) {
      throw new Error('Timesheets feature not yet implemented');
    }

    const result = await pool.query(
      `UPDATE timesheets 
       SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP, rejected_by = $1, rejection_reason = $2
       WHERE id = $3 AND status = 'submitted'
       RETURNING *`,
      [rejectedBy, reason, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Timesheet not found or cannot be rejected');
    }

    return result.rows[0];
  }

  /**
   * List timesheets with filters
   */
  async listTimesheets(filters: {
    operatorId?: string;
    projectId?: string;
    status?: string;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<any[]> {
    const tableExists = await this.tableExists();
    if (!tableExists) {
      // Return empty array - feature not implemented
      return [];
    }

    let query = `
      SELECT ts.*, 
             o.first_name || ' ' || o.last_name as operator_name
      FROM timesheets ts
      LEFT JOIN operators o ON ts.operator_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.operatorId) {
      query += ` AND ts.operator_id = $${paramIndex++}`;
      params.push(filters.operatorId);
    }

    if (filters.projectId) {
      query += ` AND ts.project_id = $${paramIndex++}`;
      params.push(filters.projectId);
    }

    if (filters.status) {
      query += ` AND ts.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.periodStart) {
      query += ` AND ts.period_start >= $${paramIndex++}`;
      params.push(filters.periodStart);
    }

    if (filters.periodEnd) {
      query += ` AND ts.period_end <= $${paramIndex++}`;
      params.push(filters.periodEnd);
    }

    query += ' ORDER BY ts.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export default new TimesheetService();
