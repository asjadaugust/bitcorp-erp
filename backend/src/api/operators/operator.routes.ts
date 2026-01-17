/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { OperatorController } from './operator.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { OperatorCreateDto, OperatorUpdateDto } from '../../types/dto/operator.dto';
import { ROLES } from '../../types/roles';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.OPERADOR),
  OperatorController.getAll
);
router.get(
  '/search-by-skill',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  OperatorController.searchBySkill
);
router.get(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO, ROLES.OPERADOR),
  OperatorController.getById
);
router.get(
  '/:id/availability',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  OperatorController.getAvailability
);
router.get(
  '/:id/performance',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  OperatorController.getPerformance
);
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(OperatorCreateDto),
  OperatorController.create
);
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(OperatorUpdateDto),
  OperatorController.update
);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.DIRECTOR), OperatorController.delete);
router.get(
  '/export/excel',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  OperatorController.exportExcel
);
router.get(
  '/export/csv',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  OperatorController.exportCSV
);

export default router;
