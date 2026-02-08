import { Injectable } from '@angular/core';

export interface CsvExportOptions {
  filename?: string;
  delimiter?: string;
  includeTimestamp?: boolean;
  columnHeaders?: Record<string, string>;
  excludeColumns?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class CsvExportService {
  /**
   * Export data to CSV file
   * @param data Array of objects to export
   * @param options Export configuration options
   */
  exportToCsv(data: any[], options: CsvExportOptions = {}): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const {
      filename = 'export',
      delimiter = ',',
      includeTimestamp = true,
      columnHeaders,
      excludeColumns = [],
    } = options;

    // Transform data
    const transformedData = this.transformData(data, columnHeaders, excludeColumns);

    if (transformedData.length === 0) {
      console.warn('No data to export after transformation');
      return;
    }

    // Get headers
    const headers = Object.keys(transformedData[0]);

    // Create CSV content
    let csvContent = headers.join(delimiter) + '\n';

    // Add rows
    transformedData.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains delimiter or quotes
        const stringValue = value?.toString() || '';
        if (
          stringValue.includes(delimiter) ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(delimiter) + '\n';
    });

    // Generate filename with timestamp
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().split('T')[0]}_${Date.now()}`
      : '';
    const fullFilename = `${filename}${timestamp}.csv`;

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fullFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Transform data based on column headers and exclusions
   */
  private transformData(
    data: any[],
    columnHeaders?: Record<string, string>,
    excludeColumns: string[] = []
  ): any[] {
    return data.map((row) => {
      const transformedRow: any = {};

      Object.keys(row).forEach((key) => {
        // Skip excluded columns
        if (excludeColumns.includes(key)) return;

        // Skip null/undefined nested objects
        if (row[key] === null || row[key] === undefined) {
          transformedRow[columnHeaders?.[key] || key] = '';
          return;
        }

        // Handle nested objects
        if (typeof row[key] === 'object' && !Array.isArray(row[key])) {
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

        // Use custom header name if provided
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
}
