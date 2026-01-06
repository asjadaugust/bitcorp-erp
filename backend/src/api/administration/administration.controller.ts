/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { CostCenterService } from '../../services/cost-center.service';

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
      console.error('Error fetching cost centers:', error);
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
      console.error('Error creating cost center:', error);
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
      console.error('Error fetching cost center:', error);
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
      console.error('Error updating cost center:', error);
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
      console.error('Error deleting cost center:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting cost center',
        error: error.message,
      });
    }
  };
}
