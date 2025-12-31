import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DailyReport {
  id?: string | number;
  report_date: string;
  operator_id: number;
  operator_name?: string;
  equipment_id: number;
  equipment_code?: string;
  equipment_name?: string;
  project_id?: string;
  project_name?: string;
  start_time: string;
  end_time: string;
  hourmeter_start: number;
  hourmeter_end: number;
  odometer_start?: number;
  odometer_end?: number;
  fuel_start?: number;
  fuel_end?: number;
  fuel_consumed?: number;
  location: string;
  work_description: string;
  notes?: string;
  weather_conditions?: string;
  photos?: string[];
  gps_latitude?: number;
  gps_longitude?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

export interface DailyReportFilters {
  status?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  operator_id?: number;
  equipment_id?: number;
  project_id?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DailyReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getAllReports(filters?: DailyReportFilters): Observable<{ data: DailyReport[]; total: number }> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DailyReportFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<{ data: DailyReport[]; total: number }>(this.apiUrl, { params });
  }

  getReportById(id: string | number): Observable<DailyReport> {
    return this.http.get<DailyReport>(`${this.apiUrl}/${id}`);
  }

  createReport(report: Partial<DailyReport>): Observable<DailyReport> {
    return this.http.post<DailyReport>(this.apiUrl, report);
  }

  updateReport(id: string | number, report: Partial<DailyReport>): Observable<DailyReport> {
    return this.http.put<DailyReport>(`${this.apiUrl}/${id}`, report);
  }

  deleteReport(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  approveReport(id: string | number): Observable<DailyReport> {
    return this.http.put<DailyReport>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectReport(id: string | number, reason: string): Observable<DailyReport> {
    return this.http.put<DailyReport>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  uploadPhotos(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload-photos`, formData);
  }

  getReportsByOperator(operatorId: string | number): Observable<DailyReport[]> {
    return this.http.get<DailyReport[]>(`${this.apiUrl}/operator/${operatorId}`);
  }

  bulkCreateReports(reports: Partial<DailyReport>[]): Observable<DailyReport[]> {
    return this.http.post<DailyReport[]>(`${this.apiUrl}/bulk`, { reports });
  }

  exportToExcel(filters?: DailyReportFilters): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DailyReportFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export/excel`, { 
      params, 
      responseType: 'blob' 
    });
  }

  exportToCSV(filters?: DailyReportFilters): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DailyReportFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export/csv`, { 
      params, 
      responseType: 'blob' 
    });
  }
}
