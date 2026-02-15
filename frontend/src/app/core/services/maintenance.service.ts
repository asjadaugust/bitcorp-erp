import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord } from '../models/maintenance-record.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/maintenance`;

  getAll(filters: any = {}): Observable<MaintenanceRecord[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.type) params = params.set('type', filters.type);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response: any) => {
        let data: any[] = [];
        if (response && response.data && Array.isArray(response.data)) {
          data = response.data;
        } else if (Array.isArray(response)) {
          data = response;
        }
        return data.map((item) => this.toCamelCase(item));
      })
    );
  }

  getById(id: number): Observable<MaintenanceRecord> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`)
      .pipe(map((response: any) => this.toCamelCase(response.data || response)));
  }

  create(record: Omit<MaintenanceRecord, 'id'>): Observable<MaintenanceRecord> {
    const payload = this.toSnakeCase(record);
    return this.http
      .post<any>(this.apiUrl, payload)
      .pipe(map((response: any) => this.toCamelCase(response.data || response)));
  }

  update(id: number, record: Partial<MaintenanceRecord>): Observable<MaintenanceRecord> {
    const payload = this.toSnakeCase(record);
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response: any) => this.toCamelCase(response.data || response)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private toSnakeCase(data: any): any {
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

  private toCamelCase(data: any): MaintenanceRecord {
    const record: any = {
      id: data.id,
      equipoId: data.equipo_id,
      tipoMantenimiento: data.tipo_mantenimiento,
      descripcion: data.descripcion,
      fechaProgramada: data.fecha_programada,
      fechaRealizada: data.fecha_realizada,
      costoEstimado: data.costo_estimado,
      costoReal: data.costo_real,
      tecnicoResponsable: data.tecnico_responsable,
      estado: data.estado,
      observaciones: data.observaciones,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    if (data.equipo) {
      record.equipo = {
        ...data.equipo,
        codigo_equipo: data.equipo.codigo_equipo || data.equipo.code,
      };
    }
    return record;
  }
}
