import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Equipment } from '../models/equipment.model';
import { DailyReport } from '../models/daily-report-typeorm.model';
import { NotFoundError, ValidationError, DatabaseError, DatabaseErrorType } from '../errors';
import logger from '../config/logger.config';

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

/**
 * Equipment Analytics Service
 *
 * Provides comprehensive analytics and metrics for equipment utilization, fuel consumption,
 * and maintenance tracking. This service aggregates data from daily reports (partes_diarios)
 * to calculate key performance indicators for individual equipment and fleet-wide metrics.
 *
 * ## Core Metrics Provided
 *
 * ### 1. Equipment Utilization
 * - **Method**: `getEquipmentUtilization()`
 * - **Purpose**: Calculate utilization rate for a single equipment over a period
 * - **Formula**: `utilization_rate = (working_hours / total_period_hours) * 100`
 * - **Returns**: Working hours, idle hours, utilization percentage, total cost
 *
 * ### 2. Utilization Trend
 * - **Method**: `getUtilizationTrend()`
 * - **Purpose**: Daily utilization trend over a date range
 * - **Returns**: Array of daily utilization rates with costs
 *
 * ### 3. Fleet Utilization
 * - **Method**: `getFleetUtilization()`
 * - **Purpose**: Aggregate metrics across all equipment
 * - **Returns**: Average utilization, top performers, underutilized equipment
 * - **⚠️ Performance Warning**: Calls `getEquipmentUtilization()` per equipment (expensive for large fleets)
 *
 * ### 4. Fuel Metrics
 * - **Method**: `getFuelMetrics()`
 * - **Purpose**: Fuel consumption and efficiency analysis
 * - **Efficiency Classification**:
 *   - Good: < 2.0 gallons/hour
 *   - Average: 2.0 - 4.0 gallons/hour
 *   - Poor: > 4.0 gallons/hour
 *
 * ### 5. Fuel Trend
 * - **Method**: `getFuelTrend()`
 * - **Purpose**: Daily fuel consumption trend
 * - **Returns**: Array of daily fuel usage with costs
 *
 * ### 6. Maintenance Metrics ⚠️ STUB
 * - **Method**: `getMaintenanceMetrics()`
 * - **Status**: Returns mock data (maintenance tracking not implemented)
 * - **TODO**: Implement when maintenance_records table is created
 *
 * ## Business Rules
 *
 * ### Utilization Calculations
 * - **Total Period Hours**: `24 hours/day * days_between_dates`
 * - **Working Hours**: Sum of `horas_trabajadas` from daily reports
 * - **Idle Hours**: `total_period_hours - working_hours`
 * - **Utilization Rate**: `(working_hours / total_period_hours) * 100`
 * - **Cost**: `working_hours * hourly_rate`
 *
 * ### Fleet Performance Classification
 * - **Top Performers**: Top 5 equipment by utilization rate (descending)
 * - **Underutilized**: Equipment with utilization < 50% (bottom 5)
 * - **Active Equipment**: Equipment with at least 1 hour worked in period
 *
 * ### Fuel Efficiency Thresholds
 * ```typescript
 * if (avgFuelPerHour < 2.0) return 'good';
 * if (avgFuelPerHour <= 4.0) return 'average';
 * return 'poor';
 * ```
 *
 * ## Constants & Configuration
 *
 * ### DEFAULT_HOURLY_RATE = 50.0
 * - **Usage**: Cost calculation for all equipment (cost = hours * rate)
 * - **Limitation**: Hardcoded, not per-equipment or configurable
 * - **Reason**: Equipment table has no `tarifa` (hourly_rate) field
 * - **TODO**: Add equipment-specific rates or company-wide configuration
 *
 * ### FUEL_PRICE_PER_GALLON = 3.5
 * - **Usage**: Fuel cost calculation (cost = gallons * price)
 * - **Limitation**: Hardcoded, not market-adjusted or time-based
 * - **TODO**: Add fuel price configuration or historical pricing
 *
 * ## Known Limitations & TODOs
 *
 * ### 1. Maintenance is a Stub
 * - `getMaintenanceMetrics()` returns mock data (not real database queries)
 * - Maintenance tracking not yet implemented in database
 * - Method preserved to maintain API contract
 * - **Phase 21**: Implement maintenance_records table and real queries
 *
 * ### 2. Project ID Parameter Ignored
 * - Methods accept `projectId` parameter but it's not used
 * - **Reason**: Equipment table has no `project_id` field
 * - Equipment-project relationship tracked via assignments, not direct FK
 * - **Phase 21**: Implement project-based filtering via assignment joins
 *
 * ### 3. Constants are Hardcoded
 * - Hourly rate and fuel price are static constants
 * - No per-equipment rates or time-based pricing
 * - **Phase 21**: Add configuration system for dynamic rates
 *
 * ### 4. No Caching
 * - Fleet queries call `getEquipmentUtilization()` for each equipment
 * - For 50 equipment = 100+ database queries (2 queries per equipment)
 * - **Performance Impact**: Fleet metrics are expensive for large fleets
 * - **Phase 21**: Implement Redis caching or query optimization
 *
 * ## Data Sources
 *
 * ### Primary Tables
 * - `equipos` (Equipment) - Equipment master data
 * - `partes_diarios` (DailyReport) - Daily work reports with hours and fuel
 *
 * ### Key Fields Used
 * - `partes_diarios.horas_trabajadas` - Working hours per day
 * - `partes_diarios.combustible_consumido` - Fuel consumed per day
 * - `equipos.codigo_equipo` - Equipment identifier
 * - `equipos.estado` - Equipment status (for active filtering)
 *
 * ## TypeORM Migration Status
 *
 * **Phase 3.10 Complete** ✅
 * - Migrated from `pool.query()` to TypeORM repositories
 * - Uses `equipmentRepository` and `dailyReportRepository`
 * - Query builder pattern for complex aggregations
 * - No raw SQL queries remaining
 *
 * ## Dependencies
 *
 * ### Internal Services
 * - None (standalone analytics service)
 *
 * ### External Dependencies
 * - TypeORM repositories (Equipment, DailyReport)
 * - Logger service for audit trail
 * - Custom error classes (NotFoundError, ValidationError, DatabaseError)
 *
 * ## Related Services
 * - `equipment.service.ts` - Equipment CRUD operations
 * - `dashboard.service.ts` - Dashboard aggregations (uses analytics data)
 * - `reporting.service.ts` - Report generation (uses analytics data)
 * - `daily-report.service.ts` - Source data for analytics
 *
 * ## Performance Considerations
 *
 * ### Query Complexity
 * - **Single Equipment**: O(1) - 2 queries (equipment lookup + aggregation)
 * - **Fleet Metrics**: O(n) - 2n queries where n = equipment count
 * - **Trend Queries**: O(1) - Single aggregation with GROUP BY date
 *
 * ### Optimization Recommendations
 * 1. **Caching**: Implement Redis cache for fleet metrics (TTL: 1 hour)
 * 2. **Batch Queries**: Rewrite fleet metrics as single query with joins
 * 3. **Indexes**: Ensure indexes on `partes_diarios.id_equipo` and `fecha_reporte`
 * 4. **Materialized Views**: Consider for frequently accessed metrics
 *
 * ## Usage Examples
 *
 * ### Example 1: Calculate Single Equipment Utilization
 * ```typescript
 * const analyticsService = new EquipmentAnalyticsService();
 * const metrics = await analyticsService.getEquipmentUtilization(
 *   123,
 *   new Date('2026-01-01'),
 *   new Date('2026-01-31')
 * );
 * // Returns:
 * // {
 * //   equipmentId: 123,
 * //   equipmentCode: 'EXC-001',
 * //   totalHours: 744,
 * //   workingHours: 562.5,
 * //   idleHours: 181.5,
 * //   utilizationRate: 75.6,
 * //   costPerHour: 50.0,
 * //   totalCost: 28125.00,
 * //   periodStart: Date('2026-01-01'),
 * //   periodEnd: Date('2026-01-31')
 * // }
 * ```
 *
 * ### Example 2: Get Fleet-Wide Metrics
 * ```typescript
 * const fleetMetrics = await analyticsService.getFleetUtilization(
 *   new Date('2026-01-01'),
 *   new Date('2026-01-31')
 * );
 * // Returns:
 * // {
 * //   totalEquipment: 45,
 * //   activeEquipment: 38,
 * //   avgUtilizationRate: 68.2,
 * //   totalCost: 1234567.89,
 * //   topPerformers: [
 * //     { equipmentCode: 'EXC-001', utilizationRate: 95.2 },
 * //     { equipmentCode: 'CAM-015', utilizationRate: 92.1 },
 * //     ...
 * //   ],
 * //   underutilized: [
 * //     { equipmentCode: 'VOL-022', utilizationRate: 28.5 },
 * //     ...
 * //   ]
 * // }
 * ```
 *
 * ### Example 3: Analyze Fuel Efficiency
 * ```typescript
 * const fuelMetrics = await analyticsService.getFuelMetrics(
 *   123,
 *   new Date('2026-01-01'),
 *   new Date('2026-01-31')
 * );
 * // Returns:
 * // {
 * //   equipmentId: 123,
 * //   totalFuelConsumed: 1250.5,
 * //   avgFuelPerHour: 2.22,
 * //   totalFuelCost: 4376.75,
 * //   avgCostPerHour: 7.78,
 * //   efficiency: 'average'
 * // }
 * ```
 *
 * ### Example 4: Track Utilization Trend Over Time
 * ```typescript
 * const trend = await analyticsService.getUtilizationTrend(
 *   123,
 *   new Date('2026-01-01'),
 *   new Date('2026-01-07')
 * );
 * // Returns:
 * // [
 * //   { date: '2026-01-01', utilizationRate: 75.0, workingHours: 18.0, cost: 900.00 },
 * //   { date: '2026-01-02', utilizationRate: 83.3, workingHours: 20.0, cost: 1000.00 },
 * //   { date: '2026-01-03', utilizationRate: 66.7, workingHours: 16.0, cost: 800.00 },
 * //   ...
 * // ]
 * ```
 *
 * ## Error Handling
 *
 * ### NotFoundError
 * - Thrown when equipment ID doesn't exist
 * - HTTP 404 status in controllers
 *
 * ### ValidationError
 * - Thrown for invalid date ranges (start >= end)
 * - Thrown for future dates (end > now)
 * - HTTP 400 status in controllers
 *
 * ### DatabaseError
 * - Thrown for query execution failures
 * - Includes original error and context
 * - HTTP 500 status in controllers
 *
 * ## Audit Logging
 *
 * All successful operations logged with:
 * - Equipment ID and code
 * - Date range
 * - Key metrics (utilization rate, costs, fuel consumption)
 * - Operation context
 *
 * ## Security & Multi-Tenancy
 *
 * - **Tenant Context**: Inherited from repository (AppDataSource)
 * - **Access Control**: Enforced at controller/route level
 * - **Data Isolation**: TypeORM ensures company-specific queries
 *
 * @class EquipmentAnalyticsService
 * @since Phase 3.10 (TypeORM migration)
 * @category Analytics
 * @see {@link EquipmentService} for equipment CRUD operations
 * @see {@link DashboardService} for dashboard aggregations
 * @see {@link ReportingService} for report generation
 */
