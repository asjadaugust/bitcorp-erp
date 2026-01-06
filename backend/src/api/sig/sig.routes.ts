/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { SigController } from './sig.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const sigController = new SigController();

router.use(authenticate);

router.get('/documents', sigController.getDocuments);
router.post('/documents', sigController.createDocument);
router.get('/documents/:id', sigController.getDocumentById);
router.put('/documents/:id', sigController.updateDocument);
router.delete('/documents/:id', sigController.deleteDocument);

export default router;
