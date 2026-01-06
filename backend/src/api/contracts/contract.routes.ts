/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ContractController } from './contract.controller';

const router = Router();

// GET /api/contracts - Get all contracts (with optional filters)
router.get('/', ContractController.getAll);

// GET /api/contracts/stats/count - Get active contracts count
router.get('/stats/count', ContractController.getActiveCount);

// GET /api/contracts/expiring/:days - Get expiring contracts
router.get('/expiring/:days?', ContractController.getExpiring);

// GET /api/contracts/numero/:numero - Get contract by numero
router.get('/numero/:numero', ContractController.getByNumero);

// GET /api/contracts/:id - Get contract by ID
router.get('/:id', ContractController.getById);

// POST /api/contracts - Create new contract
router.post('/', ContractController.create);

// PUT /api/contracts/:id - Update contract
router.put('/:id', ContractController.update);

// DELETE /api/contracts/:id - Soft delete contract
router.delete('/:id', ContractController.delete);

// GET /api/contracts/:id/addendums - Get addendums for a contract
router.get('/:id/addendums', ContractController.getAddendums);

// POST /api/contracts/:id/addendums - Create addendum
router.post('/:id/addendums', ContractController.createAddendum);

export default router;
