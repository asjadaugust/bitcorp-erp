/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { OperatorDocumentService } from '../../services/operator-document.service';
import {
  sendError,
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
} from '../../utils/api-response';

const documentService = new OperatorDocumentService();

export class OperatorDocumentController {
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { trabajador_id, tipo_documento, page, limit } = req.query;
      const result = await documentService.findAll({
        trabajadorId: trabajador_id ? Number(trabajador_id) : undefined,
        tipoDocumento: tipo_documento as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendPaginatedSuccess(res, result.data, {
        page: result.page,
        limit: result.limit,
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

  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const document = await documentService.findById(id);
      if (!document) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Documento de operador no encontrado');
        return;
      }
      sendSuccess(res, document);
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_GET_FAILED',
        'Error al obtener el documento del operador',
        error.message
      );
    }
  }

  async getDocumentsByOperator(req: Request, res: Response): Promise<void> {
    try {
      const operatorId = parseInt(req.params.operatorId);
      if (isNaN(operatorId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de operador inválido');
        return;
      }

      const documents = await documentService.findByOperator(operatorId);
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

  async getExpiringDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { days } = req.query;
      const documents = await documentService.findExpiring(days ? Number(days) : 30);
      sendSuccess(res, documents);
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

  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const document = await documentService.create(req.body);
      sendCreated(res, document);
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_CREATE_FAILED',
        'Error al crear el documento del operador',
        error.message
      );
    }
  }

  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const document = await documentService.update(id, req.body);
      if (!document) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Documento de operador no encontrado');
        return;
      }
      sendSuccess(res, document);
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_UPDATE_FAILED',
        'Error al actualizar el documento del operador',
        error.message
      );
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const success = await documentService.delete(id);
      if (!success) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Documento de operador no encontrado');
        return;
      }
      res.status(204).send();
    } catch (error: any) {
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
