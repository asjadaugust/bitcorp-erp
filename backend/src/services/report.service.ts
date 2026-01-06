/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { DailyReport, DailyReportModel } from '../models/daily-report.model';
import { AppDataSource } from '../config/database.config';
import { DailyReport as DailyReportEntity } from '../models/daily-report-typeorm.model';
import { transformToDailyReportPdfDto } from '../utils/daily-report-pdf-transformer';
import { DailyReportPdfDto } from '../types/dto/daily-report-pdf.dto';

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

  /**
   * Get daily report data formatted for PDF generation
   * Fetches report with all relations and transforms to PDF DTO
   */
  async getDailyReportPdfData(id: number): Promise<DailyReportPdfDto> {
    const repository = AppDataSource.getRepository(DailyReportEntity);

    const report = await repository.findOne({
      where: { id },
      relations: [
        'equipo',
        'trabajador',
        'proyecto',
        'produccionRows',
        'actividadesProduccion',
        'demorasOperativas',
        'otrosEventos',
        'demorasMecanicas',
      ],
    });

    if (!report) {
      throw new Error(`Daily report with ID ${id} not found`);
    }

    return transformToDailyReportPdfDto(report as any);
  }
}
