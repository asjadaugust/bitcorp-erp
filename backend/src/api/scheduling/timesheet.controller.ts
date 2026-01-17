/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import timesheetService from '../../services/timesheet.service';
import { AppDataSource } from '../../config/database.config';
import { Timesheet } from '../../models/timesheet.model';
import { sendSuccess, sendError } from '../../utils/api-response';
import Logger from '../../utils/logger';

/**
 * Timesheet Controller
 * Handles API endpoints for timesheet management
 */

/**
 * GET /api/scheduling/timesheets
 * List all timesheets with filters
 */
export const listTimesheets = async (req: Request, res: Response) => {
  try {
    const { trabajador_id, periodo, estado, creado_por } = req.query;

    const filters: any = {};
    if (trabajador_id) filters.trabajadorId = parseInt(trabajador_id as string);
    if (periodo) filters.periodo = periodo as string;
    if (estado) filters.estado = estado as string;
    if (creado_por) filters.creadoPor = parseInt(creado_por as string);

    const timesheets = await timesheetService.listTimesheets(filters);
    return sendSuccess(res, timesheets);
  } catch (error: any) {
    Logger.error('Error listing timesheets', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'TimesheetController.listTimesheets',
    });
    return sendError(res, 500, 'TIMESHEET_LIST_FAILED', 'Failed to list timesheets', error.message);
  }
};

/**
 * GET /api/scheduling/timesheets/:id
 * Get a single timesheet with details
 */
export const getTimesheetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timesheet = await timesheetService.getTimesheetWithDetails(parseInt(id));
    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error getting timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.getTimesheetById',
    });
    if (error.message.includes('no encontrado') || error.message.includes('not found')) {
      return sendError(res, 404, 'TIMESHEET_NOT_FOUND', error.message);
    }
    return sendError(res, 500, 'TIMESHEET_GET_FAILED', 'Failed to get timesheet', error.message);
  }
};

/**
 * POST /api/scheduling/timesheets/generate
 * Generate a new timesheet from daily reports
 */
export const generateTimesheet = async (req: Request, res: Response) => {
  try {
    const { trabajadorId, periodo, totalDiasTrabajados, totalHoras, observaciones } = req.body;
    const creadoPor = (req as any).user?.id || 1;

    if (!trabajadorId || !periodo) {
      return sendError(
        res,
        400,
        'TIMESHEET_MISSING_FIELDS',
        'trabajadorId and periodo are required'
      );
    }

    const timesheet = await timesheetService.generateTimesheet({
      trabajadorId: parseInt(trabajadorId),
      periodo,
      totalDiasTrabajados: totalDiasTrabajados ? parseInt(totalDiasTrabajados) : 0,
      totalHoras: totalHoras ? parseFloat(totalHoras) : 0,
      observaciones,
      creadoPor,
    });

    return sendSuccess(res, timesheet, undefined, 201);
  } catch (error: any) {
    Logger.error('Error generating timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      trabajadorId: req.body.trabajadorId,
      periodo: req.body.periodo,
      context: 'TimesheetController.generateTimesheet',
    });
    return sendError(
      res,
      500,
      'TIMESHEET_GENERATE_FAILED',
      error.message || 'Failed to generate timesheet'
    );
  }
};

/**
 * POST /api/scheduling/timesheets/:id/submit
 * Submit a timesheet for approval
 */
export const submitTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submittedBy = (req as any).user?.id || 1; // Default to 1 if no user

    const timesheet = await timesheetService.submitTimesheet(parseInt(id), submittedBy);
    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error submitting timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.submitTimesheet',
    });
    if (
      error.message.includes('not found') ||
      error.message.includes('encontrado') ||
      error.message.includes('puede')
    ) {
      return sendError(res, 400, 'TIMESHEET_SUBMIT_INVALID', error.message);
    }
    return sendError(
      res,
      500,
      'TIMESHEET_SUBMIT_FAILED',
      'Failed to submit timesheet',
      error.message
    );
  }
};

