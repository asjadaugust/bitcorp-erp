/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { OperatorController } from './operator.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania',
    'operador'
  ),
  OperatorController.getAll
);
router.get(
  '/search-by-skill',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  OperatorController.searchBySkill
);
router.get(
  '/:id',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania',
    'operador'
  ),
  OperatorController.getById
);
router.get(
  '/:id/availability',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  OperatorController.getAvailability
);
router.get(
  '/:id/performance',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  OperatorController.getPerformance
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
  OperatorController.create
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
  OperatorController.update
);
router.delete(
  '/:id',
  authorize('director_general', 'administrador', 'director_proyecto', 'director_compania'),
  OperatorController.delete
);
router.get(
  '/export/excel',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  OperatorController.exportExcel
);
router.get(
  '/export/csv',
  authorize(
    'director_general',
    'administrador',
    'jefe_equipos',
    'director_proyecto',
    'director_compania'
  ),
  OperatorController.exportCSV
);

export default router;
