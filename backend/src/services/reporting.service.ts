import pool from '../config/database.config';

export class ReportingService {
  async getEquipmentUtilization(startDate: string, endDate: string) {
    const query = `
      SELECT 
        e."C08001_Codigo" as code,
        e.name as equipment,
        e.equipment_type,
        COUNT(dr."C08005_IdParteDiario") as days_worked,
        SUM(dr.hourmeter_end - dr.hourmeter_start) as total_hours,
        AVG(dr.hourmeter_end - dr.hourmeter_start) as avg_daily_hours,
        SUM(dr.fuel_consumed) as total_fuel
      FROM tbl_c08001_equipo e
      LEFT JOIN tbl_c08005_partediario dr ON e."C08001_Id" = dr."C08001_Id"
      WHERE dr."C08005_Fecha" >= $1 AND dr."C08005_Fecha" <= $2
        AND dr.status = 'approved'
      GROUP BY e."C08001_Id", e."C08001_Codigo", e.name, e.equipment_type
      ORDER BY total_hours DESC
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  async getMaintenanceHistory(startDate: string, endDate: string) {
    const query = `
      SELECT 
        mr.id,
        mr.start_date,
        mr.end_date,
        mr.maintenance_type,
        mr.status,
        mr.cost,
        mr.description,
        e."C08001_Codigo" as equipment_code,
        e.name as equipment_name,
        p.business_name as provider_name
      FROM maintenance_records mr
      LEFT JOIN tbl_c08001_equipo e ON mr.equipment_id = e."C08001_Id"
      LEFT JOIN providers p ON mr.provider_id = p.id
      WHERE mr.start_date >= $1 AND mr.start_date <= $2
      ORDER BY mr.start_date DESC
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  async getInventoryMovements(startDate: string, endDate: string) {
    const query = `
      SELECT 
        m.id,
        m.fecha,
        m.tipo_movimiento,
        m.tipo_documento,
        m.numero_documento,
        p."G00007_Nombre" as project_name,
        pr."C07001_RazonSocial" as provider_name,
        COUNT(md.id) as items_count,
        SUM(md.total) as total_amount
      FROM movements m
      LEFT JOIN tbl_g00007_proyecto p ON m.project_id = p."G00007_Id"
      LEFT JOIN tbl_c07001_proveedor pr ON m.provider_id = pr."C07001_Id"
      LEFT JOIN movement_details md ON m.id = md.movement_id
      WHERE m.fecha >= $1 AND m.fecha <= $2
      GROUP BY m.id, m.fecha, m.tipo_movimiento, m.tipo_documento, m.numero_documento, p."G00007_Nombre", pr."C07001_RazonSocial"
      ORDER BY m.fecha DESC
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  async getOperatorTimesheet(startDate: string, endDate: string) {
    const query = `
      SELECT 
        o."C05000_Nombre" || ' ' || o."C05000_Apellido" as operator_name,
        p."G00007_Nombre" as project_name,
        COUNT(DISTINCT dr."C08005_Fecha") as days_worked,
        SUM(EXTRACT(EPOCH FROM (dr.end_time - dr.start_time))/3600) as total_hours,
        SUM(CASE WHEN EXTRACT(EPOCH FROM (dr.end_time - dr.start_time))/3600 > 8 
            THEN (EXTRACT(EPOCH FROM (dr.end_time - dr.start_time))/3600) - 8 
            ELSE 0 END) as overtime_hours
      FROM tbl_c05000_trabajador o
      JOIN tbl_c08005_partediario dr ON o."C05000_Id" = dr.operator_id
      LEFT JOIN tbl_g00007_proyecto p ON dr.project_id = p."G00007_Id"
      WHERE dr."C08005_Fecha" >= $1 AND dr."C08005_Fecha" <= $2
        AND dr.status = 'approved'
      GROUP BY o."C05000_Id", o."C05000_Nombre", o."C05000_Apellido", p."G00007_Nombre"
      ORDER BY operator_name, project_name
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }
}
