/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { OperatorService } from '../../services/operator.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';

const operatorService = new OperatorService();

export class OperatorController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, cargo, especialidad, page, limit, sort_by, sort_order } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);

      const filters = {
        isActive: status === 'active' || status === 'activo' || !status ? true : false,
        search: search as string,
        cargo: cargo as string,
        especialidad: especialidad as string,
        page: pageNum,
        limit: limitNum,
        sort_by: sort_by as string,
        sort_order: (String(sort_order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as
          | 'ASC'
          | 'DESC',
      };

      const result = await operatorService.findAll(filters);

      sendPaginatedSuccess(res, result.data, {
        page: pageNum,
        limit: limitNum,
        total: result.total,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'FETCH_OPERATORS_FAILED',
        'No se pudieron obtener los operadores',
        error.message
      );
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de operador inválido');
        return;
      }

      const operator = await operatorService.findById(id);
      sendSuccess(res, operator);
    } catch (error: any) {
      if (error.message === 'Operator not found') {
        sendError(res, 404, 'OPERATOR_NOT_FOUND', 'Operador no encontrado');
        return;
      }
      sendError(res, 500, 'FETCH_OPERATOR_FAILED', 'No se pudo obtener el operador', error.message);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const operator = await operatorService.create(req.body);
      sendCreated(res, operator);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        sendError(res, 409, 'DUPLICATE_OPERATOR', error.message);
        return;
      }
      sendError(res, 400, 'CREATE_OPERATOR_FAILED', 'No se pudo crear el operador', error.message);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de operador inválido');
        return;
      }

      const operator = await operatorService.update(id, req.body);
      sendSuccess(res, operator);
    } catch (error: any) {
      if (error.message === 'Operator not found') {
        sendError(res, 404, 'OPERATOR_NOT_FOUND', 'Operador no encontrado');
        return;
      }
      if (error.message?.includes('already exists')) {
        sendError(res, 409, 'DUPLICATE_OPERATOR', error.message);
        return;
      }
      sendError(
        res,
        500,
        'UPDATE_OPERATOR_FAILED',
        'No se pudo actualizar el operador',
        error.message
      );
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de operador inválido');
        return;
      }

      await operatorService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        500,
        'DELETE_OPERATOR_FAILED',
        'No se pudo eliminar el operador',
        error.message
      );
    }
  }

  static async searchBySkill(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement searchOperatorsBySkill method in OperatorService
      res.json({
        success: true,
        data: [],
        message: 'Method not yet implemented',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement getOperatorAvailability method in OperatorService
      res.json({
        success: true,
        data: {},
        message: 'Method not yet implemented',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement getOperatorPerformance method in OperatorService
      res.json({
        success: true,
        data: {},
        message: 'Method not yet implemented',
      });

      res.json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { ExportUtil } = await import('../../utils/export.util');
      const { search, cargo, especialidad, status } = req.query;

      const filters: any = {
        isActive: status === 'active' || status === 'activo' || !status ? true : false,
      };
      if (search) filters.search = search as string;
      if (cargo) filters.cargo = cargo as string;
      if (especialidad) filters.especialidad = especialidad as string;

      const result = await operatorService.findAll(filters);
      const operators = result.data;

      const data = operators.map((op: any) => ({
        dni: op.dni || '',
        nombre_completo: op.nombre_completo,
        telefono: op.telefono || '',
        email: op.email || '',
        cargo: op.cargo || '',
        especialidad: op.especialidad || '',
        fecha_ingreso: ExportUtil.formatDate(op.fecha_ingreso),
      }));

      const columns = [
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Nombre Completo', key: 'nombre_completo', width: 30 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Cargo', key: 'cargo', width: 20 },
        { header: 'Especialidad', key: 'especialidad', width: 20 },
        { header: 'Fecha Ingreso', key: 'fecha_ingreso', width: 15 },
      ];

      await ExportUtil.exportToExcel(res, data, columns, `operadores_${Date.now()}`);
    } catch (error: any) {
      sendError(res, 500, 'EXPORT_EXCEL_FAILED', 'No se pudo exportar a Excel', error.message);
    }
  }

  static async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { ExportUtil } = await import('../../utils/export.util');
      const { search, cargo, especialidad, status } = req.query;

      const filters: any = {
        isActive: status === 'active' || status === 'activo' || !status ? true : false,
      };
      if (search) filters.search = search as string;
      if (cargo) filters.cargo = cargo as string;
      if (especialidad) filters.especialidad = especialidad as string;

      const result = await operatorService.findAll(filters);
      const operators = result.data;

      const data = operators.map((op: any) => ({
        dni: op.dni || '',
        nombre_completo: op.nombre_completo,
        telefono: op.telefono || '',
        email: op.email || '',
        cargo: op.cargo || '',
        especialidad: op.especialidad || '',
        fecha_ingreso: ExportUtil.formatDate(op.fecha_ingreso),
      }));

      const fields = [
        { label: 'DNI', value: 'dni' },
        { label: 'Nombre Completo', value: 'nombre_completo' },
        { label: 'Teléfono', value: 'telefono' },
        { label: 'Email', value: 'email' },
        { label: 'Cargo', value: 'cargo' },
        { label: 'Especialidad', value: 'especialidad' },
        { label: 'Fecha Ingreso', value: 'fecha_ingreso' },
      ];

      ExportUtil.exportToCSV(res, data, fields, `operadores_${Date.now()}`);
    } catch (error: any) {
      sendError(res, 500, 'EXPORT_CSV_FAILED', 'No se pudo exportar a CSV', error.message);
    }
  }
}
