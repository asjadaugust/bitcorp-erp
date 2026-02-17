/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ContractController } from './contract.controller';
import { validateDto } from '../../middleware/validation.middleware';
import { ContractCreateDto, ContractUpdateDto } from '../../types/dto/contract.dto';

const router = Router();

// GET /api/contracts - Get all contracts (with optional filters)
router.get('/', ContractController.getAll);

// GET /api/contracts/stats/count - Get active contracts count
router.get('/stats/count', ContractController.getActiveCount);

// GET /api/contracts/numero/:numero - Get contract by numero
router.get('/numero/:numero', ContractController.getByNumero);

// GET /api/contracts/:id - Get contract by ID
router.get('/:id', ContractController.getById);

// POST /api/contracts - Create new contract
router.post('/', validateDto(ContractCreateDto), ContractController.create);

// PUT /api/contracts/:id - Update contract
router.put('/:id', validateDto(ContractUpdateDto), ContractController.update);

// DELETE /api/contracts/:id - Soft delete contract
router.delete('/:id', ContractController.delete);

// GET /api/contracts/:id/addendums - Get addendums for a contract
router.get('/:id/addendums', ContractController.getAddendums);

// POST /api/contracts/addendums - Create addendum
router.post('/addendums', validateDto(ContractCreateDto), ContractController.createAddendum);

// ─── Annex routes (WS-3) ───
router.get('/:id/annexes', ContractController.getAnnexes);
router.put('/:id/annexes/:tipo', ContractController.saveAnnexes);

// ─── Required Document routes (WS-4) ───
router.get('/:id/required-documents', ContractController.getRequiredDocuments);
router.post('/:id/required-documents/initialize', ContractController.initializeRequiredDocuments);
router.put('/required-documents/:docId', ContractController.updateRequiredDocument);

export default router;
