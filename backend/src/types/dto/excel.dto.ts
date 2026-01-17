/**
 * Excel Export DTOs
 * For ExportService - Excel file generation utilities
 */

/**
 * Excel Column Configuration
 * Defines structure for Excel worksheet columns
 */
export interface ExcelColumn {
  /** Column header text (displayed in first row) */
  header: string;

  /** Data key to map from data objects */
  key: string;

  /** Optional column width in characters (default: auto) */
  width?: number;
}
