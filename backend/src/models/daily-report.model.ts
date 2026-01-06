/* eslint-disable @typescript-eslint/no-explicit-any */
import pool from '../config/database.config';
import { DailyReportRawRow } from '../types/daily-report-raw.interface';

/**
 * Daily Report Model
 * Uses Spanish column names matching database schema
 * Returns raw entities - transformation to DTO happens in controller/service
 */

export class DailyReportModel {
  static async findAll(filters?: {
    estado?: string;
    fecha?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    trabajador_id?: string;
    equipo_id?: string;
    proyecto_id?: string;
  }): Promise<DailyReportRawRow[]> {
    let query = `
      SELECT dr.*,
             o.nombres || ' ' || o.apellido_paterno || ' ' || COALESCE(o.apellido_materno, '') as trabajador_nombre,
             e.codigo_equipo as equipo_codigo,
             e.marca || ' ' || e.modelo as equipo_nombre,
             p.nombre as proyecto_nombre
       FROM equipo.parte_diario dr
       LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
       LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
       LEFT JOIN gestion.proyecto p ON dr.proyecto_id = p.id
       WHERE 1=1
    `;
    const params: (string | number | null)[] = [];
    let paramIndex = 1;

    if (filters?.estado) {
      query += ` AND dr.estado = $${paramIndex++}`;
      params.push(filters.estado);
    }

    if (filters?.fecha) {
      query += ` AND dr.fecha = $${paramIndex++}`;
      params.push(filters.fecha);
    }

    if (filters?.fecha_inicio) {
      query += ` AND dr.fecha >= $${paramIndex++}`;
      params.push(filters.fecha_inicio);
    }

    if (filters?.fecha_fin) {
      query += ` AND dr.fecha <= $${paramIndex++}`;
      params.push(filters.fecha_fin);
    }

    if (filters?.trabajador_id) {
      query += ` AND dr.trabajador_id = $${paramIndex++}`;
      params.push(filters.trabajador_id);
    }

    if (filters?.equipo_id) {
      query += ` AND dr.equipo_id = $${paramIndex++}`;
      params.push(filters.equipo_id);
    }

    if (filters?.proyecto_id) {
      query += ` AND dr.proyecto_id = $${paramIndex++}`;
      params.push(filters.proyecto_id);
    }

    query += ' ORDER BY dr.fecha DESC, dr.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows as DailyReportRawRow[];
  }

  static async findById(id: string): Promise<DailyReportRawRow | null> {
    const result = await pool.query(
      `SELECT dr.*,
              o.nombres || ' ' || o.apellido_paterno || ' ' || COALESCE(o.apellido_materno, '') as trabajador_nombre,
              e.codigo_equipo as equipo_codigo,
              e.marca || ' ' || e.modelo as equipo_nombre,
              p.nombre as proyecto_nombre
       FROM equipo.parte_diario dr
       LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
       LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
       LEFT JOIN gestion.proyecto p ON dr.proyecto_id = p.id
       WHERE dr.id = $1`,
      [id]
    );
    return result.rows.length > 0 ? (result.rows[0] as DailyReportRawRow) : null;
  }

  static async findByOperator(operatorId: string): Promise<DailyReportRawRow[]> {
    const result = await pool.query(
      `SELECT dr.*,
              o.nombres || ' ' || o.apellido_paterno || ' ' || COALESCE(o.apellido_materno, '') as trabajador_nombre,
              e.codigo_equipo as equipo_codigo,
              e.marca || ' ' || e.modelo as equipo_nombre,
              p.nombre as proyecto_nombre
       FROM equipo.parte_diario dr
       LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
       LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
       LEFT JOIN gestion.proyecto p ON dr.proyecto_id = p.id
       WHERE dr.trabajador_id = $1
       ORDER BY dr.fecha DESC`,
      [operatorId]
    );
    return result.rows as DailyReportRawRow[];
  }

