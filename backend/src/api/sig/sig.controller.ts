import { Request, Response } from 'express';
import { SigService } from '../../services/sig.service';

export class SigController {
  private sigService = new SigService();

  getDocuments = async (req: Request, res: Response) => {
    try {
      const documents = await this.sigService.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching documents', error });
    }
  };

  createDocument = async (req: Request, res: Response) => {
    try {
      const document = await this.sigService.createDocument(req.body);
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: 'Error creating document', error });
    }
  };

  getDocumentById = async (req: Request, res: Response) => {
    try {
      const document = await this.sigService.getDocumentById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching document', error });
    }
  };
}
