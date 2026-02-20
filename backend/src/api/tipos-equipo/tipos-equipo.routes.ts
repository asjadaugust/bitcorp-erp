/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';
import { TiposEquipoController } from './tipos-equipo.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new TiposEquipoController();

// All routes require authentication
router.use(authenticate);

router.get('/', controller.listar);
router.get('/agrupados', controller.listarAgrupados);
router.get('/categoria/:categoria', controller.listarPorCategoria);
router.get('/:id', controller.obtener);

export default router;
