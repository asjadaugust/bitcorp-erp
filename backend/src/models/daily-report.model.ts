import pool from '../config/database.config';
import { BaseModel } from './base.model';

export interface DailyReport extends BaseModel {
  report_date: string;
  operator_id: string;
  operator_name?: string;
  equipment_id: string;
  equipment_code?: string;
  equipment_name?: string;
  project_id?: string; // UUID
  project_name?: string;
  start_time: string;
  end_time: string;
  hourmeter_start: number;
  hourmeter_end: number;
  odometer_start?: number;
  odometer_end?: number;
  fuel_start?: number;
  fuel_end?: number;
  fuel_consumed?: number;
  location: string;
  work_description: string;
  notes?: string;
  weather_conditions?: string;
  photos?: string[];
  gps_latitude?: number;
  gps_longitude?: number;
  gps_accuracy?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
}

export class DailyReportModel {
  static async findAll(filters?: {
    status?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    operator_id?: string;
    equipment_id?: string;
    project_id?: string;
  }): Promise<DailyReport[]> {
    let query = `
      SELECT dr.*,
             o.nombres || ' ' || o.apellido_paterno || ' ' || COALESCE(o.apellido_materno, '') as operator_name,
             e.codigo_equipo as equipment_code,
             e.marca || ' ' || e.modelo as equipment_name
       FROM equipo.parte_diario dr
       LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
       LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
       WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND dr.estado = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.date) {
      query += ` AND dr.fecha = $${paramIndex++}`;
      params.push(filters.date);
    }

    if (filters?.start_date) {
      query += ` AND dr.fecha >= $${paramIndex++}`;
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      query += ` AND dr.fecha <= $${paramIndex++}`;
      params.push(filters.end_date);
    }

    if (filters?.operator_id) {
      query += ` AND dr.trabajador_id = $${paramIndex++}`;
      params.push(filters.operator_id);
    }

    if (filters?.equipment_id) {
      query += ` AND dr.equipo_id = $${paramIndex++}`;
      params.push(filters.equipment_id);
    }

    if (filters?.project_id) {
      query += ` AND dr.proyecto_id = $${paramIndex++}`;
      params.push(filters.project_id);
    }

    query += ' ORDER BY dr.fecha DESC, dr.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id: string): Promise<DailyReport | null> {
    const result = await pool.query(
      `SELECT dr.*,
              o.nombres || ' ' || o.apellido_paterno || ' ' || COALESCE(o.apellido_materno, '') as operator_name,
              e.codigo_equipo as equipment_code,
              e.marca || ' ' || e.modelo as equipment_name
       FROM equipo.parte_diario dr
       LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
       LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
       WHERE dr.id = $1`,
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async findByOperator(operatorId: string): Promise<DailyReport[]> {
    const result = await pool.query(
      `SELECT dr.*,
              o.nombres || ' ' || o.apellido_paterno || ' ' || COALESCE(o.apellido_materno, '') as operator_name,
              e.codigo_equipo as equipment_code,
              e.marca || ' ' || e.modelo as equipment_name
       FROM equipo.parte_diario dr
       LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
       LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
       WHERE dr.trabajador_id = $1
       ORDER BY dr.fecha DESC`,
      [operatorId]
    );
    return result.rows;
  }

  static async create(data: Partial<DailyReport>): Promise<DailyReport> {
    // Calculate fuel consumed
    const fuelConsumed = data.fuel_start && data.fuel_end ? data.fuel_start - data.fuel_end : null;

    const result = await pool.query(
      `INSERT INTO daily_reports (
        report_date, operator_id, equipment_id, project_id,
        start_time, end_time, hourmeter_start, hourmeter_end,
        odometer_start, odometer_end, fuel_start, fuel_end, fuel_consumed,
        location, work_description, notes, weather_conditions,
        gps_latitude, gps_longitude, gps_accuracy,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        data.report_date,
        data.operator_id,
        data.equipment_id,
        data.project_id,
        data.start_time,
        data.end_time,
        data.hourmeter_start,
        data.hourmeter_end,
        data.odometer_start,
        data.odometer_end,
        data.fuel_start,
        data.fuel_end,
        fuelConsumed,
        data.location,
        data.work_description,
        data.notes,
        data.weather_conditions,
        data.gps_latitude,
        data.gps_longitude,
        data.gps_accuracy,
        data.status || 'draft',
      ]
    );
    return result.rows[0];
  }

  static async update(id: string, data: Partial<DailyReport>): Promise<DailyReport | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updateFields: (keyof DailyReport)[] = [
      'report_date',
      'start_time',
      'end_time',
      'hourmeter_start',
      'hourmeter_end',
      'odometer_start',
      'odometer_end',
      'fuel_start',
      'fuel_end',
      'location',
      'work_description',
      'notes',
      'weather_conditions',
      'gps_latitude',
      'gps_longitude',
      'gps_accuracy',
      'status',
    ];

    updateFields.forEach((field) => {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex++}`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) return this.findById(id);

    // Recalculate fuel consumed if fuel data changed
    if (data.fuel_start !== undefined || data.fuel_end !== undefined) {
      const current = await this.findById(id);
      if (current) {
        const fuelStart = data.fuel_start !== undefined ? data.fuel_start : current.fuel_start;
        const fuelEnd = data.fuel_end !== undefined ? data.fuel_end : current.fuel_end;
        if (fuelStart && fuelEnd) {
          fields.push(`fuel_consumed = $${paramIndex++}`);
          values.push(fuelStart - fuelEnd);
        }
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE daily_reports SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async approve(id: string, approvedBy: string): Promise<DailyReport | null> {
    const result = await pool.query(
      `UPDATE daily_reports 
       SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [approvedBy, id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async reject(id: string, reason: string): Promise<DailyReport | null> {
    const result = await pool.query(
      `UPDATE daily_reports 
       SET status = 'rejected', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [reason, id]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id: string): Promise<boolean> {
    // Hard delete (no soft delete column)
    const result = await pool.query('DELETE FROM equipo.parte_diario WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }
}
