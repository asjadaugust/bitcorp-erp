/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ReportingService } from '../../services/reporting.service';
import { ExportService } from '../../services/export.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class ReportingController {
  private reportingService: ReportingService;
  private exportService: ExportService;

  constructor() {
    this.reportingService = new ReportingService();
    this.exportService = new ExportService();
  }

  getEquipmentUtilization = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const { startDate, endDate, format } = req.query;

      // Fallback validation (DTO should handle this)
      if (!startDate || !endDate) {
        sendError(res, 400, 'MISSING_PARAMETERS', 'Las fechas de inicio y fin son requeridas');
        return;
      }

      const data = await this.reportingService.getEquipmentUtilization(
        tenantId,
        startDate as string,
        endDate as string
      );

      if (format === 'excel') {
        const columns = [
          { header: 'Código', key: 'code', width: 15 },
          { header: 'Equipo', key: 'equipment', width: 30 },
          { header: 'Tipo', key: 'equipment_type', width: 20 },
          { header: 'Días Trabajados', key: 'days_worked', width: 15 },
          { header: 'Horas Totales', key: 'total_hours', width: 15 },
          { header: 'Promedio Diario', key: 'avg_daily_hours', width: 15 },
          { header: 'Combustible (Gal)', key: 'total_fuel', width: 15 },
        ];
        await this.exportService.generateExcel(
          data,
          columns,
          'Utilización',
          res,
          'reporte-utilizacion'
        );
      } else {
        sendSuccess(res, data);
      }
    } catch (error: any) {
      sendError(
        res,
        500,
        'EQUIPMENT_UTILIZATION_REPORT_FAILED',
        'Error al generar el reporte de utilización de equipos',
        error.message
      );
    }
  };

  getMaintenanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const { startDate, endDate, format } = req.query;

      // Fallback validation (DTO should handle this)
      if (!startDate || !endDate) {
        sendError(res, 400, 'MISSING_PARAMETERS', 'Las fechas de inicio y fin son requeridas');
        return;
      }

      const data = await this.reportingService.getMaintenanceHistory(
        tenantId,
        startDate as string,
        endDate as string
      );

      if (format === 'excel') {
        const columns = [
          { header: 'Fecha Inicio', key: 'start_date', width: 15 },
          { header: 'Fecha Fin', key: 'end_date', width: 15 },
          { header: 'Equipo', key: 'equipment_name', width: 25 },
          { header: 'Proveedor', key: 'provider_name', width: 25 },
          { header: 'Tipo', key: 'maintenance_type', width: 15 },
          { header: 'Estado', key: 'status', width: 15 },
          { header: 'Costo', key: 'cost', width: 15 },
          { header: 'Descripción', key: 'description', width: 40 },
        ];
        await this.exportService.generateExcel(
          data,
          columns,
          'Mantenimiento',
          res,
          'reporte-mantenimiento'
        );
      } else {
        sendSuccess(res, data);
      }
    } catch (error: any) {
      sendError(
        res,
        500,
        'MAINTENANCE_REPORT_FAILED',
        'Error al generar el reporte de historial de mantenimiento',
        error.message
      );
    }
  };

  getInventoryMovements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const { startDate, endDate, format } = req.query;

      // Fallback validation (DTO should handle this)
      if (!startDate || !endDate) {
        sendError(res, 400, 'MISSING_PARAMETERS', 'Las fechas de inicio y fin son requeridas');
        return;
      }

      const data = await this.reportingService.getInventoryMovements(
        tenantId,
        startDate as string,
        endDate as string
      );

      if (format === 'excel') {
        const columns = [
          { header: 'Fecha', key: 'fecha', width: 15 },
          { header: 'Tipo', key: 'tipo_movimiento', width: 10 },
          { header: 'Documento', key: 'tipo_documento', width: 15 },
          { header: 'Número', key: 'numero_documento', width: 15 },
          { header: 'Proyecto', key: 'project_name', width: 25 },
          { header: 'Proveedor', key: 'provider_name', width: 25 },
          { header: 'Items', key: 'items_count', width: 10 },
          { header: 'Total', key: 'total_amount', width: 15 },
        ];
        await this.exportService.generateExcel(
          data,
          columns,
          'Inventario',
          res,
          'reporte-inventario'
        );
      } else {
        sendSuccess(res, data);
      }
    } catch (error: any) {
      sendError(
        res,
        500,
        'INVENTORY_REPORT_FAILED',
        'Error al generar el reporte de movimientos de inventario',
        error.message
      );
    }
  };

  getOperatorTimesheet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const { startDate, endDate, format } = req.query;

      // Fallback validation (DTO should handle this)
      if (!startDate || !endDate) {
        sendError(res, 400, 'MISSING_PARAMETERS', 'Las fechas de inicio y fin son requeridas');
        return;
      }

      const data = await this.reportingService.getOperatorTimesheet(
        tenantId,
        startDate as string,
        endDate as string
      );

      if (format === 'excel') {
        const columns = [
          { header: 'Operador', key: 'operator_name', width: 30 },
          { header: 'Proyecto', key: 'project_name', width: 30 },
          { header: 'Días Trabajados', key: 'days_worked', width: 15 },
          { header: 'Horas Totales', key: 'total_hours', width: 15 },
          { header: 'Horas Extras', key: 'overtime_hours', width: 15 },
        ];
        await this.exportService.generateExcel(
          data,
          columns,
          'Timesheet',
          res,
          'reporte-timesheet'
        );
      } else {
        sendSuccess(res, data);
      }
    } catch (error: any) {
      sendError(
        res,
        500,
        'TIMESHEET_REPORT_FAILED',
        'Error al generar el reporte de timesheet de operadores',
        error.message
      );
    }
  };
}
