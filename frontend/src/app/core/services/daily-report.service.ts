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
        const reports = Array.isArray(data) ? data : [];
        return reports.map((r) => this.mapSpanishToEnglish(r));
      })
    );
  }

  /**
   * Map Spanish backend field names to English frontend field names
   * Backend returns Spanish snake_case, frontend expects English snake_case
   * This is a compatibility layer until frontend is fully migrated
   */
  private mapSpanishToEnglish(backendData: any): DailyReport {
    return {
      ...backendData,
      // Map Spanish to English field names
      report_date: backendData.fecha || backendData.report_date,
      operator_id: backendData.trabajador_id || backendData.operator_id,
      operator_name: backendData.trabajador_nombre || backendData.operator_name,
      equipment_id: backendData.equipo_id || backendData.equipment_id,
      equipment_code: backendData.equipo_codigo || backendData.equipment_code,
      equipment_name: backendData.equipo_nombre || backendData.equipment_name,
      project_id: backendData.proyecto_id || backendData.project_id,
      project_name: backendData.proyecto_nombre || backendData.project_name,
      start_time: backendData.hora_inicio || backendData.start_time,
      end_time: backendData.hora_fin || backendData.end_time,
      hourmeter_start: backendData.horometro_inicial || backendData.hourmeter_start,
      hourmeter_end: backendData.horometro_final || backendData.hourmeter_end,
      worked_hours: backendData.horas_trabajadas || backendData.worked_hours,
      odometer_start: backendData.odometro_inicial || backendData.odometer_start,
      odometer_end: backendData.odometro_final || backendData.odometer_end,
      fuel_start: backendData.combustible_inicial || backendData.fuel_start,
      fuel_consumed: backendData.combustible_consumido || backendData.fuel_consumed,
      departure_location: backendData.lugar_salida || backendData.departure_location,
      observations: backendData.observaciones || backendData.observations,
      notes: backendData.observaciones_correcciones || backendData.notes,
      status: this.mapEstadoToStatus(backendData.estado || backendData.status),
      created_at: backendData.created_at,
      updated_at: backendData.updated_at,
    } as DailyReport;
  }

  /**
   * Map Spanish estado values to English status values
   */
  private mapEstadoToStatus(
    estado: string
  ): 'draft' | 'submitted' | 'supervisor_approved' | 'cost_reviewed' | 'approved' | 'rejected' {
    const statusMap: Record<string, any> = {
      BORRADOR: 'draft',
      PENDIENTE: 'submitted',
      APROBADO: 'approved',
      RECHAZADO: 'rejected',
    };
    return statusMap[estado] || estado;
  }

  /**
   * Map English status values to Spanish estado values
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

  /**
   * Map English frontend field names to Spanish backend field names
   * This is a compatibility layer until frontend is fully migrated
   */
  private mapEnglishToSpanish(frontendData: any): any {
    const backendData: any = { ...frontendData };

    // Map English to Spanish field names (only if English version exists)
    if ('report_date' in frontendData) {
      backendData.fecha = frontendData.report_date;
      delete backendData.report_date;
    }
    if ('operator_id' in frontendData) {
      backendData.trabajador_id = frontendData.operator_id;
      delete backendData.operator_id;
    }
    if ('equipment_id' in frontendData) {
      backendData.equipo_id = frontendData.equipment_id;
      delete backendData.equipment_id;
    }
    if ('project_id' in frontendData) {
      backendData.proyecto_id = frontendData.project_id;
      delete backendData.project_id;
    }
    if ('start_time' in frontendData) {
      backendData.hora_inicio = frontendData.start_time;
      delete backendData.start_time;
    }
    if ('end_time' in frontendData) {
      backendData.hora_fin = frontendData.end_time;
      delete backendData.end_time;
    }
    if ('hourmeter_start' in frontendData) {
      backendData.horometro_inicial = frontendData.hourmeter_start;
      delete backendData.hourmeter_start;
    }
    if ('hourmeter_end' in frontendData) {
      backendData.horometro_final = frontendData.hourmeter_end;
      delete backendData.hourmeter_end;
    }
    if ('odometer_start' in frontendData) {
      backendData.odometro_inicial = frontendData.odometer_start;
      delete backendData.odometer_start;
    }
    if ('odometer_end' in frontendData) {
      backendData.odometro_final = frontendData.odometer_end;
      delete backendData.odometer_end;
    }
    if ('fuel_start' in frontendData) {
      backendData.combustible_inicial = frontendData.fuel_start;
      delete backendData.fuel_start;
    }
    if ('departure_location' in frontendData) {
      backendData.lugar_salida = frontendData.departure_location;
      delete backendData.departure_location;
    }
    if ('observations' in frontendData) {
      backendData.observaciones = frontendData.observations;
      delete backendData.observations;
    }
    if ('notes' in frontendData) {
      backendData.observaciones_correcciones = frontendData.notes;
      delete backendData.notes;
    }
    if ('status' in frontendData) {
      backendData.estado = this.mapStatusToEstado(frontendData.status);
      delete backendData.status;
    }

    return backendData;
  }

  getById(id: string | number): Observable<DailyReport> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((r) => this.mapSpanishToEnglish(r)));
  }

  create(data: CreateDailyReportDto): Observable<DailyReport> {
    const backendData = this.mapEnglishToSpanish(data);
    return this.http
      .post<any>(this.apiUrl, backendData)
      .pipe(map((r) => this.mapSpanishToEnglish(r)));
  }

  update(id: string | number, data: Partial<DailyReport>): Observable<DailyReport> {
    const backendData = this.mapEnglishToSpanish(data);
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, backendData)
      .pipe(map((r) => this.mapSpanishToEnglish(r)));
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByOperator(operatorId: string | number): Observable<DailyReport[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/operator/${operatorId}`)
      .pipe(map((reports) => reports.map((r) => this.mapSpanishToEnglish(r))));
  }

  approve(id: string | number): Observable<DailyReport> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(map((r) => this.mapSpanishToEnglish(r)));
  }

  reject(id: string | number, reason: string): Observable<DailyReport> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}/reject`, { reason })
      .pipe(map((r) => this.mapSpanishToEnglish(r)));
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
