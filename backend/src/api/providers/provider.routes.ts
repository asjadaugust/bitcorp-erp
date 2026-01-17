/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ProviderController } from './provider.controller';
import { ProviderContactController } from './provider-contact.controller';
import { ProviderFinancialInfoController } from './provider-financial-info.controller';
import { validateDto } from '../../middleware/validation.middleware';
import { ProviderCreateDto, ProviderUpdateDto } from '../../types/dto/provider.dto';

const router = Router();

// Create controller instances
const contactController = new ProviderContactController();
const financialInfoController = new ProviderFinancialInfoController();

// GET /api/providers - Get all providers (with optional filters)
router.get('/', ProviderController.getAll);

// GET /api/providers/stats/count - Get active providers count
router.get('/stats/count', ProviderController.getActiveCount);

// GET /api/providers/type/:type - Get providers by type
router.get('/type/:type', ProviderController.getByType);

// GET /api/providers/ruc/:ruc - Get provider by RUC
router.get('/ruc/:ruc', ProviderController.getByRuc);

// GET /api/providers/:id - Get provider by ID
router.get('/:id', ProviderController.getById);

// GET /api/providers/:providerId/financial-info - Get financial info for a provider
router.get('/:providerId/financial-info', financialInfoController.getByProviderId);

// GET /api/providers/financial-info/:id - Get financial info by ID
router.get('/financial-info/:id', financialInfoController.getById);

// POST /api/providers/:providerId/financial-info - Create financial info
router.post('/:providerId/financial-info', financialInfoController.create);

// PUT /api/providers/financial-info/:id - Update financial info
router.put('/financial-info/:id', financialInfoController.update);

// DELETE /api/providers/financial-info/:id - Delete financial info
router.delete('/financial-info/:id', financialInfoController.delete);

// GET /api/providers/:providerId/contacts - Get contacts for a provider
router.get('/:providerId/contacts', contactController.getByProviderId);

// GET /api/providers/contacts/:id - Get contact by ID
router.get('/contacts/:id', contactController.getById);

// POST /api/providers/:providerId/contacts - Create contact
router.post('/:providerId/contacts', contactController.create);

// PUT /api/providers/contacts/:id - Update contact
router.put('/contacts/:id', contactController.update);

// DELETE /api/providers/contacts/:id - Delete contact
router.delete('/contacts/:id', contactController.delete);

// POST /api/providers - Create new provider
router.post('/', validateDto(ProviderCreateDto), ProviderController.create);

// PUT /api/providers/:id - Update provider
router.put('/:id', validateDto(ProviderUpdateDto), ProviderController.update);

// DELETE /api/providers/:id - Soft delete provider
router.delete('/:id', ProviderController.delete);

export default router;
