import { Router } from 'express';
import { ProviderController } from './provider.controller';

const router = Router();

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

// POST /api/providers - Create new provider
router.post('/', ProviderController.create);

// PUT /api/providers/:id - Update provider
router.put('/:id', ProviderController.update);

// DELETE /api/providers/:id - Soft delete provider
router.delete('/:id', ProviderController.delete);

export default router;
