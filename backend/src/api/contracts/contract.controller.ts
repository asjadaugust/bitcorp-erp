/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ContractService } from '../../services/contract.service';
import Logger from '../../utils/logger';
import {
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
  sendError,
} from '../../utils/api-response';

const contractService = new ContractService();

export class ContractController {
  /**
   * GET /api/contracts
   * Get all contracts with optional filters, pagination, and sorting
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        search,
        estado,
        equipment_id,
        provider_id,
        project_id,
        page,
        limit,
        sort_by,
        sort_order,
      } = req.query;

      const filters: any = {};

      if (search) filters.search = String(search);
      if (estado) filters.estado = String(estado);
      if (equipment_id) filters.equipment_id = parseInt(String(equipment_id));
      if (provider_id) filters.provider_id = parseInt(String(provider_id));
      if (project_id) filters.project_id = parseInt(String(project_id));
      if (sort_by) filters.sort_by = String(sort_by);
      if (sort_order)
        filters.sort_order = (String(sort_order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as
          | 'ASC'
          | 'DESC';

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);

      const { data, total } = await contractService.findAll(filters, pageNum, limitNum);

      sendPaginatedSuccess(res, data, { page: pageNum, limit: limitNum, total });
    } catch (error: any) {
      Logger.error('Error in getAll contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractController.getAll',
      });
      sendError(res, 500, 'CONTRACT_FETCH_FAILED', 'Failed to fetch contracts', error.message);
    }
  }

  /**
   * GET /api/contracts/:id
   * Get contract by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const contract = await contractService.findById(id);

      sendSuccess(res, contract);
    } catch (error: any) {
      Logger.error('Error in getById contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId: req.params.id,
        context: 'ContractController.getById',
      });

      if (error.message === 'Contract not found') {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', 'Contract not found');
        return;
      }

      sendError(res, 500, 'CONTRACT_FETCH_FAILED', 'Failed to fetch contract', error.message);
    }
  }

  /**
   * GET /api/contracts/numero/:numero
   * Get contract by numero_contrato
   */
  static async getByNumero(req: Request, res: Response): Promise<void> {
    try {
      const { numero } = req.params;

      const contract = await contractService.findByNumero(numero);

      if (!contract) {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', 'Contract not found');
        return;
      }

      sendSuccess(res, contract);
    } catch (error: any) {
      Logger.error('Error in getByNumero contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        numero: req.params.numero,
        context: 'ContractController.getByNumero',
      });
      sendError(res, 500, 'CONTRACT_FETCH_FAILED', 'Failed to fetch contract', error.message);
    }
  }

  /**
   * POST /api/contracts
   * Create new contract
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const contract = await contractService.create(req.body);

      sendCreated(res, contract);
    } catch (error: any) {
      Logger.error('Error in create contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractController.create',
      });

      if (error.message.includes('already exists')) {
        sendError(res, 409, 'DUPLICATE_CONTRACT', error.message);
        return;
      }

      if (error.message.includes('required')) {
        sendError(res, 400, 'VALIDATION_ERROR', error.message);
        return;
      }

      sendError(res, 500, 'CONTRACT_CREATE_FAILED', 'Failed to create contract', error.message);
    }
  }

  /**
   * PUT /api/contracts/:id
   * Update contract
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const contract = await contractService.update(id, req.body);

      sendSuccess(res, contract);
    } catch (error: any) {
      Logger.error('Error in update contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId: req.params.id,
        context: 'ContractController.update',
      });

      if (error.message === 'Contract not found') {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', 'Contract not found');
        return;
      }

      sendError(res, 500, 'CONTRACT_UPDATE_FAILED', 'Failed to update contract', error.message);
    }
  }

  /**
   * DELETE /api/contracts/:id
   * Cancel contract (soft delete)
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      await contractService.delete(id);

      res.status(204).send();
    } catch (error: any) {
      Logger.error('Error in delete contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId: req.params.id,
        context: 'ContractController.delete',
      });
      sendError(res, 500, 'CONTRACT_DELETE_FAILED', 'Failed to delete contract', error.message);
    }
  }

  /**
   * GET /api/contracts/:id/addendums
   * Get all addendums for a contract
   */
  static async getAddendums(req: Request, res: Response): Promise<void> {
    try {
      const contractId = parseInt(req.params.id);

      if (isNaN(contractId)) {
        sendError(res, 400, 'INVALID_ID', 'Invalid contract ID');
        return;
      }

      const addendums = await contractService.getAddendums(contractId);

      sendSuccess(res, addendums);
    } catch (error: any) {
      Logger.error('Error in getAddendums', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId: req.params.id,
        context: 'ContractController.getAddendums',
      });
      sendError(res, 500, 'ADDENDUM_FETCH_FAILED', 'Failed to fetch addendums', error.message);
    }
  }

  /**
   * POST /api/contracts/addendums
   * Create addendum for a contract
   */
  static async createAddendum(req: Request, res: Response): Promise<void> {
    try {
      const addendum = await contractService.createAddendum(req.body);

      sendCreated(res, addendum);
    } catch (error: any) {
      Logger.error('Error in createAddendum', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractController.createAddendum',
      });

      if (error.message.includes('not found')) {
        sendError(res, 404, 'CONTRACT_NOT_FOUND', error.message);
        return;
      }

      sendError(res, 500, 'ADDENDUM_CREATE_FAILED', 'Failed to create addendum', error.message);
    }
  }

  /**
   * GET /api/contracts/stats/count
   * Get active contract count
   */
  static async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await contractService.getActiveCount();

      sendSuccess(res, { count });
    } catch (error: any) {
      Logger.error('Error in getActiveCount', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractController.getActiveCount',
      });
      sendError(res, 500, 'COUNT_FETCH_FAILED', 'Failed to fetch count', error.message);
    }
  }
}
