/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ProviderFinancialInfoService } from '../../services/provider-financial-info.service';
import { sendError, sendSuccess, sendCreated } from '../../utils/api-response';

export class ProviderFinancialInfoController {
  private service: ProviderFinancialInfoService;

  constructor() {
    this.service = new ProviderFinancialInfoService();
  }

  /**
   * GET /api/providers/:providerId/financial-info
   * Get all financial info for a provider
   */
  getByProviderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de proveedor inválido');
        return;
      }

      const financialInfo = await this.service.findByProviderId(providerId);
      sendSuccess(res, financialInfo);
    } catch (error: any) {
      sendError(
        res,
        500,
        'PROVIDER_FINANCIAL_INFO_LIST_FAILED',
        'Error al obtener la información financiera del proveedor',
        error.message
      );
    }
  };

  /**
   * GET /api/providers/financial-info/:id
   * Get financial info by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const financialInfo = await this.service.findById(id);
      if (!financialInfo) {
        sendError(
          res,
          404,
          'PROVIDER_FINANCIAL_INFO_NOT_FOUND',
          'Información financiera no encontrada'
        );
        return;
      }
      sendSuccess(res, financialInfo);
    } catch (error: any) {
      if (error.message === 'Financial info not found') {
        sendError(
          res,
          404,
          'PROVIDER_FINANCIAL_INFO_NOT_FOUND',
          'Información financiera no encontrada'
        );
        return;
      }
      sendError(
        res,
        500,
        'PROVIDER_FINANCIAL_INFO_GET_FAILED',
        'Error al obtener la información financiera',
        error.message
      );
    }
  };

  /**
   * POST /api/providers/:providerId/financial-info
   * Create new financial info
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de proveedor inválido');
        return;
      }

      const data = {
        ...req.body,
        provider_id: providerId,
        created_by: (req as any).user?.id,
      };

      const financialInfo = await this.service.create(data);
      sendCreated(res, financialInfo);
    } catch (error: any) {
      sendError(
        res,
        400,
        'PROVIDER_FINANCIAL_INFO_CREATE_FAILED',
        'Error al crear la información financiera',
        error.message
      );
    }
  };

  /**
   * PUT /api/providers/financial-info/:id
   * Update financial info
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const data = {
        ...req.body,
        updated_by: (req as any).user?.id,
      };

      const financialInfo = await this.service.update(id, data);
      if (!financialInfo) {
        sendError(
          res,
          404,
          'PROVIDER_FINANCIAL_INFO_NOT_FOUND',
          'Información financiera no encontrada'
        );
        return;
      }
      sendSuccess(res, financialInfo);
    } catch (error: any) {
      if (error.message === 'Financial info not found') {
        sendError(
          res,
          404,
          'PROVIDER_FINANCIAL_INFO_NOT_FOUND',
          'Información financiera no encontrada'
        );
        return;
      }
      sendError(
        res,
        400,
        'PROVIDER_FINANCIAL_INFO_UPDATE_FAILED',
        'Error al actualizar la información financiera',
        error.message
      );
    }
  };

  /**
   * DELETE /api/providers/financial-info/:id
   * Delete financial info
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const deleted = await this.service.delete(id);

      if (deleted) {
        res.status(204).send();
      } else {
        sendError(
          res,
          404,
          'PROVIDER_FINANCIAL_INFO_NOT_FOUND',
          'Información financiera no encontrada'
        );
      }
    } catch (error: any) {
      sendError(
        res,
        500,
        'PROVIDER_FINANCIAL_INFO_DELETE_FAILED',
        'Error al eliminar la información financiera',
        error.message
      );
    }
  };
}
