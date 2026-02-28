import ExcelJS from 'exceljs';
import { Response } from 'express';
import Logger from '../utils/logger';
import { ValidationError } from '../errors/validation.error';
import { ExcelColumn } from '../types/dto/excel.dto';

/**
 * ExportService
 *
 * Utility service for generating Excel files from data arrays.
 *
 * NOTE: This is a stateless utility service that does NOT access the database.
 * Tenant filtering must be applied by the caller before passing data to this service.
 *
 * Standards Applied:
 * ✅ Error handling (try/catch with logging)
 * ✅ Input validation (ValidationError for invalid inputs)
 * ✅ Type safety (no 'any' types)
 * ✅ Comprehensive logging (info + error with context)
 * ✅ File name sanitization (prevent injection)
 * ❌ NO tenant context (utility service, data pre-filtered by caller)
 * ❌ NO DTOs (doesn't return entities)
 */
export class ExportService {
  /**
   * Generate Excel file from data array
   *
   * @param data - Array of data objects to export (must be non-empty)
   * @param columns - Column definitions (header, key, width)
   * @param sheetName - Name of the Excel worksheet
   * @param res - Express Response object (for streaming file)
   * @param fileName - Desired file name (will be sanitized)
   *
   * @throws {ValidationError} If data is empty, columns missing, or names invalid
   * @throws {Error} If Excel generation or streaming fails
   *
   * @example
   * await exportService.generateExcel(
   *   [{ code: 'EXC-001', type: 'EXCAVADORA' }],
   *   [{ header: 'Código', key: 'code', width: 15 }],
   *   'Equipos',
   *   res,
   *   'equipos_2026-01-18'
   * );
   */
  async generateExcel(
    data: unknown[],
    columns: ExcelColumn[],
    sheetName: string,
    res: Response,
    fileName: string
  ): Promise<void> {
    try {
      Logger.info('Generating Excel file', {
        sheetName,
        fileName,
        rowCount: data.length,
        columnCount: columns.length,
        context: 'ExportService.generateExcel',
      });

      // ========================================
      // Input Validation
      // ========================================

      if (!data || data.length === 0) {
        throw new ValidationError('Cannot export empty data', [
          {
            field: 'data',
            message: 'Data array cannot be empty',
            rule: 'required',
            value: data?.length || 0,
          },
        ]);
      }

      if (!columns || columns.length === 0) {
        throw new ValidationError('Cannot export without columns', [
          {
            field: 'columns',
            message: 'At least one column definition is required',
            rule: 'required',
            value: columns?.length || 0,
          },
        ]);
      }

      if (!sheetName || sheetName.trim() === '') {
        throw new ValidationError('Sheet name is required', [
          {
            field: 'sheetName',
            message: 'Sheet name cannot be empty',
            rule: 'required',
            value: sheetName,
          },
        ]);
      }

      if (!fileName || fileName.trim() === '') {
        throw new ValidationError('File name is required', [
          {
            field: 'fileName',
            message: 'File name cannot be empty',
            rule: 'required',
            value: fileName,
          },
        ]);
      }

      // ========================================
      // File Name Sanitization
      // ========================================
      // Remove special characters that could cause issues or security vulnerabilities
      // Allow: alphanumeric, underscore, hyphen, period
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');

      Logger.info('File name sanitized', {
        original: fileName,
        sanitized: sanitizedFileName,
        context: 'ExportService.generateExcel',
      });

      // ========================================
      // Excel Generation
      // ========================================

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Set column definitions
      worksheet.columns = columns;

      // Add data rows
      worksheet.addRows(data);

      // ========================================
      // Header Styling
      // ========================================

      // Make header row bold
      worksheet.getRow(1).font = { bold: true };

      // Apply light gray background to header
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // ========================================
      // HTTP Response Configuration
      // ========================================

      // Set content type for Excel file
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      // Set download file name
      res.setHeader('Content-Disposition', `attachment; filename=${sanitizedFileName}.xlsx`);

      // ========================================
      // Stream Excel to Response
      // ========================================

      await workbook.xlsx.write(res);
      res.end();

      Logger.info('Excel file generated successfully', {
        sheetName,
        fileName: sanitizedFileName,
        rowCount: data.length,
        columnCount: columns.length,
        context: 'ExportService.generateExcel',
      });
    } catch (error) {
      // Log error with full context
      Logger.error('Error generating Excel file', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sheetName,
        fileName,
        dataRowCount: data?.length || 0,
        columnCount: columns?.length || 0,
        context: 'ExportService.generateExcel',
      });

      // Re-throw to let controller handle HTTP response
      throw error;
    }
  }
}
