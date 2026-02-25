import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord } from '../models/maintenance-record.model';
import { StatsSummary } from '../models/stats.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/maintenance`;

  getAll(filters: Record<string, string | undefined> = {}): Observable<MaintenanceRecord[]> {
    let params = new HttpParams();
    if (filters['search']) params = params.set('search', filters['search']);
    if (filters['status']) params = params.set('status', filters['status']);
    if (filters['type']) params = params.set('type', filters['type']);

    return this.http.get<Record<string, unknown>>(this.apiUrl, { params }).pipe(
      map((response: Record<string, unknown>) => {
        let data: Record<string, unknown>[] = [];
        if (response && response['data'] && Array.isArray(response['data'])) {
          data = response['data'];
        } else if (Array.isArray(response)) {
          data = response;
        }
        return data.map((item) => this.toCamelCase(item));
      })
    );
  }

  getById(id: number): Observable<MaintenanceRecord> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response: Record<string, unknown>) =>
          this.toCamelCase((response['data'] as Record<string, unknown>) || response)
        )
      );
  }

  create(record: Omit<MaintenanceRecord, 'id'>): Observable<MaintenanceRecord> {
    const payload = this.toSnakeCase(record);
    return this.http
      .post<Record<string, unknown>>(this.apiUrl, payload)
      .pipe(
        map((response: Record<string, unknown>) =>
          this.toCamelCase((response['data'] as Record<string, unknown>) || response)
        )
      );
  }

  update(id: number, record: Partial<MaintenanceRecord>): Observable<MaintenanceRecord> {
    const payload = this.toSnakeCase(record);
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map((response: Record<string, unknown>) =>
          this.toCamelCase((response['data'] as Record<string, unknown>) || response)
        )
      );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(filters?: { startDate?: string; endDate?: string }): Observable<StatsSummary> {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);

    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/stats`, { params })
      .pipe(map((response) => (response?.['data'] || response) as unknown as StatsSummary));
  }

  private toSnakeCase(data: Partial<MaintenanceRecord>): Record<string, unknown> {
    // Strict mapping to avoid sending unknown fields
    return {
      equipo_id: data.equipoId,
      tipo_mantenimiento: data.tipoMantenimiento,
      descripcion: data.descripcion,
      fecha_programada: data.fechaProgramada,
      fecha_realizada: data.fechaRealizada,
      costo_estimado: data.costoEstimado,
      costo_real: data.costoReal,
      tecnico_responsable: data.tecnicoResponsable,
      estado: data.estado,
      observaciones: data.observaciones,
    };
  }

  private toCamelCase(data: Record<string, unknown>): MaintenanceRecord {
    const record: MaintenanceRecord = {
      id: data['id'] as number,
      equipoId: data['equipo_id'] as number,
      tipoMantenimiento: data['tipo_mantenimiento'] as any,
      descripcion: data['descripcion'] as string,
      fechaProgramada: data['fecha_programada'] as string,
      fechaRealizada: data['fecha_realizada'] as string,
      costoEstimado: data['costo_estimado'] as number,
      costoReal: data['costo_real'] as number,
      tecnicoResponsable: data['tecnico_responsable'] as string,
      estado: data['estado'] as any,
      observaciones: data['observaciones'] as string,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string,
    };

    if (data['equipo']) {
      const equipo = data['equipo'] as Record<string, unknown>;
      record.equipo = {
        ...equipo,
        codigo_equipo: (equipo['codigo_equipo'] as string) || (equipo['code'] as string),
      } as any;
    }
    return record;
  }
}
