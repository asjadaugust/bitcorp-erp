/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ProviderContactService } from '../../services/provider-contact.service';
import Logger from '../../utils/logger';

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
      const { providerId } = req.params;

      const contacts = await this.service.findByProviderId(providerId);
      res.json(contacts);
    } catch (error: any) {
      Logger.error('Error in getByProviderId', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.providerId,
        context: 'ProviderContactController.getByProviderId',
      });
      res.status(500).json({ error: error.message || 'Error fetching contacts' });
    }
  };

  /**
   * GET /api/providers/contacts/:id
   * Get contact by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const contact = await this.service.findById(parseInt(id));
      res.json(contact);
    } catch (error: any) {
      Logger.error('Error in getById', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contactId: req.params.id,
        context: 'ProviderContactController.getById',
      });
      res.status(404).json({ error: error.message || 'Contact not found' });
    }
  };

  /**
   * POST /api/providers/:providerId/contacts
   * Create new contact
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { providerId } = req.params;
      const data = {
        ...req.body,
        provider_id: providerId,
        created_by: (req as any).user?.id,
      };

      const contact = await this.service.create(data);
      res.status(201).json(contact);
    } catch (error: any) {
      Logger.error('Error in create', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: req.params.providerId,
        context: 'ProviderContactController.create',
      });
      res.status(400).json({ error: error.message || 'Error creating contact' });
    }
  };

  /**
   * PUT /api/providers/contacts/:id
   * Update contact
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
        updated_by: (req as any).user?.id,
      };

      const contact = await this.service.update(parseInt(id), data);
      res.json(contact);
    } catch (error: any) {
      Logger.error('Error in update', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contactId: req.params.id,
        context: 'ProviderContactController.update',
      });
      res.status(400).json({ error: error.message || 'Error updating contact' });
    }
  };

  /**
   * DELETE /api/providers/contacts/:id
   * Delete contact
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const deleted = await this.service.delete(parseInt(id));

      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Contact not found' });
      }
    } catch (error: any) {
      Logger.error('Error in delete', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contactId: req.params.id,
        context: 'ProviderContactController.delete',
      });
      res.status(500).json({ error: error.message || 'Error deleting contact' });
    }
  };
}
