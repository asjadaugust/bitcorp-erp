import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MaintenanceSchedule } from '../models/maintenance-schedule.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceScheduleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/maintenance`;

  getAll(filters?: any): Observable<MaintenanceSchedule[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        let data: any[] = [];
        if (response && typeof response === 'object' && 'data' in response) {
          data = response.data;
        } else if (Array.isArray(response)) {
          data = response;
        }
        return data.map((item) => this.toCamelCase(item));
      })
    );
  }

  getById(id: string | number): Observable<MaintenanceSchedule> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.toCamelCase(response?.data || response)));
  }

  create(schedule: Partial<MaintenanceSchedule>): Observable<MaintenanceSchedule> {
    const payload = this.toSnakeCase(schedule);
    return this.http
      .post<any>(this.apiUrl, payload)
      .pipe(map((response) => this.toCamelCase(response?.data || response)));
  }

  update(
    id: string | number,
    schedule: Partial<MaintenanceSchedule>
  ): Observable<MaintenanceSchedule> {
    const payload = this.toSnakeCase(schedule);
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => this.toCamelCase(response?.data || response)));
  }

  delete(id: string | number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  generateTasks(daysAhead = 30): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-tasks`, { daysAhead });
  }

  complete(id: string | number, completionHours?: number): Observable<MaintenanceSchedule> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/complete`, {
        completionHours,
      })
      .pipe(map((response) => this.toCamelCase(response?.data || response)));
  }

  private toSnakeCase(data: any): any {
    return {
      equipo_id: data.equipoId,
      tipo_mantenimiento: data.tipoMantenimiento,
      fecha_programada: data.fechaProgramada,
      costo_estimado: data.costoEstimado,
      tecnico_responsable: data.tecnicoResponsable,
      fecha_realizada: data.fechaRealizada,
      costo_real: data.costoReal,
      estado: data.estado,
      observaciones: data.observaciones,
      descripcion: data.descripcion,
    };
  }

  private toCamelCase(data: any): MaintenanceSchedule {
    const schedule: any = {
      id: data.id,
      equipoId: data.equipo_id,
      tipoMantenimiento: data.tipo_mantenimiento,
      fechaProgramada: data.fecha_programada,
      fechaRealizada: data.fecha_realizada,
      costoEstimado: data.costo_estimado,
      costoReal: data.costo_real,
      tecnicoResponsable: data.tecnico_responsable,
      estado: data.estado,
      observaciones: data.observaciones,
      descripcion: data.descripcion,
      intervalValue: data.interval_value,
      intervalType: data.interval_type,
      nextDueHours: data.next_due_hours,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    if (data.equipo) {
      schedule.equipo = {
        ...data.equipo,
        codigo_equipo: data.equipo.codigo_equipo || data.equipo.code,
      };
    } else if (data.equipo_codigo) {
      // Backend returns flattened fields in MaintenanceDto
      schedule.equipo = {
        id: data.equipo_id,
        codigo_equipo: data.equipo_codigo,
        marca: '', // Not returned by flattened DTO
        modelo: data.equipo_descripcion, // Mapped to description as fallback
      };
    }
    return schedule;
  }
}
