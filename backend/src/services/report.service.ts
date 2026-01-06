import { DailyReportModel } from '../models/daily-report.model';
import { AppDataSource } from '../config/database.config';
import { DailyReport as DailyReportEntity } from '../models/daily-report-typeorm.model';
import { transformToDailyReportPdfDto } from '../utils/daily-report-pdf-transformer';
import { DailyReportPdfDto } from '../types/dto/daily-report-pdf.dto';
import {
  DailyReportDto,
  toDailyReportDto,
  fromDailyReportDto,
} from '../types/dto/daily-report.dto';
import { DailyReportRawRow } from '../types/daily-report-raw.interface';

export class ReportService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllReports(filters?: any): Promise<DailyReportDto[]> {
    const entities: DailyReportRawRow[] = await DailyReportModel.findAll(filters);
    return entities.map(toDailyReportDto);
  }

  async getReportById(id: string): Promise<DailyReportDto | null> {
    const entity: DailyReportRawRow | null = await DailyReportModel.findById(id);
    return entity ? toDailyReportDto(entity) : null;
  }

  async getReportsByOperator(operatorId: string): Promise<DailyReportDto[]> {
    const entities: DailyReportRawRow[] = await DailyReportModel.findByOperator(operatorId);
    return entities.map(toDailyReportDto);
  }

  async createReport(data: Partial<DailyReportDto>): Promise<DailyReportDto> {
    const entity = fromDailyReportDto(data);
    const created: DailyReportRawRow = await DailyReportModel.create(entity);
    return toDailyReportDto(created);
  }

  async updateReport(id: string, data: Partial<DailyReportDto>): Promise<DailyReportDto | null> {
    const entity = fromDailyReportDto(data);
    const updated: DailyReportRawRow | null = await DailyReportModel.update(id, entity);
    return updated ? toDailyReportDto(updated) : null;
  }

  async approveReport(id: string, approvedBy: string): Promise<DailyReportDto | null> {
    const entity: DailyReportRawRow | null = await DailyReportModel.approve(id, approvedBy);
    return entity ? toDailyReportDto(entity) : null;
  }

  async rejectReport(id: string, reason: string): Promise<DailyReportDto | null> {
    const entity: DailyReportRawRow | null = await DailyReportModel.reject(id, reason);
    return entity ? toDailyReportDto(entity) : null;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return transformToDailyReportPdfDto(report as any);
  }
}
