/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { SigService } from '../../services/sig.service';
import { sendSuccess, sendError, sendCreated } from '../../utils/api-response';
import { NotFoundError } from '../../errors/http.errors';
import { BusinessRuleError } from '../../errors/business.error';
import { AppError } from '../../errors/base.error';

/**
 * SigController - Sistema Integrado de Gestión (Integrated Management System)
 * Handles HTTP requests for SIG documents
 *
 * Standards Applied:
 * - ✅ Extracts tenantId from request
 * - ✅ Passes tenantId to service calls
 * - ✅ Maps service errors to HTTP status codes
 * - ✅ Returns standardized responses
 *
 * TODO: Update JWT payload to include tenantId field
 * Currently: Hardcoded to tenantId = 1 for development
 */
export class SigController {
  private sigService = new SigService();

  /**
   * GET /api/sig
   * Get all SIG documents (paginated)
   */
  getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Extract from JWT payload: const tenantId = req.user.tenantId;
      const tenantId = 1; // Hardcoded for now (schema limitation + JWT update needed)

      // Extract pagination params
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.sigService.getAllDocuments(tenantId, page, limit);

      // Return paginated response
      sendSuccess(res, result.data, {
        pagination: {
          page,
          limit,
          total: result.total,
          total_pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error: any) {
      // Map errors to appropriate HTTP status codes
      if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message, error.metadata);
      } else {
        sendError(
          res,
          500,
          'DOCUMENTS_FETCH_FAILED',
          'Error al obtener los documentos SIG',
          error.message
        );
      }
    }
  };

  /**
   * POST /api/sig
   * Create new SIG document
   */
  createDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Extract from JWT payload: const tenantId = req.user.tenantId;
      const tenantId = 1; // Hardcoded for now

      const document = await this.sigService.createDocument(tenantId, req.body);

      sendCreated(res, document);
    } catch (error: any) {
      // Map errors to appropriate HTTP status codes
      if (error instanceof BusinessRuleError) {
        sendError(res, 422, error.code, error.message, error.metadata);
      } else if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message, error.metadata);
      } else {
        sendError(
          res,
          500,
          'DOCUMENT_CREATE_FAILED',
          'Error al crear el documento SIG',
          error.message
        );
      }
    }
  };

  /**
   * GET /api/sig/:id
   * Get SIG document by ID
   */
  getDocumentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate ID
      const documentId = parseInt(id);
      if (isNaN(documentId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      // TODO: Extract from JWT payload: const tenantId = req.user.tenantId;
      const tenantId = 1; // Hardcoded for now

      const document = await this.sigService.getDocumentById(tenantId, id);

      sendSuccess(res, document);
    } catch (error: any) {
      // Map errors to appropriate HTTP status codes
      if (error instanceof NotFoundError) {
        sendError(res, 404, error.name, error.message, error.metadata);
      } else if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message, error.metadata);
      } else {
        sendError(
          res,
          500,
          'DOCUMENT_FETCH_FAILED',
          'Error al obtener el documento SIG',
          error.message
        );
      }
    }
  };

  /**
   * PUT /api/sig/:id
   * Update SIG document
   */
  updateDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate ID
      const documentId = parseInt(id);
      if (isNaN(documentId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      // TODO: Extract from JWT payload: const tenantId = req.user.tenantId;
      const tenantId = 1; // Hardcoded for now

      const document = await this.sigService.updateDocument(tenantId, id, req.body);

      sendSuccess(res, document);
    } catch (error: any) {
      // Map errors to appropriate HTTP status codes
      if (error instanceof NotFoundError) {
        sendError(res, 404, error.name, error.message, error.metadata);
      } else if (error instanceof BusinessRuleError) {
        sendError(res, 422, error.code, error.message, error.metadata);
      } else if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message, error.metadata);
      } else {
        sendError(
          res,
          500,
          'DOCUMENT_UPDATE_FAILED',
          'Error al actualizar el documento SIG',
          error.message
        );
      }
    }
  };

  /**
   * DELETE /api/sig/:id
   * Delete SIG document
   */
  deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate ID
      const documentId = parseInt(id);
      if (isNaN(documentId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      // TODO: Extract from JWT payload: const tenantId = req.user.tenantId;
      const tenantId = 1; // Hardcoded for now

      await this.sigService.deleteDocument(tenantId, id);

      // Return 204 No Content on successful deletion
      res.status(204).send();
    } catch (error: any) {
      // Map errors to appropriate HTTP status codes
      if (error instanceof NotFoundError) {
        sendError(res, 404, error.name, error.message, error.metadata);
      } else if (error instanceof BusinessRuleError) {
        sendError(res, 422, error.code, error.message, error.metadata);
      } else if (error instanceof AppError) {
        sendError(res, error.statusCode, error.name, error.message, error.metadata);
      } else {
        sendError(
          res,
          500,
          'DOCUMENT_DELETE_FAILED',
          'Error al eliminar el documento SIG',
          error.message
        );
      }
    }
  };
}
