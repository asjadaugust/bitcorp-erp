/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { OperatorDocumentController } from './operator-document.controller';
import { validateDto } from '../../middleware/validation.middleware';
import {
  OperatorDocumentCreateDto,
  OperatorDocumentUpdateDto,
} from '../../types/dto/operator-document.dto';

const router = Router();
const controller = new OperatorDocumentController();

// GET /api/hr/documents - Get all documents (with filters)
router.get('/', (req, res) => controller.getDocuments(req, res));

// GET /api/hr/documents/expiring - Get expiring documents
router.get('/expiring', (req, res) => controller.getExpiringDocuments(req, res));

// GET /api/hr/documents/operator/:operatorId - Get documents by operator
router.get('/operator/:operatorId', (req, res) => controller.getDocumentsByOperator(req, res));

// GET /api/hr/documents/:id - Get document by ID
router.get('/:id', (req, res) => controller.getDocumentById(req, res));

// POST /api/hr/documents - Create new document
router.post('/', validateDto(OperatorDocumentCreateDto), (req, res) =>
  controller.createDocument(req, res)
);

// PUT /api/hr/documents/:id - Update document
router.put('/:id', validateDto(OperatorDocumentUpdateDto), (req, res) =>
  controller.updateDocument(req, res)
);

// DELETE /api/hr/documents/:id - Delete document
router.delete('/:id', (req, res) => controller.deleteDocument(req, res));

export default router;
