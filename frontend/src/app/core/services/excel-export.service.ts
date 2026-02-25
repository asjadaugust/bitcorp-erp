import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  columnHeaders?: Record<string, string>; // Map of keys to display names
  excludeColumns?: string[];
  includeTimestamp?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  /**
   * Export data to Excel file
   * @param data Array of objects to export
   * @param options Export configuration options
   */
  exportToExcel(data: Record<string, unknown>[], options: ExcelExportOptions = {}): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const {
      filename = 'export',
      sheetName = 'Sheet1',
      columnHeaders,
      excludeColumns = [],
      includeTimestamp = true,
    } = options;

    // Transform data if column headers provided
    const exportData = this.transformData(data, columnHeaders, excludeColumns);

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = this.calculateColumnWidths(exportData, maxWidth);
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with timestamp
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().split('T')[0]}_${Date.now()}`
      : '';
    const fullFilename = `${filename}${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, fullFilename);
  }

  /**
   * Export multiple sheets to one Excel file
   * @param sheets Array of sheet data with names
   * @param filename Output filename
   */
  exportMultipleSheets(
    sheets: { data: Record<string, unknown>[]; sheetName: string; columnHeaders?: Record<string, string> }[],
    filename = 'export'
  ): void {
    const workbook = XLSX.utils.book_new();

    sheets.forEach((sheet) => {
      const transformedData = this.transformData(sheet.data, sheet.columnHeaders);
      const worksheet = XLSX.utils.json_to_sheet(transformedData);

      // Auto-size columns
      const colWidths = this.calculateColumnWidths(transformedData);
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName);
    });

    const timestamp = `_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
    XLSX.writeFile(workbook, `${filename}${timestamp}.xlsx`);
  }

  /**
   * Transform data based on column headers and exclusions
   */
  private transformData(
    data: Record<string, unknown>[],
    columnHeaders?: Record<string, string>,
    excludeColumns: string[] = []
  ): Record<string, unknown>[] {
    return data.map((row) => {
      const transformedRow: Record<string, unknown> = {};

      Object.keys(row).forEach((key) => {
        // Skip excluded columns
        if (excludeColumns.includes(key)) return;

        // Skip null/undefined nested objects
        if (row[key] === null || row[key] === undefined) {
          transformedRow[columnHeaders?.[key] || key] = '';
          return;
        }

        // Handle nested objects (e.g., provider.razon_social)
        if (typeof row[key] === 'object' && !Array.isArray(row[key])) {
          // For nested objects, just use their string representation or skip
          return;
        }

        // Handle arrays
        if (Array.isArray(row[key])) {
          transformedRow[columnHeaders?.[key] || key] = row[key].join(', ');
          return;
        }

        // Handle dates
        if (row[key] instanceof Date) {
          transformedRow[columnHeaders?.[key] || key] = row[key].toISOString().split('T')[0];
          return;
        }

        // Use custom header name if provided, otherwise use original key
        const headerName = columnHeaders?.[key] || this.formatHeader(key);
        transformedRow[headerName] = row[key];
      });

      return transformedRow;
    });
  }

  /**
   * Format header name (camelCase to Title Case)
   */
  private formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Calculate column widths based on content
   */
  private calculateColumnWidths(data: Record<string, unknown>[], maxWidth = 50): { wch: number }[] {
    if (!data || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    return keys.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => {
          const value = row[key];
          return value ? value.toString().length : 0;
        })
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
  }

  /**
   * Export table data directly from HTML table element
   * @param tableId HTML table element ID
   * @param filename Output filename
   */
  exportTableToExcel(tableId: string, filename = 'table_export'): void {
    const table = document.getElementById(tableId);
    if (!table) {
      console.error(`Table with ID '${tableId}' not found`);
      return;
    }

    const workbook = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' });
    const timestamp = `_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
    XLSX.writeFile(workbook, `${filename}${timestamp}.xlsx`);
  }

  /**
   * Export data to CSV file
   * @param data Array of objects to export
   * @param filename Output filename
   */
  exportToCSV(data: Record<string, unknown>[], filename = 'export'): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create worksheet and convert to CSV
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = `_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}${timestamp}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
