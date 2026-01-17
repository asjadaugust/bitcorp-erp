/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { CostCenterService } from '../../services/cost-center.service';
import Logger from '../../utils/logger';
import { sendSuccess, sendError, sendCreated } from '../../utils/api-response';

export class AdministrationController {
  private costCenterService = new CostCenterService();

  getCostCenters = async (req: Request, res: Response) => {
    try {
      const { search, project_id } = req.query;
      const costCenters = await this.costCenterService.findAll({
        search: search as string,
        projectId: project_id ? parseInt(project_id as string) : undefined,
      });
      sendSuccess(res, costCenters);
    } catch (error: any) {
      Logger.error('Error fetching cost centers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'AdministrationController.getCostCenters',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al obtener los centros de costo');
    }
  };

  createCostCenter = async (req: Request, res: Response) => {
    try {
      const costCenter = await this.costCenterService.create(req.body);
      sendCreated(res, costCenter);
    } catch (error: any) {
      Logger.error('Error creating cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'AdministrationController.createCostCenter',
      });
      sendError(res, 500, 'CREATE_FAILED', 'Error al crear el centro de costo');
    }
  };

  getCostCenterById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const costCenter = await this.costCenterService.findById(id);
      if (!costCenter) {
        sendError(res, 404, 'COST_CENTER_NOT_FOUND', 'Centro de costo no encontrado');
        return;
      }

      sendSuccess(res, costCenter);
    } catch (error: any) {
      Logger.error('Error fetching cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'AdministrationController.getCostCenterById',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al obtener el centro de costo');
    }
  };

  updateCostCenter = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const costCenter = await this.costCenterService.update(id, req.body);
      sendSuccess(res, costCenter);
    } catch (error: any) {
      Logger.error('Error updating cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'AdministrationController.updateCostCenter',
      });
      sendError(res, 500, 'UPDATE_FAILED', 'Error al actualizar el centro de costo');
    }
  };

  deleteCostCenter = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      await this.costCenterService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error deleting cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'AdministrationController.deleteCostCenter',
      });
      sendError(res, 500, 'DELETE_FAILED', 'Error al eliminar el centro de costo');
    }
  };
}
