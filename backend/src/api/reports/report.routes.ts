/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validateDto } from '../../middleware/validation.middleware';
import { DailyReportCreateDto, DailyReportUpdateDto } from '../../types/dto/daily-report.dto';

const router = Router();
const controller = new ReportController();

router.use(authenticate);

router.get('/', controller.getReports.bind(controller));
router.get('/reception-status', controller.getReceptionStatus.bind(controller));
router.get('/inspection-tracking', controller.getInspectionTracking.bind(controller));
router.patch('/observaciones/:id/resolver', controller.resolverObservacion.bind(controller));
router.post('/', validateDto(DailyReportCreateDto), controller.createReport.bind(controller));
router.get('/:id', controller.getReportById.bind(controller));
router.put('/:id', validateDto(DailyReportUpdateDto), controller.updateReport.bind(controller));
router.delete('/:id', controller.deleteReport.bind(controller));

// Approval workflow
router.post('/:id/approve', controller.approveReport.bind(controller));
router.post('/:id/reject', controller.rejectReport.bind(controller));
router.post('/:id/firmar-residente', controller.firmarResidente.bind(controller));

// PDF download
router.get('/:id/pdf', controller.downloadPdf.bind(controller));

export default router;
