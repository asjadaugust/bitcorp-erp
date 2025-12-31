import { Request, Response } from 'express';
import { AccountsPayableService } from '../../services/accounts-payable.service';

export class AccountsPayableController {
  private service: AccountsPayableService;

  constructor() {
    this.service = new AccountsPayableService();
  }

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;
      const result = await this.service.create(data);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating accounts payable:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.findAll();
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching accounts payable:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  findOne = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.service.findOne(id);
      if (!result) {
        res.status(404).json({ message: 'Accounts payable not found' });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching accounts payable:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const result = await this.service.update(id, data);
      if (!result) {
        res.status(404).json({ message: 'Accounts payable not found' });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating accounts payable:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.service.delete(id);
      if (!result) {
        res.status(404).json({ message: 'Accounts payable not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting accounts payable:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  findPending = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.findPending();
      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching pending accounts payable:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}
