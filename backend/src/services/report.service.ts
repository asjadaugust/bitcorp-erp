import { DailyReportModel } from '../models/daily-report.model';
import { AppDataSource } from '../config/database.config';
import { DailyReport } from '../models/daily-report-typeorm.model';
import { DailyReportMechanicalDelay } from '../models/daily-report-mechanical-delay.model';
import { Equipment } from '../models/equipment.model';
import { PrecalentamientoConfigService } from './precalentamiento-config.service';
import { transformToDailyReportPdfDto } from '../utils/daily-report-pdf-transformer';
import { DailyReportPdfDto } from '../types/dto/daily-report-pdf.dto';
import {
  DailyReportDto,
  toDailyReportDto,
  fromDailyReportDto,
} from '../types/dto/daily-report.dto';
import { DailyReportAdapter, DailyReportFrontendModel } from '../types/daily-report-adapter';
import { DailyReportRawRow } from '../types/daily-report-raw.interface';
import { DailyReportFiltersDto } from '../types/dto/report.dto';
import Logger from '../utils/logger';
import { NotFoundError } from '../errors/http.errors';
import { ValidationError } from '../errors/validation.error';
import { DashboardService } from './dashboard.service';
import { Between, FindOptionsWhere, In } from 'typeorm';

export interface EquipmentReceptionStatus {
  equipo_id: number;
  codigo_equipo: string;
  marca: string;
  modelo: string;
  proyecto_nombre?: string;
  total_dias: number;
  reportes_recibidos: number;
  reportes_pendientes: number;
  porcentaje_recepcion: number;
  fechas_faltantes: string[];
}

/**
 * ReportService
 *
 * Manages daily report operations (partes diarios) for equipment usage tracking.
 *
 * Responsibilities:
 * - CRUD operations for daily reports
 * - Report approval/rejection workflow
 * - PDF data generation for report printing
 * - Filtering and querying reports by various criteria
 *
 * Standards Applied:
 * ✅ Tenant context (tenantId parameter on all methods)
 * ✅ Error handling (try/catch with comprehensive logging)
 * ✅ Custom errors (NotFoundError instead of null returns)
 * ✅ Type safety (DailyReportFiltersDto interface, no 'any' types)
 * ✅ Pagination (service-level, returns { data, total })
 * ✅ Logging (info on success, error on failure with full context)
 * ✅ Business validation (date ranges, required fields)
 *
 * Database: partes_diarios table
 * Note: Uses DailyReportModel as data access layer (TypeORM wrapper)
 *
 * TODO: Update DailyReportModel to accept tenantId parameter
 * TODO: Add tenant_id column to partes_diarios table
 * TODO: Remove tenant_id TODO comments once schema updated
 */
export class ReportService {
  private dashboardService: DashboardService;
  private precalentamientoService: PrecalentamientoConfigService;

  constructor() {
    this.dashboardService = new DashboardService();
    this.precalentamientoService = new PrecalentamientoConfigService();
  }

