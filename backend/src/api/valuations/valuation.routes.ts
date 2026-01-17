/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ValuationController } from './valuation.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { ValuationCreateDto, ValuationUpdateDto } from '../../types/dto/valuation.dto';
import { ROLES } from '../../types/roles';

const router = Router();
const controller = new ValuationController();

router.use(authenticate);

router.get('/', authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO), controller.getAll);
router.get(
  '/analytics',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.getAnalytics
);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO), controller.getById);
router.get(
  '/:id/pdf',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.downloadPdf
);
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(ValuationCreateDto),
  controller.create
);
router.post(
  '/calculate',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.calculate
);
router.post(
  '/generate',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  controller.generate
);
router.post(
  '/preview-pdf',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  (req, res, next) => {
    req.params.id = 'preview';
    controller.downloadPdf(req, res, next);
  }
);
router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO),
  validateDto(ValuationUpdateDto),
  controller.update
);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.DIRECTOR), controller.remove);

export default router;
