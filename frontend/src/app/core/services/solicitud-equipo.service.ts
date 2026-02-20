import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SolicitudEquipo {
  id: number;
  codigo: string;
  proyecto_id: number | null;
  tipo_equipo: string;
  descripcion: string | null;
  cantidad: number;
  fecha_requerida: string;
  justificacion: string | null;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  estado: 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';
  observaciones: string | null;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
  creado_por: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SolicitudEquipoListResponse {
  data: SolicitudEquipo[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

@Injectable({ providedIn: 'root' })
export class SolicitudEquipoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/solicitudes-equipo`;

  listar(
    filters: {
      estado?: string;
      proyecto_id?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Observable<SolicitudEquipoListResponse> {
    let params = new HttpParams();
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.proyecto_id) params = params.set('proyecto_id', String(filters.proyecto_id));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<SolicitudEquipoListResponse>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<SolicitudEquipo> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((r) => r.data ?? r));
  }

  crear(dto: Partial<SolicitudEquipo>): Observable<SolicitudEquipo> {
    return this.http.post<any>(this.apiUrl, dto).pipe(map((r) => r.data ?? r));
  }

  actualizar(id: number, dto: Partial<SolicitudEquipo>): Observable<SolicitudEquipo> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(map((r) => r.data ?? r));
  }

  enviar(id: number): Observable<SolicitudEquipo> {
    return this.http.post<any>(`${this.apiUrl}/${id}/enviar`, {}).pipe(map((r) => r.data ?? r));
  }

  aprobar(id: number, observaciones?: string): Observable<SolicitudEquipo> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/aprobar`, { observaciones })
      .pipe(map((r) => r.data ?? r));
  }

  rechazar(id: number, observaciones?: string): Observable<SolicitudEquipo> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/rechazar`, { observaciones })
      .pipe(map((r) => r.data ?? r));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