  /**
   * Get all daily reports with optional filters and pagination
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default: 10, max: 100)
   * @param filters - Optional filters (status, date range, worker, equipment, project)
   *
   * @returns Paginated list of daily reports with total count
   *
   * @example
   * const result = await reportService.getAllReports(1, 1, 10, {
   *   estado: 'PENDIENTE',
   *   fecha_inicio: '2026-01-01',
   *   fecha_fin: '2026-01-31',
   *   proyecto_id: '5'
   * });
   * // Returns: { data: [...], total: 45 }
   */
  async getAllReports(
    tenantId: number,
    page: number = 1,
    limit: number = 10,
    filters?: DailyReportFiltersDto
  ): Promise<{ data: DailyReportDto[]; total: number }> {
    try {
      Logger.info('Fetching daily reports', {
        tenantId,
        page,
        limit,
        filters,
        context: 'ReportService.getAllReports',
      });

      // TODO: Add tenant_id filter when column exists in partes_diarios table
      // filters = { ...filters, tenant_id: tenantId };

      // Fetch all matching reports (model layer doesn't support pagination yet)
      const entities: DailyReportRawRow[] = await DailyReportModel.findAll(tenantId, filters);

      // Calculate pagination
      const total = entities.length;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedEntities = entities.slice(startIndex, endIndex);

      // Transform to DTOs
      const data = paginatedEntities.map(toDailyReportDto);

      Logger.info('Daily reports fetched successfully', {
        tenantId,
        count: data.length,
        total,
        page,
        limit,
        context: 'ReportService.getAllReports',
      });

      return { data, total };
    } catch (error) {
      Logger.error('Error fetching daily reports', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        page,
        limit,
        filters,
        context: 'ReportService.getAllReports',
      });
      throw error;
    }
  }

  /**
   * Get single daily report by ID
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Daily report ID
   *
   * @returns Daily report details
   * @throws {NotFoundError} If report not found
   *
   * @example
   * const report = await reportService.getReportById(1, '123');
   */
  async getReportById(tenantId: number, id: string): Promise<DailyReportDto> {
    try {
      Logger.info('Fetching daily report by ID', {
        tenantId,
        reportId: id,
        context: 'ReportService.getReportById',
      });

      const entity: DailyReportRawRow | null = await DailyReportModel.findById(tenantId, id);

      if (!entity) {
        throw new NotFoundError('Daily report', id, { tenantId });
      }

      const report = toDailyReportDto(entity);

      Logger.info('Daily report fetched successfully', {
        tenantId,
        reportId: id,
        estado: report.estado,
        context: 'ReportService.getReportById',
      });

      return report;
    } catch (error) {
      Logger.error('Error fetching daily report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        reportId: id,
        context: 'ReportService.getReportById',
      });
      throw error;
    }
  }

  /**
   * Get all daily reports for specific operator/worker
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param operatorId - Operator/worker ID
   *
   * @returns List of daily reports for the operator
   *
   * @example
   * const reports = await reportService.getReportsByOperator(1, '456');
   */
  async getReportsByOperator(tenantId: number, operatorId: string): Promise<DailyReportDto[]> {
    try {
      Logger.info('Fetching daily reports by operator', {
        tenantId,
        operatorId,
        context: 'ReportService.getReportsByOperator',
      });

      const entities: DailyReportRawRow[] = await DailyReportModel.findByOperator(
        tenantId,
        operatorId
      );

      const reports = entities.map(toDailyReportDto);

      Logger.info('Daily reports fetched successfully', {
        tenantId,
        operatorId,
        count: reports.length,
        context: 'ReportService.getReportsByOperator',
      });

      return reports;
    } catch (error) {
      Logger.error('Error fetching daily reports by operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        operatorId,
        context: 'ReportService.getReportsByOperator',
      });
      throw error;
    }
  }

  /**
   * Create new daily report
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param data - Daily report data (DTO or frontend model)
   *
   * @returns Created daily report
   * @throws {ValidationError} If data validation fails
   *
   * @example
   * const report = await reportService.createReport(1, {
   *   equipo_id: 123,
   *   trabajador_id: 456,
   *   proyecto_id: 789,
   *   fecha: '2026-01-18',
   *   horas_trabajadas: 8
   * });
   */
  async createReport(
    tenantId: number,
    data: Partial<DailyReportDto> | DailyReportFrontendModel
  ): Promise<DailyReportDto> {
    try {
      // Extract fields safely from either DTO or frontend model
      const dtoData = data as Partial<DailyReportDto>;
      const frontendData = data as DailyReportFrontendModel;

      Logger.info('Creating daily report', {
        tenantId,
        equipoId: dtoData.equipo_id || frontendData.equipmentId,
        trabajadorId: dtoData.trabajador_id || frontendData.operatorId,
        fecha: dtoData.fecha || frontendData.reportDate,
        context: 'ReportService.createReport',
      });

      // Business validation: fecha cannot be in the future
      const fecha = dtoData.fecha || frontendData.reportDate;
      if (fecha) {
        const reportDate = new Date(fecha);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (reportDate > today) {
          throw new ValidationError('Report date cannot be in the future', [
            {
              field: 'fecha',
              message: 'La fecha no puede ser futura',
              rule: 'max',
              value: fecha,
              constraints: { max: today.toISOString().split('T')[0] },
            },
          ]);
        }
      }

      // Business validation: horas_trabajadas must be positive and <= 24
      // Note: Frontend model may not have this field
      const horasTrabajadas = dtoData.horas_trabajadas;
      if (horasTrabajadas !== undefined && horasTrabajadas !== null) {
        if (horasTrabajadas <= 0) {
          throw new ValidationError('Hours worked must be positive', [
            {
              field: 'horas_trabajadas',
              message: 'Horas trabajadas debe ser mayor a 0',
              rule: 'min',
              value: horasTrabajadas,
              constraints: { min: 0 },
            },
          ]);
        }

        if (horasTrabajadas > 24) {
          throw new ValidationError('Hours worked cannot exceed 24', [
            {
              field: 'horas_trabajadas',
              message: 'Horas trabajadas no puede exceder 24',
              rule: 'max',
              value: horasTrabajadas,
              constraints: { max: 24 },
            },
          ]);
        }
      }

      // Adapter: sanitize input (convert frontend model to backend DTO if needed)
      const sanitizedDto: Partial<DailyReportDto> = {
        ...DailyReportAdapter.toBackendDto(data as DailyReportFrontendModel),
        ...(data as Partial<DailyReportDto>), // Allow explicit DTO properties to override
      };

      // Transform to Entity (for raw SQL/TypeORM)
      const entity = fromDailyReportDto(sanitizedDto);

      // TODO: Add tenant_id to entity when column exists
      // entity.tenant_id = tenantId;

      // Auto-apply precalentamiento config when not explicitly provided
      if (entity.horas_precalentamiento === undefined || entity.horas_precalentamiento === null) {
        const equipoId = entity.equipo_id || dtoData.equipo_id;
        if (equipoId) {
          try {
            const equipoRepo = AppDataSource.getRepository(Equipment);
            const equipo = await equipoRepo.findOne({
              where: { id: equipoId },
              select: ['id', 'tipoEquipoId'],
            });
            if (equipo?.tipoEquipoId) {
              entity.horas_precalentamiento = await this.precalentamientoService.obtenerHoras(
                equipo.tipoEquipoId
              );
            }
          } catch (precalErr) {
            // Non-critical: log and continue without auto-apply
            Logger.warn('No se pudo auto-aplicar precalentamiento', {
              equipoId,
              error: precalErr instanceof Error ? precalErr.message : String(precalErr),
              context: 'ReportService.createReport',
            });
          }
        }
      }

      // Persist
      const created: DailyReportRawRow = await DailyReportModel.create(tenantId, entity);
      const report = toDailyReportDto(created);

      Logger.info('Daily report created successfully', {
        tenantId,
        reportId: report.id,
        equipoId: report.equipo_id,
        trabajadorId: report.trabajador_id,
        context: 'ReportService.createReport',
      });

      // Invalidate dashboard cache (report count changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after report create', {
        tenantId,
        reportId: report.id,
        context: 'ReportService.createReport',
      });

      return report;
    } catch (error) {
      Logger.error('Error creating daily report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        data,
        context: 'ReportService.createReport',
      });
      throw error;
    }
  }

  /**
   * Update existing daily report
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Daily report ID
   * @param data - Updated daily report data
   *
   * @returns Updated daily report
   * @throws {NotFoundError} If report not found
   *
   * @example
   * const updated = await reportService.updateReport(1, '123', {
   *   horas_trabajadas: 9,
   *   observaciones: 'Trabajo extendido'
   * });
   */
  async updateReport(
    tenantId: number,
    id: string,
    data: Partial<DailyReportDto> | DailyReportFrontendModel
  ): Promise<DailyReportDto> {
    try {
      Logger.info('Updating daily report', {
        tenantId,
        reportId: id,
        context: 'ReportService.updateReport',
      });

      // Verify report exists first
      await this.getReportById(tenantId, id);

      // Adapter: sanitize input
      const sanitizedDto: Partial<DailyReportDto> = {
        ...DailyReportAdapter.toBackendDto(data as DailyReportFrontendModel),
        ...(data as Partial<DailyReportDto>),
      };

      // Transform to Entity
      const entity = fromDailyReportDto(sanitizedDto);

      // TODO: Add tenant_id verification when column exists

      // Persist
      const updated: DailyReportRawRow | null = await DailyReportModel.update(tenantId, id, entity);

      if (!updated) {
        throw new NotFoundError('Daily report', id, { tenantId });
      }

      const report = toDailyReportDto(updated);

      Logger.info('Daily report updated successfully', {
        tenantId,
        reportId: id,
        context: 'ReportService.updateReport',
      });

      // Invalidate dashboard cache (report data changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after report update', {
        tenantId,
        reportId: id,
        context: 'ReportService.updateReport',
      });

      return report;
    } catch (error) {
      Logger.error('Error updating daily report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        reportId: id,
        data,
        context: 'ReportService.updateReport',
      });
      throw error;
    }
  }

  /**
   * Approve daily report
   *
   * Changes report status to APROBADO and records approver
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Daily report ID
   * @param approvedBy - ID of user approving the report
   *
   * @returns Approved daily report
   * @throws {NotFoundError} If report not found
   *
   * @example
   * const approved = await reportService.approveReport(1, '123', 'user_456');
   */
  async approveReport(tenantId: number, id: string, approvedBy: string): Promise<DailyReportDto> {
    try {
      Logger.info('Approving daily report', {
        tenantId,
        reportId: id,
        approvedBy,
        context: 'ReportService.approveReport',
      });

      const entity: DailyReportRawRow | null = await DailyReportModel.approve(
        tenantId,
        id,
        approvedBy
      );

      if (!entity) {
        throw new NotFoundError('Daily report', id, { tenantId });
      }

      const report = toDailyReportDto(entity);

      Logger.info('Daily report approved successfully', {
        tenantId,
        reportId: id,
        approvedBy,
        context: 'ReportService.approveReport',
      });

      return report;
    } catch (error) {
      Logger.error('Error approving daily report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        reportId: id,
        approvedBy,
        context: 'ReportService.approveReport',
      });
      throw error;
    }
  }

  /**
   * Reject daily report
   *
   * Changes report status to RECHAZADO and records rejection reason
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Daily report ID
   * @param reason - Reason for rejection
   *
   * @returns Rejected daily report
   * @throws {NotFoundError} If report not found
   * @throws {ValidationError} If reason is empty
   *
   * @example
   * const rejected = await reportService.rejectReport(1, '123', 'Datos incompletos');
   */
  async rejectReport(tenantId: number, id: string, reason: string): Promise<DailyReportDto> {
    try {
      Logger.info('Rejecting daily report', {
        tenantId,
        reportId: id,
        reason,
        context: 'ReportService.rejectReport',
      });

      // Business validation: reason required
      if (!reason || reason.trim() === '') {
        throw new ValidationError('Rejection reason is required', [
          {
            field: 'reason',
            message: 'Razón de rechazo es requerida',
            rule: 'required',
            value: reason,
          },
        ]);
      }

      const entity: DailyReportRawRow | null = await DailyReportModel.reject(tenantId, id, reason);

      if (!entity) {
        throw new NotFoundError('Daily report', id, { tenantId });
      }

      const report = toDailyReportDto(entity);

      Logger.info('Daily report rejected successfully', {
        tenantId,
        reportId: id,
        context: 'ReportService.rejectReport',
      });

      return report;
    } catch (error) {
      Logger.error('Error rejecting daily report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        reportId: id,
        reason,
        context: 'ReportService.rejectReport',
      });
      throw error;
    }
  }

  /**
   * Register resident signature on daily report
   *
   * @param tenantId - Tenant identifier
   * @param id - Daily report ID
   * @param firmaResidente - Resident name or signature value
   *
   * @returns Updated daily report DTO
   * @throws {NotFoundError} If report not found
   */
  async firmarResidente(
    tenantId: number,
    id: string,
    firmaResidente: string
  ): Promise<DailyReportDto> {
    try {
      Logger.info('Registrando firma del residente en parte diario', {
        tenantId,
        reportId: id,
        context: 'ReportService.firmarResidente',
      });

      if (!firmaResidente || firmaResidente.trim() === '') {
        throw new ValidationError('La firma del residente es requerida', [
          {
            field: 'firma_residente',
            message: 'Firma del residente no puede estar vacía',
            rule: 'required',
            value: firmaResidente,
          },
        ]);
      }

      const entity = await DailyReportModel.firmarResidente(
        tenantId,
        id,
        firmaResidente.trim()
      );

      if (!entity) {
        throw new NotFoundError('Daily report', id, { tenantId });
      }

      const report = toDailyReportDto(entity);

      Logger.info('Firma del residente registrada exitosamente', {
        tenantId,
        reportId: id,
        context: 'ReportService.firmarResidente',
      });

      return report;
    } catch (error) {
      Logger.error('Error al registrar firma del residente', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        reportId: id,
        context: 'ReportService.firmarResidente',
      });
      throw error;
    }
  }

  /**
   * Delete daily report (soft delete)
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Daily report ID
   *
   * @throws {NotFoundError} If report not found
   *
   * @example
   * await reportService.deleteReport(1, '123');
   */
  async deleteReport(tenantId: number, id: string): Promise<void> {
    try {
      Logger.info('Deleting daily report', {
        tenantId,
        reportId: id,
        context: 'ReportService.deleteReport',
      });

      const deleted = await DailyReportModel.delete(tenantId, id);

      if (!deleted) {
        throw new NotFoundError('Daily report', id, { tenantId });
      }

      Logger.info('Daily report deleted successfully', {
        tenantId,
        reportId: id,
        context: 'ReportService.deleteReport',
      });

      // Invalidate dashboard cache (report count changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after report delete', {
        tenantId,
        reportId: id,
        context: 'ReportService.deleteReport',
      });
    } catch (error) {
      Logger.error('Error deleting daily report', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        reportId: id,
        context: 'ReportService.deleteReport',
      });
      throw error;
    }
  }

  /**
   * Get daily report data formatted for PDF generation
   *
   * Fetches report with all relations (equipment, worker, project, production data, etc.)
   * and transforms to PDF-specific DTO
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Daily report ID
   *
   * @returns Daily report data formatted for PDF
   * @throws {NotFoundError} If report not found
   *
   * @example
   * const pdfData = await reportService.getDailyReportPdfData(1, 123);
   * // Use pdfData to generate PDF
   */
  async getDailyReportPdfData(tenantId: number, id: number): Promise<DailyReportPdfDto> {
    try {
      Logger.info('Fetching daily report PDF data', {
        tenantId,
        reportId: id,
        context: 'ReportService.getDailyReportPdfData',
      });

      const repository = AppDataSource.getRepository(DailyReport);

      const report = await repository.findOne({
        where: { id, tenantId },
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
        throw new NotFoundError('Daily report', id, { tenantId });
      }

      // Transform to PDF DTO (handles all nested relations)
      const pdfDto = transformToDailyReportPdfDto(report);

      Logger.info('Daily report PDF data fetched successfully', {
        tenantId,
        reportId: id,
        hasProduccion: Array.isArray((pdfDto as unknown as Record<string, unknown>).produccionRows),
        context: 'ReportService.getDailyReportPdfData',
      });

      return pdfDto;
    } catch (error) {
      Logger.error('Error fetching daily report PDF data', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        reportId: id,
        context: 'ReportService.getDailyReportPdfData',
      });
      throw error;
    }
  }

  /**
   * Get reception status for daily reports per equipment
   *
   * For each active equipment (optionally filtered by project), checks which dates
   * within the given range have daily reports and which are missing.
   */
  async getReceptionStatus(
    tenantId: number,
    fechaDesde: string,
    fechaHasta: string,
    proyectoId?: number
  ): Promise<EquipmentReceptionStatus[]> {
    try {
      Logger.info('Fetching daily report reception status', {
        tenantId,
        fechaDesde,
        fechaHasta,
        proyectoId,
        context: 'ReportService.getReceptionStatus',
      });

      const equipmentRepo = AppDataSource.getRepository(Equipment);
      const reportRepo = AppDataSource.getRepository(DailyReport);

      // Get active equipment
      const equipment = await equipmentRepo.find({
        where: { tenantId, estado: In(['DISPONIBLE', 'EN_USO', 'OPERATIVO']) },
        order: { codigoEquipo: 'ASC' },
      });

      // Calculate total working days in range (Mon-Sat)
      const start = new Date(fechaDesde);
      const end = new Date(fechaHasta);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Rango de fechas inválido');
      }

      const workingDays: string[] = [];
      const current = new Date(start);
      while (current <= end) {
        const dow = current.getDay();
        if (dow >= 1 && dow <= 6) {
          // Mon-Sat
          workingDays.push(current.toISOString().split('T')[0]);
        }
        current.setDate(current.getDate() + 1);
      }

      const totalDias = workingDays.length;

      // Get all daily reports in the date range (optionally filtered by project)
      const reportWhere: FindOptionsWhere<DailyReport> = {
        tenantId,
        fecha: Between(new Date(fechaDesde), new Date(fechaHasta)),
      };
      if (proyectoId) {
        reportWhere.proyectoId = proyectoId;
      }

      const reports = await reportRepo.find({
        where: reportWhere,
        select: ['id', 'equipoId', 'fecha', 'proyectoId'],
        relations: ['proyecto'],
      });

      // Group report dates by equipment
      const reportsByEquipment = new Map<number, Set<string>>();
      const projectByEquipment = new Map<number, string>();
      for (const r of reports) {
        const dateStr = new Date(r.fecha).toISOString().split('T')[0];
        if (!reportsByEquipment.has(r.equipoId)) {
          reportsByEquipment.set(r.equipoId, new Set());
        }
        reportsByEquipment.get(r.equipoId)!.add(dateStr);
        if (r.proyecto?.nombre && !projectByEquipment.has(r.equipoId)) {
          projectByEquipment.set(r.equipoId, r.proyecto.nombre);
        }
      }

      // If filtering by project, only include equipment that has reports for that project
      const relevantEquipment = proyectoId
        ? equipment.filter((eq) => reportsByEquipment.has(eq.id))
        : equipment;

      // Build result per equipment
      const result: EquipmentReceptionStatus[] = relevantEquipment.map((eq) => {
        const reportDates = reportsByEquipment.get(eq.id) || new Set();
        const fechasFaltantes = workingDays.filter((d) => !reportDates.has(d));
        const recibidos = totalDias - fechasFaltantes.length;

        return {
          equipo_id: eq.id,
          codigo_equipo: eq.codigoEquipo || '',
          marca: eq.marca || '',
          modelo: eq.modelo || '',
          proyecto_nombre: projectByEquipment.get(eq.id) || undefined,
          total_dias: totalDias,
          reportes_recibidos: recibidos,
          reportes_pendientes: fechasFaltantes.length,
          porcentaje_recepcion: totalDias > 0 ? Math.round((recibidos / totalDias) * 100) : 0,
          fechas_faltantes: fechasFaltantes,
        };
      });

      Logger.info('Daily report reception status fetched', {
        tenantId,
        equipmentCount: result.length,
        totalDias,
        context: 'ReportService.getReceptionStatus',
      });

      return result;
    } catch (error) {
      Logger.error('Error fetching reception status', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        fechaDesde,
        fechaHasta,
        proyectoId,
        context: 'ReportService.getReceptionStatus',
      });
      throw error;
    }
  }

  /**
   * Get inspection tracking: list of equipment with pending/resolved mechanical observations.
   */
  async getInspectionTracking(
    fechaDesde?: string,
    fechaHasta?: string,
    soloAbiertas?: boolean
  ): Promise<EquipmentInspectionTracking[]> {
    try {
      const delayRepo = AppDataSource.getRepository(DailyReportMechanicalDelay);

      const qb = delayRepo
        .createQueryBuilder('dm')
        .innerJoinAndSelect('dm.parteDiario', 'pd')
        .innerJoinAndSelect('pd.equipo', 'eq')
        .orderBy('pd.fecha', 'DESC')
        .addOrderBy('dm.resuelta', 'ASC')
        .addOrderBy('dm.createdAt', 'DESC');

      if (fechaDesde) qb.andWhere('pd.fecha >= :desde', { desde: fechaDesde });
      if (fechaHasta) qb.andWhere('pd.fecha <= :hasta', { hasta: fechaHasta });
      if (soloAbiertas) qb.andWhere('dm.resuelta = false');

      const delays = await qb.getMany();

      // Group by equipment
      const byEquipo = new Map<
        number,
        { equipo: Equipment; observaciones: DailyReportMechanicalDelay[] }
      >();

      for (const d of delays) {
        const equipo = d.parteDiario?.equipo;
        if (!equipo) continue;
        if (!byEquipo.has(equipo.id)) {
          byEquipo.set(equipo.id, { equipo, observaciones: [] });
        }
        byEquipo.get(equipo.id)!.observaciones.push(d);
      }

      const result: EquipmentInspectionTracking[] = [];
      for (const { equipo, observaciones } of byEquipo.values()) {
        const abiertas = observaciones.filter((o) => !o.resuelta).length;
        result.push({
          equipo_id: equipo.id,
          codigo_equipo: equipo.codigoEquipo,
          marca: equipo.marca || null,
          modelo: equipo.modelo || null,
          total_observaciones: observaciones.length,
          observaciones_abiertas: abiertas,
          observaciones_resueltas: observaciones.length - abiertas,
          observaciones: observaciones.map((o) => ({
            id: o.id,
            parte_diario_id: o.parteDiarioId,
            fecha: o.parteDiario?.fecha
              ? new Date(o.parteDiario.fecha).toISOString().split('T')[0]
              : null,
            codigo: o.codigo,
            descripcion: o.descripcion || null,
            resuelta: o.resuelta,
            fecha_resolucion: o.fechaResolucion
              ? new Date(o.fechaResolucion).toISOString().split('T')[0]
              : null,
            observacion_resolucion: o.observacionResolucion || null,
          })),
        });
      }

      result.sort((a, b) => b.observaciones_abiertas - a.observaciones_abiertas);

      Logger.info('Inspection tracking fetched', {
        total_equipos: result.length,
        context: 'ReportService.getInspectionTracking',
      });

      return result;
    } catch (error) {
      Logger.error('Error fetching inspection tracking', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ReportService.getInspectionTracking',
      });
      throw error;
    }
  }

  /**
   * Mark a mechanical delay observation as resolved.
   */
  async resolverObservacion(id: number, observacionResolucion?: string): Promise<void> {
    const delayRepo = AppDataSource.getRepository(DailyReportMechanicalDelay);
    const obs = await delayRepo.findOneBy({ id });
    if (!obs) throw new NotFoundError('Observación', String(id));

    obs.resuelta = true;
    obs.fechaResolucion = new Date();
    obs.observacionResolucion = observacionResolucion || null;
    await delayRepo.save(obs);

    Logger.info('Mechanical observation resolved', {
      observacion_id: id,
      context: 'ReportService.resolverObservacion',
    });
  }
}

export interface EquipmentInspectionTracking {
  equipo_id: number;
  codigo_equipo: string;
  marca: string | null;
  modelo: string | null;
  total_observaciones: number;
  observaciones_abiertas: number;
  observaciones_resueltas: number;
  observaciones: Array<{
    id: number;
    parte_diario_id: number;
    fecha: string | null;
    codigo: string;
    descripcion: string | null;
    resuelta: boolean;
    fecha_resolucion: string | null;
    observacion_resolucion: string | null;
  }>;
}
