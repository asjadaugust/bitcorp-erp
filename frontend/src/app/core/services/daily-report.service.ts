import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DailyReport, DailyReportPhoto, CreateDailyReportDto } from '../models/daily-report.model';

import { environment } from '../../../environments/environment';

export interface EquipmentReceptionStatus {
  equipo_id: number;
  codigo_equipo: string;
  marca: string;
  modelo: string;
  proyecto_nombre?: string;
  total_dias: number;
  reportes_recibidos: number;
  reportes_pendientes: number;
  porcentaje_recepcion: number;
  fechas_faltantes: string[];
}

export interface InspectionObservacion {
  id: number;
  parte_diario_id: number;
  fecha: string | null;
  codigo: string;
  descripcion: string | null;
  resuelta: boolean;
  fecha_resolucion: string | null;
  observacion_resolucion: string | null;
}

export interface EquipmentInspectionTracking {
  equipo_id: number;
  codigo_equipo: string;
  marca: string | null;
  modelo: string | null;
  total_observaciones: number;
  observaciones_abiertas: number;
  observaciones_resueltas: number;
  observaciones: InspectionObservacion[];
}

@Injectable({ providedIn: 'root' })
export class DailyReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reports`;

  /**
   * Get all daily reports with optional filters
   * Backend returns Spanish snake_case fields, map to Frontend Interface
   */
  getAll(filters?: Record<string, string | number | undefined>): Observable<DailyReport[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    // Default limit to 100 to avoid pagination issues
    if (!filters?.['limit']) {
      params = params.set('limit', '100');
    }

    return this.http.get<Record<string, unknown>>(this.apiUrl, { params }).pipe(
      map((response) => {
        let data = response;
        if (response && typeof response === 'object' && 'data' in response) {
          data = response['data'] as Record<string, unknown>;
        }
        return Array.isArray(data)
          ? data.map((item) => this.mapToFrontend(item as Record<string, unknown>))
          : [];
      })
    );
  }

  /**
   * Get daily report by ID
   */
  getById(id: string | number): Observable<DailyReport> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}`)
      .pipe(map((r) => this.mapToFrontend(r)));
  }

  /**
   * Create a new daily report
   */
  create(data: CreateDailyReportDto): Observable<DailyReport> {
    const backendData: Record<string, unknown> = { ...data };

    // Map fecha_parte → fecha (backend expects 'fecha')
    if (backendData['fecha_parte']) {
      backendData['fecha'] = backendData['fecha_parte'];
      delete backendData['fecha_parte'];
    }

    return this.http
      .post<Record<string, unknown>>(this.apiUrl, backendData)
      .pipe(map((r) => this.mapToFrontend(r)));
  }

  /**
   * Update an existing daily report
   */
  update(id: string | number, data: Partial<DailyReport>): Observable<DailyReport> {
    const backendData: Record<string, unknown> = { ...data };

    // Map fecha_parte → fecha (backend expects 'fecha')
    if (backendData['fecha_parte']) {
      backendData['fecha'] = backendData['fecha_parte'];
      delete backendData['fecha_parte'];
    }

    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, backendData)
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
      .get<Record<string, unknown>[]>(`${this.apiUrl}/operator/${operatorId}`)
      .pipe(map((reports) => reports.map((r) => this.mapToFrontend(r))));
  }

  /**
   * Approve a daily report
   */
  approve(id: string | number): Observable<DailyReport> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(map((r) => this.mapToFrontend(r)));
  }

  /**
   * Reject a daily report
   */
  reject(id: string | number, reason: string): Observable<DailyReport> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}/reject`, { reason })
      .pipe(map((r) => this.mapToFrontend(r)));
  }

  /**
   * Register resident signature on a daily report
   */
  firmarResidente(id: string | number, firma_residente: string): Observable<DailyReport> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/firmar-residente`, { firma_residente })
      .pipe(map((r) => this.mapToFrontend((r?.['data'] || r) as Record<string, unknown>)));
  }

  downloadPdf(id: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  getPhotos(id: string | number): Observable<DailyReportPhoto[]> {
    return this.http.get<DailyReportPhoto[]>(`${this.apiUrl}/${id}/photos`);
  }

  uploadPhotos(
    id: string | number,
    formData: FormData
  ): Observable<{ photos: DailyReportPhoto[] }> {
    return this.http.post<{ photos: DailyReportPhoto[] }>(`${this.apiUrl}/${id}/photos`, formData);
  }

  deletePhoto(id: string | number, photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/photos/${photoId}`);
  }

  /**
   * Get reception status for daily reports per equipment
   */
  getReceptionStatus(
    fechaDesde: string,
    fechaHasta: string,
    proyectoId?: number
  ): Observable<EquipmentReceptionStatus[]> {
    let params = new HttpParams().set('fecha_desde', fechaDesde).set('fecha_hasta', fechaHasta);
    if (proyectoId) {
      params = params.set('proyecto_id', proyectoId.toString());
    }
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/reception-status`, { params })
      .pipe(
        map((response) => {
          if (response && typeof response === 'object' && 'data' in response) {
            return response['data'] as EquipmentReceptionStatus[];
          }
          return response as unknown as EquipmentReceptionStatus[];
        })
      );
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
    return estado as
      | 'BORRADOR'
      | 'PENDIENTE'
      | 'APROBADO_SUPERVISOR'
      | 'REVISADO_COSTOS'
      | 'APROBADO'
      | 'RECHAZADO';
  }

  private mapStatusToEstado(status: string): string {
    return status;
  }

  /**
   * Get inspection tracking: equipment with mechanical delay observations
   */
  getInspectionTracking(
    fechaDesde?: string,
    fechaHasta?: string,
    soloAbiertas?: boolean
  ): Observable<EquipmentInspectionTracking[]> {
    let params = new HttpParams();
    if (fechaDesde) params = params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params = params.set('fecha_hasta', fechaHasta);
    if (soloAbiertas) params = params.set('solo_abiertas', 'true');
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/inspection-tracking`, { params })
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as EquipmentInspectionTracking[]));
  }

  /**
   * Resolve a mechanical delay observation
   */
  resolverObservacion(id: number, observacion_resolucion?: string): Observable<unknown> {
    return this.http
      .patch<Record<string, unknown>>(`${this.apiUrl}/observaciones/${id}/resolver`, {
        observacion_resolucion,
      })
      .pipe(map((r) => (r?.['data'] ?? r) as unknown));
  }

  /**
   * Map English properties to Frontend Interface
   */
  private mapToFrontend(data: Record<string, unknown>): DailyReport {
    return {
      ...(data as any),
      fecha_parte: (data['fecha'] || data['fecha_parte']) as string,
      horas_trabajadas: (data['horas_trabajadas'] ?? 0) as number,

      // Ensure relations are populated
      codigo_equipo: (data['equipo_codigo'] || data['codigo_equipo']) as string,
      equipo_nombre: data['equipo_nombre'] as string | undefined,
      trabajador_nombre: data['trabajador_nombre'] as string | undefined,
      proyecto_nombre: data['proyecto_nombre'] as string | undefined,
    } as DailyReport;
  }
}
