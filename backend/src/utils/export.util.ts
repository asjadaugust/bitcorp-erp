import { Response } from 'express';
import ExcelJS from 'exceljs';
import { parse } from 'json2csv';

export class ExportUtil {
  /**
   * Export data to Excel format
   */
  static async exportToExcel(
    res: Response,
    data: any[],
    columns: { header: string; key: string; width?: number }[],
    filename: string
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Define columns
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    data.forEach((item) => {
      worksheet.addRow(item);
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: String.fromCharCode(64 + columns.length) + '1',
    };

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Export data to CSV format
   */
  static exportToCSV(
    res: Response,
    data: any[],
    fields: { label: string; value: string }[],
    filename: string
  ): void {
    try {
      const csv = parse(data, { fields });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } catch (error) {
      throw new Error(`CSV export failed: ${(error as Error).message}`);
    }
  }

  /**
   * Format date for export
   */
  static formatDate(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Format datetime for export
   */
  static formatDateTime(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format currency for export
   */
  static formatCurrency(amount: number | null, currency: string = 'PEN'): string {
    if (amount === null || amount === undefined) return '';
    const symbol = currency === 'USD' ? '$' : 'S/';
    return `${symbol} ${amount.toFixed(2)}`;
  }

  /**
   * Format boolean for export
   */
  static formatBoolean(value: boolean | null, trueLabel: string = 'Sí', falseLabel: string = 'No'): string {
    if (value === null || value === undefined) return '';
    return value ? trueLabel : falseLabel;
  }
}