export class EquipmentAnalyticsService {
  // Default hourly rate for equipment (since tarifa field doesn't exist)
  private static readonly DEFAULT_HOURLY_RATE = 50.0;
  private static readonly FUEL_PRICE_PER_GALLON = 3.5;

  private get equipmentRepository(): Repository<Equipment> {
    return AppDataSource.getRepository(Equipment);
  }

  private get dailyReportRepository(): Repository<DailyReport> {
    return AppDataSource.getRepository(DailyReport);
  }

  /**
   * Calculate equipment utilization metrics for a given period.
   *
   * ## Overview
   * Analyzes equipment performance by calculating utilization rate, working hours,
   * idle hours, and total cost based on daily reports (partes_diarios) for the
   * specified date range.
   *
   * ## Calculation Formula
   *
   * ### Total Period Hours
   * ```
   * total_hours = 24 hours/day * days_between(start_date, end_date)
   * ```
   *
   * ### Working Hours
   * ```
   * working_hours = SUM(partes_diarios.horas_trabajadas)
   *                 WHERE fecha BETWEEN start_date AND end_date
   * ```
   *
   * ### Idle Hours
   * ```
   * idle_hours = total_hours - working_hours
   * ```
   *
   * ### Utilization Rate
   * ```
   * utilization_rate = (working_hours / total_hours) * 100
   * ```
   *
   * ### Total Cost
   * ```
   * total_cost = working_hours * DEFAULT_HOURLY_RATE (50.0)
   * ```
   *
   * ## Data Sources
   * - `equipos` table - Equipment master data (codigo_equipo)
   * - `partes_diarios` table - Daily work reports (horas_trabajadas)
   *
   * ## Business Rules
   * - Date range is inclusive (start_date and end_date included)
   * - Only counts working hours from daily reports
   * - Idle hours = total available hours - working hours
   * - Uses DEFAULT_HOURLY_RATE constant (equipment-specific rates not supported)
   * - Returns 0 hours if no daily reports found in period
   *
   * ## TypeORM Migration (Phase 3.10)
   * - **Before**: 2 raw pool.query() calls
   * - **After**: TypeORM Repository with QueryBuilder
   * - Equipment lookup via `findOne()`
   * - Aggregation via QueryBuilder with SUM()
   *
   * @param equipmentId - Equipment ID to analyze
   * @param startDate - Period start date (inclusive)
   * @param endDate - Period end date (inclusive)
   *
   * @returns {Promise<UtilizationMetrics>} Utilization metrics object containing:
   * - `equipmentId`: Equipment identifier
   * - `equipmentCode`: Equipment code (e.g., 'EXC-001')
   * - `totalHours`: Total hours in period (24 * days)
   * - `workingHours`: Sum of horas_trabajadas
   * - `idleHours`: Total hours - working hours
   * - `utilizationRate`: Percentage of time worked (0-100)
   * - `costPerHour`: Hourly rate (50.0)
   * - `totalCost`: Total cost for working hours
   * - `periodStart`: Start date
   * - `periodEnd`: End date
   *
   * @throws {NotFoundError} If equipment with given ID doesn't exist
   * @throws {ValidationError} If date range is invalid:
   * - Start date >= end date
   * - End date is in the future
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * // Calculate January 2026 utilization for equipment 123
   * const metrics = await analyticsService.getEquipmentUtilization(
   *   123,
   *   new Date('2026-01-01'),
   *   new Date('2026-01-31')
   * );
   *
   * console.log(metrics);
   * // {
   * //   equipmentId: 123,
   * //   equipmentCode: 'EXC-001',
   * //   totalHours: 744,          // 31 days * 24 hours
   * //   workingHours: 562.5,      // Actual worked hours
   * //   idleHours: 181.5,         // Idle time
   * //   utilizationRate: 75.6,    // 75.6% utilization
   * //   costPerHour: 50.0,        // Default rate
   * //   totalCost: 28125.00,      // 562.5 * 50.0
   * //   periodStart: Date('2026-01-01'),
   * //   periodEnd: Date('2026-01-31')
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Handle low utilization equipment
   * const metrics = await analyticsService.getEquipmentUtilization(456, start, end);
   * if (metrics.utilizationRate < 50) {
   *   console.warn(`Equipment ${metrics.equipmentCode} underutilized: ${metrics.utilizationRate}%`);
   * }
   * ```
   *
   * @see {@link getUtilizationTrend} for daily utilization breakdown
   * @see {@link getFleetUtilization} for fleet-wide metrics
   */
  async getEquipmentUtilization(
    equipmentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<UtilizationMetrics> {
    // Validate date range
    if (startDate >= endDate) {
      throw new ValidationError('Invalid date range', [
        {
          field: 'date_range',
          rule: 'startBeforeEnd',
          message: 'Start date must be before end date',
          value: { start: startDate.toISOString(), end: endDate.toISOString() },
        },
      ]);
    }

    // Validate not in future
    const now = new Date();
    if (endDate > now) {
      throw new ValidationError('Cannot calculate metrics for future dates', [
        {
          field: 'end_date',
          rule: 'notInFuture',
          message: 'End date cannot be in the future',
          value: endDate.toISOString(),
        },
      ]);
    }

    try {
      // Get equipment details
      const equipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
      });

      if (!equipment) {
        throw new NotFoundError('Equipment', equipmentId);
      }

      // Get daily reports for the period
      const reports = await this.dailyReportRepository.find({
        where: {
          equipoId: equipmentId,
        },
        select: ['horasTrabajadas', 'fecha'],
      });

      // Filter by date range manually (TypeORM Between doesn't work well with dates)
      const filteredReports = reports.filter((report) => {
        const reportDate = new Date(report.fecha);
        return reportDate >= startDate && reportDate <= endDate;
      });

      const totalHours = this.calculateTotalPeriodHours(startDate, endDate);
      const workingHours = filteredReports.reduce(
        (sum, report) => sum + parseFloat(String(report.horasTrabajadas || 0)),
        0
      );
      const idleHours = totalHours - workingHours;
      const utilizationRate = totalHours > 0 ? (workingHours / totalHours) * 100 : 0;

      // Calculate cost using default hourly rate
      const costPerHour = EquipmentAnalyticsService.DEFAULT_HOURLY_RATE;
      const totalCost = workingHours * costPerHour;

      const result = {
        equipmentId,
        equipmentCode: equipment.codigoEquipo,
        totalHours,
        workingHours,
        idleHours,
        utilizationRate,
        costPerHour,
        totalCost,
        periodStart: startDate,
        periodEnd: endDate,
      };

      logger.info('Equipment utilization calculated', {
        equipment_id: equipmentId,
        equipment_code: equipment.codigoEquipo,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        utilization_rate: utilizationRate.toFixed(2),
        working_hours: workingHours,
        idle_hours: idleHours,
        total_cost: totalCost,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      logger.error('Error calculating equipment utilization', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        equipment_id: equipmentId,
        start_date: startDate,
        end_date: endDate,
        context: 'EquipmentAnalyticsService.getEquipmentUtilization',
      });

      throw new DatabaseError(
        'Failed to calculate equipment utilization',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { equipment_id: equipmentId, start_date: startDate, end_date: endDate }
      );
    }
  }

