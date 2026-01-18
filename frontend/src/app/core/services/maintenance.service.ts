import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord } from '../models/maintenance-record.model';

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

    // Interceptor already unwraps {success, data} -> data
    return this.http.get<MaintenanceRecord[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<MaintenanceRecord> {
    // Interceptor already unwraps {success, data} -> data
    return this.http.get<MaintenanceRecord>(`${this.apiUrl}/${id}`);
  }

  create(record: Omit<MaintenanceRecord, 'id'>): Observable<MaintenanceRecord> {
    // Interceptor already unwraps {success, data} -> data
    return this.http.post<MaintenanceRecord>(this.apiUrl, record);
  }

  update(id: number, record: Partial<MaintenanceRecord>): Observable<MaintenanceRecord> {
    // Interceptor already unwraps {success, data} -> data
    return this.http.put<MaintenanceRecord>(`${this.apiUrl}/${id}`, record);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
