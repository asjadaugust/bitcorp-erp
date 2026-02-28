/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { DashboardService } from '../../services/dashboard.service';
import Logger from '../../utils/logger';
import { sendSuccess, sendError } from '../../utils/api-response';

export class DashboardController {
  private dashboardService = new DashboardService();

  /**
   * GET /api/dashboard/modules
   * Get all modules with permissions for current user
   */
  getModules = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;

      if (!userId) {
        sendError(res, 401, 'UNAUTHORIZED', 'No autorizado');
        return;
      }

      const modules = await this.dashboardService.getModulesForUser(userId.toString());

      sendSuccess(res, modules);
    } catch (error) {
      Logger.error('Error in getModules', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'DashboardController.getModules',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al obtener los módulos');
    }
  };

  /**
   * GET /api/dashboard/user-info
   * Get current user information with active project
   */
  getUserInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user!.id_empresa;
      const userId = (req as any).user?.id || (req as any).user?.userId;

      if (!userId) {
        sendError(res, 401, 'UNAUTHORIZED', 'No autorizado');
        return;
      }

      const userInfo = await this.dashboardService.getUserInfo(tenantId, userId.toString());

      sendSuccess(res, userInfo);
    } catch (error) {
      Logger.error('Error in getUserInfo', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'DashboardController.getUserInfo',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al obtener la información del usuario');
    }
  };

  /**
   * PUT /api/dashboard/switch-project
   * Switch user's active project
   */
  switchProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user!.id_empresa;
      const userId = (req as any).user?.id || (req as any).user?.userId;
      const { project_id } = req.body;

      if (!userId) {
        sendError(res, 401, 'UNAUTHORIZED', 'No autorizado');
        return;
      }

      if (!project_id) {
        sendError(res, 400, 'VALIDATION_ERROR', 'El ID del proyecto es requerido');
        return;
      }

      // Validate project_id is a valid number (can be string or number)
      const projectIdStr = String(project_id);
      const projectIdNum = parseInt(projectIdStr);
      if (isNaN(projectIdNum)) {
        sendError(res, 400, 'INVALID_ID', 'El ID del proyecto debe ser un número');
        return;
      }

      const project = await this.dashboardService.switchProject(
        tenantId,
        userId.toString(),
        projectIdStr
      );

      sendSuccess(res, {
        active_project: project,
        message: 'Proyecto cambiado exitosamente',
      });
    } catch (error) {
      Logger.error('Error in switchProject', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.body.project_id,
        context: 'DashboardController.switchProject',
      });

      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar de proyecto';
      sendError(res, 400, 'SWITCH_PROJECT_FAILED', errorMessage);
    }
  };

  /**
   * GET /api/dashboard/document-alerts
   * Get document expiry alerts summary
   */
  getDocumentAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user!.id_empresa;
      const alerts = await this.dashboardService.getDocumentAlerts(tenantId);
      sendSuccess(res, alerts);
    } catch (error) {
      Logger.error('Error in getDocumentAlerts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'DashboardController.getDocumentAlerts',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al obtener las alertas de documentos');
    }
  };

  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user!.id_empresa;
      const userId = (req as any).user?.id || (req as any).user?.userId;
      const projectId = req.query.project_id as string | undefined;

      if (!userId) {
        sendError(res, 401, 'UNAUTHORIZED', 'No autorizado');
        return;
      }

      const stats = await this.dashboardService.getDashboardStats(
        tenantId,
        userId.toString(),
        projectId
      );

      sendSuccess(res, stats);
    } catch (error) {
      Logger.error('Error in getStats', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'DashboardController.getStats',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al obtener las estadísticas');
    }
  };
}
