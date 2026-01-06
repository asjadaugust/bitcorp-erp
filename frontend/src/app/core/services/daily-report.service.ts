import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DailyReport, CreateDailyReportDto } from '../models/daily-report.model';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DailyReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  getAll(filters?: any): Observable<DailyReport[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    // API might return paginated response: {success, data, pagination}
    // Extract data array if it exists, otherwise return as-is
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      })
    );
  }

  getById(id: string | number): Observable<DailyReport> {
    return this.http.get<DailyReport>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateDailyReportDto): Observable<DailyReport> {
    return this.http.post<DailyReport>(this.apiUrl, data);
  }

  update(id: string | number, data: Partial<DailyReport>): Observable<DailyReport> {
    return this.http.put<DailyReport>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByOperator(operatorId: string | number): Observable<DailyReport[]> {
    return this.http.get<DailyReport[]>(`${this.apiUrl}/operator/${operatorId}`);
  }

  approve(id: string | number): Observable<DailyReport> {
    return this.http.put<DailyReport>(`${this.apiUrl}/${id}/approve`, {});
  }

  reject(id: string | number, reason: string): Observable<DailyReport> {
    return this.http.put<DailyReport>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  downloadPdf(id: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  uploadPhotos(id: string | number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/photos`, formData);
  }

  deletePhoto(id: string | number, photoIndex: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/photos/${photoIndex}`);
  }
}
