/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { CostCenterService } from '../../services/cost-center.service';
import Logger from '../../utils/logger';

export class AdministrationController {
  private costCenterService = new CostCenterService();

  getCostCenters = async (req: Request, res: Response) => {
    try {
      const { search, project_id } = req.query;
      const costCenters = await this.costCenterService.findAll({
        search: search as string,
        projectId: project_id ? parseInt(project_id as string) : undefined,
      });
      res.json({
        success: true,
        data: costCenters,
      });
    } catch (error: any) {
      Logger.error('Error fetching cost centers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'AdministrationController.getCostCenters',
      });
      res.status(500).json({
        success: false,
        message: 'Error fetching cost centers',
        error: error.message,
      });
    }
  };

  createCostCenter = async (req: Request, res: Response) => {
    try {
      const costCenter = await this.costCenterService.create(req.body);
      res.status(201).json({
        success: true,
        data: costCenter,
      });
    } catch (error: any) {
      Logger.error('Error creating cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'AdministrationController.createCostCenter',
      });
      res.status(500).json({
        success: false,
        message: 'Error creating cost center',
        error: error.message,
      });
    }
  };

  getCostCenterById = async (req: Request, res: Response) => {
    try {
      const costCenter = await this.costCenterService.findById(parseInt(req.params.id));
      if (!costCenter) {
        return res.status(404).json({
          success: false,
          message: 'Cost center not found',
        });
      }
      res.json({
        success: true,
        data: costCenter,
      });
    } catch (error: any) {
      Logger.error('Error fetching cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'AdministrationController.getCostCenterById',
      });
      res.status(500).json({
        success: false,
        message: 'Error fetching cost center',
        error: error.message,
      });
    }
  };

  updateCostCenter = async (req: Request, res: Response) => {
    try {
      const costCenter = await this.costCenterService.update(parseInt(req.params.id), req.body);
      res.json({
        success: true,
        data: costCenter,
      });
    } catch (error: any) {
      Logger.error('Error updating cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'AdministrationController.updateCostCenter',
      });
      res.status(500).json({
        success: false,
        message: 'Error updating cost center',
        error: error.message,
      });
    }
  };

  deleteCostCenter = async (req: Request, res: Response) => {
    try {
      await this.costCenterService.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error deleting cost center', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        costCenterId: req.params.id,
        context: 'AdministrationController.deleteCostCenter',
      });
      res.status(500).json({
        success: false,
        message: 'Error deleting cost center',
        error: error.message,
      });
    }
  };
}
