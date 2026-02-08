import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reporting`;

  getEquipmentUtilization(
    startDate: string,
    endDate: string,
    format: 'json' | 'excel' = 'json'
  ): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('format', format);

    if (format === 'excel') {
      return this.http.get(`${this.apiUrl}/equipment-utilization`, {
        params,
        responseType: 'blob' as 'json', // Hack for blob response
      });
    }

    return this.http.get<any>(`${this.apiUrl}/equipment-utilization`, { params });
  }

  getMaintenanceHistory(
    startDate: string,
    endDate: string,
    format: 'json' | 'excel' = 'json'
  ): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('format', format);

    if (format === 'excel') {
      return this.http.get(`${this.apiUrl}/maintenance`, {
        params,
        responseType: 'blob' as 'json',
      });
    }

    return this.http.get<any>(`${this.apiUrl}/maintenance`, { params });
  }

  getInventoryMovements(
    startDate: string,
    endDate: string,
    format: 'json' | 'excel' = 'json'
  ): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('format', format);

    if (format === 'excel') {
      return this.http.get(`${this.apiUrl}/inventory`, {
        params,
        responseType: 'blob' as 'json',
      });
    }

    return this.http.get<any>(`${this.apiUrl}/inventory`, { params });
  }

  getOperatorTimesheet(
    startDate: string,
    endDate: string,
    format: 'json' | 'excel' = 'json'
  ): Observable<any> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('format', format);

    if (format === 'excel') {
      return this.http.get(`${this.apiUrl}/operator-timesheet`, {
        params,
        responseType: 'blob' as 'json',
      });
    }

    return this.http.get<any>(`${this.apiUrl}/operator-timesheet`, { params });
  }
}
