import { Router } from 'express';
import maintenanceScheduleRoutes from './maintenance-schedule.routes';
import scheduledTaskRoutes from './scheduled-task.routes';
import timesheetRoutes from './timesheet.routes';

const router = Router();

// Mount sub-routes
router.use('/maintenance-schedules', maintenanceScheduleRoutes);
router.use('/tasks', scheduledTaskRoutes);
router.use('/timesheets', timesheetRoutes);

export default router;
