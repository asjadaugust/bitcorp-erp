import { Request, Response, NextFunction } from 'express';
import { ReportingService } from '../../services/reporting.service';
import { ExportService } from '../../services/export.service';

export class ReportingController {
  private reportingService: ReportingService;
  private exportService: ExportService;

  constructor() {
    this.reportingService = new ReportingService();
    this.exportService = new ExportService();
  }

  getEquipmentUtilization = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, format } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      const data = await this.reportingService.getEquipmentUtilization(
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
        await this.exportService.generateExcel(data, columns, 'Utilización', res, 'reporte-utilizacion');
      } else {
        res.json({ success: true, data });
      }
    } catch (error) {
      next(error);
    }
  };

  getMaintenanceHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, format } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      const data = await this.reportingService.getMaintenanceHistory(
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
        await this.exportService.generateExcel(data, columns, 'Mantenimiento', res, 'reporte-mantenimiento');
      } else {
        res.json({ success: true, data });
      }
    } catch (error) {
      next(error);
    }
  };

  getInventoryMovements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, format } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      const data = await this.reportingService.getInventoryMovements(
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
        await this.exportService.generateExcel(data, columns, 'Inventario', res, 'reporte-inventario');
      } else {
        res.json({ success: true, data });
      }
    } catch (error) {
      next(error);
    }
  };

  getOperatorTimesheet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, format } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required' });
      }

      const data = await this.reportingService.getOperatorTimesheet(
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
        await this.exportService.generateExcel(data, columns, 'Timesheet', res, 'reporte-timesheet');
      } else {
        res.json({ success: true, data });
      }
    } catch (error) {
      next(error);
    }
  };
}
