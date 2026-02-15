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
   * List all timesheets with optional filters
   */
  listTimesheets(filters?: {
    trabajador_id?: number;
    proyecto_id?: string;
    estado?: string;
    periodo?: string;
  }): Observable<Timesheet[]> {
    const params: any = {};
    if (filters) {
      if (filters.trabajador_id) params.trabajador_id = filters.trabajador_id.toString();
      if (filters.proyecto_id) params.proyecto_id = filters.proyecto_id;
      if (filters.estado) params.estado = filters.estado;
      if (filters.periodo) params.periodo = filters.periodo;
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        const dataArray = response?.data || response;
        return Array.isArray(dataArray) ? dataArray : [];
      })
    );
  }

  /**
   * Get timesheet by ID
   */
  getById(id: string | number): Observable<Timesheet> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response?.data || response)
    );
  }

  // Alias for backward compatibility
  getTimesheetById(id: number): Observable<Timesheet> {
    return this.getById(id);
  }

  /**
   * Create manual timesheet
   */
  create(data: Partial<Timesheet>): Observable<Timesheet> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      map((response) => response?.data || response)
    );
  }

  /**
   * Update timesheet (draft only)
   */
  update(id: string | number, data: Partial<Timesheet>): Observable<Timesheet> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      map((response) => response?.data || response)
    );
  }

  // Alias for backward compatibility
  updateTimesheet(id: number, data: Partial<Timesheet>): Observable<Timesheet> {
    return this.update(id, data);
  }

  /**
   * Generate timesheet from daily reports
   */
  generateTimesheet(dto: GenerateTimesheetDto): Observable<Timesheet> {
    return this.http.post<any>(`${this.apiUrl}/generate`, dto).pipe(
      map((response) => response?.data || response)
    );
  }

  /**
   * Submit timesheet for approval (BORRADOR → ENVIADO)
   */
  submitTimesheet(id: number): Observable<Timesheet> {
    return this.http.post<any>(`${this.apiUrl}/${id}/submit`, {}).pipe(
      map((response) => response?.data || response)
    );
  }

  /**
   * Approve timesheet (ENVIADO → APROBADO)
   */
  approveTimesheet(id: number): Observable<Timesheet> {
    return this.http.post<any>(`${this.apiUrl}/${id}/approve`, {}).pipe(
      map((response) => response?.data || response)
    );
  }

  /**
   * Reject timesheet (ENVIADO → RECHAZADO)
   */
  rejectTimesheet(id: number, reason: string): Observable<Timesheet> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reject`, { reason }).pipe(
      map((response) => response?.data || response)
    );
  }

  /**
   * Delete timesheet (draft only)
   */
  deleteTimesheet(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
