/**
 * Report Query DTOs
 * For ReportService - daily report filtering and queries
 */

/**
 * Filters for daily report queries
 * Used by getAllReports() method
 */
export interface DailyReportFiltersDto {
  /** Filter by report status */
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

  /** Filter by specific date (YYYY-MM-DD) */
  fecha?: string;

  /** Filter by date range start (YYYY-MM-DD) */
  fecha_inicio?: string;

  /** Filter by date range end (YYYY-MM-DD) */
  fecha_fin?: string;

  /** Filter by worker/operator ID */
  trabajador_id?: string;

  /** Filter by equipment ID */
  equipo_id?: string;

  /** Filter by project ID */
  proyecto_id?: string;
}
