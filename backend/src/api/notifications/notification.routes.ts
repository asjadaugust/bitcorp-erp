/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

router.get('/', controller.getUserNotifications);
router.patch('/:id/read', controller.markAsRead);
router.patch('/read-all', controller.markAllAsRead);

export default router;
