import { Router } from 'express';
import { SolicitudesEquipoController } from './solicitudes-equipo.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new SolicitudesEquipoController();

router.use(authenticate);

router.get('/', controller.listar.bind(controller));
router.post('/', controller.crear.bind(controller));
router.get('/:id', controller.obtener.bind(controller));
router.put('/:id', controller.actualizar.bind(controller));
router.delete('/:id', controller.eliminar.bind(controller));
router.post('/:id/enviar', controller.enviar.bind(controller));
router.post('/:id/aprobar', controller.aprobar.bind(controller));
router.post('/:id/rechazar', controller.rechazar.bind(controller));

export default router;
