import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Timesheet, GenerateTimesheetDto } from '../models/scheduling.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimesheetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/scheduling/timesheets`;

  /**
   * Map backend DTO (snake_case) to frontend model (camelCase)
   */
  private mapApiToTimesheet(apiData: any): Timesheet {
    return {
      id: apiData.id,
      timesheetCode: apiData.timesheet_code || `TS-${apiData.id}`,
      operatorId: apiData.trabajador_id || apiData.operator_id,
      projectId: apiData.project_id,
      periodStart: apiData.period_start || this.parsePeriod(apiData.periodo)?.start,
      periodEnd: apiData.period_end || this.parsePeriod(apiData.periodo)?.end,
      totalHours: parseFloat(apiData.total_horas || apiData.total_hours || 0),
      totalDays: parseInt(apiData.total_dias_trabajados || apiData.total_days || 0),
      regularHours: apiData.regular_hours,
      overtimeHours: apiData.overtime_hours,
      status: apiData.estado || apiData.status,
      generatedFromReports:
        apiData.generated_from_reports !== undefined ? apiData.generated_from_reports : true,
      notes: apiData.notes || apiData.notas,
      submittedAt: apiData.submitted_at,
      submittedBy: apiData.submitted_by,
      approvedAt: apiData.approved_at,
      approvedBy: apiData.aprobado_por || apiData.approved_by,
      rejectedAt: apiData.rejected_at,
      rejectedBy: apiData.rejected_by,
      rejectionReason: apiData.rejection_reason,
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at,
      operator:
        apiData.operator ||
        (apiData.trabajador_nombre ? { nombre: apiData.trabajador_nombre } : undefined),
      project: apiData.project,
      details: apiData.details,
    };
  }

  /**
   * Parse periodo string (e.g., "2025-01") to start/end dates
   */
  private parsePeriod(periodo?: string): { start: Date; end: Date } | undefined {
    if (!periodo) return undefined;
    const [year, month] = periodo.split('-').map(Number);
    if (!year || !month) return undefined;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0); // Last day of month
    return { start, end };
  }

  /**
   * List all timesheets with optional filters
   */
  listTimesheets(filters?: {
    operator_id?: number;
    project_id?: string;
    status?: string;
    period_start?: string;
    period_end?: string;
  }): Observable<Timesheet[]> {
    const params: any = {};
    if (filters) {
      if (filters.operator_id) params.operator_id = filters.operator_id.toString();
      if (filters.project_id) params.project_id = filters.project_id;
      if (filters.status) params.status = filters.status;
      if (filters.period_start) params.period_start = filters.period_start;
      if (filters.period_end) params.period_end = filters.period_end;
    }

    // Interceptor does NOT unwrap paginated responses {success, data, pagination}
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        const dataArray = response?.data || response;
        if (Array.isArray(dataArray)) {
          return dataArray.map((item) => this.mapApiToTimesheet(item));
        }
        return [];
      })
    );
  }

  /**
   * Create manual timesheet
   */
  create(data: any): Observable<Timesheet> {
    return this.http.post<Timesheet>(this.apiUrl, data);
  }

  /**
   * Alias for getTimesheetById to match component usage
   */
  getById(id: string | number): Observable<Timesheet> {
    return this.getTimesheetById(Number(id));
  }

  /**
   * Alias for updateTimesheet to match component usage
   */
  update(id: string | number, data: any): Observable<Timesheet> {
    return this.updateTimesheet(Number(id), data);
  }

  /**
   * Get timesheet by ID with details
   */
  getTimesheetById(id: number): Observable<Timesheet> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        const data = response?.data || response;
        return this.mapApiToTimesheet(data);
      })
    );
  }

  /**
   * Generate timesheet from daily reports
   */
  generateTimesheet(dto: GenerateTimesheetDto): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.apiUrl}/generate`, dto);
  }

  /**
   * Submit timesheet for approval
   */
  submitTimesheet(id: number): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.apiUrl}/${id}/submit`, {});
  }

  /**
   * Approve timesheet
   */
  approveTimesheet(id: number): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.apiUrl}/${id}/approve`, {});
  }

  /**
   * Reject timesheet
   */
  rejectTimesheet(id: number, reason: string): Observable<Timesheet> {
    return this.http.post<Timesheet>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * Update timesheet (draft only)
   */
  updateTimesheet(id: number, data: Partial<Timesheet>): Observable<Timesheet> {
    return this.http.put<Timesheet>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete timesheet (draft only)
   */
  deleteTimesheet(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
