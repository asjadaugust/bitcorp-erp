import { Request, Response } from 'express';
import { ReportService } from '../../services/report.service';

const reportService = new ReportService();

export class ReportController {
  async getReports(req: Request, res: Response) {
    try {
      const filters = req.query;
      const reports = await reportService.getAllReports(filters);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  }

  async createReport(req: Request, res: Response) {
    try {
      const report = await reportService.createReport(req.body);
      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }

  async updateReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await reportService.updateReport(id, req.body);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  }

  async approveReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Assuming user ID is available in req.user (from auth middleware)
      const userId = (req as any).user?.id; 
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const report = await reportService.approveReport(id, userId);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      console.error('Error approving report:', error);
      res.status(500).json({ error: 'Failed to approve report' });
    }
  }

  async rejectReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }
      const report = await reportService.rejectReport(id, reason);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      console.error('Error rejecting report:', error);
      res.status(500).json({ error: 'Failed to reject report' });
    }
  }

  async deleteReport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await reportService.deleteReport(id);
      if (!success) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
}





