import { Router } from 'express';
import { ApprovalsController } from './approvals.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { ROLES } from '../../types/roles';

const router = Router();
const controller = new ApprovalsController();

router.use(authenticate);

// Templates (ADMIN only for write operations)
router.get('/templates', controller.getTemplates.bind(controller));
router.post('/templates', authorize(ROLES.ADMIN), controller.createTemplate.bind(controller));
router.get('/templates/:id', controller.getTemplate.bind(controller));
router.put('/templates/:id', authorize(ROLES.ADMIN), controller.updateTemplate.bind(controller));
router.post(
  '/templates/:id/activate',
  authorize(ROLES.ADMIN),
  controller.activateTemplate.bind(controller)
);
router.post(
  '/templates/:id/archive',
  authorize(ROLES.ADMIN),
  controller.archiveTemplate.bind(controller)
);

// Dashboard (NOTE: must be before /requests/:id to avoid route collision)
router.get('/dashboard/recibidos', controller.getDashboardRecibidos.bind(controller));
router.get('/dashboard/enviados', controller.getDashboardEnviados.bind(controller));
router.get('/dashboard/stats', controller.getDashboardStats.bind(controller));

// Approval Requests
router.get('/requests', controller.getRequests.bind(controller));
router.post('/requests', controller.createRequest.bind(controller));
router.get('/requests/:id', controller.getRequest.bind(controller));
router.post('/requests/:id/approve', controller.approveRequest.bind(controller));
router.post('/requests/:id/reject', controller.rejectRequest.bind(controller));
router.post(
  '/requests/:id/rebase',
  authorize(ROLES.ADMIN),
  controller.rebaseRequest.bind(controller)
);
router.get('/requests/:id/audit', controller.getRequestAudit.bind(controller));

// Ad-hoc Requests
router.get('/adhoc', controller.getAdhocList.bind(controller));
router.post('/adhoc', controller.createAdhoc.bind(controller));
router.get('/adhoc/:id', controller.getAdhoc.bind(controller));
router.post('/adhoc/:id/respond', controller.respondAdhoc.bind(controller));

export default router;