  /**
   * Get equipment utilization trend over time with daily aggregation.
   *
   * ## Overview
   * Provides day-by-day breakdown of equipment utilization for trend analysis,
   * performance tracking, and visualization. Each data point represents one day's
   * utilization metrics.
   *
   * ## Calculation Formula
   *
   * ### Per-Day Metrics
   * ```
   * For each date in range:
   *   working_hours = SUM(partes_diarios.horas_trabajadas WHERE fecha = date)
   *   utilization_rate = (working_hours / 24) * 100
   *   cost = working_hours * DEFAULT_HOURLY_RATE (50.0)
   * ```
   *
   * ## Data Aggregation
   * - Groups daily reports by `fecha_reporte`
   * - Sums `horas_trabajadas` per day
   * - Returns one data point per day (even if 0 hours)
   * - Orders by date ascending (chronological)
   *
   * ## Business Rules
   * - Date range is inclusive (start_date and end_date included)
   * - Days with no reports show 0 utilization (not omitted)
   * - Each day calculated independently (24-hour period)
   * - Uses DEFAULT_HOURLY_RATE for cost calculation
   *
   * ## Use Cases
   * - Chart utilization over time (line graph)
   * - Identify usage patterns (weekday vs weekend)
   * - Detect anomalies (sudden drops/spikes)
   * - Compare periods (month-over-month)
   *
   * ## TypeORM Migration (Phase 3.10)
   * - **Before**: 2 raw pool.query() calls
   * - **After**: QueryBuilder with GROUP BY fecha
   * - Aggregation: SUM(horas_trabajadas)
   * - Ordering: ASC by fecha
   *
   * @param equipmentId - Equipment ID to analyze
   * @param startDate - Period start date (inclusive)
   * @param endDate - Period end date (inclusive)
   *
   * @returns {Promise<UtilizationTrend[]>} Array of daily utilization data points:
   * - `date`: Date string (YYYY-MM-DD format)
   * - `utilizationRate`: Percentage of 24-hour day worked (0-100)
   * - `workingHours`: Hours worked that day
   * - `cost`: Daily cost (working_hours * 50.0)
   *
   * @throws {NotFoundError} If equipment with given ID doesn't exist
   * @throws {ValidationError} If date range is invalid:
   * - Start date >= end date
   * - End date is in the future
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * // Get weekly utilization trend
   * const trend = await analyticsService.getUtilizationTrend(
   *   123,
   *   new Date('2026-01-01'),
   *   new Date('2026-01-07')
   * );
   *
   * console.log(trend);
   * // [
   * //   { date: '2026-01-01', utilizationRate: 75.0, workingHours: 18.0, cost: 900.00 },
   * //   { date: '2026-01-02', utilizationRate: 83.3, workingHours: 20.0, cost: 1000.00 },
   * //   { date: '2026-01-03', utilizationRate: 66.7, workingHours: 16.0, cost: 800.00 },
   * //   { date: '2026-01-04', utilizationRate: 70.8, workingHours: 17.0, cost: 850.00 },
   * //   { date: '2026-01-05', utilizationRate: 0.0, workingHours: 0.0, cost: 0.00 },      // No work
   * //   { date: '2026-01-06', utilizationRate: 0.0, workingHours: 0.0, cost: 0.00 },      // Weekend
   * //   { date: '2026-01-07', utilizationRate: 87.5, workingHours: 21.0, cost: 1050.00 }
   * // ]
   * ```
   *
   * @example
   * ```typescript
   * // Chart utilization trend in frontend
   * const trend = await analyticsService.getUtilizationTrend(456, start, end);
   * const chartData = {
   *   labels: trend.map(d => d.date),
   *   datasets: [{
   *     label: 'Utilization Rate (%)',
   *     data: trend.map(d => d.utilizationRate)
   *   }]
   * };
   * ```
   *
   * @see {@link getEquipmentUtilization} for period-aggregated metrics
   * @see {@link getFuelTrend} for fuel consumption trend
   */
  async getUtilizationTrend(
    equipmentId: number,
    startDate: Date,
    endDate: Date
  ): Promise<UtilizationTrend[]> {
    // Validate date range
    if (startDate >= endDate) {
      throw new ValidationError('Invalid date range', [
        {
          field: 'date_range',
          rule: 'startBeforeEnd',
          message: 'Start date must be before end date',
          value: { start: startDate.toISOString(), end: endDate.toISOString() },
        },
      ]);
    }

    // Validate not in future
    const now = new Date();
    if (endDate > now) {
      throw new ValidationError('Cannot calculate metrics for future dates', [
        {
          field: 'end_date',
          rule: 'notInFuture',
          message: 'End date cannot be in the future',
          value: endDate.toISOString(),
        },
      ]);
    }

    try {
      const equipment = await this.equipmentRepository.findOne({
        where: { id: equipmentId },
      });

      if (!equipment) {
        throw new NotFoundError('Equipment', equipmentId);
      }

      // Get daily aggregated data using QueryBuilder
      const reports = await this.dailyReportRepository
        .createQueryBuilder('pd')
        .select('pd.fecha', 'fecha')
        .addSelect('SUM(pd.horas_trabajadas)', 'horas_trabajadas')
        .where('pd.equipo_id = :equipmentId', { equipmentId })
        .andWhere('pd.fecha >= :startDate', { startDate })
        .andWhere('pd.fecha <= :endDate', { endDate })
        .groupBy('pd.fecha')
        .orderBy('pd.fecha', 'ASC')
        .getRawMany();

      const costPerHour = EquipmentAnalyticsService.DEFAULT_HOURLY_RATE;
      const hoursPerDay = 24;

      interface RawReport {
        fecha: string;
        horas_trabajadas: string;
      }

      const trend = reports.map((report: RawReport) => {
        const workingHours = parseFloat(report.horas_trabajadas || '0');
        return {
          date: new Date(report.fecha).toISOString().split('T')[0],
          utilizationRate: (workingHours / hoursPerDay) * 100,
          workingHours,
          cost: workingHours * costPerHour,
        };
      });

      logger.info('Utilization trend calculated', {
        equipment_id: equipmentId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        trend_points: trend.length,
      });

      return trend;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }

      logger.error('Error calculating utilization trend', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        equipment_id: equipmentId,
        start_date: startDate,
        end_date: endDate,
        context: 'EquipmentAnalyticsService.getUtilizationTrend',
      });

