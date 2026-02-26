import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  /** Paginated response — interceptor does NOT unwrap */
  getIncidents(): Observable<SstIncidente[]> {
    return this.http
      .get<{
        success: boolean;
        data: SstIncidente[];
        pagination: unknown;
      }>(`${this.apiUrl}/incidents`)
      .pipe(map((response) => response.data ?? []));
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
