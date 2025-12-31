import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaintenanceSchedule } from '../models/maintenance-schedule.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceScheduleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/scheduling/maintenance-schedules`;

  // Interceptor unwraps { success: true, data: [...] } to just [...]
  getAll(filters?: any): Observable<MaintenanceSchedule[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<MaintenanceSchedule[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<MaintenanceSchedule> {
    return this.http.get<MaintenanceSchedule>(`${this.apiUrl}/${id}`);
  }

  create(schedule: Partial<MaintenanceSchedule>): Observable<MaintenanceSchedule> {
    return this.http.post<MaintenanceSchedule>(this.apiUrl, schedule);
  }

  update(id: string, schedule: Partial<MaintenanceSchedule>): Observable<MaintenanceSchedule> {
    return this.http.put<MaintenanceSchedule>(`${this.apiUrl}/${id}`, schedule);
  }

  delete(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  generateTasks(daysAhead = 30): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-tasks`, { daysAhead });
  }

  complete(id: string, completionHours?: number): Observable<MaintenanceSchedule> {
    return this.http.post<MaintenanceSchedule>(`${this.apiUrl}/${id}/complete`, {
      completionHours,
    });
  }
}
