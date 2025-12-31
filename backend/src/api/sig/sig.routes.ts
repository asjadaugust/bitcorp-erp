import { Router } from 'express';
import { SigController } from './sig.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const sigController = new SigController();

router.use(authenticate);

router.get('/documents', sigController.getDocuments);
router.post('/documents', sigController.createDocument);
router.get('/documents/:id', sigController.getDocumentById);

export default router;
