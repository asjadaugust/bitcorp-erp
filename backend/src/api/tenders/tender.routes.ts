/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { TenderController } from './tender.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { LicitacionCreateDto, LicitacionUpdateDto } from '../../types/dto/tender.dto';

const router = Router();

// Lazy controller instantiation - defer until first request to avoid "Database not initialized" error
let tenderControllerInstance: TenderController | null = null;
const getTenderController = () => {
  if (!tenderControllerInstance) {
    tenderControllerInstance = new TenderController();
  }
  return tenderControllerInstance;
};

// Apply authentication middleware to all routes
router.use(authenticate);

// Tender CRUD routes
router.get('/', (req, res) => getTenderController().getTenders(req, res));
router.get('/:id', (req, res) => getTenderController().getTenderById(req, res));
router.post('/', validateDto(LicitacionCreateDto), (req, res) =>
  getTenderController().createTender(req, res)
);
router.put('/:id', validateDto(LicitacionUpdateDto), (req, res) =>
  getTenderController().updateTender(req, res)
);
router.delete('/:id', (req, res) => getTenderController().deleteTender(req, res));

export default router;
