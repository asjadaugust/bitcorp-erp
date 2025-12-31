import pool from '../config/database.config';

export class MaintenanceService {
  async getAllMaintenance(filters?: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const legacyTableExists = await this.legacyTableExists();

    if (!legacyTableExists) {
      return { data: [], total: 0, tableMissing: true };
    }

    let query = `
      SELECT m."C08010_IdMantenimiento" as id, 
             m."C08001_Id" as equipment_id,
             m."C08010_FechaProgramada" as maintenance_date,
             m."C08010_Descripcion" as description,
             m."C08010_Tipo" as maintenance_type,
             m."C08010_Estado" as status,
             m."C08010_Costo" as cost,
             m."C08010_Observaciones" as notes,
             e."C08001_Codigo" as equipment_code, 
             e."C08001_Marca" as equipment_brand, 
             e."C08001_Modelo" as equipment_model
      FROM tbl_c08010_mantenimiento m
      LEFT JOIN tbl_c08001_equipo e ON m."C08001_Id" = e."C08001_Id"
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND m."C08010_Estado" = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.type) {
      query += ` AND m."C08010_Tipo" = $${paramIndex++}`;
      params.push(filters.type);
    }

    if (filters?.search) {
      query += ` AND (e."C08001_Codigo" ILIKE $${paramIndex} OR m."C08010_Descripcion" ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY m."C08010_FechaProgramada" DESC';

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tbl_c08010_mantenimiento m
      LEFT JOIN tbl_c08001_equipo e ON m."C08001_Id" = e."C08001_Id"
      WHERE 1=1
      ${filters?.status ? `AND m."C08010_Estado" = '${filters.status}'` : ''}
      ${filters?.type ? `AND m."C08010_Tipo" = '${filters.type}'` : ''}
      ${filters?.search ? `AND (e."C08001_Codigo" ILIKE '%${filters.search}%' OR m."C08010_Descripcion" ILIKE '%${filters.search}%')` : ''}
    `;
    const countResult = await pool.query(countQuery);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }

  async getMaintenanceById(id: number) {
    const legacyTableExists = await this.legacyTableExists();

    if (!legacyTableExists) return null;

    const query = `
      SELECT m."C08010_IdMantenimiento" as id, 
             m."C08001_Id" as equipment_id,
             m."C08010_FechaProgramada" as maintenance_date,
             m."C08010_Descripcion" as description,
             m."C08010_Tipo" as maintenance_type,
             m."C08010_Estado" as status,
             m."C08010_Costo" as cost,
             m."C08010_Observaciones" as notes,
             e."C08001_Codigo" as equipment_code, 
             e."C08001_Marca" as equipment_brand, 
             e."C08001_Modelo" as equipment_model,
             p.razon_social as provider_name
      FROM tbl_c08010_mantenimiento m
      LEFT JOIN tbl_c08001_equipo e ON m."C08001_Id" = e."C08001_Id"
      LEFT JOIN providers p ON m.provider_id = p.id
      WHERE m."C08010_IdMantenimiento" = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async createMaintenance(data: any, userId: string) {
    const legacyTableExists = await this.legacyTableExists();

    if (!legacyTableExists) {
      throw new Error('LEGACY_MAINTENANCE_TABLE_MISSING');
    }

    const query = `
      INSERT INTO tbl_c08010_mantenimiento (
        "C08001_Id", "C08010_Tipo", "C08010_Descripcion",
        "C08010_FechaProgramada", "C08010_Costo",
        "C08010_Estado", "C08010_Observaciones", "G00002_IdUsuarioCreacion"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        "C08010_IdMantenimiento" as id, "C08001_Id" as equipment_id, "C08010_Tipo" as maintenance_type,
        "C08010_Descripcion" as description, "C08010_FechaProgramada" as maintenance_date,
        "C08010_Costo" as cost, "C08010_Estado" as status, "C08010_Observaciones" as notes
    `;

    const params = [
      data.equipment_id,
      data.maintenance_type,
      data.description,
      data.maintenance_date || data.start_date,
      data.cost,
      data.status || 'scheduled',
      data.notes,
      userId,
    ];
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async updateMaintenance(id: number, data: any, userId: string) {
    const legacyTableExists = await this.legacyTableExists();

    if (!legacyTableExists) {
      throw new Error('LEGACY_MAINTENANCE_TABLE_MISSING');
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      equipment_id: '"C08001_Id"',
      maintenance_type: '"C08010_Tipo"',
      description: '"C08010_Descripcion"',
      maintenance_date: '"C08010_FechaProgramada"',
      start_date: '"C08010_FechaProgramada"',
      cost: '"C08010_Costo"',
      status: '"C08010_Estado"',
      notes: '"C08010_Observaciones"',
    };

    Object.keys(fieldMap).forEach((field) => {
      if (data[field] !== undefined) {
        fields.push(`${fieldMap[field]} = $${paramIndex++}`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) return null;

    fields.push(`"G00000_FechaModificacion" = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE tbl_c08010_mantenimiento
      SET ${fields.join(', ')}
      WHERE "C08010_IdMantenimiento" = $${paramIndex}
      RETURNING 
        "C08010_IdMantenimiento" as id, c08001_id as equipment_id, "C08010_Tipo" as maintenance_type,
        "C08010_Descripcion" as description, "C08010_FechaProgramada" as maintenance_date,
        "C08010_Costo" as cost, "C08010_Estado" as status, "C08010_Observaciones" as notes
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteMaintenance(id: number) {
    const legacyTableExists = await this.legacyTableExists();

    if (!legacyTableExists) {
      throw new Error('LEGACY_MAINTENANCE_TABLE_MISSING');
    }

    const query =
      'DELETE FROM tbl_c08010_mantenimiento WHERE "C08010_IdMantenimiento" = $1 RETURNING "C08010_IdMantenimiento"';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }

  private async legacyTableExists(): Promise<boolean> {
    const result = await pool.query(
      `SELECT to_regclass('public.tbl_c08010_mantenimiento') AS regclass`
    );

    return Boolean(result.rows[0]?.regclass);
  }
}
