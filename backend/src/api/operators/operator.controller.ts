import { Request, Response, NextFunction } from 'express';
import { OperatorService } from '../../services/operator.service';

const operatorService = new OperatorService();

export class OperatorController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search, skill, page, limit } = req.query;
      const result = await operatorService.findAll({
        isActive: status === 'active' || status === 'activo' || !status ? true : false,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: parseInt(limit as string) || 10,
          total: result.total,
          totalPages: Math.ceil(result.total / (parseInt(limit as string) || 10)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const operator = await operatorService.findById(parseInt(id));
      
      res.json({
        success: true,
        data: operator,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const operator = await operatorService.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Operator created successfully',
        data: operator,
      });
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email or DNI already exists' });
      }
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const userId = (req as any).user?.id;
      const operator = await operatorService.update(parseInt(id), req.body);
      
      res.json({
        success: true,
        message: 'Operator updated successfully',
        data: operator,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      await operatorService.delete(parseInt(id));
      
      res.json({
        success: true,
        message: 'Operator deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchBySkill(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Implement searchOperatorsBySkill method in OperatorService
      res.json({
        success: true,
        data: [],
        message: 'Method not yet implemented'
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
        message: 'Method not yet implemented'
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
        message: 'Method not yet implemented'
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
      const { search, skillIds, status } = req.query;
      
      const filters: any = {};
      if (search) filters.search = search as string;
      if (skillIds) filters.skillIds = (skillIds as string).split(',').map(Number);
      if (status) filters.status = status as string;
      
      const result = await operatorService.findAll(filters);
      const operators = result.data;
      
      const data = operators.map((op: any) => ({
        codigo: op.employee_code || '',
        nombre: `${op.first_name} ${op.last_name}`,
        documento: op.national_id,
        telefono: op.phone || '',
        email: op.email || '',
        habilidades: op.skills?.map((s: any) => s.skill_name).join(', ') || '',
        estado: op.status,
        fecha_contrato: ExportUtil.formatDate(op.hire_date),
      }));
      
      const columns = [
        { header: 'Código', key: 'codigo', width: 12 },
        { header: 'Nombre Completo', key: 'nombre', width: 30 },
        { header: 'Documento', key: 'documento', width: 15 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Habilidades', key: 'habilidades', width: 40 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Fecha Contrato', key: 'fecha_contrato', width: 15 },
      ];
      
      await ExportUtil.exportToExcel(res, data, columns, `operadores_${Date.now()}`);
    } catch (error) {
      next(error);
    }
  }

  static async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { ExportUtil } = await import('../../utils/export.util');
      const { search, skillIds, status } = req.query;
      
      const filters: any = {};
      if (search) filters.search = search as string;
      if (skillIds) filters.skillIds = (skillIds as string).split(',').map(Number);
      if (status) filters.status = status as string;
      
      const result2 = await operatorService.findAll(filters);
      const operators2 = result2.data;
      
      const data = operators2.map((op: any) => ({
        codigo: op.employee_code || '',
        nombre: `${op.first_name} ${op.last_name}`,
        documento: op.national_id,
        telefono: op.phone || '',
        email: op.email || '',
        habilidades: op.skills?.map((s: any) => s.skill_name).join(', ') || '',
        estado: op.status,
        fecha_contrato: ExportUtil.formatDate(op.hire_date),
      }));
      
      const fields = [
        { label: 'Código', value: 'codigo' },
        { label: 'Nombre Completo', value: 'nombre' },
        { label: 'Documento', value: 'documento' },
        { label: 'Teléfono', value: 'telefono' },
        { label: 'Email', value: 'email' },
        { label: 'Habilidades', value: 'habilidades' },
        { label: 'Estado', value: 'estado' },
        { label: 'Fecha Contrato', value: 'fecha_contrato' },
      ];
      
      ExportUtil.exportToCSV(res, data, fields, `operadores_${Date.now()}`);
    } catch (error) {
      next(error);
    }
  }
}
