import { Pool } from 'pg';

export interface QueryFilters {
  tenantId?: number;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  [key: string]: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<T> {
  protected tableName: string;
  protected pool: Pool;

  constructor(tableName: string, pool: Pool) {
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * Add tenant filter to WHERE clause
   */
  protected addTenantFilter(conditions: string[], params: unknown[], tenantId?: number): number {
    let paramCount = params.length + 1;
    if (tenantId) {
      conditions.push(`${this.tableName}.tenant_id = $${paramCount}`);
      params.push(tenantId);
      paramCount++;
    }
    return paramCount;
  }

  /**
   * Build WHERE clause from conditions
   */
  protected buildWhereClause(conditions: string[]): string {
    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  /**
   * Generic find all with pagination and tenant filtering
   */
  async findAll(filters: QueryFilters): Promise<PaginatedResult<T>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramCount = 1;

    // Add tenant filter
    paramCount = this.addTenantFilter(conditions, params, filters.tenantId);

    // Add is_active filter by default
    if (filters.is_active !== false) {
      conditions.push(`${this.tableName}.is_active = $${paramCount++}`);
      params.push(true);
    }

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT *
      FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${this.tableName}
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

  /**
   * Find by ID with tenant check
   */
  async findById(id: number | string, tenantId?: number): Promise<T | null> {
    const conditions: string[] = [`${this.tableName}.id = $1`];
    const params: unknown[] = [id];
    let paramCount = 2;

    paramCount = this.addTenantFilter(conditions, params, tenantId);

    conditions.push(`${this.tableName}.is_active = $${paramCount}`);
    params.push(true);

    const whereClause = this.buildWhereClause(conditions);

    const query = `
      SELECT *
      FROM ${this.tableName}
      ${whereClause}
    `;

    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Soft delete with tenant check
   */
  async softDelete(id: number | string, tenantId?: number): Promise<void> {
    const conditions: string[] = ['id = $1'];
    const params: unknown[] = [id];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      UPDATE ${this.tableName}
      SET is_active = false, updated_at = NOW()
      WHERE ${whereClause}
    `;

    await this.pool.query(query, params);
  }

  /**
   * Hard delete (use with caution)
   */
  async hardDelete(id: number | string, tenantId?: number): Promise<void> {
    const conditions: string[] = ['id = $1'];
    const params: unknown[] = [id];
    let paramCount = 2;

    if (tenantId) {
      conditions.push(`tenant_id = $${paramCount++}`);
      params.push(tenantId);
    }

    const whereClause = conditions.join(' AND ');

    const query = `DELETE FROM ${this.tableName} WHERE ${whereClause}`;
    await this.pool.query(query, params);
  }
}
