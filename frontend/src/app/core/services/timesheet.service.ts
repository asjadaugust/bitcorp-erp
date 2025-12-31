import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

    return this.http.get<Timesheet[]>(this.apiUrl, { params });
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
    return this.http.get<Timesheet>(`${this.apiUrl}/${id}`);
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
