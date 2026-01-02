import pool from '../config/database.config';
import { CostCenter } from '../models/cost-center.model';

export class AdministrationService {
  private mapToCostCenter(row: any): CostCenter {
    return {
      id: row.id,
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion,
      project_id: row.project_id,
      presupuesto: row.presupuesto,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    } as CostCenter;
  }

  async getAllCostCenters(): Promise<CostCenter[]> {
    const result = await pool.query(`
      SELECT * FROM administracion.centro_costo 
      WHERE is_active = true 
      ORDER BY codigo ASC
    `);
    return result.rows.map(this.mapToCostCenter);
  }

  async createCostCenter(data: Partial<CostCenter>): Promise<CostCenter> {
    const query = `
      INSERT INTO administracion.centro_costo (
        codigo, nombre, descripcion, project_id, presupuesto, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `;
    const values = [
      data.codigo, data.nombre, data.descripcion, data.project_id || null, data.presupuesto || null
    ];
    const result = await pool.query(query, values);
    return this.mapToCostCenter(result.rows[0]);
  }

  async getCostCenterById(id: string): Promise<CostCenter | null> {
    const result = await pool.query(`
      SELECT * FROM administracion.centro_costo WHERE id = $1
    `, [id]);
    return result.rows[0] ? this.mapToCostCenter(result.rows[0]) : null;
  }

  async updateCostCenter(id: string, data: Partial<CostCenter>): Promise<CostCenter | null> {
    const current = await this.getCostCenterById(id);
    if (!current) return null;

    const clauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.codigo) { clauses.push(`codigo = $${idx++}`); values.push(data.codigo); }
    if (data.nombre) { clauses.push(`nombre = $${idx++}`); values.push(data.nombre); }
    if (data.descripcion) { clauses.push(`descripcion = $${idx++}`); values.push(data.descripcion); }
    if (data.project_id !== undefined) { clauses.push(`project_id = $${idx++}`); values.push(data.project_id); }
    if (data.presupuesto !== undefined) { clauses.push(`presupuesto = $${idx++}`); values.push(data.presupuesto); }
    
    if (clauses.length === 0) return current;

    // updatedAt missing in model but good practice to keep clause if table has it? 
    // Model doesn't have updatedAt. Table script had it? 
    // Script: updated_at timestamp DEFAULT now()
    // So we can update it in DB even if model doesn't show it.
    clauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE administracion.centro_costo SET ${clauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);
    return this.mapToCostCenter(result.rows[0]);
  }

  async deleteCostCenter(id: string): Promise<boolean> {
    const query = `UPDATE administracion.centro_costo SET is_active = false WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
