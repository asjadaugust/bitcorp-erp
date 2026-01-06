import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord } from '../models/maintenance-record.model';

interface MaintenanceResponse {
  success: boolean;
  data: MaintenanceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/maintenance`;

  getAll(filters: any = {}): Observable<MaintenanceRecord[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.type) params = params.set('type', filters.type);

    return this.http
      .get<MaintenanceResponse>(this.apiUrl, { params })
      .pipe(map((response) => response.data));
  }

  getById(id: number): Observable<MaintenanceRecord> {
    return this.http
      .get<{ success: boolean; data: MaintenanceRecord }>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  create(record: Omit<MaintenanceRecord, 'id'>): Observable<MaintenanceRecord> {
    return this.http
      .post<{ success: boolean; data: MaintenanceRecord }>(this.apiUrl, record)
      .pipe(map((response) => response.data));
  }

  update(id: number, record: Partial<MaintenanceRecord>): Observable<MaintenanceRecord> {
    return this.http
      .put<{ success: boolean; data: MaintenanceRecord }>(`${this.apiUrl}/${id}`, record)
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
