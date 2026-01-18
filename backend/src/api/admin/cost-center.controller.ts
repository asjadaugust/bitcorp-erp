/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { CostCenterService } from '../../services/cost-center.service';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';
import { toCostCenterListDtoArray, toCostCenterDetailDto } from '../../types/dto/cost-center.dto';
import Logger from '../../utils/logger';

const costCenterService = new CostCenterService();

export class CostCenterController {
  /**
   * GET /api/admin/cost-centers
   * Get all cost centers with optional filters and pagination
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, project_id, is_active } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const sort_by = req.query.sort_by as string;
      const sort_order =
        (req.query.sort_order as string)?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const filters: any = {
        page,
        limit,
        sort_by,
        sort_order,
      };

      if (search) filters.search = String(search);
      if (project_id) filters.projectId = parseInt(String(project_id));
      if (is_active !== undefined) filters.isActive = is_active === 'true';

      const result = await costCenterService.findAll(filters);

      // Transform entities to DTOs (snake_case)
      const dtos = toCostCenterListDtoArray(result.data);

      sendPaginatedSuccess(res, dtos, {
        page,
        limit,
        total: result.total,
      });
    } catch (error: any) {
      Logger.error('Error in getAll cost centers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'CostCenterController.getAll',
      });
      sendError(
        res,
        500,
        'COST_CENTER_LIST_FAILED',
        'Error al obtener centros de costo',
        error.message
      );
    }
  }

  /**
   * GET /api/admin/cost-centers/:id
   * Get cost center by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de centro de costo inválido');
        return;
      }

      const costCenter = await costCenterService.findById(id);

      // Transform to DTO (snake_case)
      const dto = toCostCenterDetailDto(costCenter as any);

      sendSuccess(res, dto);
    } catch (error: any) {
      Logger.error('Error in getById cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'CostCenterController.getById',
      });

      if (error.message === 'Cost center not found') {
        sendError(res, 404, 'COST_CENTER_NOT_FOUND', 'Centro de costo no encontrado');
        return;
      }

      sendError(
        res,
        500,
        'COST_CENTER_FETCH_FAILED',
        'Error al obtener centro de costo',
        error.message
      );
    }
  }

  /**
   * GET /api/admin/cost-centers/code/:code
   * Get cost center by code
   */
  static async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const costCenter = await costCenterService.findByCode(code);

      if (!costCenter) {
        sendError(res, 404, 'COST_CENTER_NOT_FOUND', 'Centro de costo no encontrado');
        return;
      }

      // Transform to DTO (snake_case)
      const dto = toCostCenterDetailDto(costCenter as any);

      sendSuccess(res, dto);
    } catch (error: any) {
      Logger.error('Error in getByCode cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: req.params.code,
        context: 'CostCenterController.getByCode',
      });
      sendError(
        res,
        500,
        'COST_CENTER_FETCH_FAILED',
        'Error al obtener centro de costo',
        error.message
      );
    }
  }

  /**
   * GET /api/admin/cost-centers/project/:project_id
   * Get cost centers by project
   */
  static async getByProject(req: Request, res: Response): Promise<void> {
    try {
      const project_id = parseInt(req.params.project_id);

      if (isNaN(project_id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de proyecto inválido');
        return;
      }

      const costCenters = await costCenterService.findByProject(project_id);

      // Transform to DTOs (snake_case)
      const dtos = toCostCenterListDtoArray(costCenters);

      sendSuccess(res, dtos);
    } catch (error: any) {
      Logger.error('Error in getByProject', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.project_id,
        context: 'CostCenterController.getByProject',
      });
      sendError(
        res,
        500,
        'COST_CENTER_LIST_FAILED',
        'Error al obtener centros de costo',
        error.message
      );
    }
  }

  /**
   * POST /api/admin/cost-centers
   * Create new cost center
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const costCenter = await costCenterService.create(req.body);

      sendCreated(res, costCenter.id, 'Centro de costo creado exitosamente');
    } catch (error: any) {
      Logger.error('Error in create cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'CostCenterController.create',
      });

      if (error.message.includes('already exists')) {
        sendError(res, 409, 'COST_CENTER_DUPLICATE', error.message);
        return;
      }

      if (error.message.includes('required')) {
        sendError(res, 400, 'VALIDATION_ERROR', error.message);
        return;
      }

      sendError(
        res,
        500,
        'COST_CENTER_CREATE_FAILED',
        'Error al crear centro de costo',
        error.message
      );
    }
  }

  /**
   * PUT /api/admin/cost-centers/:id
   * Update cost center
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de centro de costo inválido');
        return;
      }

      const costCenter = await costCenterService.update(id, req.body);

      // Transform to DTO (snake_case)
      const dto = toCostCenterDetailDto(costCenter as any);

      sendSuccess(res, dto);
    } catch (error: any) {
      Logger.error('Error in update cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'CostCenterController.update',
      });

      if (error.message === 'Cost center not found') {
        sendError(res, 404, 'COST_CENTER_NOT_FOUND', 'Centro de costo no encontrado');
        return;
      }

      if (error.message.includes('already exists')) {
        sendError(res, 409, 'COST_CENTER_DUPLICATE', error.message);
        return;
      }

      sendError(
        res,
        500,
        'COST_CENTER_UPDATE_FAILED',
        'Error al actualizar centro de costo',
        error.message
      );
    }
  }

  /**
   * DELETE /api/admin/cost-centers/:id
   * Soft delete cost center
   */
  static async remove(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de centro de costo inválido');
        return;
      }

      await costCenterService.delete(id);

      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error in delete cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'CostCenterController.delete',
      });
      sendError(
        res,
        500,
        'COST_CENTER_DELETE_FAILED',
        'Error al eliminar centro de costo',
        error.message
      );
    }
  }

  /**
   * GET /api/admin/cost-centers/stats/count
   * Get active cost centers count
   */
  static async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await costCenterService.getActiveCount();

      sendSuccess(res, { count });
    } catch (error: any) {
      Logger.error('Error in getActiveCount', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'CostCenterController.getActiveCount',
      });
      sendError(
        res,
        500,
        'COST_CENTER_COUNT_FAILED',
        'Error al contar centros de costo',
        error.message
      );
    }
  }

  /**
   * GET /api/admin/cost-centers/project/:project_id/budget
   * Get total budget for project
   */
  static async getProjectBudget(req: Request, res: Response): Promise<void> {
    try {
      const project_id = parseInt(req.params.project_id);

      if (isNaN(project_id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de proyecto inválido');
        return;
      }

      const total = await costCenterService.getTotalBudgetByProject(project_id);

      sendSuccess(res, { project_id, total_budget: total });
    } catch (error: any) {
      Logger.error('Error in getProjectBudget', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.project_id,
        context: 'CostCenterController.getProjectBudget',
      });
      sendError(
        res,
        500,
        'COST_CENTER_BUDGET_FAILED',
        'Error al calcular presupuesto',
        error.message
      );
    }
  }
}
