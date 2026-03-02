import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

/** Raw alert DTO from backend (flat list). */
interface AlertaDocumentoRaw {
  equipo_id: number;
  codigo: string;
  tipo_documento: string;
  fecha_vencimiento: string;
  dias_restantes: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  getDocumentAlerts(): Observable<DocumentAlertsSummary> {
    return this.http
      .get<AlertaDocumentoRaw[]>(`${this.apiUrl}/document-alerts`)
      .pipe(map((alerts) => this.transformAlerts(alerts)));
  }

  /** Transform flat alert list into categorized summary. */
  private transformAlerts(alerts: AlertaDocumentoRaw[]): DocumentAlertsSummary {
    const emptyCategory = (): DocumentAlertCategory => ({
      expired: 0,
      critical: 0,
      warning: 0,
    });

    const equipment = emptyCategory();

    for (const alert of alerts) {
      if (alert.dias_restantes <= 0) {
        equipment.expired++;
      } else if (alert.dias_restantes <= 7) {
        equipment.critical++;
      } else {
        equipment.warning++;
      }
    }

    return {
      equipment,
      operators: emptyCategory(),
      contracts: emptyCategory(),
      total_alerts: alerts.length,
    };
  }
}
