import { Pool } from 'pg';
import { BaseRepository, QueryFilters, PaginatedResult } from './base.repository';

export interface Operator {
  id: number;
  tenant_id: number;
  codigo_operador: string;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  tipo_documento: string;
  fecha_nacimiento?: Date;
  telefono?: string;
  email?: string;
  direccion?: string;
  estado: string;
  foto_url?: string;
  fecha_contratacion?: Date;
  tipo_contrato?: string;
  tarifa_hora?: number;
  skills?: string[];
  certifications?: Record<string, unknown>[];
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}

export interface OperatorFilters extends QueryFilters {
  status?: string;
  skill?: string;
  tipo_contrato?: string;
}

export class OperatorRepository extends BaseRepository<Operator> {
  constructor(pool: Pool) {
    super('operators', pool);
  }

  async findAll(filters: OperatorFilters): Promise<PaginatedResult<Operator>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['o.is_active = true'];
    const params: unknown[] = [];
    let paramCount = 1;

    // Tenant filter
    if (filters.tenantId) {
      conditions.push(`o.tenant_id = $${paramCount++}`);
      params.push(filters.tenantId);
    }

    // Status filter
    if (filters.status) {
      conditions.push(`o.estado = $${paramCount++}`);
      params.push(filters.status);
    }

    // Contract type filter
    if (filters.tipo_contrato) {
      conditions.push(`o.tipo_contrato = $${paramCount++}`);
      params.push(filters.tipo_contrato);
    }

    // Search filter
    if (filters.search) {
      conditions.push(`(
        o.nombres ILIKE $${paramCount} OR 
        o.apellidos ILIKE $${paramCount} OR 
        o.codigo_operador ILIKE $${paramCount} OR 
        o.documento_identidad ILIKE $${paramCount}
      )`);
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Skill filter
    if (filters.skill) {
      conditions.push(`$${paramCount} = ANY(o.skills)`);
      params.push(filters.skill);
      paramCount++;
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM equipo.parte_diario dr WHERE dr.trabajador_id = o.id AND dr.is_active = true) as total_reportes
      FROM rrhh.trabajador o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM rrhh.trabajador o
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

  async findById(id: number, tenantId?: number): Promise<Operator | null> {
    const conditions: string[] = ['o.id = $1', 'o.is_active = true'];
    const params: unknown[] = [id];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`o.tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM equipo.parte_diario dr WHERE dr.trabajador_id = o.id AND dr.is_active = true) as total_reportes,
        (SELECT SUM(horas_trabajadas) FROM equipo.parte_diario dr WHERE dr.trabajador_id = o.id AND dr.is_active = true) as total_horas
      FROM rrhh.trabajador o
      ${whereClause}
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  async findByCode(codigo: string, tenantId?: number): Promise<Operator | null> {
    const conditions: string[] = ['codigo_operador = $1', 'is_active = true'];
    const params: unknown[] = [codigo];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `SELECT * FROM rrhh.trabajador ${whereClause}`;
    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  async findByDocument(documento: string, tenantId?: number): Promise<Operator | null> {
    const conditions: string[] = ['documento_identidad = $1', 'is_active = true'];
    const params: unknown[] = [documento];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `SELECT * FROM rrhh.trabajador ${whereClause}`;
    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  async create(data: Partial<Operator>, userId: number): Promise<Operator> {
    const query = `
      INSERT INTO rrhh.trabajador (
        tenant_id, codigo_operador, nombres, apellidos, documento_identidad,
        tipo_documento, fecha_nacimiento, telefono, email, direccion, estado,
        foto_url, fecha_contratacion, tipo_contrato, tarifa_hora, skills,
        certifications, created_by, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      data.codigo_operador,
      data.nombres,
      data.apellidos,
      data.documento_identidad,
      data.tipo_documento || 'DNI',
      data.fecha_nacimiento,
      data.telefono,
      data.email,
      data.direccion,
      data.estado || 'activo',
      data.foto_url,
      data.fecha_contratacion,
      data.tipo_contrato,
      data.tarifa_hora,
      data.skills ? JSON.stringify(data.skills) : null,
      data.certifications ? JSON.stringify(data.certifications) : null,
      userId,
      true,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(
    id: number,
    data: Partial<Operator>,
    userId: number,
    tenantId?: number
  ): Promise<Operator> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramCount = 1;

    const updateFields = Object.keys(data).filter(
      (k) => k !== 'id' && k !== 'tenant_id' && k !== 'created_at' && k !== 'created_by'
    );

    updateFields.forEach((field) => {
      const value = data[field as keyof Operator];
      if (value !== undefined) {
        setClauses.push(`${field} = $${paramCount++}`);
        // Handle JSON fields
        if (field === 'skills' || field === 'certifications') {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
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
      UPDATE operators
      SET ${setClauses.join(', ')}
      WHERE ${whereConditions.join(' AND ')}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('Operator not found or access denied');
    }
    return result.rows[0];
  }

  async getOperatorStats(operatorId: number, tenantId?: number): Promise<Record<string, unknown> | undefined> {
    const conditions: string[] = ['operator_id = $1', 'is_active = true'];
    const params: unknown[] = [operatorId];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        COUNT(*) as total_reportes,
        SUM(horas_trabajadas) as total_horas,
        AVG(horas_trabajadas) as promedio_horas_dia,
        SUM(combustible_consumido) as total_combustible
      FROM equipo.parte_diario
      ${whereClause}
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }
}
