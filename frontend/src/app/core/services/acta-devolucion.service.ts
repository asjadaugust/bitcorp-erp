import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ActaDevolucion {
  id: number;
  codigo: string;
  equipo_id: number;
  contrato_id: number | null;
  proyecto_id: number | null;
  fecha_devolucion: string;
  tipo: 'DEVOLUCION' | 'DESMOBILIZACION' | 'TRANSFERENCIA';
  estado: 'BORRADOR' | 'PENDIENTE' | 'FIRMADO' | 'ANULADO';
  condicion_equipo: 'BUENO' | 'REGULAR' | 'MALO' | 'CON_OBSERVACIONES';
  horometro_devolucion: number | null;
  kilometraje_devolucion: number | null;
  observaciones: string | null;
  observaciones_fisicas: string | null;
  recibido_por: number | null;
  entregado_por: number | null;
  tiene_firma_recibido: boolean;
  tiene_firma_entregado: boolean;
  fecha_firma: string | null;
  creado_por: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActaDevolucionListResponse {
  data: ActaDevolucion[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

@Injectable({ providedIn: 'root' })
export class ActaDevolucionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/actas-devolucion`;

  listar(
    filters: {
      equipo_id?: number;
      estado?: string;
      tipo?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Observable<ActaDevolucionListResponse> {
    let params = new HttpParams();
    if (filters.equipo_id) params = params.set('equipo_id', String(filters.equipo_id));
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<ActaDevolucionListResponse>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<ActaDevolucion> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map((r) => r.data ?? r));
  }

  crear(dto: Partial<ActaDevolucion>): Observable<ActaDevolucion> {
    return this.http.post<any>(this.apiUrl, dto).pipe(map((r) => r.data ?? r));
  }

  actualizar(id: number, dto: Partial<ActaDevolucion>): Observable<ActaDevolucion> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(map((r) => r.data ?? r));
  }

  enviarParaFirma(id: number): Observable<ActaDevolucion> {
    return this.http.post<any>(`${this.apiUrl}/${id}/enviar`, {}).pipe(map((r) => r.data ?? r));
  }

  firmar(
    id: number,
    dto: {
      firma_entregado?: string;
      firma_recibido?: string;
      recibido_por?: number;
      entregado_por?: number;
    }
  ): Observable<ActaDevolucion> {
    return this.http.post<any>(`${this.apiUrl}/${id}/firmar`, dto).pipe(map((r) => r.data ?? r));
  }

  anular(id: number, observaciones?: string): Observable<ActaDevolucion> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/anular`, { observaciones })
      .pipe(map((r) => r.data ?? r));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