  static async create(data: any): Promise<DailyReportRawRow> {
    // Calculate fuel consumed and hours worked
    const combustibleConsumido =
      data.combustible_inicial && data.combustible_final
        ? data.combustible_inicial - data.combustible_final
        : null;

    const horasTrabajadas =
      data.horometro_inicial && data.horometro_final
        ? data.horometro_final - data.horometro_inicial
        : null;

    const result = await pool.query(
      `INSERT INTO equipo.parte_diario (
        fecha, trabajador_id, equipo_id, proyecto_id,
        hora_inicio, hora_fin, horometro_inicial, horometro_final,
        odometro_inicial, odometro_final, combustible_inicial, combustible_consumido,
        horas_trabajadas, observaciones, observaciones_correcciones, estado,
        lugar_salida
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        data.fecha,
        data.trabajador_id || null,
        data.equipo_id || null,
        data.proyecto_id || null,
        data.hora_inicio,
        data.hora_fin,
        data.horometro_inicial,
        data.horometro_final,
        data.odometro_inicial || null,
        data.odometro_final || null,
        data.combustible_inicial || null,
        combustibleConsumido,
        horasTrabajadas,
        data.observaciones,
        data.observaciones_correcciones || null,
        data.estado || 'BORRADOR',
        data.lugar_salida,
      ]
    );
    return result.rows[0] as DailyReportRawRow;
  }

  static async update(id: string, data: any): Promise<DailyReportRawRow | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Only update fields that are provided
    const updatableFields = [
      'fecha',
      'trabajador_id',
      'equipo_id',
      'proyecto_id',
      'hora_inicio',
      'hora_fin',
      'horometro_inicial',
      'horometro_final',
      'odometro_inicial',
      'odometro_final',
      'combustible_inicial',
      'lugar_salida',
      'observaciones',
      'observaciones_correcciones',
      'estado',
    ];

    updatableFields.forEach((field) => {
      if (data[field] !== undefined) {
        // Convert empty strings to null for nullable fields
        const value = data[field] === '' ? null : data[field];
        fields.push(`${field} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findById(id);

    // Recalculate fuel consumed if fuel data changed
    if (data.combustible_inicial !== undefined || data.combustible_final !== undefined) {
      const current = await this.findById(id);
      if (current) {
        const fuelStart =
          data.combustible_inicial !== undefined
            ? data.combustible_inicial
            : current.combustible_inicial;
        const fuelEnd =
          data.combustible_final !== undefined ? data.combustible_final : current.combustible_final;
        if (fuelStart && fuelEnd) {
          fields.push(`combustible_consumido = $${paramIndex++}`);
          values.push(fuelStart - fuelEnd);
        }
      }
    }

    // Recalculate hours worked if hourmeter data changed
    if (data.horometro_inicial !== undefined || data.horometro_final !== undefined) {
      const current = await this.findById(id);
      if (current) {
        const hourStart =
          data.horometro_inicial !== undefined ? data.horometro_inicial : current.horometro_inicial;
        const hourEnd =
          data.horometro_final !== undefined ? data.horometro_final : current.horometro_final;
        if (hourStart && hourEnd) {
          fields.push(`horas_trabajadas = $${paramIndex++}`);
          values.push(hourEnd - hourStart);
        }
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE equipo.parte_diario SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? this.findById(id) : null;
  }

  static async approve(id: string, approvedBy: string): Promise<DailyReportRawRow | null> {
    const result = await pool.query(
      `UPDATE equipo.parte_diario 
       SET estado = 'APROBADO', aprobado_por = $1, aprobado_en = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [approvedBy, id]
    );
    return result.rows.length > 0 ? (result.rows[0] as DailyReportRawRow) : null;
  }

  static async reject(id: string, reason: string): Promise<DailyReportRawRow | null> {
    const result = await pool.query(
      `UPDATE equipo.parte_diario 
       SET estado = 'RECHAZADO', observaciones_correcciones = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [reason, id]
    );
    return result.rows.length > 0 ? (result.rows[0] as DailyReportRawRow) : null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM equipo.parte_diario WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
