import { Router } from 'express';
import { CotizacionesController } from './cotizaciones.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new CotizacionesController();

router.use(authenticate);

// GET /api/cotizaciones — List cotizaciones (filter by solicitud_equipo_id, proveedor_id, estado)
router.get('/', controller.listar.bind(controller));

// GET /api/cotizaciones/comparacion/:solicitudId — Comparison matrix for a solicitud
router.get('/comparacion/:solicitudId', controller.obtenerComparacion.bind(controller));

// GET /api/cotizaciones/:id — Get single cotización
router.get('/:id', controller.obtener.bind(controller));

// POST /api/cotizaciones — Create new cotización
router.post('/', controller.crear.bind(controller));

// PUT /api/cotizaciones/:id — Update cotización
router.put('/:id', controller.actualizar.bind(controller));

// POST /api/cotizaciones/:id/evaluar — Score/evaluate cotización
router.post('/:id/evaluar', controller.evaluar.bind(controller));

// POST /api/cotizaciones/:id/seleccionar — Select cotización (auto-creates OAL)
router.post('/:id/seleccionar', controller.seleccionar.bind(controller));

// POST /api/cotizaciones/:id/rechazar — Reject cotización
router.post('/:id/rechazar', controller.rechazar.bind(controller));

// DELETE /api/cotizaciones/:id — Soft delete cotización
router.delete('/:id', controller.eliminar.bind(controller));

export default router;
