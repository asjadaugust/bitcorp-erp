import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MaintenanceSchedule } from '../models/maintenance-schedule.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceScheduleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/scheduling/maintenance-schedules`;

  getAll(filters?: any): Observable<MaintenanceSchedule[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      })
    );
  }

  getById(id: string | number): Observable<MaintenanceSchedule> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response?.data || response)
    );
  }

  create(schedule: Partial<MaintenanceSchedule>): Observable<MaintenanceSchedule> {
    return this.http.post<any>(this.apiUrl, schedule).pipe(
      map((response) => response?.data || response)
    );
  }

  update(id: string | number, schedule: Partial<MaintenanceSchedule>): Observable<MaintenanceSchedule> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, schedule).pipe(
      map((response) => response?.data || response)
    );
  }

  delete(id: string | number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  generateTasks(daysAhead = 30): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-tasks`, { daysAhead });
  }

  complete(id: string | number, completionHours?: number): Observable<MaintenanceSchedule> {
    return this.http.post<any>(`${this.apiUrl}/${id}/complete`, {
      completionHours,
    }).pipe(
      map((response) => response?.data || response)
    );
  }
}