/**
 * POST /api/scheduling/timesheets/:id/approve
 * Approve a timesheet
 */
export const approveTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approvedBy = (req as any).user?.id || 1; // Default to 1 if no user

    const timesheet = await timesheetService.approveTimesheet(parseInt(id), approvedBy);
    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error approving timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.approveTimesheet',
    });
    if (
      error.message.includes('not found') ||
      error.message.includes('encontrado') ||
      error.message.includes('puede')
    ) {
      return sendError(res, 400, 'TIMESHEET_APPROVE_INVALID', error.message);
    }
    return sendError(
      res,
      500,
      'TIMESHEET_APPROVE_FAILED',
      'Failed to approve timesheet',
      error.message
    );
  }
};

/**
 * POST /api/scheduling/timesheets/:id/reject
 * Reject a timesheet
 */
export const rejectTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectedBy = (req as any).user?.id || 1; // Default to 1 if no user

    if (!reason) {
      return sendError(
        res,
        400,
        'TIMESHEET_REJECT_REASON_REQUIRED',
        'Rejection reason is required'
      );
    }

    const timesheet = await timesheetService.rejectTimesheet(parseInt(id), rejectedBy, reason);

    return sendSuccess(res, timesheet);
  } catch (error: any) {
    Logger.error('Error rejecting timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.rejectTimesheet',
    });
    if (
      error.message.includes('not found') ||
      error.message.includes('encontrado') ||
      error.message.includes('puede')
    ) {
      return sendError(res, 400, 'TIMESHEET_REJECT_INVALID', error.message);
    }
    return sendError(
      res,
      500,
      'TIMESHEET_REJECT_FAILED',
      'Failed to reject timesheet',
      error.message
    );
  }
};

/**
 * PUT /api/scheduling/timesheets/:id
 * Update a timesheet
 */
export const updateTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Timesheet);
    const timesheet = await repo.findOne({ where: { id: parseInt(id) } });

    if (!timesheet) {
      return sendError(res, 404, 'TIMESHEET_NOT_FOUND', 'Timesheet not found');
    }

    // Only allow updates to draft timesheets
    if (timesheet.estado !== 'BORRADOR') {
      return sendError(
        res,
        400,
        'TIMESHEET_UPDATE_NOT_ALLOWED',
        'Only draft timesheets can be updated'
      );
    }

    Object.assign(timesheet, req.body);
    const updatedTimesheet = await repo.save(timesheet);

    return sendSuccess(res, updatedTimesheet);
  } catch (error: any) {
    Logger.error('Error updating timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.updateTimesheet',
    });
    return sendError(
      res,
      500,
      'TIMESHEET_UPDATE_FAILED',
      'Failed to update timesheet',
      error.message
    );
  }
};

/**
 * DELETE /api/scheduling/timesheets/:id
 * Delete a timesheet
 */
export const deleteTimesheet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const repo = AppDataSource.getRepository(Timesheet);
    const timesheet = await repo.findOne({ where: { id: parseInt(id) } });

    if (!timesheet) {
      return sendError(res, 404, 'TIMESHEET_NOT_FOUND', 'Timesheet not found');
    }

    // Only allow deletion of draft timesheets
    if (timesheet.estado !== 'BORRADOR') {
      return sendError(
        res,
        400,
        'TIMESHEET_DELETE_NOT_ALLOWED',
        'Only draft timesheets can be deleted'
      );
    }

    await repo.delete(parseInt(id));

    return sendSuccess(res, { message: 'Timesheet deleted successfully' });
  } catch (error: any) {
    Logger.error('Error deleting timesheet', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timesheetId: req.params.id,
      context: 'TimesheetController.deleteTimesheet',
    });
    return sendError(
      res,
      500,
      'TIMESHEET_DELETE_FAILED',
      'Failed to delete timesheet',
      error.message
    );
  }
};
