import { Router } from 'express';
import { OperatorController } from './operator.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania', 'operador', 'Director General', 'DIRECTOR_GENERAL'),
  OperatorController.getAll
);
router.get(
  '/search-by-skill',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania', 'Director General', 'DIRECTOR_GENERAL'),
  OperatorController.searchBySkill
);
router.get(
  '/:id',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania', 'operador', 'Director General', 'DIRECTOR_GENERAL'),
  OperatorController.getById
);
router.get(
  '/:id/availability',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  OperatorController.getAvailability
);
router.get(
  '/:id/performance',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  OperatorController.getPerformance
);
router.post(
  '/',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  OperatorController.create
);
router.put(
  '/:id',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  OperatorController.update
);
router.delete(
  '/:id',
  authorize('administrador', 'director_proyecto', 'director_compania'),
  OperatorController.delete
);
router.get(
  '/export/excel',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  OperatorController.exportExcel
);
router.get(
  '/export/csv',
  authorize('administrador', 'jefe_equipos', 'director_proyecto', 'director_compania'),
  OperatorController.exportCSV
);

export default router;
