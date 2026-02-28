import { Router } from 'express';
import { OrdenesAlquilerController } from './ordenes-alquiler.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new OrdenesAlquilerController();

router.use(authenticate);

router.get('/', controller.listar.bind(controller));
router.post('/', controller.crear.bind(controller));
router.get('/:id', controller.obtener.bind(controller));
router.put('/:id', controller.actualizar.bind(controller));
router.delete('/:id', controller.eliminar.bind(controller));
router.post('/:id/enviar', controller.enviar.bind(controller));
router.post('/:id/confirmar', controller.confirmar.bind(controller));
router.post('/:id/cancelar', controller.cancelar.bind(controller));

export default router;
