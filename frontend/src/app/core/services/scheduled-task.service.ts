import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ScheduledTask } from '../models/scheduled-task.model';

@Injectable({
  providedIn: 'root',
})
export class ScheduledTaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/scheduling/tasks`;

  // Interceptor unwraps { success: true, data: [...] } to just [...]
  getAll(filters?: any): Observable<ScheduledTask[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<ScheduledTask[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ScheduledTask> {
    return this.http.get<ScheduledTask>(`${this.apiUrl}/${id}`);
  }

  create(task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.http.post<ScheduledTask>(this.apiUrl, task);
  }

  update(id: number, task: Partial<ScheduledTask>): Observable<ScheduledTask> {
    return this.http.put<ScheduledTask>(`${this.apiUrl}/${id}`, task);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  assignOperator(id: number, operatorId: number): Observable<ScheduledTask> {
    return this.http.post<ScheduledTask>(`${this.apiUrl}/${id}/assign`, { operatorId });
  }

  complete(
    id: number,
    data: { completionNotes?: string; maintenanceRecordId?: number }
  ): Observable<ScheduledTask> {
    return this.http.post<ScheduledTask>(`${this.apiUrl}/${id}/complete`, data);
  }

  checkConflicts(
    operatorId: number,
    date: string,
    excludeTaskId?: number
  ): Observable<{ hasConflicts: boolean; conflicts: any[] }> {
    let params = new HttpParams().set('operator_id', operatorId.toString()).set('date', date);

    if (excludeTaskId) {
      params = params.set('exclude_task_id', excludeTaskId.toString());
    }

    return this.http.get<{ hasConflicts: boolean; conflicts: any[] }>(
      `${this.apiUrl}/check-conflicts`,
      { params }
    );
  }
}
