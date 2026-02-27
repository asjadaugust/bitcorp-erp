/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { TenderService } from '../../services/tender.service';
import { sendSuccess, sendError, sendCreated } from '../../utils/api-response';
import { NotFoundError, ConflictError } from '../../errors';
import { EstadoLicitacion } from '../../types/dto/tender.dto';
import Logger from '../../utils/logger';

/**
 * TenderController - Handles HTTP requests for tender/bid (licitaciones) management
 *
 * Following ARCHITECTURE.md patterns:
 * - Passes tenantId to all service methods
 * - Handles typed errors (NotFoundError, ConflictError)
 * - Returns standardized API responses
 * - Extracts pagination and filter parameters
 */
export class TenderController {
  private tenderService = new TenderService();

  /**
   * GET /api/tenders
   * List all tenders with optional filters and pagination
   */
  getTenders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;

      // Extract pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Extract filter parameters
      const filters: { search?: string; estado?: EstadoLicitacion } = {};
      if (req.query.search) {
        filters.search = req.query.search as string;
      }
      if (req.query.estado) {
        filters.estado = req.query.estado as EstadoLicitacion;
      }

      const result = await this.tenderService.findAll(tenantId, filters, page, limit);

      sendSuccess(res, result.data, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error: any) {
      Logger.error('Error in getTenders', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'TenderController.getTenders',
      });
      sendError(res, 500, 'TENDERS_FETCH_FAILED', 'Error al obtener las licitaciones');
    }
  };

  /**
   * GET /api/tenders/:id
   * Get single tender by ID
   */
  getTenderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      const tender = await this.tenderService.findById(tenantId, id);
      sendSuccess(res, tender);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'TENDER_NOT_FOUND', 'Licitación no encontrada');
        return;
      }
      Logger.error('Error in getTenderById', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'TenderController.getTenderById',
      });
      sendError(res, 500, 'TENDER_FETCH_FAILED', 'Error al obtener la licitación');
    }
  };

  /**
   * POST /api/tenders
   * Create new tender
   */
  createTender = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;

      const tender = await this.tenderService.create(tenantId, req.body);
      sendCreated(res, tender);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        sendError(res, 409, 'TENDER_CONFLICT', error.message);
        return;
      }
      Logger.error('Error in createTender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'TenderController.createTender',
      });
      sendError(res, 500, 'TENDER_CREATE_FAILED', 'Error al crear la licitación');
    }
  };

  /**
   * PUT /api/tenders/:id
   * Update existing tender
   */
  updateTender = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      const tender = await this.tenderService.update(tenantId, id, req.body);
      sendSuccess(res, tender);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'TENDER_NOT_FOUND', 'Licitación no encontrada');
        return;
      }
      if (error instanceof ConflictError) {
        sendError(res, 409, 'TENDER_CONFLICT', error.message);
        return;
      }
      Logger.error('Error in updateTender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'TenderController.updateTender',
      });
      sendError(res, 500, 'TENDER_UPDATE_FAILED', 'Error al actualizar la licitación');
    }
  };

  /**
   * DELETE /api/tenders/:id
   * Delete tender
   */
  deleteTender = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      await this.tenderService.delete(tenantId, id);
      sendSuccess(res, { message: 'Licitación eliminada exitosamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'TENDER_NOT_FOUND', 'Licitación no encontrada');
        return;
      }
      Logger.error('Error in deleteTender', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'TenderController.deleteTender',
      });
      sendError(res, 500, 'TENDER_DELETE_FAILED', 'Error al eliminar la licitación');
    }
  };
}
