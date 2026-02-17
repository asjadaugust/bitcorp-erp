import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DocumentAlertDetail {
  equipment_id?: number;
  codigo_equipo?: string;
  operator_id?: number;
  operator_name?: string;
  document_type: string;
  expiry_date: string;
  days_until_expiry: number;
  status: 'expired' | 'critical' | 'warning';
}

export interface DocumentAlertCategory {
  expired: number;
  critical: number;
  warning: number;
  details?: DocumentAlertDetail[];
}

export interface DocumentAlertsSummary {
  equipment: DocumentAlertCategory;
  operators: DocumentAlertCategory;
  contracts: DocumentAlertCategory;
  total_alerts: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  getDocumentAlerts(): Observable<DocumentAlertsSummary> {
    return this.http.get<DocumentAlertsSummary>(`${this.apiUrl}/document-alerts`);
  }
}
