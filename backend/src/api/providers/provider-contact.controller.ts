import { Request, Response } from 'express';
import { ProviderContactService } from '../../services/provider-contact.service';

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
      console.error('Error in getByProviderId:', error);
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
      console.error('Error in getById:', error);
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
        created_by: (req as any).user?.id
      };
      
      const contact = await this.service.create(data);
      res.status(201).json(contact);
    } catch (error: any) {
      console.error('Error in create:', error);
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
        updated_by: (req as any).user?.id
      };
      
      const contact = await this.service.update(parseInt(id), data);
      res.json(contact);
    } catch (error: any) {
      console.error('Error in update:', error);
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
      console.error('Error in delete:', error);
      res.status(500).json({ error: error.message || 'Error deleting contact' });
    }
  };
}
