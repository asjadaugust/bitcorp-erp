/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Response } from 'express';
import { AccountsPayableService } from '../../services/accounts-payable.service';
import {
  sendError,
  sendSuccess,
  sendPaginatedSuccess,
  sendCreated,
} from '../../utils/api-response';
import Logger from '../../utils/logger';
import { AuthRequest } from '../../middleware/auth.middleware';

export class AccountsPayableController {
  private service: AccountsPayableService;

  constructor() {
    this.service = new AccountsPayableService();
  }

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const data = req.body;
      const result = await this.service.create(tenantId, data);
      sendCreated(res, result);
    } catch (error) {
      Logger.error('Error creating accounts payable', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'AccountsPayableController.create',
      });
      sendError(
        res,
        500,
        'ACCOUNTS_PAYABLE_CREATE_FAILED',
        'Error al crear cuenta por pagar',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  findAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      // Extract and validate pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

      const filters = {
        page,
        limit,
        sort_by: req.query.sort_by as string,
        sort_order: req.query.sort_order as 'ASC' | 'DESC',
      };

      const result = await this.service.findAll(tenantId, filters);
      sendPaginatedSuccess(res, result.data, { page, limit, total: result.total });
    } catch (error) {
      Logger.error('Error fetching accounts payable', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'AccountsPayableController.findAll',
      });
      sendError(
        res,
        500,
        'ACCOUNTS_PAYABLE_LIST_FAILED',
        'Error al obtener cuentas por pagar',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  findOne = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de cuenta por pagar debe ser un número');
        return;
      }

      const result = await this.service.findOne(tenantId, id);
      if (!result) {
        sendError(res, 404, 'ACCOUNTS_PAYABLE_NOT_FOUND', 'Cuenta por pagar no encontrada');
        return;
      }
      sendSuccess(res, result);
    } catch (error) {
      Logger.error('Error fetching accounts payable by id', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id: req.params.id,
        context: 'AccountsPayableController.findOne',
      });
      sendError(
        res,
        500,
        'ACCOUNTS_PAYABLE_GET_FAILED',
        'Error al obtener cuenta por pagar',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de cuenta por pagar debe ser un número');
        return;
      }

      const data = req.body;
      const result = await this.service.update(tenantId, id, data);
      if (!result) {
        sendError(res, 404, 'ACCOUNTS_PAYABLE_NOT_FOUND', 'Cuenta por pagar no encontrada');
        return;
      }
      sendSuccess(res, result);
    } catch (error) {
      Logger.error('Error updating accounts payable', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id: req.params.id,
        context: 'AccountsPayableController.update',
      });
      sendError(
        res,
        500,
        'ACCOUNTS_PAYABLE_UPDATE_FAILED',
        'Error al actualizar cuenta por pagar',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de cuenta por pagar debe ser un número');
        return;
      }

      const result = await this.service.delete(tenantId, id);
      if (!result) {
        sendError(res, 404, 'ACCOUNTS_PAYABLE_NOT_FOUND', 'Cuenta por pagar no encontrada');
        return;
      }
      res.status(204).send();
    } catch (error) {
      Logger.error('Error deleting accounts payable', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        accountId: req.params.id,
        context: 'AccountsPayableController.remove',
      });
      sendError(
        res,
        500,
        'ACCOUNTS_PAYABLE_DELETE_FAILED',
        'Error al eliminar cuenta por pagar',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  findPending = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const result = await this.service.findPending(tenantId);
      sendSuccess(res, result);
    } catch (error) {
      Logger.error('Error fetching pending accounts payable', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'AccountsPayableController.findPending',
      });
      sendError(
        res,
        500,
        'ACCOUNTS_PAYABLE_PENDING_FAILED',
        'Error al obtener cuentas pendientes',
        error instanceof Error ? error.message : String(error)
      );
    }
  };
}
