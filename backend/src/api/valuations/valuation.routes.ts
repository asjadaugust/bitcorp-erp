/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ValuationController } from './valuation.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ValuationController();

router.use(authenticate);

router.get(
  '/',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'finanzas',
    'director_proyecto',
    'director_compania'
  ),
  controller.getAll
);
router.get(
  '/analytics',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'finanzas',
    'director_proyecto',
    'director_compania'
  ),
  controller.getAnalytics
);
router.get(
  '/:id',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'finanzas',
    'director_proyecto',
    'director_compania'
  ),
  controller.getById
);
router.get(
  '/:id/pdf',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'finanzas',
    'director_proyecto',
    'director_compania'
  ),
  controller.downloadPdf
);
router.post(
  '/',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  controller.create
);
router.post(
  '/calculate',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  controller.calculate
);
router.post(
  '/generate',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  controller.generate
);
router.post(
  '/preview-pdf',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  (req, res, next) => {
    req.params.id = 'preview';
    controller.downloadPdf(req, res, next);
  }
);
router.put(
  '/:id',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  controller.update
);
router.delete(
  '/:id',
  authorize('director_general', 'administrador', 'director_proyecto', 'director_compania'),
  controller.delete
);

export default router;
