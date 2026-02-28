/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ProviderContactService } from '../../services/provider-contact.service';
import { sendError, sendSuccess, sendCreated } from '../../utils/api-response';

export class ProviderContactController {
  private service: ProviderContactService;

  constructor() {
    this.service = new ProviderContactService();
  }

  /**
   * GET /api/providers/:providerId/contacts
   * Get all contacts for a provider
   */
  getByProviderId = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de proveedor inválido');
        return;
      }

      const contacts = await this.service.findByProviderId(tenantId, providerId);
      sendSuccess(res, contacts);
    } catch (error: any) {
      sendError(
        res,
        500,
        'PROVIDER_CONTACTS_LIST_FAILED',
        'Error al obtener los contactos del proveedor',
        error.message
      );
    }
  };

  /**
   * GET /api/providers/contacts/:id
   * Get contact by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const contact = await this.service.findById(tenantId, id);
      if (!contact) {
        sendError(res, 404, 'PROVIDER_CONTACT_NOT_FOUND', 'Contacto no encontrado');
        return;
      }
      sendSuccess(res, contact);
    } catch (error: any) {
      if (error.message === 'Contact not found') {
        sendError(res, 404, 'PROVIDER_CONTACT_NOT_FOUND', 'Contacto no encontrado');
        return;
      }
      sendError(
        res,
        500,
        'PROVIDER_CONTACT_GET_FAILED',
        'Error al obtener el contacto',
        error.message
      );
    }
  };

  /**
   * POST /api/providers/:providerId/contacts
   * Create new contact
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const providerId = parseInt(req.params.providerId);
      if (isNaN(providerId)) {
        sendError(res, 400, 'INVALID_ID', 'ID de proveedor inválido');
        return;
      }

      const data = {
        ...req.body,
        id_proveedor: providerId,
        created_by: req.user?.id_usuario,
      };

      const contact = await this.service.create(tenantId, data);
      sendCreated(res, contact);
    } catch (error: any) {
      sendError(
        res,
        400,
        'PROVIDER_CONTACT_CREATE_FAILED',
        'Error al crear el contacto',
        error.message
      );
    }
  };

  /**
   * PUT /api/providers/contacts/:id
   * Update contact
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const data = {
        ...req.body,
        updated_by: req.user?.id_usuario,
      };

      const contact = await this.service.update(tenantId, id, data);
      if (!contact) {
        sendError(res, 404, 'PROVIDER_CONTACT_NOT_FOUND', 'Contacto no encontrado');
        return;
      }
      sendSuccess(res, contact);
    } catch (error: any) {
      if (error.message === 'Contact not found') {
        sendError(res, 404, 'PROVIDER_CONTACT_NOT_FOUND', 'Contacto no encontrado');
        return;
      }
      sendError(
        res,
        400,
        'PROVIDER_CONTACT_UPDATE_FAILED',
        'Error al actualizar el contacto',
        error.message
      );
    }
  };

  /**
   * DELETE /api/providers/contacts/:id
   * Delete contact
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID inválido');
        return;
      }

      const deleted = await this.service.delete(tenantId, id);

      if (deleted) {
        res.status(204).send();
      } else {
        sendError(res, 404, 'PROVIDER_CONTACT_NOT_FOUND', 'Contacto no encontrado');
      }
    } catch (error: any) {
      sendError(
        res,
        500,
        'PROVIDER_CONTACT_DELETE_FAILED',
        'Error al eliminar el contacto',
        error.message
      );
    }
  };
}
