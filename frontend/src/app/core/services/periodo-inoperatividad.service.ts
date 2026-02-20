import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PeriodoInoperatividad {
  id: number;
  equipo_id: number;
  equipo_codigo: string | null;
  equipo_descripcion: string | null;
  contrato_id: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  dias_inoperativo: number;
  motivo: string;
  estado: 'ACTIVO' | 'RESUELTO' | 'PENALIZADO';
  excede_plazo: boolean;
  dias_plazo: number;
  dias_restantes: number | null;
  penalidad_aplicada: boolean;
  monto_penalidad: number | null;
  observaciones_penalidad: string | null;
  resuelto_por: number | null;
  creado_por: number | null;
  created_at: string;
  updated_at: string;
}

export interface PeriodoResumen {
  total: number;
  activos: number;
  resueltos: number;
  penalizados: number;
  exceden_plazo: number;
  max_dias_inoperativo: number;
}

export interface PeriodoListResponse {
  data: PeriodoInoperatividad[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

@Injectable({ providedIn: 'root' })
export class PeriodoInoperatividadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/periodos-inoperatividad`;

  listar(
    filters: {
      equipo_id?: number;
      contrato_id?: number;
      estado?: string;
      excede_plazo?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Observable<PeriodoListResponse> {
    let params = new HttpParams();
    if (filters.equipo_id) params = params.set('equipo_id', String(filters.equipo_id));
    if (filters.contrato_id) params = params.set('contrato_id', String(filters.contrato_id));
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.excede_plazo !== undefined)
      params = params.set('excede_plazo', String(filters.excede_plazo));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<PeriodoListResponse>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<PeriodoInoperatividad> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((r) => r.data ?? r));
  }

  getResumen(equipoId: number): Observable<PeriodoResumen> {
    return this.http.get<any>(`${this.apiUrl}/resumen/${equipoId}`).pipe(map((r) => r.data ?? r));
  }

  crear(dto: {
    equipo_id: number;
    contrato_id?: number;
    fecha_inicio: string;
    motivo: string;
    dias_plazo?: number;
  }): Observable<PeriodoInoperatividad> {
    return this.http.post<any>(this.apiUrl, dto).pipe(map((r) => r.data ?? r));
  }

  resolver(
    id: number,
    dto: { fecha_fin: string; observaciones_penalidad?: string }
  ): Observable<PeriodoInoperatividad> {
    return this.http.post<any>(`${this.apiUrl}/${id}/resolver`, dto).pipe(map((r) => r.data ?? r));
  }

  aplicarPenalidad(
    id: number,
    dto: { monto_penalidad: number; observaciones_penalidad?: string }
  ): Observable<PeriodoInoperatividad> {
    return this.http.post<any>(`${this.apiUrl}/${id}/penalidad`, dto).pipe(map((r) => r.data ?? r));
  }
}
