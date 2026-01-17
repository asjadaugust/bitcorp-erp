/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { TenderService } from '../../services/tender.service';
import { sendSuccess, sendError, sendCreated } from '../../utils/api-response';

export class TenderController {
  private tenderService = new TenderService();

  getTenders = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenders = await this.tenderService.getAllTenders();
      sendSuccess(res, tenders);
    } catch (error: any) {
      sendError(
        res,
        500,
        'TENDERS_FETCH_FAILED',
        'Error al obtener las licitaciones',
        error.message
      );
    }
  };

  createTender = async (req: Request, res: Response): Promise<void> => {
    try {
      const tender = await this.tenderService.createTender(req.body);
      sendCreated(res, tender);
    } catch (error: any) {
      sendError(res, 500, 'TENDER_CREATE_FAILED', 'Error al crear la licitación', error.message);
    }
  };
}
