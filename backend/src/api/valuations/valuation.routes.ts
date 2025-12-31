import { Router } from 'express';
import { ValuationController } from './valuation.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ValuationController();

router.use(authenticate);

router.get(
  '/',
  authorize('administrador', 'jefe_equipos', 'finanzas', 'director_proyecto', 'director_compania'),
  controller.getAll
);
router.get(
  '/analytics',
  authorize('administrador', 'jefe_equipos', 'finanzas', 'director_proyecto', 'director_compania'),
  controller.getAnalytics
);
router.get(
  '/:id',
  authorize('administrador', 'jefe_equipos', 'finanzas', 'director_proyecto', 'director_compania'),
  controller.getById
);
router.get(
  '/:id/pdf',
  authorize('administrador', 'jefe_equipos', 'finanzas', 'director_proyecto', 'director_compania'),
  controller.downloadPdf
);
router.post(
  '/',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  controller.create
);
router.post(
  '/calculate',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  controller.calculate
);
router.post(
  '/generate',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  controller.generate
);
router.post(
  '/preview-pdf',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  (req, res, next) => {
      req.params.id = 'preview';
      controller.downloadPdf(req, res, next);
  }
);
router.put(
  '/:id',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  controller.update
);
router.delete(
  '/:id',
  authorize('administrador', 'director_proyecto', 'director_compania'),
  controller.delete
);

export default router;
