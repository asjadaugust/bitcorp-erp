import { Router, Request, Response } from 'express';
import { PeriodosInoperatividadController } from './periodos-inoperatividad.controller';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware';
import { ROLES } from '../../types/roles';

const router = Router();
const ctrl = new PeriodosInoperatividadController();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/periodos-inoperatividad - List (filter by equipo_id, contrato_id, estado, excede_plazo)
router.get('/', (req: Request, res: Response) => ctrl.listar(req as AuthRequest, res));

// GET /api/periodos-inoperatividad/resumen/:equipoId - Summary for equipment
router.get('/resumen/:equipoId', (req: Request, res: Response) =>
  ctrl.getResumen(req as AuthRequest, res)
);

// GET /api/periodos-inoperatividad/:id - Get single period
router.get('/:id', (req: Request, res: Response) => ctrl.obtener(req as AuthRequest, res));

// POST /api/periodos-inoperatividad - Register new inoperability period
router.post('/', authorize(ROLES.JEFE_EQUIPO, ROLES.ADMIN), (req: Request, res: Response) =>
  ctrl.crear(req as AuthRequest, res)
);

// POST /api/periodos-inoperatividad/:id/resolver - Resolve (set end date)
router.post(
  '/:id/resolver',
  authorize(ROLES.JEFE_EQUIPO, ROLES.ADMIN),
  (req: Request, res: Response) => ctrl.resolver(req as AuthRequest, res)
);

// POST /api/periodos-inoperatividad/:id/penalidad - Apply penalty amount
router.post('/:id/penalidad', authorize(ROLES.ADMIN), (req: Request, res: Response) =>
  ctrl.aplicarPenalidad(req as AuthRequest, res)
);

export default router;
