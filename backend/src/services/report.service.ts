import { DailyReport, DailyReportModel } from '../models/daily-report.model';

export class ReportService {
  async getAllReports(filters?: any): Promise<DailyReport[]> {
    return DailyReportModel.findAll(filters);
  }

  async getReportById(id: string): Promise<DailyReport | null> {
    return DailyReportModel.findById(id);
  }

  async getReportsByOperator(operatorId: string): Promise<DailyReport[]> {
    return DailyReportModel.findByOperator(operatorId);
  }

  async createReport(data: Partial<DailyReport>): Promise<DailyReport> {
    return DailyReportModel.create(data);
  }

  async updateReport(id: string, data: Partial<DailyReport>): Promise<DailyReport | null> {
    return DailyReportModel.update(id, data);
  }

  async approveReport(id: string, approvedBy: string): Promise<DailyReport | null> {
    return DailyReportModel.approve(id, approvedBy);
  }

  async rejectReport(id: string, reason: string): Promise<DailyReport | null> {
    return DailyReportModel.reject(id, reason);
  }

  async deleteReport(id: string): Promise<boolean> {
    return DailyReportModel.delete(id);
  }
}




