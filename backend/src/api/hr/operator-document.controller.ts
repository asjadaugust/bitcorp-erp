/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { OperatorDocumentService } from '../../services/operator-document.service';
import { sendError } from '../../utils/api-response';

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
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_LIST_FAILED',
        'Failed to fetch operator documents',
        error.message
      );
    }
  }

  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const document = await documentService.findById(Number(id));
      if (!document) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Operator document not found');
        return;
      }
      res.json({ success: true, data: document });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_GET_FAILED',
        'Failed to fetch operator document',
        error.message
      );
    }
  }

  async getDocumentsByOperator(req: Request, res: Response): Promise<void> {
    try {
      const { operatorId } = req.params;
      const documents = await documentService.findByOperator(Number(operatorId));
      res.json({ success: true, data: documents });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENTS_LIST_FAILED',
        'Failed to fetch operator documents',
        error.message
      );
    }
  }

  async getExpiringDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { days } = req.query;
      const documents = await documentService.findExpiring(days ? Number(days) : 30);
      res.json({ success: true, data: documents });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENTS_EXPIRING_FAILED',
        'Failed to fetch expiring operator documents',
        error.message
      );
    }
  }

  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const document = await documentService.create(req.body);
      res.status(201).json({ success: true, data: document });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_CREATE_FAILED',
        'Failed to create operator document',
        error.message
      );
    }
  }

  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const document = await documentService.update(Number(id), req.body);
      if (!document) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Operator document not found');
        return;
      }
      res.json({ success: true, data: document });
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_UPDATE_FAILED',
        'Failed to update operator document',
        error.message
      );
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await documentService.delete(Number(id));
      if (!success) {
        sendError(res, 404, 'OPERATOR_DOCUMENT_NOT_FOUND', 'Operator document not found');
        return;
      }
      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        500,
        'OPERATOR_DOCUMENT_DELETE_FAILED',
        'Failed to delete operator document',
        error.message
      );
    }
  }
}
