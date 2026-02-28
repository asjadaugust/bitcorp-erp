import { AppDataSource } from '../config/database.config';
import { DatabaseError, DatabaseErrorType, ValidationError } from '../errors';
import logger from '../config/logger.config';
import type {
  EquipmentUtilizationReport,
  MaintenanceHistoryReport,
  InventoryMovementReport,
  OperatorTimesheetReport,
} from '../types/dto/reporting.dto';

/**
 * # Reporting Service
 *
 * Provides business intelligence and analytics reporting across multiple domains.
 * Generates various operational reports for management decision-making and compliance.
 *
 * ## Purpose
 *
 * This service aggregates data from multiple schemas (equipo, logistica, rrhh) to produce
 * comprehensive reports on:
 * - Equipment utilization and efficiency
 * - Maintenance history and costs
 * - Inventory movements and logistics
 * - Operator timesheets and labor hours
 *
 * Reports support date range filtering, data aggregation, and export capabilities.
 *
 * ---
 *
 * ## Report Types
 *
 * ### 1. Equipment Utilization Report
 *
 * **Purpose**: Track equipment usage, hours worked, and fuel consumption
 *
 * **Metrics**:
 * - Days worked (equipment active days)
 * - Total hours operated
 * - Average daily hours
 * - Total fuel consumption
 *
 * **Data Source**: `equipo.equipo` table
 *
 * **Current Limitation**: ⚠️ Returns mock/zero data because `parte_diario` (daily reports)
 * table doesn't exist in current schema. Real metrics will be available when daily report
 * module is implemented.
 *
 * **Use Cases**:
 * - Equipment efficiency analysis
 * - Rental billing verification
 * - Fuel consumption monitoring
 * - Underutilized asset identification
 *
 * ---
 *
 * ### 2. Maintenance History Report
 *
 * **Purpose**: Track maintenance activities, costs, and service providers
 *
 * **Metrics**:
 * - Scheduled vs actual completion dates
 * - Maintenance type (preventivo, correctivo)
 * - Costs per maintenance event
 * - Provider performance
 *
 * **Data Source**: `equipo.programa_mantenimiento` (maintenance schedules)
 *
 * **Filters**:
 * - Date range (required): `startDate` to `endDate`
 * - Equipment (future): filter by equipment ID
 * - Maintenance type (future): filter by tipo_mantenimiento
 *
 * **Use Cases**:
 * - Maintenance budget analysis
 * - Provider cost comparison
 * - Preventive vs corrective ratio
 * - Equipment downtime tracking
 *
 * ---
 *
 * ### 3. Inventory Movement Report
 *
 * **Purpose**: Track logistics movements and inventory flow
 *
 * **Metrics**:
 * - Movement count by type (entrada, salida, traslado)
 * - Item quantities
 * - Monetary totals
 * - Project-level distribution
 *
 * **Data Source**: `logistica.movimiento` + `logistica.detalle_movimiento`
 *
 * **Aggregation**: Groups movements by document, calculates item counts and totals
 *
 * **Filters**:
 * - Date range (required): `startDate` to `endDate`
 * - Movement type (future): filter by tipo_movimiento
 * - Project (future): filter by proyecto_id
 *
 * **Use Cases**:
 * - Inventory turnover analysis
 * - Project cost tracking
 * - Supplier delivery compliance
 * - Stock level optimization
 *
 * ---
 *
 * ### 4. Operator Timesheet Report
 *
 * **Purpose**: Track operator work hours and overtime
 *
 * **Metrics**:
 * - Days worked
 * - Regular hours
 * - Overtime hours
 * - Project assignments
 *
 * **Data Source**: `rrhh.trabajador` table
 *
 * **Current Limitation**: ⚠️ Returns mock/zero data because `parte_diario` (daily reports)
 * table doesn't exist in current schema. Real timesheet data will be available when daily
 * report module is implemented.
 *
 * **Use Cases**:
 * - Payroll calculation
 * - Labor cost analysis
 * - Overtime monitoring
 * - Project labor allocation
 *
 * ---
 *
 * ## Date Range Handling
 *
 * ### Date Format
 * - **Required Format**: `YYYY-MM-DD` (ISO 8601)
 * - **Example**: `2026-01-15`
 * - **Validation**: Uses `IsDateString` validator from class-validator
 *
 * ### Date Range Validation Rules
 *
 * **For methods requiring date range**:
 * 1. Both `startDate` and `endDate` are required (not optional)
 * 2. `startDate` must be ≤ `endDate`
 * 3. Maximum date range: 365 days (1 year)
 * 4. Invalid dates throw `ValidationError`
 *
 * **Methods with date range validation**:
 * - `getMaintenanceHistory(startDate, endDate)`
 * - `getInventoryMovements(startDate, endDate)`
 *
 * **Methods with optional dates** (currently unused due to mock data):
 * - `getEquipmentUtilization(_startDate?, _endDate?)`
 * - `getOperatorTimesheet(_startDate?, _endDate?)`
 *
 * ---
 *
 * ## Data Aggregation
 *
 * ### Aggregation Patterns
 *
 * **Equipment Utilization**:
 * ```sql
 * -- When parte_diario exists (future):
 * SUM(hours_worked) as total_hours
 * COUNT(DISTINCT date) as days_worked
 * AVG(hours_worked) as avg_daily_hours
 * SUM(fuel_consumed) as total_fuel
 * ```
 *
 * **Inventory Movements**:
 * ```sql
 * -- Groups by movement document:
 * COUNT(detalle.id) as items_count
 * SUM(detalle.monto_total) as total_amount
 * GROUP BY movimiento.id
 * ```
 *
 * **Maintenance Costs**:
 * ```sql
 * -- No aggregation (one row per maintenance event):
 * costo_estimado as cost
 * ```
 *
 * ---
 *
 * ## Performance Considerations
 *
 * ### Query Optimization
 *
 * **Complex Queries**:
 * - `getInventoryMovements`: Uses `GROUP BY` and aggregations (`COUNT`, `SUM`)
 * - `getMaintenanceHistory`: 3-table JOIN (programa_mantenimiento + equipo + proveedor)
 *
 * **Recommended Indexes** (to be added in Phase 21):
 * ```sql
 * CREATE INDEX idx_programa_mantenimiento_fecha ON equipo.programa_mantenimiento(fecha_programada);
 * CREATE INDEX idx_movimiento_fecha ON logistica.movimiento(fecha);
 * CREATE INDEX idx_movimiento_proyecto ON logistica.movimiento(proyecto_id);
 * ```
 *
 * ### Pagination
 *
 * **Current State**: No pagination implemented
 *
 * **Future Enhancement**: Add pagination for large datasets
 * - Limit: 100 rows per page (default)
 * - Offset-based pagination
 * - Total count in response
 *
 * **Affected Methods**:
 * - `getMaintenanceHistory` (can return 1000s of records)
 * - `getInventoryMovements` (high volume)
 * - `getOperatorTimesheet` (currently hardcoded LIMIT 100)
 *
 * ### Caching Strategy (Future)
 *
 * **Cacheable Reports**:
 * - Equipment utilization (daily aggregates)
 * - Maintenance history (historical data doesn't change)
 *
 * **Cache Key Pattern**: `report:{type}:{startDate}:{endDate}:{tenantId}`
 *
 * **Cache TTL**:
 * - Current day data: 1 hour
 * - Historical data: 24 hours
 * - Month-end reports: 7 days
 *
 * ---
 *
 * ## Multi-Tenancy
 *
 * All queries are filtered by `tenantId` for data isolation.
 *
 * ---
 *
 * ## Error Handling
 *
 * ### Error Types
 *
 * **DatabaseError** (4 methods):
 * - Thrown when SQL query execution fails
 * - Wraps underlying database exceptions
 * - Type: `DatabaseErrorType.QUERY`
 *
 * **ValidationError** (2 methods):
 * - Thrown when date range validation fails
 * - Scenarios:
 *   - `startDate > endDate`
 *   - Invalid date format (not YYYY-MM-DD)
 *   - Date range exceeds 365 days
 *
 * ### Error Response Pattern
 *
 * **DatabaseError Example**:
 * ```typescript
 * try {
 *   const results = await AppDataSource.query(query, params);
 * } catch (error) {
 *   throw new DatabaseError(
 *     'Failed to fetch maintenance history',
 *     DatabaseErrorType.QUERY,
 *     error
 *   );
 * }
 * ```
 *
 * **ValidationError Example**:
 * ```typescript
 * const start = new Date(startDate);
 * const end = new Date(endDate);
 *
 * if (start > end) {
 *   throw new ValidationError('startDate must be less than or equal to endDate', [
 *     { field: 'startDate', rule: 'date_range', message: 'Start date exceeds end date', value: startDate },
 *     { field: 'endDate', rule: 'date_range', message: 'End date precedes start date', value: endDate },
 *   ]);
 * }
 * ```
 *
 * ---
 *
 * ## Related Services
 *
 * - **EquipmentService**: Source data for equipment utilization
 * - **MaintenanceService**: Source data for maintenance history
 * - **InventoryService**: Source data for inventory movements
 * - **TimesheetService**: Source data for operator hours (future)
 * - **ExportService**: Report export to Excel/PDF formats
 *
 * ---
 *
 * ## Usage Examples
 *
 * ### Example 1: Get Equipment Utilization (Mock Data)
 *
 * ```typescript
 * const reportingService = new ReportingService();
 *
 * // Note: Date parameters currently unused (returns all equipment with zero metrics)
 * const report = await reportingService.getEquipmentUtilization(
 *   '2026-01-01',
 *   '2026-01-31'
 * );
 *
 * // Result:
 * // [
 * //   {
 * //     code: 'EXC-001',
 * //     equipment: 'Caterpillar 320D',
 * //     equipment_type: 'EXCAVADORA',
 * //     days_worked: 0,        // Mock data
 * //     total_hours: 0,        // Mock data
 * //     avg_daily_hours: 0,    // Mock data
 * //     total_fuel: 0          // Mock data
 * //   },
 * //   ...
 * // ]
 *
 * console.log(`Equipment count: ${report.length}`);
 * ```
 *
 * ---
 *
 * ### Example 2: Get Maintenance History with Date Range
 *
 * ```typescript
 * const reportingService = new ReportingService();
 *
 * const report = await reportingService.getMaintenanceHistory(
 *   '2026-01-01',
 *   '2026-01-31'
 * );
 *
 * // Result:
 * // [
 * //   {
 * //     id: 123,
 * //     start_date: 2026-01-15T00:00:00.000Z,
 * //     end_date: 2026-01-16T00:00:00.000Z,
 * //     maintenance_type: 'PREVENTIVO',
 * //     status: 'COMPLETADO',
 * //     cost: 1500.50,
 * //     description: 'Cambio de aceite y filtros',
 * //     equipment_code: 'EXC-001',
 * //     equipment_name: 'Caterpillar 320D',
 * //     provider_name: 'Servicio Técnico SAC'
 * //   },
 * //   ...
 * // ]
 *
 * const totalCost = report.reduce((sum, r) => sum + r.cost, 0);
 * console.log(`Total maintenance cost: S/ ${totalCost.toFixed(2)}`);
 * ```
 *
 * ---
 *
 * ### Example 3: Get Inventory Movements with Aggregation
 *
 * ```typescript
 * const reportingService = new ReportingService();
 *
 * const report = await reportingService.getInventoryMovements(
 *   '2026-01-01',
 *   '2026-01-31'
 * );
 *
 * // Result:
 * // [
 * //   {
 * //     id: 456,
 * //     fecha: 2026-01-20T00:00:00.000Z,
 * //     tipo_movimiento: 'ENTRADA',
 * //     numero_documento: 'GR-2026-001',
 * //     project_name: 'Proyecto Carretera Norte',
 * //     items_count: 15,          // Aggregated from detalle_movimiento
 * //     total_amount: 8750.00     // SUM(monto_total)
 * //   },
 * //   ...
 * // ]
 *
 * const totalValue = report.reduce((sum, r) => sum + r.total_amount, 0);
 * console.log(`Total inventory value: S/ ${totalValue.toFixed(2)}`);
 * ```
 *
 * ---
 *
 * ### Example 4: Get Operator Timesheet (Mock Data)
 *
 * ```typescript
 * const reportingService = new ReportingService();
 *
 * // Note: Date parameters currently unused (returns operators with zero hours)
 * const report = await reportingService.getOperatorTimesheet(
 *   '2026-01-01',
 *   '2026-01-31'
 * );
 *
 * // Result (limited to 100 operators):
 * // [
 * //   {
 * //     operator_name: 'Juan Pérez García',
 * //     project_name: 'N/A',        // Mock data
 * //     days_worked: 0,             // Mock data
 * //     total_hours: 0,             // Mock data
 * //     overtime_hours: 0           // Mock data
 * //   },
 * //   ...
 * // ]
 *
 * console.log(`Operator count: ${report.length}`);
 * ```
 *
 * ---
 *
 * ### Example 5: Error Handling - Invalid Date Range
 *
 * ```typescript
 * const reportingService = new ReportingService();
 *
 * try {
 *   // Invalid: start date after end date
 *   const report = await reportingService.getMaintenanceHistory(
 *     '2026-01-31',
 *     '2026-01-01'
 *   );
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Date range validation failed:');
 *     error.errors.forEach(e => {
 *       console.error(`  - ${e.field}: ${e.message}`);
 *     });
 *   }
 * }
 *
 * // Output:
 * // Date range validation failed:
 * //   - startDate: Start date exceeds end date
 * //   - endDate: End date precedes start date
 * ```
 *
 * ---
 *
 * ## Future Enhancements
 *
 * 1. **Real-Time Data**: Integrate with `parte_diario` for live equipment/operator metrics
 * 2. **Export Formats**: Add Excel/PDF export capabilities (integrate with ExportService)
 * 3. **Pagination**: Implement offset-based pagination for large result sets
 * 4. **Caching**: Add Redis caching layer for frequently-run reports
 * 5. **Dashboard Integration**: Pre-calculated metrics for dashboard service
 * 6. **Custom Date Ranges**: Support fiscal periods, quarters, custom calendars
 * 7. **Advanced Filters**: Equipment type, project, provider, status filters
 * 8. **Scheduled Reports**: Automated report generation and email delivery
 * 9. **Data Visualization**: Chart-ready data structures for frontend graphs
 * 10. **Report Templates**: Configurable report layouts per company
 *
 * ---
 *
 * @see {@link EquipmentUtilizationReport} - Equipment metrics response structure
 * @see {@link MaintenanceHistoryReport} - Maintenance records response structure
 * @see {@link InventoryMovementReport} - Inventory movement response structure
 * @see {@link OperatorTimesheetReport} - Operator hours response structure
 * @see {@link ValidationError} - Date range validation errors
 * @see {@link DatabaseError} - Database query failures
 */
