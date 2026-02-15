/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ProviderController } from './provider.controller';
import { ProviderContactController } from './provider-contact.controller';
import { ProviderFinancialInfoController } from './provider-financial-info.controller';
import { ProviderDocumentController } from './provider-document.controller';
import { validateDto } from '../../middleware/validation.middleware';
import { ProviderCreateDto, ProviderUpdateDto } from '../../types/dto/provider.dto';
import {
  ProviderContactCreateDto,
  ProviderContactUpdateDto,
} from '../../types/dto/provider-contact.dto';
import {
  ProviderFinancialInfoCreateDto,
  ProviderFinancialInfoUpdateDto,
} from '../../types/dto/provider-financial-info.dto';
import {
  ProviderDocumentCreateDto,
  ProviderDocumentUpdateDto,
} from '../../types/dto/provider-document.dto';

const router = Router();

// Create controller instances
const contactController = new ProviderContactController();
const financialInfoController = new ProviderFinancialInfoController();
const documentController = new ProviderDocumentController();

// GET /api/providers - Get all providers (with optional filters)
router.get('/', ProviderController.getAll);

// GET /api/providers/stats/count - Get active providers count
router.get('/stats/count', ProviderController.getActiveCount);

// GET /api/providers/type/:type - Get providers by type
router.get('/type/:type', ProviderController.getByType);

// GET /api/providers/ruc/:ruc/lookup - Lookup RUC data from external API
router.get('/ruc/:ruc/lookup', ProviderController.lookupRuc);

// GET /api/providers/:id - Get provider by ID
router.get('/:id', ProviderController.getById);

// GET /api/providers/:id/logs - Get provider audit logs
router.get('/:id/logs', ProviderController.getLogs);

// GET /api/providers/:providerId/financial-info - Get financial info for a provider
router.get('/:providerId/financial-info', financialInfoController.getByProviderId);

// GET /api/providers/financial-info/:id - Get financial info by ID
router.get('/financial-info/:id', financialInfoController.getById);

// POST /api/providers/:providerId/financial-info - Create financial info
router.post(
  '/:providerId/financial-info',
  validateDto(ProviderFinancialInfoCreateDto),
  financialInfoController.create
);

// PUT /api/providers/financial-info/:id - Update financial info
router.put(
  '/financial-info/:id',
  validateDto(ProviderFinancialInfoUpdateDto),
  financialInfoController.update
);

// DELETE /api/providers/financial-info/:id - Delete financial info
router.delete('/financial-info/:id', financialInfoController.delete);

// GET /api/providers/:providerId/contacts - Get contacts for a provider
router.get('/:providerId/contacts', contactController.getByProviderId);

// GET /api/providers/contacts/:id - Get contact by ID
router.get('/contacts/:id', contactController.getById);

// POST /api/providers/:providerId/contacts - Create contact
router.post(
  '/:providerId/contacts',
  validateDto(ProviderContactCreateDto),
  contactController.create
);

// PUT /api/providers/contacts/:id - Update contact
router.put('/contacts/:id', validateDto(ProviderContactUpdateDto), contactController.update);

// DELETE /api/providers/contacts/:id - Delete contact
router.delete('/contacts/:id', contactController.delete);

// --- Provider Documents (BIT-12) ---
// GET /api/providers/:providerId/documents - Get documents for a provider
router.get('/:providerId/documents', documentController.getByProviderId);

// GET /api/providers/documents/:id - Get document by ID
router.get('/documents/:id', documentController.getDocumentById);

// POST /api/providers/:providerId/documents - Create document
router.post(
  '/:providerId/documents',
  validateDto(ProviderDocumentCreateDto),
  documentController.createDocument
);

// PUT /api/providers/documents/:id - Update document
router.put('/documents/:id', validateDto(ProviderDocumentUpdateDto), documentController.updateDocument);

// DELETE /api/providers/documents/:id - Delete document
router.delete('/documents/:id', documentController.deleteDocument);

// POST /api/providers - Create new provider
router.post('/', validateDto(ProviderCreateDto), ProviderController.create);

// PUT /api/providers/:id - Update provider
router.put('/:id', validateDto(ProviderUpdateDto), ProviderController.update);

// DELETE /api/providers/:id - Soft delete provider
router.delete('/:id', ProviderController.delete);

export default router;
