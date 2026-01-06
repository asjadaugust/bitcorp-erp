/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { MovementController } from './movement.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new MovementController();

router.use(authenticate);

router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));
router.post('/:id/approve', controller.approve.bind(controller));

export default router;
