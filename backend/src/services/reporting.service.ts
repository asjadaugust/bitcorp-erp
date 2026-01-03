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
        o.nombres || ' ' || o.apellido_paterno as operator_name,
        p.nombre as project_name,
        COUNT(DISTINCT dr.fecha) as days_worked,
        SUM(dr.horas_trabajadas) as total_hours,
        SUM(CASE WHEN dr.horas_trabajadas > 8 
            THEN dr.horas_trabajadas - 8 
            ELSE 0 END) as overtime_hours
      FROM rrhh.trabajador o
      JOIN equipo.parte_diario dr ON o.id = dr.trabajador_id
      LEFT JOIN proyectos.edt p ON dr.proyecto_id = p.id
      WHERE dr.fecha >= $1 AND dr.fecha <= $2
        AND dr.estado = 'aprobado'
      GROUP BY o.id, o.nombres, o.apellido_paterno, p.nombre
      ORDER BY operator_name, project_name
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }
}
