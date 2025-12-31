import { Request, Response } from 'express';
import { OperatorDocumentService } from '../../services/operator-document.service';

const documentService = new OperatorDocumentService();

export class OperatorDocumentController {
  async getDocuments(req: Request, res: Response) {
    try {
      const { operator_id, document_type, is_active } = req.query;
      const documents = await documentService.findAll({
        operator_id: operator_id ? Number(operator_id) : undefined,
        document_type: document_type as string,
        is_active: is_active === 'false' ? false : true
      });
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  async getDocumentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const document = await documentService.findById(Number(id));
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }

  async getDocumentsByOperator(req: Request, res: Response) {
    try {
      const { operatorId } = req.params;
      const documents = await documentService.findByOperator(Number(operatorId));
      res.json(documents);
    } catch (error) {
      console.error('Error fetching operator documents:', error);
      res.status(500).json({ error: 'Failed to fetch operator documents' });
    }
  }

  async getExpiringDocuments(req: Request, res: Response) {
    try {
      const { days } = req.query;
      const documents = await documentService.findExpiring(days ? Number(days) : 30);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
      res.status(500).json({ error: 'Failed to fetch expiring documents' });
    }
  }

  async createDocument(req: Request, res: Response) {
    try {
      const document = await documentService.create(req.body);
      res.status(201).json(document);
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ error: 'Failed to create document' });
    }
  }

  async updateDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const document = await documentService.update(Number(id), req.body);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json(document);
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({ error: 'Failed to update document' });
    }
  }

  async deleteDocument(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await documentService.delete(Number(id));
      if (!success) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
}
