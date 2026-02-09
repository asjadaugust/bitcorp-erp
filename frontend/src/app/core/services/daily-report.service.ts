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
   * Backend returns Spanish snake_case fields, map to Frontend Interface
   */
  getAll(filters?: any): Observable<DailyReport[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    // Default limit to 100 to avoid pagination issues
    if (!filters?.limit) {
      params = params.set('limit', '100');
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        let data = response;
        if (response && typeof response === 'object' && 'data' in response) {
          data = response.data;
        }
        return Array.isArray(data) ? data.map((item) => this.mapToFrontend(item)) : [];
      })
    );
  }

  /**
   * Get daily report by ID
   */
  getById(id: string | number): Observable<DailyReport> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((r) => this.mapToFrontend(r)));
  }

  /**
   * Create a new daily report
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

    return this.http.post<any>(this.apiUrl, backendData).pipe(map((r) => this.mapToFrontend(r)));
  }

  /**
   * Update an existing daily report
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

    return this.http
      .put<any>(`${this.apiUrl}/${id}`, backendData)
      .pipe(map((r) => this.mapToFrontend(r)));
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
      .pipe(map((reports) => reports.map((r) => this.mapToFrontend(r))));
  }

  /**
   * Approve a daily report
   */
  approve(id: string | number): Observable<DailyReport> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(map((r) => this.mapToFrontend(r)));
  }

  /**
   * Reject a daily report
   */
  reject(id: string | number, reason: string): Observable<DailyReport> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}/reject`, { reason })
      .pipe(map((r) => this.mapToFrontend(r)));
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

  /**
   * Map status
   */
  private mapEstadoToStatus(
    estado: string
  ):
    | 'BORRADOR'
    | 'PENDIENTE'
    | 'APROBADO_SUPERVISOR'
    | 'REVISADO_COSTOS'
    | 'APROBADO'
    | 'RECHAZADO' {
    return estado as any;
  }

  private mapStatusToEstado(status: string): string {
    return status;
  }

  /**
   * Map English properties to Frontend Interface
   */
  private mapToFrontend(data: any): DailyReport {
    return {
      ...data,
      fecha_parte: data.fecha || data.fecha_parte,
      location: data.lugar_salida || data.location,
      work_description: data.observaciones || data.work_description,
      fuel_consumed: data.combustible_consumido || data.fuel_consumed,
      fuel_start: data.combustible_inicial || data.fuel_start,
      notes: data.observaciones_correcciones || data.notes,
      horas_trabajadas: data.horas_trabajadas ?? 0,

      // Ensure relations are populated
      // Backend returns: equipo_codigo, equipo_nombre, trabajador_nombre
      codigo_equipo: data.equipo_codigo || data.codigo_equipo,
      equipo_nombre: data.equipo_nombre,
      trabajador_nombre: data.trabajador_nombre,
      proyecto_nombre: data.proyecto_nombre,
    };
  }
}
