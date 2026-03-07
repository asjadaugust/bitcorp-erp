import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}
import { Timesheet, GenerateTimesheetDto } from '../models/scheduling.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimesheetService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/scheduling/timesheets`;

  listTimesheetsPaginated(params?: {
    page?: number;
    limit?: number;
    trabajador_id?: number;
    proyecto_id?: string;
    estado?: string;
    periodo?: string;
  }): Observable<PaginatedResponse<Timesheet>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.trabajador_id)
      httpParams = httpParams.set('trabajador_id', params.trabajador_id.toString());
    if (params?.proyecto_id) httpParams = httpParams.set('proyecto_id', params.proyecto_id);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    if (params?.periodo) httpParams = httpParams.set('periodo', params.periodo);
    return this.http.get<Record<string, unknown>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        const data = (response?.['data'] ?? response) as Timesheet[];
        const pagination = (response?.[
          'pagination'
        ] as PaginatedResponse<Timesheet>['pagination']) ?? {
          page: 1,
          limit: params?.limit ?? 20,
          total: Array.isArray(data) ? data.length : 0,
          total_pages: 1,
        };
        return { data: Array.isArray(data) ? data : [], pagination };
      })
    );
  }

  /**
   * List all timesheets with optional filters
   */
  listTimesheets(filters?: {
    trabajador_id?: number;
    proyecto_id?: string;
    estado?: string;
    periodo?: string;
  }): Observable<Timesheet[]> {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.trabajador_id) params['trabajador_id'] = filters.trabajador_id.toString();
      if (filters.proyecto_id) params['proyecto_id'] = filters.proyecto_id;
      if (filters.estado) params['estado'] = filters.estado;
      if (filters.periodo) params['periodo'] = filters.periodo;
    }

    return this.http.get<Record<string, unknown>>(this.apiUrl, { params }).pipe(
      map((response) => {
        const dataArray = response?.['data'] || response;
        return Array.isArray(dataArray) ? (dataArray as Timesheet[]) : [];
      })
    );
  }

  /**
   * Get timesheet by ID
   */
  getById(id: string | number): Observable<Timesheet> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => (response?.['data'] || response) as Timesheet));
  }

  // Alias for backward compatibility
  getTimesheetById(id: number): Observable<Timesheet> {
    return this.getById(id);
  }

  /**
   * Create manual timesheet
   */
  create(data: Partial<Timesheet>): Observable<Timesheet> {
    return this.http
      .post<Record<string, unknown>>(this.apiUrl, data)
      .pipe(map((response) => (response?.['data'] || response) as Timesheet));
  }

  /**
   * Update timesheet (draft only)
   */
  update(id: string | number, data: Partial<Timesheet>): Observable<Timesheet> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, data)
      .pipe(map((response) => (response?.['data'] || response) as Timesheet));
  }

  // Alias for backward compatibility
  updateTimesheet(id: number, data: Partial<Timesheet>): Observable<Timesheet> {
    return this.update(id, data);
  }

  /**
   * Generate timesheet from daily reports
   */
  generateTimesheet(dto: GenerateTimesheetDto): Observable<Timesheet> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/generate`, dto)
      .pipe(map((response) => (response?.['data'] || response) as Timesheet));
  }

  /**
   * Submit timesheet for approval (BORRADOR → ENVIADO)
   */
  submitTimesheet(id: number): Observable<Timesheet> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/submit`, {})
      .pipe(map((response) => (response?.['data'] || response) as Timesheet));
  }

  /**
   * Approve timesheet (ENVIADO → APROBADO)
   */
  approveTimesheet(id: number): Observable<Timesheet> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(map((response) => (response?.['data'] || response) as Timesheet));
  }

  /**
   * Reject timesheet (ENVIADO → RECHAZADO)
   */
  rejectTimesheet(id: number, reason: string): Observable<Timesheet> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/reject`, { reason })
      .pipe(map((response) => (response?.['data'] || response) as Timesheet));
  }

  /**
   * Delete timesheet (draft only)
   */
  deleteTimesheet(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
