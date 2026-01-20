/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { OperatorDocumentService } from '../../services/operator-document.service';
import { NotFoundError, ConflictError } from '../../errors/http.errors';
import {
  sendError,
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
} from '../../utils/api-response';

const documentService = new OperatorDocumentService();

export class OperatorDocumentController {
  async getDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const { trabajador_id, tipo_documento, page, limit } = req.query;

      const result = await documentService.findAll(
        tenantId,
        {
          trabajadorId: trabajador_id ? Number(trabajador_id) : undefined,
          tipoDocumento: tipo_documento as string,
        },
        page ? Number(page) : 1,
        limit ? Number(limit) : 10
      );

      sendPaginatedSuccess(res, result.data, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        total: result.total,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_LIST_FAILED',
        'Error al obtener los documentos de operadores',
        error.message
      );
    }
  }

  async getDocumentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const document = await documentService.findById(tenantId, id);
      sendSuccess(res, document);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Documento de operador no encontrado');
        return;
      }
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_GET_FAILED',
        'Error al obtener el documento del operador',
        error.message
      );
    }
  }

  async getDocumentsByOperator(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const operatorId = parseInt(req.params.operatorId);
      if (isNaN(operatorId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de operador inválido');
        return;
      }

      const documents = await documentService.findByOperator(tenantId, operatorId);
      sendSuccess(res, documents);
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENTS_LIST_FAILED',
        'Error al obtener los documentos del operador',
        error.message
      );
    }
  }

  async getExpiringDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const { days, page, limit } = req.query;

      const result = await documentService.findExpiring(
        tenantId,
        days ? Number(days) : 30,
        page ? Number(page) : 1,
        limit ? Number(limit) : 50
      );

      sendPaginatedSuccess(res, result.data, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 50,
        total: result.total,
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENTS_EXPIRING_FAILED',
        'Error al obtener los documentos próximos a vencer',
        error.message
      );
    }
  }

  async createDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const document = await documentService.create(tenantId, req.body);
      sendCreated(res, document);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        sendError(res, 409, 'OPERATOR_DOCUMENT_CONFLICT', error.message, error.metadata);
        return;
      }
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_CREATE_FAILED',
        'Error al crear el documento del operador',
        error.message
      );
    }
  }

  async updateDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const document = await documentService.update(tenantId, id, req.body);
      sendSuccess(res, document);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Documento de operador no encontrado');
        return;
      }
      if (error instanceof ConflictError) {
        sendError(res, 409, 'OPERATOR_DOCUMENT_CONFLICT', error.message, error.metadata);
        return;
      }
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_UPDATE_FAILED',
        'Error al actualizar el documento del operador',
        error.message
      );
    }
  }

  async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      await documentService.delete(tenantId, id);
      res.status(204).send();
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Documento de operador no encontrado');
        return;
      }
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_DELETE_FAILED',
        'Error al eliminar el documento del operador',
        error.message
      );
    }
  }
}
