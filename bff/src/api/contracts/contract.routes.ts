/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ContractController } from './contract.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { ContractCreateDto, ContractUpdateDto } from '../../types/dto/contract.dto';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /api/contracts:
 *   get:
 *     tags:
 *       - Contracts
 *     summary: Get all contracts
 *     description: Retrieve a list of all contracts with optional filters and pagination.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contracts retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', ContractController.getAll);

// GET /api/contracts/stats/count - Get active contracts count
router.get('/stats/count', ContractController.getActiveCount);

// GET /api/contracts/numero/:numero - Get contract by numero
router.get('/numero/:numero', ContractController.getByNumero);

// GET /api/contracts/:id/pdf - Generate contract PDF
router.get('/:id/pdf', ContractController.downloadPdf);

/**
 * @openapi
 * /api/contracts/{id}:
 *   get:
 *     tags:
 *       - Contracts
 *     summary: Get contract by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contract found
 *       404:
 *         description: Contract not found
 */
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

/**
 * @openapi
 * /api/contracts/{id}/obligaciones:
 *   get:
 *     tags:
 *       - Contracts
 *     summary: Get contract obligations (WS-21)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of obligations
 */
router.get('/:id/obligaciones', ContractController.getObligaciones);

/**
 * @openapi
 * /api/contracts/{id}/obligaciones/initialize:
 *   post:
 *     tags:
 *       - Contracts
 *     summary: Initialize default obligations (WS-21)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Obligations initialized
 */
router.post('/:id/obligaciones/initialize', ContractController.initializeObligaciones);

/**
 * @openapi
 * /api/contracts/obligaciones/{obligacionId}:
 *   put:
 *     tags:
 *       - Contracts
 *     summary: Update an obligation (WS-21)
 *     parameters:
 *       - in: path
 *         name: obligacionId
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Obligation updated
 */
router.put('/obligaciones/:obligacionId', ContractController.updateObligacion);

// ─── Obligaciones del Arrendatario routes (WS-22) ───
router.get('/:id/obligaciones-arrendatario', ContractController.getObligacionesArrendatario);
router.post(
  '/:id/obligaciones-arrendatario/initialize',
  ContractController.initializeObligacionesArrendatario
);
router.put(
  '/obligaciones-arrendatario/:obligacionId',
  ContractController.updateObligacionArrendatario
);

// ─── Lifecycle routes (WS-16) ───
router.post('/:id/resolver', ContractController.resolver);
router.get('/:id/liquidation-check', ContractController.liquidationCheck);
router.post('/:id/liquidar', ContractController.liquidar);

// ─── Legalization routes (WS-32b — PRD P-001 §4.3.3) ───
router.get('/:id/legalizacion', ContractController.getLegalizacion);
router.post('/:id/legalizacion/iniciar', ContractController.iniciarLegalizacion);
router.post('/:id/legalizacion/paso/:numero', ContractController.completarPasoLegalizacion);
router.post('/:id/legalizacion/paso/:numero/revertir', ContractController.revertirPasoLegalizacion);

export default router;
