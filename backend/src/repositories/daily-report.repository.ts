import { Pool } from 'pg';
import { BaseRepository, QueryFilters, PaginatedResult } from './base.repository';

export interface DailyReport {
  id: number;
  tenant_id: number;
  codigo_reporte: string;
  fecha: Date;
  operator_id: number;
  equipment_id: number;
  project_id?: number;
  hora_inicio: string;
  hora_fin: string;
  horas_trabajadas: number;
  horometro_inicio?: number;
  horometro_fin?: number;
  odometro_inicio?: number;
  odometro_fin?: number;
  combustible_consumido?: number;
  ubicacion?: string;
  actividades?: string;
  observaciones?: string;
  estado: string;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}

export interface DailyReportFilters extends QueryFilters {
  fecha_inicio?: Date;
  fecha_fin?: Date;
  operator_id?: number;
  equipment_id?: number;
  project_id?: number;
  estado?: string;
}

export class DailyReportRepository extends BaseRepository<DailyReport> {
  constructor(pool: Pool) {
    super('daily_reports', pool);
  }

  async findAll(filters: DailyReportFilters): Promise<PaginatedResult<DailyReport>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['dr.is_active = true'];
    const params: any[] = [];
    let paramCount = 1;

    // Tenant filter
    if (filters.tenantId) {
      conditions.push(`dr.tenant_id = $${paramCount++}`);
      params.push(filters.tenantId);
    }

    // Date range filter
    if (filters.fecha_inicio) {
      conditions.push(`dr.fecha >= $${paramCount++}`);
      params.push(filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      conditions.push(`dr.fecha <= $${paramCount++}`);
      params.push(filters.fecha_fin);
    }

    // Operator filter
    if (filters.operator_id) {
      conditions.push(`dr.trabajador_id = $${paramCount++}`);
      params.push(filters.operator_id);
    }

    // Equipment filter
    if (filters.equipment_id) {
      conditions.push(`dr.equipo_id = $${paramCount++}`);
      params.push(filters.equipment_id);
    }

    // Project filter
    if (filters.project_id) {
      conditions.push(`dr.proyecto_id = $${paramCount++}`);
      params.push(filters.project_id);
    }

    // Status filter
    if (filters.estado) {
      conditions.push(`dr.estado = $${paramCount++}`);
      params.push(filters.estado);
    }

    // Search filter
    if (filters.search) {
      conditions.push(`(
        dr.codigo_reporte ILIKE $${paramCount} OR
        dr.actividades ILIKE $${paramCount} OR
        dr.observaciones ILIKE $${paramCount}
      )`);
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        dr.*,
        o.nombres || ' ' || o.apellidos as operador_nombre,
        o.codigo_operador,
        e.code as equipo_codigo,
        e.name as equipo_nombre,
        p.nombre as proyecto_nombre
      FROM equipo.parte_diario dr
      LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
      LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
      LEFT JOIN proyectos.edt p ON dr.proyecto_id = p.id
      ${whereClause}
      ORDER BY dr.fecha DESC, dr.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM equipo.parte_diario dr
      ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      this.pool.query(query, params),
      this.pool.query(countQuery, params.slice(0, -2)),
    ]);

