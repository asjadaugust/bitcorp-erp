import { Pool } from 'pg';
import { BaseRepository, QueryFilters, PaginatedResult } from './base.repository';

export interface Equipment {
  id: number;
  tenant_id: number;
  code: string;
  name: string;
  brand: string;
  model: string;
  serial_number?: string;
  equipment_type: string;
  year_manufactured?: number;
  hourlyrate?: number;
  status: string;
  current_location?: string;
  provider_id?: number;
  placa?: string;
  categoria_equipo?: string;
  tipo_proveedor?: string;
  tipo_combustible?: string;
  potencia_neta?: number;
  fecha_venc_poliza?: Date;
  fecha_venc_soat?: Date;
  fecha_venc_citv?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
}

export interface EquipmentFilters extends QueryFilters {
  status?: string;
  equipment_type?: string;
  categoria_equipo?: string;
  provider_id?: number;
  expiringOnly?: boolean;
}

export class EquipmentRepository extends BaseRepository<Equipment> {
  constructor(pool: Pool) {
    super('equipment', pool);
  }

  async findAll(filters: EquipmentFilters): Promise<PaginatedResult<Equipment>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['e.is_active = true'];
    const params: unknown[] = [];
    let paramCount = 1;

    // Tenant filter
    if (filters.tenantId) {
      conditions.push(`e.tenant_id = $${paramCount++}`);
      params.push(filters.tenantId);
    }

    // Status filter
    if (filters.status) {
      conditions.push(`e.status = $${paramCount++}`);
      params.push(filters.status);
    }

    // Equipment type filter
    if (filters.equipment_type) {
      conditions.push(`e.equipment_type = $${paramCount++}`);
      params.push(filters.equipment_type);
    }

    // Category filter
    if (filters.categoria_equipo) {
      conditions.push(`e.categoria_equipo = $${paramCount++}`);
      params.push(filters.categoria_equipo);
    }

    // Provider filter
    if (filters.provider_id) {
      conditions.push(`e.provider_id = $${paramCount++}`);
      params.push(filters.provider_id);
    }

    // Search filter
    if (filters.search) {
      conditions.push(`(
        e.name ILIKE $${paramCount} OR 
        e.code ILIKE $${paramCount} OR 
        e.brand ILIKE $${paramCount} OR 
        e.placa ILIKE $${paramCount}
      )`);
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Expiring filter
    if (filters.expiringOnly) {
      conditions.push(`(
        e.fecha_venc_poliza <= CURRENT_DATE + INTERVAL '30 days' OR
        e.fecha_venc_soat <= CURRENT_DATE + INTERVAL '30 days' OR
        e.fecha_venc_citv <= CURRENT_DATE + INTERVAL '30 days'
      )`);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        e.*,
        p.razon_social as proveedor_nombre,
        p.nombre_comercial as proveedor_comercial
      FROM equipo.equipo e
      LEFT JOIN proveedores.proveedor p ON e.provider_id = p.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM equipo.equipo e
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

  async findById(id: number, tenantId?: number): Promise<Equipment | null> {
    const conditions: string[] = ['e.id = $1', 'e.is_active = true'];
    const params: unknown[] = [id];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`e.tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT 
        e.*,
        p.razon_social as proveedor_nombre,
        p.nombre_comercial as proveedor_comercial,
        p.tax_id as proveedor_ruc
      FROM equipo.equipo e
      LEFT JOIN proveedores.proveedor p ON e.provider_id = p.id
      ${whereClause}
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  async findByCode(code: string, tenantId?: number): Promise<Equipment | null> {
    const conditions: string[] = ['code = $1', 'is_active = true'];
    const params: unknown[] = [code];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `SELECT * FROM equipo.equipo ${whereClause}`;
    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  async create(data: Partial<Equipment>, userId: number): Promise<Equipment> {
    const query = `
      INSERT INTO equipo.equipo (
        tenant_id, code, name, brand, model, serial_number, equipment_type,
        year_manufactured, hourlyrate, status, current_location, provider_id,
        placa, categoria_equipo, tipo_proveedor, tipo_combustible, potencia_neta,
        fecha_venc_poliza, fecha_venc_soat, fecha_venc_citv, created_by, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      data.code,
      data.name,
      data.brand,
      data.model,
      data.serial_number,
      data.equipment_type,
      data.year_manufactured,
      data.hourlyrate,
      data.status || 'disponible',
      data.current_location,
      data.provider_id,
      data.placa,
      data.categoria_equipo,
      data.tipo_proveedor,
      data.tipo_combustible,
      data.potencia_neta,
      data.fecha_venc_poliza,
      data.fecha_venc_soat,
      data.fecha_venc_citv,
      userId,
      true,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async update(
    id: number,
    data: Partial<Equipment>,
    userId: number,
    tenantId?: number
  ): Promise<Equipment> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramCount = 1;

    const updateFields = Object.keys(data).filter(
      (k) => k !== 'id' && k !== 'tenant_id' && k !== 'created_at' && k !== 'created_by'
    );

    updateFields.forEach((field) => {
      if (data[field as keyof Equipment] !== undefined) {
        setClauses.push(`${field} = $${paramCount++}`);
        params.push(data[field as keyof Equipment]);
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
      UPDATE equipment
      SET ${setClauses.join(', ')}
      WHERE ${whereConditions.join(' AND ')}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('Equipment not found or access denied');
    }
    return result.rows[0];
  }

  async getExpiringDocuments(days: number = 30, tenantId?: number): Promise<Equipment[]> {
    const conditions: string[] = [
      'is_active = true',
      `(
        fecha_venc_poliza <= CURRENT_DATE + INTERVAL '${days} days' OR
        fecha_venc_soat <= CURRENT_DATE + INTERVAL '${days} days' OR
        fecha_venc_citv <= CURRENT_DATE + INTERVAL '${days} days'
      )`,
    ];
    const params: unknown[] = [];
    let paramCount = 1;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT * FROM equipment
      ${whereClause}
      ORDER BY 
        LEAST(fecha_venc_poliza, fecha_venc_soat, fecha_venc_citv) ASC
    `;

    const result = await this.pool.query(query, params);
    return result.rows;
  }
}
