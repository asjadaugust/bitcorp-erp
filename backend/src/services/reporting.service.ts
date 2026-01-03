import pool from '../config/database.config';

export class ReportingService {
  async getEquipmentUtilization(startDate: string, endDate: string) {
    const query = `
      SELECT 
        e.codigo_equipo as code,
        e.marca || ' ' || e.modelo as equipment,
        te.nombre as equipment_type,
        COUNT(pd.id) as days_worked,
        SUM(pd.horometro_final - pd.horometro_inicial) as total_hours,
        AVG(pd.horometro_final - pd.horometro_inicial) as avg_daily_hours,
        SUM(pd.combustible_consumido) as total_fuel
      FROM equipo.equipo e
      LEFT JOIN equipo.parte_diario pd ON e.id = pd.equipo_id
      LEFT JOIN equipo.tipo_equipo te ON e.tipo_equipo_id = te.id
      WHERE pd.fecha >= $1 AND pd.fecha <= $2
        AND pd.estado = 'APROBADO'
      GROUP BY e.id, e.codigo_equipo, e.marca, e.modelo, te.nombre
      ORDER BY total_hours DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  async getMaintenanceHistory(startDate: string, endDate: string) {
    const query = `
      SELECT 
        pm.id,
        pm.fecha_inicio as start_date,
        pm.fecha_fin as end_date,
        pm.tipo_mantenimiento as maintenance_type,
        pm.estado as status,
        pm.costo_estimado as cost,
        pm.descripcion as description,
        e.codigo_equipo as equipment_code,
        e.marca || ' ' || e.modelo as equipment_name,
        p.razon_social as provider_name
      FROM equipo.programa_mantenimiento pm
      LEFT JOIN equipo.equipo e ON pm.equipo_id = e.id
      LEFT JOIN proveedores.proveedor p ON pm.proveedor_id = p.id
      WHERE pm.fecha_inicio >= $1 AND pm.fecha_inicio <= $2
      ORDER BY pm.fecha_inicio DESC
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
        m.numero_documento,
        p.nombre as project_name,
        COUNT(md.id) as items_count,
        SUM(md.monto_total) as total_amount
      FROM logistica.movimiento m
      LEFT JOIN proyectos.edt p ON m.proyecto_id = p.id
      LEFT JOIN logistica.detalle_movimiento md ON m.id = md.movimiento_id
      WHERE m.fecha >= $1 AND m.fecha <= $2
      GROUP BY m.id, m.fecha, m.tipo_movimiento, m.numero_documento, p.nombre
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
        COUNT(DISTINCT pd.fecha) as days_worked,
        SUM(pd.horas_trabajadas) as total_hours,
        SUM(CASE WHEN pd.horas_trabajadas > 8 
            THEN pd.horas_trabajadas - 8 
            ELSE 0 END) as overtime_hours
      FROM rrhh.trabajador o
      JOIN equipo.parte_diario pd ON o.id = pd.trabajador_id
      LEFT JOIN proyectos.edt p ON pd.proyecto_id = p.id
      WHERE pd.fecha >= $1 AND pd.fecha <= $2
        AND pd.estado = 'APROBADO'
      GROUP BY o.id, o.nombres, o.apellido_paterno, p.nombre
      ORDER BY operator_name, project_name
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }
}
