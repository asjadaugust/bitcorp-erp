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

  /**
   * Get all daily reports with optional filters
   * Backend returns Spanish snake_case fields, pass through as-is
   */
  getAll(filters?: any): Observable<DailyReport[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    // Default limit to 100 to avoid pagination issues (like equipment/provider/contract services)
    if (!filters?.limit) {
      params = params.set('limit', '100');
    }
    // API might return paginated response: {success, data, pagination}
    // Extract data array if it exists, otherwise return as-is
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        let data = response;
        if (response && typeof response === 'object' && 'data' in response) {
          data = response.data;
        }
        return Array.isArray(data) ? data : [];
      })
    );
  }

  /**
   * Get daily report by ID
   * Backend returns Spanish snake_case fields, pass through as-is
   */
  getById(id: string | number): Observable<DailyReport> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((r) => r));
  }

  /**
   * Create a new daily report
   * Backend expects Spanish snake_case fields, transform from English DTO
   */
  create(data: CreateDailyReportDto): Observable<DailyReport> {
    // Transform English DTO to Spanish backend format
    const backendData: any = { ...data };

    // Map field names: English → Spanish
    if (data.fecha_parte) {
      backendData.fecha = data.fecha_parte;
      delete backendData.fecha_parte;
    }
    if (data.trabajador_id) {
      backendData.trabajador_id = data.trabajador_id;
      delete backendData.trabajador_id;
    }
    if (data.equipo_id) {
      backendData.equipo_id = data.equipo_id;
      delete backendData.equipo_id;
    }
    if (data.proyecto_id) {
      backendData.proyecto_id = data.proyecto_id;
      delete backendData.proyecto_id;
    }
    if (data.hora_inicio) {
      backendData.hora_inicio = data.hora_inicio;
      delete backendData.hora_inicio;
    }
    if (data.hora_fin) {
      backendData.hora_fin = data.hora_fin;
      delete backendData.hora_fin;
    }
    if (data.horometro_inicial) {
      backendData.horometro_inicial = data.horometro_inicial;
      delete backendData.horometro_inicial;
    }
    if (data.horometro_final) {
      backendData.horometro_final = data.horometro_final;
      delete backendData.horometro_final;
    }
    if (data.odometro_inicial) {
      backendData.odometro_inicial = data.odometro_inicial;
      delete backendData.odometro_inicial;
    }
    if (data.odometro_final) {
      backendData.odometro_final = data.odometro_final;
      delete backendData.odometro_final;
    }
    if (data.fuel_start) {
      backendData.combustible_inicial = data.fuel_start;
      delete backendData.fuel_start;
    }
    if (data.lugar_salida) {
      backendData.lugar_salida = data.lugar_salida;
      delete backendData.lugar_salida;
    }
    if (data.observaciones) {
      backendData.observaciones = data.observaciones;
      delete backendData.observaciones;
    }
    if (data.notes) {
      backendData.observaciones_correcciones = data.notes;
      delete backendData.notes;
    }
    // Map status: English → Spanish
    if (data.estado) {
      backendData.estado = this.mapStatusToEstado(data.estado);
      delete backendData.estado;
    }

    return this.http.post<any>(this.apiUrl, backendData).pipe(map((r) => r));
  }

  /**
   * Update an existing daily report
   * Backend expects Spanish snake_case fields, transform from English DTO
   */
  update(id: string | number, data: Partial<DailyReport>): Observable<DailyReport> {
    // Transform English DTO to Spanish backend format
    const backendData: any = { ...data };

    // Map field names: English → Spanish (only transform if English version exists)
    if (data.fecha_parte) {
      backendData.fecha = data.fecha_parte;
      delete backendData.fecha_parte;
    }
    if (data.trabajador_id) {
      backendData.trabajador_id = data.trabajador_id;
      delete backendData.trabajador_id;
    }
    if (data.equipo_id) {
      backendData.equipo_id = data.equipo_id;
      delete backendData.equipo_id;
    }
    if (data.proyecto_id) {
      backendData.proyecto_id = data.proyecto_id;
      delete backendData.proyecto_id;
    }
    if (data.hora_inicio) {
      backendData.hora_inicio = data.hora_inicio;
      delete backendData.hora_inicio;
    }
    if (data.hora_fin) {
      backendData.hora_fin = data.hora_fin;
      delete backendData.hora_fin;
    }
    if (data.horometro_inicial) {
      backendData.horometro_inicial = data.horometro_inicial;
      delete backendData.horometro_inicial;
    }
    if (data.horometro_final) {
      backendData.horometro_final = data.horometro_final;
      delete backendData.horometro_final;
    }
    if (data.odometro_inicial) {
      backendData.odometro_inicial = data.odometro_inicial;
      delete backendData.odometro_inicial;
    }
    if (data.odometro_final) {
      backendData.odometro_final = data.odometro_final;
      delete backendData.odometro_final;
    }
    if (data.fuel_start) {
      backendData.combustible_inicial = data.fuel_start;
      delete backendData.fuel_start;
    }
    if (data.lugar_salida) {
      backendData.lugar_salida = data.lugar_salida;
      delete backendData.lugar_salida;
    }
    if (data.observaciones) {
      backendData.observaciones = data.observaciones;
      delete backendData.observaciones;
    }
    if (data.notes) {
      backendData.observaciones_correcciones = data.notes;
      delete backendData.notes;
    }
    // Map status: English → Spanish
    if (data.estado) {
      backendData.estado = this.mapStatusToEstado(data.estado);
      delete backendData.estado;
    }

    return this.http.put<any>(`${this.apiUrl}/${id}`, backendData).pipe(map((r) => r));
  }

  /**
   * Delete a daily report
   */
  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get daily reports by operator ID
   */
  getByOperator(operatorId: string | number): Observable<DailyReport[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/operator/${operatorId}`)
      .pipe(map((reports) => reports));
  }

  /**
   * Approve a daily report
   */
  approve(id: string | number): Observable<DailyReport> {
    return this.http.put<any>(`${this.apiUrl}/${id}/approve`, {}).pipe(map((r) => r));
  }

  /**
   * Reject a daily report
   */
  reject(id: string | number, reason: string): Observable<DailyReport> {
    return this.http.put<any>(`${this.apiUrl}/${id}/reject`, { reason }).pipe(map((r) => r));
  }

  /**
   * Download PDF for a daily report
   */
  downloadPdf(id: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  /**
   * Upload photos for a daily report
   */
  uploadPhotos(id: string | number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/photos`, formData);
  }

  /**
   * Delete a photo from a daily report
   */
  deletePhoto(id: string | number, photoIndex: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/photos/${photoIndex}`);
  }

  /**
   * Map Spanish estado values to English status values
   * Backend returns: 'BORRADOR', 'PENDIENTE', 'APROBADO', 'RECHAZADO'
   * Frontend uses: 'draft', 'submitted', 'approved', 'rejected'
   */
  private mapEstadoToStatus(
    estado: string
  ): 'draft' | 'submitted' | 'supervisor_approved' | 'cost_reviewed' | 'approved' | 'rejected' {
    const statusMap: Record<string, any> = {
      BORRADOR: 'draft',
      PENDIENTE: 'submitted',
      APROBADO_SUPERVISOR: 'supervisor_approved',
      REVISADO_COSTOS: 'cost_reviewed',
      APROBADO: 'approved',
      RECHAZADO: 'rejected',
    };
    return statusMap[estado] || estado;
  }

  /**
   * Map English status values to Spanish estado values
   * Frontend uses: 'draft', 'submitted', 'approved', 'rejected'
   * Backend expects: 'BORRADOR', 'PENDIENTE', 'APROBADO', 'RECHAZADO'
   */
  private mapStatusToEstado(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'BORRADOR',
      submitted: 'PENDIENTE',
      approved: 'APROBADO',
      rejected: 'RECHAZADO',
    };
    return statusMap[status] || status;
  }
}
