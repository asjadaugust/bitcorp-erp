/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Router } from 'express';
import * as timesheetController from './timesheet.controller';
import { validateDto } from '../../middleware/validation.middleware';
import { TimesheetCreateDto } from '../../types/dto/timesheet.dto';

const router = Router();

// List all timesheets
router.get('/', timesheetController.listTimesheets);

// Get single timesheet with details
router.get('/:id', timesheetController.getTimesheetById);

// Generate timesheet from daily reports
router.post('/generate', validateDto(TimesheetCreateDto), timesheetController.generateTimesheet);

// Update timesheet (draft only)
router.put('/:id', timesheetController.updateTimesheet);

// Delete timesheet (draft only)
router.delete('/:id', timesheetController.deleteTimesheet);

// Submit timesheet for approval
router.post('/:id/submit', timesheetController.submitTimesheet);

// Approve timesheet
router.post('/:id/approve', timesheetController.approveTimesheet);

// Reject timesheet
router.post('/:id/reject', timesheetController.rejectTimesheet);

export default router;