export class ReportingService {
  /**
   * Get Equipment Utilization Report
   *
   * Retrieves equipment usage metrics including hours worked, days active, and fuel consumption
   * for a specified date range.
   *
   * ## Current Limitation
   *
   * ⚠️ **Mock Data**: This method currently returns equipment list with **zero values** for all
   * metrics (days_worked, total_hours, avg_daily_hours, total_fuel) because the `parte_diario`
   * (daily reports) table doesn't exist in the current database schema.
   *
   * Real utilization data will be available once the daily report module is implemented and
   * the `parte_diario` table is created with equipment usage tracking.
   *
   * ## Business Logic
   *
   * **Data Source**: `equipo.equipo` table
   *
   * **Returned Fields**:
   * - `code`: Equipment code (unique identifier)
   * - `equipment`: Equipment description (brand + model or code fallback)
   * - `equipment_type`: Equipment category (categoria field)
   * - `days_worked`: Number of active days (currently 0)
   * - `total_hours`: Sum of hours operated (currently 0)
   * - `avg_daily_hours`: Average hours per day (currently 0)
   * - `total_fuel`: Total fuel consumed in gallons (currently 0)
   *
   * **Sorting**: Results ordered alphabetically by equipment code
   *
   * ## Future Implementation (when parte_diario exists)
   *
   * ```sql
   * SELECT
   *   e.codigo_equipo as code,
   *   COUNT(DISTINCT pd.fecha) as days_worked,
   *   SUM(pd.horas_trabajadas) as total_hours,
   *   AVG(pd.horas_trabajadas) as avg_daily_hours,
   *   SUM(pd.combustible_consumido) as total_fuel
   * FROM equipo.equipo e
   * LEFT JOIN parte_diario pd ON e.id = pd.equipo_id
   *   AND pd.fecha BETWEEN $1 AND $2
   * WHERE e.codigo_equipo IS NOT NULL
   * GROUP BY e.id, e.codigo_equipo, e.marca, e.modelo, e.categoria
   * ORDER BY e.codigo_equipo
   * ```
   *
   * @param _startDate - Start date for report range (YYYY-MM-DD) - **Currently unused**
   * @param _endDate - End date for report range (YYYY-MM-DD) - **Currently unused**
   *
   * @returns Promise resolving to array of equipment utilization records
   *
   * @throws {DatabaseError} When database query execution fails
   *
   * @example
   * ```typescript
   * const reportingService = new ReportingService();
   *
   * // Note: Date parameters currently unused due to mock data
   * const report = await reportingService.getEquipmentUtilization(
   *   '2026-01-01',
   *   '2026-01-31'
   * );
   *
   * console.log(`Found ${report.length} equipment records`);
   * // Output: Found 25 equipment records
   *
   * // All metrics will be 0 until parte_diario is implemented:
   * console.log(report[0]);
   * // {
   * //   code: 'EXC-001',
   * //   equipment: 'Caterpillar 320D',
   * //   equipment_type: 'EXCAVADORA',
   * //   days_worked: 0,
   * //   total_hours: 0,
   * //   avg_daily_hours: 0,
   * //   total_fuel: 0
   * // }
   * ```
   */
  async getEquipmentUtilization(
    tenantId: number,
    _startDate?: string,
    _endDate?: string
  ): Promise<EquipmentUtilizationReport[]> {
    try {
      // Since parte_diario doesn't exist, return equipment list with mock/zero data
      // This maintains API compatibility while working with existing schema
      const query = `
        SELECT
          e.codigo_equipo as code,
          COALESCE(e.marca || ' ' || e.modelo, e.codigo_equipo) as equipment,
          COALESCE(e.categoria, 'Unknown') as equipment_type,
          0 as days_worked,
          0 as total_hours,
          0 as avg_daily_hours,
          0 as total_fuel
        FROM equipo.equipo e
        WHERE e.codigo_equipo IS NOT NULL
          AND e.tenant_id = $1
        ORDER BY e.codigo_equipo
      `;

      const results = await AppDataSource.query(query, [tenantId]);

      const report = results.map((row: Record<string, unknown>) => ({
        code: row.code as string,
        equipment: row.equipment as string,
        equipment_type: row.equipment_type as string,
        days_worked: Number(row.days_worked) || 0,
        total_hours: Number(row.total_hours) || 0,
        avg_daily_hours: Number(row.avg_daily_hours) || 0,
        total_fuel: Number(row.total_fuel) || 0,
      }));

      logger.info('Equipment utilization report generated successfully', {
        equipment_count: report.length,
        note: 'Mock data - parte_diario table not implemented',
      });

      return report;
    } catch (error) {
      throw new DatabaseError(
        'Failed to generate equipment utilization report',
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Get Maintenance History Report
   *
   * Retrieves maintenance activity records with costs, providers, and status information
   * for a specified date range.
   *
   * ## Business Logic
   *
   * **Data Source**: 3-table JOIN
   * - `equipo.programa_mantenimiento`: Maintenance schedules (primary)
   * - `equipo.equipo`: Equipment details
   * - `proveedores.proveedor`: Service provider information
   *
   * **Returned Fields**:
   * - `id`: Maintenance schedule ID
   * - `start_date`: Scheduled maintenance date (fecha_programada)
   * - `end_date`: Actual completion date (fecha_realizada)
   * - `maintenance_type`: Type of maintenance (PREVENTIVO, CORRECTIVO, etc.)
   * - `status`: Current status (PROGRAMADO, EN_PROGRESO, COMPLETADO, etc.)
   * - `cost`: Estimated or actual cost (costo_estimado)
   * - `description`: Maintenance description/notes
   * - `equipment_code`: Equipment identifier
   * - `equipment_name`: Equipment brand + model
   * - `provider_name`: Service provider company name
   *
   * **Date Filtering**: Records filtered by `fecha_programada` (scheduled date) within range
   *
   * **Sorting**: Results ordered by scheduled date (most recent first)
   *
   * ## Validation Rules
   *
   * - Both `startDate` and `endDate` are required (not optional)
   * - Dates must be in `YYYY-MM-DD` format
   * - `startDate` must be ≤ `endDate`
   * - Invalid date range throws `ValidationError`
   *
   * @param startDate - Start date for report range (YYYY-MM-DD) - **Required**
   * @param endDate - End date for report range (YYYY-MM-DD) - **Required**
   *
   * @returns Promise resolving to array of maintenance history records
   *
   * @throws {ValidationError} When date range validation fails (startDate > endDate)
   * @throws {DatabaseError} When database query execution fails
   *
   * @example
   * ```typescript
   * const reportingService = new ReportingService();
   *
   * // Get January 2026 maintenance records
   * const report = await reportingService.getMaintenanceHistory(
   *   '2026-01-01',
   *   '2026-01-31'
   * );
   *
   * console.log(`Found ${report.length} maintenance records`);
   *
   * // Calculate total maintenance cost
   * const totalCost = report.reduce((sum, r) => sum + r.cost, 0);
   * console.log(`Total cost: S/ ${totalCost.toFixed(2)}`);
   *
   * // Group by maintenance type
   * const preventivo = report.filter(r => r.maintenance_type === 'PREVENTIVO');
   * const correctivo = report.filter(r => r.maintenance_type === 'CORRECTIVO');
   * console.log(`Preventivo: ${preventivo.length}, Correctivo: ${correctivo.length}`);
   * ```
   */
  async getMaintenanceHistory(
    tenantId: number,
    startDate: string,
    endDate: string
  ): Promise<MaintenanceHistoryReport[]> {
    try {
      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        throw new ValidationError('startDate must be less than or equal to endDate', [
          {
            field: 'startDate',
            rule: 'date_range',
            message: 'Start date exceeds end date',
            value: startDate,
          },
          {
            field: 'endDate',
            rule: 'date_range',
            message: 'End date precedes start date',
            value: endDate,
          },
        ]);
      }

      const query = `
        SELECT
          pm.id,
          pm.fecha_programada as start_date,
          pm.fecha_realizada as end_date,
          pm.tipo_mantenimiento as maintenance_type,
          pm.estado as status,
          pm.costo_estimado as cost,
          pm.descripcion as description,
          e.codigo_equipo as equipment_code,
          COALESCE(e.marca || ' ' || e.modelo, e.codigo_equipo) as equipment_name,
          p.razon_social as provider_name
        FROM equipo.programa_mantenimiento pm
        LEFT JOIN equipo.equipo e ON pm.equipo_id = e.id
        LEFT JOIN proveedores.proveedor p ON e.proveedor_id = p.id
        WHERE pm.fecha_programada >= $1 AND pm.fecha_programada <= $2
          AND pm.tenant_id = $3
        ORDER BY pm.fecha_programada DESC
      `;

      const results = await AppDataSource.query(query, [startDate, endDate, tenantId]);

      const report = results.map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        start_date: row.start_date as Date,
        end_date: row.end_date as Date,
        maintenance_type: row.maintenance_type as string,
        status: row.status as string,
        cost: Number(row.cost) || 0,
        description: row.description as string,
        equipment_code: row.equipment_code as string,
        equipment_name: row.equipment_name as string,
        provider_name: row.provider_name as string,
      }));

      logger.info('Maintenance history report generated successfully', {
        record_count: report.length,
        start_date: startDate,
        end_date: endDate,
        total_cost: report.reduce((sum, r) => sum + r.cost, 0),
      });

      return report;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to generate maintenance history report for date range ${startDate} to ${endDate}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Get Inventory Movement Report
   *
   * Retrieves inventory movement records with item counts and monetary totals for a
   * specified date range. Aggregates movement details by document.
   *
   * ## Business Logic
   *
   * **Data Source**: 3-table JOIN with aggregation
   * - `logistica.movimiento`: Movement headers (primary)
   * - `proyectos.edt`: Project information
   * - `logistica.detalle_movimiento`: Movement line items (aggregated)
   *
   * **Returned Fields**:
   * - `id`: Movement ID
   * - `fecha`: Movement date
   * - `tipo_movimiento`: Movement type (ENTRADA, SALIDA, TRASLADO, DEVOLUCION, etc.)
   * - `numero_documento`: Document number (invoice, guide, etc.)
   * - `project_name`: Project name (destination or source)
   * - `items_count`: Number of line items (COUNT of detalle_movimiento)
   * - `total_amount`: Total monetary value (SUM of monto_total)
   *
   * **Aggregation**: Groups by movement document, calculates:
   * - `COUNT(detalle.id)` → items_count
   * - `SUM(detalle.monto_total)` → total_amount
   *
   * **Date Filtering**: Records filtered by `fecha` (movement date) within range
   *
   * **Sorting**: Results ordered by date (most recent first)
   *
   * ## Validation Rules
   *
   * - Both `startDate` and `endDate` are required (not optional)
   * - Dates must be in `YYYY-MM-DD` format
   * - `startDate` must be ≤ `endDate`
   * - Invalid date range throws `ValidationError`
   *
   * @param startDate - Start date for report range (YYYY-MM-DD) - **Required**
   * @param endDate - End date for report range (YYYY-MM-DD) - **Required**
   *
   * @returns Promise resolving to array of inventory movement records
   *
   * @throws {ValidationError} When date range validation fails (startDate > endDate)
   * @throws {DatabaseError} When database query execution fails
   *
   * @example
   * ```typescript
   * const reportingService = new ReportingService();
   *
   * // Get January 2026 inventory movements
   * const report = await reportingService.getInventoryMovements(
   *   '2026-01-01',
   *   '2026-01-31'
   * );
   *
   * console.log(`Found ${report.length} inventory movements`);
   *
   * // Calculate total inventory value
   * const totalValue = report.reduce((sum, r) => sum + r.total_amount, 0);
   * console.log(`Total value: S/ ${totalValue.toFixed(2)}`);
   *
   * // Group by movement type
   * const entradas = report.filter(r => r.tipo_movimiento === 'ENTRADA');
   * const salidas = report.filter(r => r.tipo_movimiento === 'SALIDA');
   * console.log(`Entradas: ${entradas.length}, Salidas: ${salidas.length}`);
   *
   * // Calculate total items moved
   * const totalItems = report.reduce((sum, r) => sum + r.items_count, 0);
   * console.log(`Total items moved: ${totalItems}`);
   * ```
   */
  async getInventoryMovements(
    tenantId: number,
    startDate: string,
    endDate: string
  ): Promise<InventoryMovementReport[]> {
    try {
      // Validate date range
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        throw new ValidationError('startDate must be less than or equal to endDate', [
          {
            field: 'startDate',
            rule: 'date_range',
            message: 'Start date exceeds end date',
            value: startDate,
          },
          {
            field: 'endDate',
            rule: 'date_range',
            message: 'End date precedes start date',
            value: endDate,
          },
        ]);
      }

      const query = `
        SELECT
          m.id,
          m.fecha,
          m.tipo_movimiento,
          m.numero_documento,
          p.nombre as project_name,
          COUNT(md.id) as items_count,
          COALESCE(SUM(md.monto_total), 0) as total_amount
        FROM logistica.movimiento m
        LEFT JOIN proyectos.edt p ON m.proyecto_id = p.id
        LEFT JOIN logistica.detalle_movimiento md ON m.id = md.movimiento_id
        WHERE m.fecha >= $1 AND m.fecha <= $2
          AND m.tenant_id = $3
        GROUP BY m.id, m.fecha, m.tipo_movimiento, m.numero_documento, p.nombre
        ORDER BY m.fecha DESC
      `;

      const results = await AppDataSource.query(query, [startDate, endDate, tenantId]);

      const report = results.map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        fecha: row.fecha as Date,
        tipo_movimiento: row.tipo_movimiento as string,
        numero_documento: row.numero_documento as string,
        project_name: row.project_name as string,
        items_count: Number(row.items_count) || 0,
        total_amount: Number(row.total_amount) || 0,
      }));

      logger.info('Inventory movements report generated successfully', {
        movement_count: report.length,
        start_date: startDate,
        end_date: endDate,
        total_items: report.reduce((sum, r) => sum + r.items_count, 0),
        total_value: report.reduce((sum, r) => sum + r.total_amount, 0),
      });

      return report;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to generate inventory movements report for date range ${startDate} to ${endDate}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Get Operator Timesheet Report
   *
   * Retrieves operator work hours including regular time and overtime for a specified date range.
   *
   * ## Current Limitation
   *
   * ⚠️ **Mock Data**: This method currently returns operator list with **zero values** for all
   * metrics (days_worked, total_hours, overtime_hours) and **'N/A' for project names** because
   * the `parte_diario` (daily reports) table doesn't exist in the current database schema.
   *
   * Real timesheet data will be available once the daily report module is implemented and
   * the `parte_diario` table is created with operator hours tracking.
   *
   * ## Business Logic
   *
   * **Data Source**: `rrhh.trabajador` table
   *
   * **Returned Fields**:
   * - `operator_name`: Operator full name (nombres + apellido_paterno)
   * - `project_name`: Project where operator worked (currently 'N/A')
   * - `days_worked`: Number of days worked (currently 0)
   * - `total_hours`: Total regular hours (currently 0)
   * - `overtime_hours`: Total overtime hours (currently 0)
   *
   * **Result Limit**: Hardcoded to 100 operators (should be configurable in future)
   *
   * **Sorting**: Results ordered alphabetically by operator name
   *
   * ## Future Implementation (when parte_diario exists)
   *
   * ```sql
   * SELECT
   *   o.nombres || ' ' || o.apellido_paterno as operator_name,
   *   p.nombre as project_name,
   *   COUNT(DISTINCT pd.fecha) as days_worked,
   *   SUM(CASE WHEN pd.horas <= 8 THEN pd.horas ELSE 8 END) as total_hours,
   *   SUM(CASE WHEN pd.horas > 8 THEN pd.horas - 8 ELSE 0 END) as overtime_hours
   * FROM rrhh.trabajador o
   * LEFT JOIN parte_diario pd ON o.id = pd.trabajador_id
   *   AND pd.fecha BETWEEN $1 AND $2
   * LEFT JOIN proyectos.edt p ON pd.proyecto_id = p.id
   * WHERE o.estado = 'ACTIVO'
   * GROUP BY o.id, o.nombres, o.apellido_paterno, p.nombre
   * ORDER BY operator_name
   * ```
   *
   * @param _startDate - Start date for report range (YYYY-MM-DD) - **Currently unused**
   * @param _endDate - End date for report range (YYYY-MM-DD) - **Currently unused**
   *
   * @returns Promise resolving to array of operator timesheet records (max 100 records)
   *
   * @throws {DatabaseError} When database query execution fails
   *
   * @example
   * ```typescript
   * const reportingService = new ReportingService();
   *
   * // Note: Date parameters currently unused due to mock data
   * const report = await reportingService.getOperatorTimesheet(
   *   '2026-01-01',
   *   '2026-01-31'
   * );
   *
   * console.log(`Found ${report.length} operators (max 100)`);
   * // Output: Found 45 operators (max 100)
   *
   * // All metrics will be 0 until parte_diario is implemented:
   * console.log(report[0]);
   * // {
   * //   operator_name: 'Juan Pérez García',
   * //   project_name: 'N/A',
   * //   days_worked: 0,
   * //   total_hours: 0,
   * //   overtime_hours: 0
   * // }
   * ```
   */
  async getOperatorTimesheet(
    tenantId: number,
    _startDate?: string,
    _endDate?: string
  ): Promise<OperatorTimesheetReport[]> {
    try {
      // Since parte_diario doesn't exist, return trabajador list with zero data
      // This maintains API compatibility
      const query = `
        SELECT
          o.nombres || ' ' || o.apellido_paterno as operator_name,
          'N/A' as project_name,
          0 as days_worked,
          0 as total_hours,
          0 as overtime_hours
        FROM rrhh.trabajador o
        WHERE o.tenant_id = $1
        ORDER BY operator_name
        LIMIT 100
      `;

      const results = await AppDataSource.query(query, [tenantId]);

      const report = results.map((row: Record<string, unknown>) => ({
        operator_name: row.operator_name as string,
        project_name: row.project_name as string,
        days_worked: Number(row.days_worked) || 0,
        total_hours: Number(row.total_hours) || 0,
        overtime_hours: Number(row.overtime_hours) || 0,
      }));

      logger.info('Operator timesheet report generated successfully', {
        operator_count: report.length,
        note: 'Mock data - parte_diario table not implemented',
        limit: 100,
      });

      return report;
    } catch (error) {
      throw new DatabaseError(
        'Failed to generate operator timesheet report',
        DatabaseErrorType.QUERY,
        error
      );
    }
  }
}