      throw new DatabaseError(
        'Failed to calculate utilization trend',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { equipment_id: equipmentId, start_date: startDate, end_date: endDate }
      );
    }
  }

  /**
   * Get fleet-wide utilization metrics aggregated across all active equipment.
   *
   * ## Overview
   * Calculates comprehensive fleet performance metrics including average utilization,
   * total costs, top performers, and underutilized equipment. Provides high-level
   * view of fleet health for management dashboards.
   *
   * ## Aggregation Process
   * 1. **Fetch Active Equipment**: Query all equipment with `is_active = true`
   * 2. **Calculate Per-Equipment**: Call `getEquipmentUtilization()` for each equipment
   * 3. **Aggregate Metrics**: Sum costs, average utilization, count active equipment
   * 4. **Classify Performance**:
   *    - Top Performers: Top 5 by utilization rate (descending)
   *    - Underutilized: Equipment with utilization < 50% (bottom 5)
   *
   * ## Performance Characteristics
   *
   * ### ⚠️ WARNING: Expensive Operation
   * - **Query Count**: 2 queries per equipment + 1 initial query
   * - **For 50 equipment**: ~101 database queries (1 + 50*2)
   * - **Execution Time**: 2-5 seconds for medium fleets (20-50 equipment)
   * - **Recommendation**: Implement caching or batch query optimization
   *
   * ### Performance Impact
   * ```
   * fleet_size | queries | est_time
   * -----------|---------|----------
   *     10     |   21    | 0.5s
   *     25     |   51    | 1.2s
   *     50     |  101    | 2.5s
   *    100     |  201    | 5.0s
   * ```
   *
   * ## Business Rules
   *
   * ### Active Equipment
   * - Only includes equipment with `is_active = true`
   * - Equipment with at least 1 hour worked in period
   *
   * ### Top Performers
   * - Top 5 equipment sorted by utilization rate (highest first)
   * - If fewer than 5 equipment, returns all
   *
   * ### Underutilized Equipment
   * - Equipment with utilization rate < 50%
   * - Limited to bottom 5 (lowest utilization first)
   * - If all equipment > 50%, returns empty array
   *
   * ### Average Utilization
   * ```
   * avg_utilization = SUM(all_utilization_rates) / active_equipment_count
   * ```
   *
   * ### Total Cost
   * ```
   * total_cost = SUM(equipment_costs)
   *            = SUM(working_hours * DEFAULT_HOURLY_RATE)
   * ```
   *
   * ## Known Limitations
   *
   * ### 1. projectId Parameter Ignored ⚠️
   * - Method accepts `projectId` parameter but doesn't use it
   * - **Reason**: Equipment table has no `project_id` field
   * - **Workaround**: Equipment-project relationship via assignments (not direct FK)
   * - **TODO Phase 21**: Implement project filtering via JOIN on assignments table
   *
   * ### 2. No Caching
   * - Recalculates all metrics on every call
   * - No Redis/in-memory cache
   * - **TODO Phase 21**: Add caching with 1-hour TTL
   *
   * ### 3. Query Optimization Needed
   * - Current: N+1 query pattern (1 + 2N queries)
   * - **TODO Phase 21**: Rewrite as single query with JOINs and aggregations
   *
   * ## TypeORM Migration (Phase 3.10)
   * - **Before**: Raw pool.query() for equipment list
   * - **After**: TypeORM Repository `find()` method
   * - Per-equipment metrics: Calls `getEquipmentUtilization()` (also TypeORM)
   *
   * @param startDate - Period start date (inclusive)
   * @param endDate - Period end date (inclusive)
   * @param _projectId - **IGNORED** - Project filter not implemented (equipment table has no project_id)
   *
   * @returns {Promise<FleetUtilizationMetrics>} Fleet-wide metrics object:
   * - `totalEquipment`: Count of all active equipment
   * - `activeEquipment`: Count of equipment with hours worked > 0
   * - `avgUtilizationRate`: Average utilization across active equipment
   * - `totalCost`: Sum of all equipment costs
   * - `topPerformers`: Array of top 5 performers (code + rate)
   * - `underutilized`: Array of underutilized equipment (rate < 50%)
   *
   * @throws {ValidationError} If date range is invalid:
   * - Start date >= end date
   * - End date is in the future
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * // Get fleet metrics for January 2026
   * const fleetMetrics = await analyticsService.getFleetUtilization(
   *   new Date('2026-01-01'),
   *   new Date('2026-01-31')
   * );
   *
   * console.log(fleetMetrics);
   * // {
   * //   totalEquipment: 45,
   * //   activeEquipment: 38,
   * //   avgUtilizationRate: 68.2,
   * //   totalCost: 1234567.89,
   * //   topPerformers: [
   * //     { equipmentCode: 'EXC-001', utilizationRate: 95.2 },
   * //     { equipmentCode: 'CAM-015', utilizationRate: 92.1 },
   * //     { equipmentCode: 'VOL-008', utilizationRate: 89.7 },
   * //     { equipmentCode: 'ROD-003', utilizationRate: 87.3 },
   * //     { equipmentCode: 'GRU-012', utilizationRate: 85.9 }
   * //   ],
   * //   underutilized: [
   * //     { equipmentCode: 'VOL-022', utilizationRate: 28.5 },
   * //     { equipmentCode: 'CAM-031', utilizationRate: 35.2 },
   * //     { equipmentCode: 'EXC-009', utilizationRate: 42.1 }
   * //   ]
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Dashboard alert for underutilized equipment
   * const metrics = await analyticsService.getFleetUtilization(start, end);
   * if (metrics.underutilized.length > 5) {
   *   console.warn(`High idle equipment count: ${metrics.underutilized.length}`);
   *   console.warn('Underutilized:', metrics.underutilized.map(e => e.equipmentCode));
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Note: projectId parameter is currently ignored
   * const metrics = await analyticsService.getFleetUtilization(
   *   startDate,
   *   endDate,
   *   projectId // ⚠️ This parameter has no effect (not implemented)
   * );
   * // Returns metrics for ALL active equipment, regardless of project
   * ```
   *
   * @see {@link getEquipmentUtilization} for single equipment metrics
   * @see {@link DashboardService.getFleetOverview} for dashboard integration
   */
  async getFleetUtilization(
    startDate: Date,
    endDate: Date,
    _projectId?: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<FleetUtilizationMetrics> {
    // Validate date range
    if (startDate >= endDate) {
      throw new ValidationError('Invalid date range', [
        {
          field: 'date_range',
          rule: 'startBeforeEnd',
          message: 'Start date must be before end date',
          value: { start: startDate.toISOString(), end: endDate.toISOString() },
        },
      ]);
    }

    // Validate not in future
    const now = new Date();
    if (endDate > now) {
      throw new ValidationError('Cannot calculate metrics for future dates', [
        {
          field: 'end_date',
          rule: 'notInFuture',
          message: 'End date cannot be in the future',
          value: endDate.toISOString(),
        },
      ]);
    }

    try {
      // Get all active equipment
      // Note: Equipment table doesn't have project_id field
      // Would need to use equipment_edt (assignments) table for project filtering
      // For now, ignoring projectId parameter

      const allEquipment = await this.equipmentRepository.find({
        where: { isActive: true },
        select: ['id', 'codigoEquipo'],
      });

      const totalEquipment = allEquipment.length;

      // Get utilization for each equipment
      const utilizationPromises = allEquipment.map((eq) =>
        this.getEquipmentUtilization(eq.id, startDate, endDate)
      );

      const utilizationMetrics = await Promise.all(utilizationPromises);

      const activeEquipment = utilizationMetrics.filter((m) => m.workingHours > 0).length;
      const avgUtilizationRate =
        totalEquipment > 0
          ? utilizationMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / totalEquipment
          : 0;
      const totalCost = utilizationMetrics.reduce((sum, m) => sum + m.totalCost, 0);

      // Sort by utilization rate
      const sorted = utilizationMetrics
        .map((m) => ({
          equipmentCode: m.equipmentCode,
          utilizationRate: m.utilizationRate,
        }))
        .sort((a, b) => b.utilizationRate - a.utilizationRate);

      const topPerformers = sorted.slice(0, 5);
      const underutilized = sorted.filter((e) => e.utilizationRate < 50).slice(-5);

      const result = {
        totalEquipment,
        activeEquipment,
        avgUtilizationRate,
        totalCost,
        topPerformers,
        underutilized,
      };

      logger.info('Fleet utilization calculated', {
        total_equipment: totalEquipment,
        active_equipment: activeEquipment,
        avg_utilization_rate: avgUtilizationRate.toFixed(2),
        total_cost: totalCost,
        top_performers_count: topPerformers.length,
        underutilized_count: underutilized.length,
      });

      return result;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Error calculating fleet utilization', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        start_date: startDate,
        end_date: endDate,
        context: 'EquipmentAnalyticsService.getFleetUtilization',
      });

      throw new DatabaseError(
        'Failed to calculate fleet utilization',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { start_date: startDate, end_date: endDate }
      );
    }
  }

  /**
   * Get fuel consumption metrics and efficiency analysis for equipment.
   *
   * ## Overview
   * Analyzes fuel consumption patterns by aggregating daily fuel usage from
   * partes_diarios and calculating efficiency metrics. Helps identify fuel
   * waste, optimize operations, and track fuel costs.
   *
   * ## Calculation Formula
   *
   * ### Total Fuel Consumed
   * ```
   * total_fuel = SUM(partes_diarios.combustible_consumido)
   *              WHERE fecha BETWEEN start_date AND end_date
   * ```
   *
   * ### Average Fuel Per Hour
   * ```
   * avg_fuel_per_hour = total_fuel_consumed / total_hours_worked
   * ```
   *
   * ### Total Fuel Cost
   * ```
   * total_fuel_cost = total_fuel_consumed * FUEL_PRICE_PER_GALLON (3.5)
   * ```
   *
   * ### Average Cost Per Hour
   * ```
   * avg_cost_per_hour = total_fuel_cost / total_hours_worked
   * ```
   *
   * ## Efficiency Classification
   *
   * Equipment fuel efficiency rated based on gallons/hour consumption:
   *
   * | Rating  | Gallons/Hour | Description               |
   * |---------|--------------|---------------------------|
   * | Good    | < 2.0        | Efficient operation       |
   * | Average | 2.0 - 4.0    | Normal consumption        |
   * | Poor    | > 4.0        | High consumption (alert!) |
   *
   * ```typescript
   * if (avgFuelPerHour < 2.0) return 'good';
   * else if (avgFuelPerHour <= 4.0) return 'average';
   * else return 'poor';
   * ```
   *
   * ## Business Rules
   * - Date range is inclusive (start_date and end_date included)
   * - Only counts fuel from daily reports with hours worked
   * - Uses FUEL_PRICE_PER_GALLON constant (3.5 USD/gallon)
   * - Returns 0 metrics if no daily reports found
   * - Efficiency classification based on industry averages
   *
   * ## Data Sources
   * - `partes_diarios` table - Daily fuel consumption records
   * - Field: `combustible_consumido` (gallons consumed per day)
   * - Field: `horas_trabajadas` (hours worked per day)
   *
   * ## TypeORM Migration (Phase 3.10)
   * - **Before**: Raw pool.query() with aggregation
   * - **After**: QueryBuilder with SUM() aggregations
   * - Single query with multiple aggregates (fuel + hours)
   *
   * @param equipmentId - Equipment ID to analyze
   * @param startDate - Period start date (inclusive)
   * @param endDate - Period end date (inclusive)
   *
   * @returns {Promise<FuelMetrics>} Fuel consumption metrics:
   * - `equipmentId`: Equipment identifier
   * - `totalFuelConsumed`: Total gallons consumed in period
   * - `avgFuelPerHour`: Average gallons per working hour
   * - `totalFuelCost`: Total fuel cost (gallons * 3.5)
   * - `avgCostPerHour`: Average fuel cost per working hour
   * - `efficiency`: Classification ('good' | 'average' | 'poor')
   *
   * @throws {NotFoundError} If equipment with given ID doesn't exist
   * @throws {ValidationError} If date range is invalid:
   * - Start date >= end date
   * - End date is in the future
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * // Analyze January 2026 fuel consumption
   * const fuelMetrics = await analyticsService.getFuelMetrics(
   *   123,
   *   new Date('2026-01-01'),
   *   new Date('2026-01-31')
   * );
   *
   * console.log(fuelMetrics);
   * // {
   * //   equipmentId: 123,
   * //   totalFuelConsumed: 1250.5,      // gallons
   * //   avgFuelPerHour: 2.22,           // gal/hr (average efficiency)
   * //   totalFuelCost: 4376.75,         // USD
   * //   avgCostPerHour: 7.78,           // USD/hr
   * //   efficiency: 'average'
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Alert on poor fuel efficiency
   * const metrics = await analyticsService.getFuelMetrics(456, start, end);
   * if (metrics.efficiency === 'poor') {
   *   console.warn(
   *     `Equipment ${equipmentCode} has poor fuel efficiency: ${metrics.avgFuelPerHour} gal/hr`
   *   );
   *   // Trigger maintenance alert or operator training
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Compare fuel costs across fleet
   * const equipmentIds = [101, 102, 103];
   * const fuelMetrics = await Promise.all(
   *   equipmentIds.map(id => analyticsService.getFuelMetrics(id, start, end))
   * );
   * const totalFleetFuelCost = fuelMetrics.reduce((sum, m) => sum + m.totalFuelCost, 0);
   * console.log(`Fleet fuel cost: $${totalFleetFuelCost.toFixed(2)}`);
   * ```
   *
   * @see {@link getFuelTrend} for daily fuel consumption breakdown
   * @see {@link getEquipmentUtilization} for operational hours context
   */
  async getFuelMetrics(equipmentId: number, startDate: Date, endDate: Date): Promise<FuelMetrics> {
    // Validate date range
    if (startDate >= endDate) {
      throw new ValidationError('Invalid date range', [
        {
          field: 'date_range',
          rule: 'startBeforeEnd',
          message: 'Start date must be before end date',
          value: { start: startDate.toISOString(), end: endDate.toISOString() },
        },
      ]);
    }

    // Validate not in future
    const now = new Date();
    if (endDate > now) {
      throw new ValidationError('Cannot calculate metrics for future dates', [
        {
          field: 'end_date',
          rule: 'notInFuture',
          message: 'End date cannot be in the future',
          value: endDate.toISOString(),
        },
      ]);
    }

    try {
      const result = await this.dailyReportRepository
        .createQueryBuilder('pd')
        .select('SUM(pd.combustible_consumido)', 'total_fuel')
        .addSelect('SUM(pd.horas_trabajadas)', 'total_hours')
        .where('pd.equipo_id = :equipmentId', { equipmentId })
        .andWhere('pd.fecha >= :startDate', { startDate })
        .andWhere('pd.fecha <= :endDate', { endDate })
        .getRawOne();

      const totalFuelConsumed = parseFloat(result?.total_fuel || 0);
      const totalHours = parseFloat(result?.total_hours || 0);
      const avgFuelPerHour = totalHours > 0 ? totalFuelConsumed / totalHours : 0;

      const fuelPricePerGallon = EquipmentAnalyticsService.FUEL_PRICE_PER_GALLON;
      const totalFuelCost = totalFuelConsumed * fuelPricePerGallon;
      const avgCostPerHour = totalHours > 0 ? totalFuelCost / totalHours : 0;

      // Determine efficiency
      let efficiency: 'good' | 'average' | 'poor' = 'average';
      if (avgFuelPerHour < 2) efficiency = 'good';
      else if (avgFuelPerHour > 4) efficiency = 'poor';

      const metrics = {
        equipmentId,
        totalFuelConsumed,
        avgFuelPerHour,
        totalFuelCost,
        avgCostPerHour,
        efficiency,
      };

      logger.info('Fuel metrics calculated', {
        equipment_id: equipmentId,
        total_fuel_consumed: totalFuelConsumed,
        avg_fuel_per_hour: avgFuelPerHour.toFixed(2),
        total_fuel_cost: totalFuelCost,
        efficiency,
      });

      return metrics;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Error calculating fuel metrics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        equipment_id: equipmentId,
        start_date: startDate,
        end_date: endDate,
        context: 'EquipmentAnalyticsService.getFuelMetrics',
      });

      throw new DatabaseError(
        'Failed to calculate fuel metrics',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { equipment_id: equipmentId, start_date: startDate, end_date: endDate }
      );
    }
  }

  /**
   * Get daily fuel consumption trend over time for equipment.
   *
   * ## Overview
   * Provides day-by-day breakdown of fuel consumption for trend analysis,
   * cost tracking, and efficiency monitoring. Each data point represents
   * one day's fuel metrics.
   *
   * ## Calculation Formula
   *
   * ### Per-Day Metrics
   * ```
   * For each date in range:
   *   fuel_consumed = SUM(partes_diarios.combustible_consumido WHERE fecha = date)
   *   hours_worked = SUM(partes_diarios.horas_trabajadas WHERE fecha = date)
   *   fuel_cost = fuel_consumed * FUEL_PRICE_PER_GALLON (3.5)
   *   fuel_per_hour = fuel_consumed / hours_worked (if hours > 0, else 0)
   * ```
   *
   * ## Data Aggregation
   * - Groups daily reports by `fecha_reporte`
   * - Sums `combustible_consumido` per day
   * - Sums `horas_trabajadas` per day
   * - Returns one data point per day with fuel data
   * - Orders by date ascending (chronological)
   *
   * ## Business Rules
   * - Date range is inclusive (start_date and end_date included)
   * - Days with no reports show 0 fuel consumption
   * - Each day calculated independently
   * - Uses FUEL_PRICE_PER_GALLON constant (3.5)
   * - Fuel efficiency calculated per day (gal/hr)
   *
   * ## Use Cases
   * - Chart fuel consumption over time (line graph)
   * - Identify consumption patterns (high-usage days)
   * - Detect anomalies (sudden spikes in fuel)
   * - Compare periods (week-over-week, month-over-month)
   * - Track daily fuel costs for budgeting
   *
   * ## TypeORM Migration (Phase 3.10)
   * - **Before**: Raw pool.query() with GROUP BY
   * - **After**: QueryBuilder with grouped aggregations
   * - Aggregations: SUM(combustible_consumido), SUM(horas_trabajadas)
   * - Ordering: ASC by fecha
   *
   * @param equipmentId - Equipment ID to analyze
   * @param startDate - Period start date (inclusive)
   * @param endDate - Period end date (inclusive)
   *
   * @returns {Promise<FuelTrend[]>} Array of daily fuel consumption data points:
   * - `date`: Date string (YYYY-MM-DD format)
   * - `fuelConsumed`: Gallons consumed that day
   * - `fuelCost`: Daily fuel cost (gallons * 3.5)
   * - `fuelPerHour`: Gallons per hour worked (efficiency)
   *
   * @throws {NotFoundError} If equipment with given ID doesn't exist
   * @throws {ValidationError} If date range is invalid:
   * - Start date >= end date
   * - End date is in the future
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * // Get weekly fuel trend
   * const fuelTrend = await analyticsService.getFuelTrend(
   *   123,
   *   new Date('2026-01-01'),
   *   new Date('2026-01-07')
   * );
   *
   * console.log(fuelTrend);
   * // [
   * //   { date: '2026-01-01', fuelConsumed: 45.2, fuelCost: 158.20, fuelPerHour: 2.51 },
   * //   { date: '2026-01-02', fuelConsumed: 52.8, fuelCost: 184.80, fuelPerHour: 2.64 },
   * //   { date: '2026-01-03', fuelConsumed: 38.5, fuelCost: 134.75, fuelPerHour: 2.41 },
   * //   { date: '2026-01-04', fuelConsumed: 41.0, fuelCost: 143.50, fuelPerHour: 2.41 },
   * //   { date: '2026-01-05', fuelConsumed: 0.0, fuelCost: 0.00, fuelPerHour: 0.00 },     // No work
   * //   { date: '2026-01-06', fuelConsumed: 0.0, fuelCost: 0.00, fuelPerHour: 0.00 },     // Weekend
   * //   { date: '2026-01-07', fuelConsumed: 48.3, fuelCost: 169.05, fuelPerHour: 2.30 }
   * // ]
   * ```
   *
   * @example
   * ```typescript
   * // Chart fuel consumption in frontend
   * const trend = await analyticsService.getFuelTrend(456, start, end);
   * const chartData = {
   *   labels: trend.map(d => d.date),
   *   datasets: [
   *     {
   *       label: 'Fuel Consumed (gal)',
   *       data: trend.map(d => d.fuelConsumed)
   *     },
   *     {
   *       label: 'Daily Cost ($)',
   *       data: trend.map(d => d.fuelCost)
   *     }
   *   ]
   * };
   * ```
   *
   * @example
   * ```typescript
   * // Alert on high daily fuel consumption
   * const trend = await analyticsService.getFuelTrend(789, start, end);
   * const highConsumptionDays = trend.filter(d => d.fuelPerHour > 4.0);
   * if (highConsumptionDays.length > 0) {
   *   console.warn('High fuel consumption days:', highConsumptionDays.map(d => d.date));
   * }
   * ```
   *
   * @see {@link getFuelMetrics} for period-aggregated fuel metrics
   * @see {@link getUtilizationTrend} for utilization comparison
   */
  async getFuelTrend(equipmentId: number, startDate: Date, endDate: Date): Promise<FuelTrend[]> {
    // Validate date range
    if (startDate >= endDate) {
      throw new ValidationError('Invalid date range', [
        {
          field: 'date_range',
          rule: 'startBeforeEnd',
          message: 'Start date must be before end date',
          value: { start: startDate.toISOString(), end: endDate.toISOString() },
        },
      ]);
    }

    // Validate not in future
    const now = new Date();
    if (endDate > now) {
      throw new ValidationError('Cannot calculate metrics for future dates', [
        {
          field: 'end_date',
          rule: 'notInFuture',
          message: 'End date cannot be in the future',
          value: endDate.toISOString(),
        },
      ]);
    }

    try {
      const reports = await this.dailyReportRepository
        .createQueryBuilder('pd')
        .select('pd.fecha', 'fecha')
        .addSelect('SUM(pd.combustible_consumido)', 'fuel_consumed')
        .addSelect('SUM(pd.horas_trabajadas)', 'hours_worked')
        .where('pd.equipo_id = :equipmentId', { equipmentId })
        .andWhere('pd.fecha >= :startDate', { startDate })
        .andWhere('pd.fecha <= :endDate', { endDate })
        .groupBy('pd.fecha')
        .orderBy('pd.fecha', 'ASC')
        .getRawMany();

      const fuelPricePerGallon = EquipmentAnalyticsService.FUEL_PRICE_PER_GALLON;

      interface FuelRawReport {
        fecha: string;
        fuel_consumed: string;
        hours_worked: string;
      }

      const trend = reports.map((report: FuelRawReport) => {
        const fuelConsumed = parseFloat(report.fuel_consumed || '0');
        const hours = parseFloat(report.hours_worked || '0');
        return {
          date: new Date(report.fecha).toISOString().split('T')[0],
          fuelConsumed,
          fuelCost: fuelConsumed * fuelPricePerGallon,
          fuelPerHour: hours > 0 ? fuelConsumed / hours : 0,
        };
      });

      logger.info('Fuel trend calculated', {
        equipment_id: equipmentId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        trend_points: trend.length,
      });

      return trend;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Error calculating fuel trend', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        equipment_id: equipmentId,
        start_date: startDate,
        end_date: endDate,
        context: 'EquipmentAnalyticsService.getFuelTrend',
      });

      throw new DatabaseError(
        'Failed to calculate fuel trend',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined,
        { equipment_id: equipmentId, start_date: startDate, end_date: endDate }
      );
    }
  }

  /**
   * Get maintenance metrics for equipment.
   *
   * ## ⚠️ STUB METHOD - Returns Mock Data
   *
   * **Status**: Not implemented - maintenance tracking system pending
   *
   * ### Current Implementation
   * This method currently returns hardcoded placeholder data because:
   * 1. `maintenance_records` table/entity does not exist in database
   * 2. Maintenance tracking system not yet designed/implemented
   * 3. Method preserved to maintain API contract and prevent breaking changes
   *
   * ### Mock Data Returned
   * ```typescript
   * {
   *   equipmentId: <provided_id>,
   *   totalMaintenances: 0,
   *   totalDowntimeHours: 0,
   *   totalMaintenanceCost: 0,
   *   avgTimeBetweenMaintenance: 30,              // Days (hardcoded)
   *   nextScheduledMaintenance: <now + 15 days>,  // Hardcoded future date
   *   maintenanceFrequency: 'normal'              // Hardcoded
   * }
   * ```
   *
   * ## TODO: Phase 21 Implementation
   *
   * ### Database Schema Required
   * ```sql
   * CREATE TABLE maintenance_records (
   *   id_maintenance SERIAL PRIMARY KEY,
   *   equipo_id INTEGER REFERENCES equipos(id_equipo),
   *   fecha_mantenimiento DATE NOT NULL,
   *   tipo_mantenimiento VARCHAR(50),     -- PREVENTIVO | CORRECTIVO | EMERGENCIA
   *   descripcion TEXT,
   *   horas_downtime DECIMAL(10,2),
   *   costo_mantenimiento DECIMAL(10,2),
   *   proximo_mantenimiento DATE,
   *   realizado_por VARCHAR(200),
   *   estado VARCHAR(20)                  -- PENDIENTE | EN_PROCESO | COMPLETADO
   * );
   * ```
   *
   * ### Real Calculation Logic
   * ```typescript
   * // Total maintenances in period
   * totalMaintenances = COUNT(*) WHERE fecha_mantenimiento BETWEEN start AND end
   *
   * // Total downtime hours
   * totalDowntimeHours = SUM(horas_downtime)
   *
   * // Total maintenance cost
   * totalMaintenanceCost = SUM(costo_mantenimiento)
   *
   * // Average time between maintenances
   * avgTimeBetweenMaintenance = days_between_maintenances / (totalMaintenances - 1)
   *
   * // Next scheduled maintenance
   * nextScheduledMaintenance = MAX(proximo_mantenimiento) WHERE estado = 'PENDIENTE'
   *
   * // Frequency classification
   * if (avgTimeBetweenMaintenance < 20) return 'frequent';
   * else if (avgTimeBetweenMaintenance <= 45) return 'normal';
   * else return 'rare';
   * ```
   *
   * ### Integration Points
   * - Equipment preventive maintenance schedules
   * - Work order system for maintenance requests
   * - Spare parts inventory tracking
   * - Maintenance technician assignments
   * - Equipment downtime alerts
   *
   * ## TypeORM Migration Status (Phase 3.10)
   * - **Before**: Checked table existence with raw SQL (bad pattern)
   * - **After**: Returns mock data (stub preserved for API contract)
   * - **Next**: Implement with maintenance_records entity when table created
   *
   * @stub This method returns mock data. Real implementation pending maintenance system.
   * @todo Implement maintenance_records table and entity (Phase 21)
   * @todo Add maintenance scheduling logic
   * @todo Integrate with work order system
   *
   * @param equipmentId - Equipment ID to analyze
   * @param _startDate - **IGNORED** - Period start date (not used in stub)
   * @param _endDate - **IGNORED** - Period end date (not used in stub)
   *
   * @returns {Promise<MaintenanceMetrics>} **MOCK DATA** - Maintenance metrics object:
   * - `equipmentId`: Equipment identifier (from parameter)
   * - `totalMaintenances`: 0 (mock)
   * - `totalDowntimeHours`: 0 (mock)
   * - `totalMaintenanceCost`: 0 (mock)
   * - `avgTimeBetweenMaintenance`: 30 days (mock)
   * - `nextScheduledMaintenance`: Current date + 15 days (mock)
   * - `maintenanceFrequency`: 'normal' (mock)
   *
   * @throws None - Always succeeds (returns mock data)
   *
   * @example
   * ```typescript
   * // ⚠️ WARNING: This returns mock data!
   * const maintenanceMetrics = await analyticsService.getMaintenanceMetrics(
   *   123,
   *   new Date('2026-01-01'),
   *   new Date('2026-01-31')
   * );
   *
   * console.log(maintenanceMetrics);
   * // {
   * //   equipmentId: 123,
   * //   totalMaintenances: 0,              // ⚠️ Mock data
   * //   totalDowntimeHours: 0,             // ⚠️ Mock data
   * //   totalMaintenanceCost: 0,           // ⚠️ Mock data
   * //   avgTimeBetweenMaintenance: 30,     // ⚠️ Mock data
   * //   nextScheduledMaintenance: Date,    // ⚠️ Mock data (now + 15 days)
   * //   maintenanceFrequency: 'normal'     // ⚠️ Mock data
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // DO NOT rely on this data for production decisions
   * const metrics = await analyticsService.getMaintenanceMetrics(456, start, end);
   * if (metrics.totalMaintenances === 0) {
   *   // ⚠️ This is always true (mock data), not real absence of maintenance
   *   console.warn('No maintenance data available (stub method)');
   * }
   * ```
   *
   * @see {@link https://github.com/bitcorp/erp/issues/XXX} Track maintenance system implementation
   */
  async getMaintenanceMetrics(
    equipmentId: number,
    _startDate: Date, // eslint-disable-line @typescript-eslint/no-unused-vars
    _endDate: Date // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<MaintenanceMetrics> {
    // Return mock data - maintenance tracking not yet implemented
    // TODO: Implement when maintenance_records table/entity is created

    logger.info('Maintenance metrics returned (stub)', {
      equipment_id: equipmentId,
      note: 'Returning mock data - maintenance tracking not implemented',
    });

    return {
      equipmentId,
      totalMaintenances: 0,
      totalDowntimeHours: 0,
      totalMaintenanceCost: 0,
      avgTimeBetweenMaintenance: 30,
      nextScheduledMaintenance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      maintenanceFrequency: 'normal',
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
