import { Request, Response } from 'express';
import { ReportService } from '../../services/report.service';
import { sendError } from '../../utils/api-response';

const reportService = new ReportService();

export class ReportController {
  async getReports(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters = req.query;
      const reports = await reportService.getAllReports(filters);

      // Pagination (list endpoint must support it)
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedReports = reports.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedReports,
        pagination: {
          page,
          limit,
          total: reports.length,
          totalPages: Math.ceil(reports.length / limit),
        },
      });
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      return sendError(res, 500, 'REPORT_LIST_FAILED', 'Failed to fetch reports', error.message);
    }
  }

  async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);

      if (!report) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error fetching report:', error);
      return sendError(res, 500, 'REPORT_GET_FAILED', 'Failed to fetch report', error.message);
    }
  }

  async createReport(req: Request, res: Response) {
    try {
      const report = await reportService.createReport(req.body);

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error creating report:', error);
      return sendError(res, 500, 'REPORT_CREATE_FAILED', 'Failed to create report', error.message);
    }
  }

  async updateReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await reportService.updateReport(id, req.body);

      if (!report) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error updating report:', error);
      return sendError(res, 500, 'REPORT_UPDATE_FAILED', 'Failed to update report', error.message);
    }
  }

  async approveReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return sendError(res, 401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const report = await reportService.approveReport(id, userId);

      if (!report) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error approving report:', error);
      return sendError(
        res,
        500,
        'REPORT_APPROVE_FAILED',
        'Failed to approve report',
        error.message
      );
    }
  }

  async rejectReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return sendError(res, 400, 'REJECTION_REASON_REQUIRED', 'Rejection reason is required');
      }

      const report = await reportService.rejectReport(id, reason);

      if (!report) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      console.error('Error rejecting report:', error);
      return sendError(res, 500, 'REPORT_REJECT_FAILED', 'Failed to reject report', error.message);
    }
  }

  async deleteReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await reportService.deleteReport(id);

      if (!success) {
        return sendError(res, 404, 'REPORT_NOT_FOUND', 'Report not found');
      }

      res.json({
        success: true,
        data: { message: 'Report deleted successfully' },
      });
    } catch (error: any) {
      console.error('Error deleting report:', error);
      return sendError(res, 500, 'REPORT_DELETE_FAILED', 'Failed to delete report', error.message);
    }
  }
}
