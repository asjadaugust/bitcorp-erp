import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export type SeveridadIncidente = 'LEVE' | 'MODERADO' | 'GRAVE' | 'MUY_GRAVE';
export type EstadoIncidente = 'ABIERTO' | 'EN_INVESTIGACION' | 'CERRADO';

export interface SstIncidente {
  id: number;
  legacy_id?: string;
  fecha_incidente: string;
  tipo_incidente?: string;
  severidad?: SeveridadIncidente;
  ubicacion?: string;
  descripcion?: string;
  acciones_tomadas?: string;
  proyecto_id?: number;
  reportado_por?: number;
  estado: EstadoIncidente;
  created_at: string;
  updated_at: string;
  reportador_nombre?: string;
}

export interface SstIncidenteCreate {
  fecha_incidente: string;
  tipo_incidente?: string;
  severidad?: SeveridadIncidente;
  ubicacion?: string;
  descripcion?: string;
  acciones_tomadas?: string;
  estado?: EstadoIncidente;
}

@Injectable({
  providedIn: 'root',
})
export class SstService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sst`;

  getIncidents(params?: {
    page?: number;
    limit?: number;
    severidad?: string;
    estado?: string;
  }): Observable<PaginatedResponse<SstIncidente>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.severidad) httpParams = httpParams.set('severidad', params.severidad);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    return this.http.get<PaginatedResponse<SstIncidente>>(`${this.apiUrl}/incidents`, {
      params: httpParams,
    });
  }

  /** Single response — interceptor unwraps automatically */
  getIncident(id: number): Observable<SstIncidente> {
    return this.http.get<SstIncidente>(`${this.apiUrl}/incidents/${id}`);
  }

  createIncident(data: SstIncidenteCreate): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/incidents`, data);
  }

  updateIncident(id: number, data: Partial<SstIncidenteCreate>): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/incidents/${id}`, data);
  }

  deleteIncident(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/incidents/${id}`);
  }
}
