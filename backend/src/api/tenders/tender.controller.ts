/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { TenderService } from '../../services/tender.service';

export class TenderController {
  private tenderService = new TenderService();

  getTenders = async (req: Request, res: Response) => {
    try {
      const tenders = await this.tenderService.getAllTenders();
      res.json(tenders);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tenders', error });
    }
  };

  createTender = async (req: Request, res: Response) => {
    try {
      const tender = await this.tenderService.createTender(req.body);
      res.status(201).json(tender);
    } catch (error) {
      res.status(500).json({ message: 'Error creating tender', error });
    }
  };
}
