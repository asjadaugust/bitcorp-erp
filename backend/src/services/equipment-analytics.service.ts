import pool from '../config/database.config';

export interface UtilizationMetrics {
  equipmentId: number;
  equipmentCode: string;
  totalHours: number;
  workingHours: number;
  idleHours: number;
  utilizationRate: number;
  costPerHour: number;
  totalCost: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface FleetUtilizationMetrics {
  totalEquipment: number;
  activeEquipment: number;
  avgUtilizationRate: number;
  totalCost: number;
  topPerformers: Array<{
    equipmentCode: string;
    utilizationRate: number;
  }>;
  underutilized: Array<{
    equipmentCode: string;
    utilizationRate: number;
  }>;
}

export interface UtilizationTrend {
  date: string;
  utilizationRate: number;
  workingHours: number;
  cost: number;
}

export interface FuelMetrics {
  equipmentId: number;
  totalFuelConsumed: number;
  avgFuelPerHour: number;
  totalFuelCost: number;
  avgCostPerHour: number;
  efficiency: 'good' | 'average' | 'poor';
}

export interface FuelTrend {
  date: string;
  fuelConsumed: number;
  fuelCost: number;
  fuelPerHour: number;
}

export interface MaintenanceMetrics {
  equipmentId: number;
  totalMaintenances: number;
  totalDowntimeHours: number;
  totalMaintenanceCost: number;
  avgTimeBetweenMaintenance: number;
  nextScheduledMaintenance: Date | null;
  maintenanceFrequency: 'high' | 'normal' | 'low';
}

export class EquipmentAnalyticsService {
  /**
   * Calculate equipment utilization for a given period
   */
  async getEquipmentUtilization(
    equipmentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<UtilizationMetrics> {
    // Get equipment details
    const equipmentResult = await pool.query(
      'SELECT id_equipo as id, codigoequipo as code, tarifa as hourly_rate FROM tbl_c08001_equipo WHERE id_equipo = $1',
      [equipmentId]
    );

    if (equipmentResult.rows.length === 0) {
      throw new Error('Equipment not found');
    }

    const equipment = equipmentResult.rows[0];

    // Get daily reports for the period
    const reportsResult = await pool.query(
      `SELECT hours_worked, date 
       FROM equipo.parte_diario 
       WHERE equipment_id = $1 AND date BETWEEN $2 AND $3`,
      [equipmentId, startDate, endDate]
    );

    const reports = reportsResult.rows;
    const totalHours = this.calculateTotalPeriodHours(startDate, endDate);
    const workingHours = reports.reduce((sum: number, report: any) => 
      sum + parseFloat(report.hours_worked || 0), 0
    );
    const idleHours = totalHours - workingHours;
    const utilizationRate = totalHours > 0 ? (workingHours / totalHours) * 100 : 0;

    // Calculate cost
    const costPerHour = parseFloat(equipment.hourly_rate || 0);
    const totalCost = workingHours * costPerHour;

    return {
      equipmentId,
      equipmentCode: equipment.code,
      totalHours,
      workingHours,
      idleHours,
      utilizationRate,
      costPerHour,
      totalCost,
      periodStart: startDate,
      periodEnd: endDate
    };
  }

  /**
   * Get utilization trend over time (daily aggregation)
   */
  async getUtilizationTrend(
    equipmentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<UtilizationTrend[]> {
    const equipmentResult = await pool.query(
      'SELECT id, code, hourly_rate FROM equipo.equipo WHERE id = $1',
      [equipmentId]
    );

    if (equipmentResult.rows.length === 0) {
      throw new Error('Equipment not found');
    }

    const equipment = equipmentResult.rows[0];
    const reportsResult = await pool.query(
      `SELECT date, SUM(hours_worked) as hours_worked 
       FROM equipo.parte_diario 
       WHERE equipment_id = $1 AND date BETWEEN $2 AND $3
       GROUP BY date
       ORDER BY date ASC`,
      [equipmentId, startDate, endDate]
    );

    const reports = reportsResult.rows;
    const costPerHour = parseFloat(equipment.hourly_rate || 0);
    const hoursPerDay = 24;

    const trend = reports.map((report: any) => {
      const workingHours = parseFloat(report.hours_worked || 0);
      return {
        date: new Date(report.date).toISOString().split('T')[0],
        utilizationRate: (workingHours / hoursPerDay) * 100,
        workingHours,
        cost: workingHours * costPerHour
      };
    });

    return trend;
  }

  /**
   * Get fleet-wide utilization metrics
   */
  async getFleetUtilization(
    startDate: Date,
    endDate: Date,
    projectId?: number
  ): Promise<FleetUtilizationMetrics> {
    // Get all equipment
    let query = 'SELECT id, code FROM equipo.equipo WHERE is_active = true';
    const params: any[] = [];
    
    if (projectId) {
      query += ' AND project_id = $1';
      params.push(projectId);
    }

    const equipmentResult = await pool.query(query, params);
    const allEquipment = equipmentResult.rows;
    const totalEquipment = allEquipment.length;

    // Get utilization for each equipment
    const utilizationPromises = allEquipment.map((eq: any) =>
      this.getEquipmentUtilization(eq.id, startDate, endDate)
    );

    const utilizationMetrics = await Promise.all(utilizationPromises);

    const activeEquipment = utilizationMetrics.filter(m => m.workingHours > 0).length;
    const avgUtilizationRate = totalEquipment > 0
      ? utilizationMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / totalEquipment
      : 0;
    const totalCost = utilizationMetrics.reduce((sum, m) => sum + m.totalCost, 0);

    // Sort by utilization rate
    const sorted = utilizationMetrics
      .map(m => ({
        equipmentCode: m.equipmentCode,
        utilizationRate: m.utilizationRate
      }))
      .sort((a, b) => b.utilizationRate - a.utilizationRate);

    const topPerformers = sorted.slice(0, 5);
    const underutilized = sorted
      .filter(e => e.utilizationRate < 50)
      .slice(-5);

    return {
      totalEquipment,
      activeEquipment,
      avgUtilizationRate,
      totalCost,
      topPerformers,
      underutilized
    };
  }

  /**
   * Get fuel consumption metrics
   */
  async getFuelMetrics(
    equipmentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<FuelMetrics> {
    const reportsResult = await pool.query(
      `SELECT SUM(fuel_consumed) as total_fuel, SUM(hours_worked) as total_hours
       FROM equipo.parte_diario 
       WHERE equipment_id = $1 AND date BETWEEN $2 AND $3`,
      [equipmentId, startDate, endDate]
    );

    const report = reportsResult.rows[0];
    const totalFuelConsumed = parseFloat(report.total_fuel || 0);
    const totalHours = parseFloat(report.total_hours || 0);
    const avgFuelPerHour = totalHours > 0 ? totalFuelConsumed / totalHours : 0;

    // Assume fuel price (should come from config)
    const fuelPricePerGallon = 3.5;
    const totalFuelCost = totalFuelConsumed * fuelPricePerGallon;
    const avgCostPerHour = totalHours > 0 ? totalFuelCost / totalHours : 0;

    // Determine efficiency
    let efficiency: 'good' | 'average' | 'poor' = 'average';
    if (avgFuelPerHour < 2) efficiency = 'good';
    else if (avgFuelPerHour > 4) efficiency = 'poor';

    return {
      equipmentId,
      totalFuelConsumed,
      avgFuelPerHour,
      totalFuelCost,
      avgCostPerHour,
      efficiency
    };
  }

  /**
   * Get fuel consumption trend over time
   */
  async getFuelTrend(
    equipmentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<FuelTrend[]> {
    const reportsResult = await pool.query(
      `SELECT date, 
              SUM(fuel_consumed) as fuel_consumed, 
              SUM(hours_worked) as hours_worked
       FROM equipo.parte_diario 
       WHERE equipment_id = $1 AND date BETWEEN $2 AND $3
       GROUP BY date
       ORDER BY date ASC`,
      [equipmentId, startDate, endDate]
    );

    const fuelPricePerGallon = 3.5;
    const trend = reportsResult.rows.map((report: any) => {
      const fuelConsumed = parseFloat(report.fuel_consumed || 0);
      const hours = parseFloat(report.hours_worked || 0);
      return {
        date: new Date(report.date).toISOString().split('T')[0],
        fuelConsumed,
        fuelCost: fuelConsumed * fuelPricePerGallon,
        fuelPerHour: hours > 0 ? fuelConsumed / hours : 0
      };
    });

    return trend;
  }

  /**
   * Get maintenance metrics
   */
  async getMaintenanceMetrics(
    equipmentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<MaintenanceMetrics> {
    // Check if maintenance_records table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'maintenance_records'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      // Return mock data if table doesn't exist yet
      return {
        equipmentId,
        totalMaintenances: 0,
        totalDowntimeHours: 0,
        totalMaintenanceCost: 0,
        avgTimeBetweenMaintenance: 30,
        nextScheduledMaintenance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        maintenanceFrequency: 'normal'
      };
    }

    // Get maintenance data
    const maintenanceResult = await pool.query(
      `SELECT COUNT(*) as count,
              SUM(downtime_hours) as downtime,
              SUM(cost) as cost
       FROM maintenance_records 
       WHERE equipment_id = $1 AND date BETWEEN $2 AND $3`,
      [equipmentId, startDate, endDate]
    );

    const data = maintenanceResult.rows[0];
    const totalMaintenances = parseInt(data.count || 0);
    const totalDowntimeHours = parseFloat(data.downtime || 0);
    const totalMaintenanceCost = parseFloat(data.cost || 0);

    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgTimeBetweenMaintenance = totalMaintenances > 0 
      ? periodDays / totalMaintenances 
      : 30;

    let maintenanceFrequency: 'high' | 'normal' | 'low' = 'normal';
    if (avgTimeBetweenMaintenance < 20) maintenanceFrequency = 'high';
    else if (avgTimeBetweenMaintenance > 45) maintenanceFrequency = 'low';

    return {
      equipmentId,
      totalMaintenances,
      totalDowntimeHours,
      totalMaintenanceCost,
      avgTimeBetweenMaintenance,
      nextScheduledMaintenance: new Date(Date.now() + avgTimeBetweenMaintenance * 24 * 60 * 60 * 1000),
      maintenanceFrequency
    };
  }

  /**
   * Helper: Calculate total hours in a period (24 * days)
   */
  private calculateTotalPeriodHours(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * 24;
  }
}

export const equipmentAnalyticsService = new EquipmentAnalyticsService();
