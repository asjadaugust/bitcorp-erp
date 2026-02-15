/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ProviderDocumentService } from '../../services/provider-document.service';
import { NotFoundError, ConflictError } from '../../errors/http.errors';
import {
  sendError,
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
} from '../../utils/api-response';

const documentService = new ProviderDocumentService();

export class ProviderDocumentController {
  /**
   * GET /api/providers/:providerId/documents
   * List documents for a specific provider
   */
  async getByProviderId(req: Request, res: Response): Promise<void> {
    try {
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de proveedor inválido');
        return;
      }

      const { page, limit } = req.query;

      const result = await documentService.findAll(
        providerId,
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
        'PROVIDER_DOCUMENTS_LIST_FAILED',
        'Error al obtener los documentos del proveedor',
        error.message
      );
    }
  }

  /**
   * GET /api/providers/documents
   * List all provider documents (admin/global view)
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { proveedor_id, page, limit } = req.query;

      const result = await documentService.findAll(
        proveedor_id ? Number(proveedor_id) : undefined,
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
        'PROVIDER_DOCUMENT_LIST_FAILED',
        'Error al obtener los documentos de proveedores',
        error.message
      );
    }
  }

  /**
   * GET /api/providers/documents/:id
   * Get provider document by ID
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const document = await documentService.findById(id);
      sendSuccess(res, document);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'PROVIDER_DOCUMENT_NOT_FOUND', 'Documento de proveedor no encontrado');
        return;
      }
      sendError(
        res,
        500,
        'PROVIDER_DOCUMENT_GET_FAILED',
        'Error al obtener el documento del proveedor',
        error.message
      );
    }
  }

  /**
   * POST /api/providers/:providerId/documents
   * Create provider document
   */
  async createDocument(req: Request, res: Response): Promise<void> {
    try {
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de proveedor inválido');
        return;
      }

      // Merge providerId from URL into body data
      const data = { ...req.body, proveedor_id: providerId };
      const document = await documentService.create(data);
      sendCreated(res, document);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        sendError(res, 409, 'PROVIDER_DOCUMENT_CONFLICT', error.message, error.metadata);
        return;
      }
      sendError(
        res,
        500,
        'PROVIDER_DOCUMENT_CREATE_FAILED',
        'Error al crear el documento del proveedor',
        error.message
      );
    }
  }

  /**
   * PUT /api/providers/documents/:id
   * Update provider document
   */
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const document = await documentService.update(id, req.body);
      sendSuccess(res, document);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'PROVIDER_DOCUMENT_NOT_FOUND', 'Documento de proveedor no encontrado');
        return;
      }
      if (error instanceof ConflictError) {
        sendError(res, 409, 'PROVIDER_DOCUMENT_CONFLICT', error.message, error.metadata);
        return;
      }
      sendError(
        res,
        500,
        'PROVIDER_DOCUMENT_UPDATE_FAILED',
        'Error al actualizar el documento del proveedor',
        error.message
      );
    }
  }

  /**
   * DELETE /api/providers/documents/:id
   * Delete provider document
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      await documentService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'PROVIDER_DOCUMENT_NOT_FOUND', 'Documento de proveedor no encontrado');
        return;
      }
      sendError(
        res,
        500,
        'PROVIDER_DOCUMENT_DELETE_FAILED',
        'Error al eliminar el documento del proveedor',
        error.message
      );
    }
  }
}