    return {
      data: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
    };
  }

  async findById(id: number, tenantId?: number): Promise<DailyReport | null> {
    const conditions: string[] = ['dr.id = $1', 'dr.is_active = true'];
    const params: any[] = [id];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`dr.tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        dr.*,
        o.nombres || ' ' || o.apellidos as operador_nombre,
        o.codigo_operador,
        o.foto_url as operador_foto,
        e.code as equipo_codigo,
        e.name as equipo_nombre,
        e.brand as equipo_marca,
        e.model as equipo_modelo,
        p.nombre as proyecto_nombre
      FROM equipo.parte_diario dr
      LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
      LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
      LEFT JOIN proyectos.edt p ON dr.proyecto_id = p.id
      ${whereClause}
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  async create(data: Partial<DailyReport>, userId: number): Promise<DailyReport> {
    // Generate report code
    const date = new Date(data.fecha!);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const countResult = await this.pool.query(
      'SELECT COUNT(*) as count FROM equipo.parte_diario WHERE fecha = $1 AND tenant_id = $2',
      [data.fecha, data.tenant_id]
    );
    const reportNumber = String(parseInt(countResult.rows[0].count) + 1).padStart(4, '0');
    const codigo_reporte = `RPT-${dateStr}-${reportNumber}`;

    const query = `
      INSERT INTO equipo.parte_diario (
        tenant_id, codigo_reporte, fecha, trabajador_id, equipo_id, proyecto_id,
        hora_inicio, hora_fin, horas_trabajadas, horometro_inicio, horometro_fin,
        odometro_inicio, odometro_fin, combustible_consumido, ubicacion,
        actividades, observaciones, estado, created_by, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      codigo_reporte,
      data.fecha,
      data.operator_id,
      data.equipment_id,
      data.project_id,
      data.hora_inicio,
      data.hora_fin,
      data.horas_trabajadas,
      data.horometro_inicio,
      data.horometro_fin,
      data.odometro_inicio,
      data.odometro_fin,
      data.combustible_consumido,
      data.ubicacion,
      data.actividades,
      data.observaciones,
      data.estado || 'pendiente',
      userId,
      true,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(
    id: number,
    data: Partial<DailyReport>,
    userId: number,
    tenantId?: number
  ): Promise<DailyReport> {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    const updateFields = Object.keys(data).filter(
      (k) =>
        k !== 'id' &&
        k !== 'tenant_id' &&
        k !== 'codigo_reporte' &&
        k !== 'created_at' &&
        k !== 'created_by'
    );

    updateFields.forEach((field) => {
      if (data[field as keyof DailyReport] !== undefined) {
        setClauses.push(`${field} = $${paramCount++}`);
        params.push(data[field as keyof DailyReport]);
      }
    });

    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`updated_by = $${paramCount++}`);
    params.push(userId);

    const whereConditions: string[] = [`id = $${paramCount++}`];
    params.push(id);

    if (tenantId) {
      whereConditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const query = `
      UPDATE daily_reports
      SET ${setClauses.join(', ')}
      WHERE ${whereConditions.join(' AND ')}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('Daily report not found or access denied');
    }
    return result.rows[0];
  }

  async getReportsByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId?: number,
    operatorId?: number,
    equipmentId?: number
  ): Promise<DailyReport[]> {
    const conditions: string[] = ['fecha >= $1', 'fecha <= $2', 'is_active = true'];
    const params: any[] = [startDate, endDate];
    let paramCount = 3;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    if (operatorId) {
      conditions.push(`trabajador_id = $${paramCount++}`);
      params.push(operatorId);
    }

    if (equipmentId) {
      conditions.push(`equipo_id = $${paramCount++}`);
      params.push(equipmentId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        dr.*,
        o.nombres || ' ' || o.apellidos as operador_nombre,
        e.code as equipo_codigo,
        e.name as equipo_nombre
      FROM equipo.parte_diario dr
      LEFT JOIN rrhh.trabajador o ON dr.trabajador_id = o.id
      LEFT JOIN equipo.equipo e ON dr.equipo_id = e.id
      ${whereClause}
      ORDER BY dr.fecha ASC
    `;

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getMonthlyStats(year: number, month: number, tenantId?: number): Promise<any> {
    const conditions: string[] = [
      'EXTRACT(YEAR FROM fecha) = $1',
      'EXTRACT(MONTH FROM fecha) = $2',
      'is_active = true',
    ];
    const params: any[] = [year, month];
    let paramCount = 3;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        COUNT(*) as total_reportes,
        COUNT(DISTINCT trabajador_id) as total_operadores,
        COUNT(DISTINCT equipo_id) as total_equipos,
        SUM(horas_trabajadas) as total_horas,
        AVG(horas_trabajadas) as promedio_horas,
        SUM(combustible_consumido) as total_combustible
      FROM equipo.parte_diario
      ${whereClause}
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }
}
