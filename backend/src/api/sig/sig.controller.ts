/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { SigService } from '../../services/sig.service';
import { sendSuccess, sendError, sendCreated } from '../../utils/api-response';

export class SigController {
  private sigService = new SigService();

  getDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const documents = await this.sigService.getAllDocuments();
      sendSuccess(res, documents);
    } catch (error: any) {
      sendError(
        res,
        500,
        'DOCUMENTS_FETCH_FAILED',
        'Error al obtener los documentos SIG',
        error.message
      );
    }
  };

  createDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const document = await this.sigService.createDocument(req.body);
      sendCreated(res, document);
    } catch (error: any) {
      sendError(
        res,
        500,
        'DOCUMENT_CREATE_FAILED',
        'Error al crear el documento SIG',
        error.message
      );
    }
  };

  getDocumentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate ID
      const documentId = parseInt(id);
      if (isNaN(documentId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const document = await this.sigService.getDocumentById(id);
      if (!document) {
        sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento no encontrado');
        return;
      }

      sendSuccess(res, document);
    } catch (error: any) {
      sendError(
        res,
        500,
        'DOCUMENT_FETCH_FAILED',
        'Error al obtener el documento SIG',
        error.message
      );
    }
  };

  updateDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate ID
      const documentId = parseInt(id);
      if (isNaN(documentId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const document = await this.sigService.updateDocument(id, req.body);
      if (!document) {
        sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento no encontrado');
        return;
      }

      sendSuccess(res, document);
    } catch (error: any) {
      sendError(
        res,
        500,
        'DOCUMENT_UPDATE_FAILED',
        'Error al actualizar el documento SIG',
        error.message
      );
    }
  };

  deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate ID
      const documentId = parseInt(id);
      if (isNaN(documentId)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      await this.sigService.deleteDocument(id);
      res.status(204).send();
    } catch (error: any) {
      sendError(
        res,
        500,
        'DOCUMENT_DELETE_FAILED',
        'Error al eliminar el documento SIG',
        error.message
      );
    }
  };
}
