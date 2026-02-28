import { Router } from 'express';
import { ActasEntregaController } from './actas-entrega.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new ActasEntregaController();

router.use(authenticate);

router.get('/', controller.listar.bind(controller));
router.post('/', controller.crear.bind(controller));
router.get('/:id', controller.obtener.bind(controller));
router.put('/:id', controller.actualizar.bind(controller));
router.delete('/:id', controller.eliminar.bind(controller));
router.post('/:id/enviar', controller.enviarParaFirma.bind(controller));
router.post('/:id/firmar', controller.firmar.bind(controller));
router.post('/:id/anular', controller.anular.bind(controller));
router.get('/:id/pdf', controller.descargarPdf.bind(controller));

export default router;
