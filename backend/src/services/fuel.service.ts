import pool from '../config/database.config';

export class FuelService {
  async getAllFuelRecords(filters?: any) {
    let query = `
      SELECT f."C08007_IdValeSalida" as id, 
             f."C08001_Id" as equipment_id,
             f."C08007_Fecha" as transaction_date,
             f."C08007_Galones" as gallons,
             f."C08007_PrecioGalon" as unit_price,
             f."C08007_CostoTotal" as total_cost,
             f."C08007_HorometroOdometro" as odometer_reading,
             f."C08007_NumValeSalida" as invoice_number,
             f."C08007_Proveedor" as supplier,
             f."C08007_Observaciones" as notes,
             e."C08001_Codigo" as equipment_code, 
             e."C08001_Marca" as equipment_brand, 
             e."C08001_Modelo" as equipment_model
      FROM tbl_c08007_equipocombustible f
      LEFT JOIN tbl_c08001_equipo e ON f."C08001_Id" = e."C08001_Id"
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.equipment_id) {
      query += ` AND f."C08001_Id" = $${paramIndex++}`;
      params.push(filters.equipment_id);
    }

    if (filters?.startDate) {
      query += ` AND f."C08007_Fecha" >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += ` AND f."C08007_Fecha" <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    if (filters?.search) {
      query += ` AND (e."C08001_Codigo" ILIKE $${paramIndex} OR f."C08007_NumValeSalida" ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY f."C08007_Fecha" DESC';

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM tbl_c08007_equipocombustible f
      LEFT JOIN tbl_c08001_equipo e ON f."C08001_Id" = e."C08001_Id"
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (filters?.equipment_id) {
      countQuery += ` AND f."C08001_Id" = $${countParamIndex++}`;
      countParams.push(filters.equipment_id);
    }

    if (filters?.startDate) {
      countQuery += ` AND f."C08007_Fecha" >= $${countParamIndex++}`;
      countParams.push(filters.startDate);
    }

    if (filters?.endDate) {
      countQuery += ` AND f."C08007_Fecha" <= $${countParamIndex++}`;
      countParams.push(filters.endDate);
    }

    if (filters?.search) {
      countQuery += ` AND (e."C08001_Codigo" ILIKE $${countParamIndex} OR f."C08007_NumValeSalida" ILIKE $${countParamIndex})`;
      countParams.push(`%${filters.search}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  }

  async getFuelRecordById(id: number) {
    const query = `
      SELECT f."C08007_IdValeSalida" as id, 
             f."C08001_Id" as equipment_id,
             f."C08007_Fecha" as transaction_date,
             f."C08007_Galones" as gallons,
             f."C08007_PrecioGalon" as unit_price,
             f."C08007_CostoTotal" as total_cost,
             f."C08007_HorometroOdometro" as odometer_reading,
             f."C08007_NumValeSalida" as invoice_number,
             f."C08007_Proveedor" as supplier,
             f."C08007_Observaciones" as notes,
             e."C08001_Codigo" as equipment_code, 
             e."C08001_Marca" as equipment_brand, 
             e."C08001_Modelo" as equipment_model
      FROM tbl_c08007_equipocombustible f
      LEFT JOIN tbl_c08001_equipo e ON f."C08001_Id" = e."C08001_Id"
      WHERE f."C08007_IdValeSalida" = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async createFuelRecord(data: any, userId: string) {
    const query = `
      INSERT INTO tbl_c08007_equipocombustible (
        "C08001_Id", "C08007_Fecha", "C08007_Galones", "C08007_PrecioGalon",
        "C08007_CostoTotal", "C08007_HorometroOdometro", "C08007_Proveedor", "C08007_NumValeSalida",
        "C08007_Observaciones", "G00002_IdUsuarioCreacion", fuel_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'diesel')
      RETURNING 
        "C08007_IdValeSalida" as id, "C08001_Id" as equipment_id, "C08007_Fecha" as transaction_date,
        "C08007_Galones" as gallons, "C08007_PrecioGalon" as unit_price, "C08007_CostoTotal" as total_cost,
        "C08007_HorometroOdometro" as odometer_reading, "C08007_NumValeSalida" as invoice_number,
        "C08007_Proveedor" as supplier, "C08007_Observaciones" as notes
    `;
    const params = [
      data.equipment_id,
      data.fueling_date,
      data.gallons,
      data.cost_per_gallon,
      data.total_cost,
      data.hourmeter,
      data.provider_id,
      data.invoice_number, // provider_id mapped to supplier string for now or needs check
      data.notes,
      userId,
    ];
    // Note: provider_id in input might need to be supplier name if DB expects string, or ID if FK.
    // Migration script renamed 'supplier' column to 'C08007_Proveedor'. Original was varchar(200).
    // So it expects a name, not an ID. If data.provider_id is passed, we might need to fetch name or change logic.
    // Assuming data.provider_id is actually the supplier name or we treat it as such for now.

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async updateFuelRecord(id: number, data: any, userId: string) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Map input fields to DB columns
    const fieldMap: Record<string, string> = {
      equipment_id: 'c08001_id',
      fueling_date: '"C08007_Fecha"',
      gallons: '"C08007_Galones"',
      cost_per_gallon: '"C08007_PrecioGalon"',
      total_cost: '"C08007_CostoTotal"',
      hourmeter: '"C08007_HorometroOdometro"',
      provider_id: '"C08007_Proveedor"', // Assuming this maps to supplier column
      invoice_number: '"C08007_NumValeSalida"',
      notes: '"C08007_Observaciones"',
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
      UPDATE tbl_c08007_equipocombustible 
      SET ${fields.join(', ')} 
      WHERE "C08007_IdValeSalida" = $${paramIndex} 
      RETURNING 
        "C08007_IdValeSalida" as id, c08001_id as equipment_id, "C08007_Fecha" as transaction_date,
        "C08007_Galones" as gallons, "C08007_PrecioGalon" as unit_price, "C08007_CostoTotal" as total_cost,
        "C08007_HorometroOdometro" as odometer_reading, "C08007_NumValeSalida" as invoice_number,
        "C08007_Proveedor" as supplier, "C08007_Observaciones" as notes
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async deleteFuelRecord(id: number) {
    const query =
      'DELETE FROM tbl_c08007_equipocombustible WHERE "C08007_IdValeSalida" = $1 RETURNING "C08007_IdValeSalida"';
    const result = await pool.query(query, [id]);
    return (result.rowCount || 0) > 0;
  }
}
