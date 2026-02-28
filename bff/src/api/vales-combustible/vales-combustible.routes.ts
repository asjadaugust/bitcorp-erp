import { Router } from 'express';
import { ValesCombustibleController } from './vales-combustible.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ValesCombustibleController();

router.use(authenticate);

router.get('/', controller.listar.bind(controller));
router.post('/', controller.crear.bind(controller));
router.get('/:id', controller.obtener.bind(controller));
router.put('/:id', controller.actualizar.bind(controller));
router.delete('/:id', controller.eliminar.bind(controller));
router.post('/:id/registrar', controller.registrar.bind(controller));
router.post('/:id/anular', controller.anular.bind(controller));

export default router;
