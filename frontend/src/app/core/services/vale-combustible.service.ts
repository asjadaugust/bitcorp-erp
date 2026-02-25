import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ValeCombustible {
  id: number;
  codigo: string;
  parte_diario_id: number | null;
  equipo_id: number;
  proyecto_id: number | null;
  fecha: string;
  numero_vale: string;
  tipo_combustible: 'DIESEL' | 'GASOLINA_90' | 'GASOLINA_95' | 'GLP' | 'GNV';
  cantidad_galones: number;
  precio_unitario: number | null;
  monto_total: number | null;
  proveedor: string | null;
  observaciones: string | null;
  estado: 'PENDIENTE' | 'REGISTRADO' | 'ANULADO';
  creado_por: number | null;
  created_at: string;
  updated_at: string;
}

export interface ValeCombustibleListResponse {
  data: ValeCombustible[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface CreateValeDto {
  equipo_id: number;
  parte_diario_id?: number | null;
  proyecto_id?: number | null;
  fecha: string;
  numero_vale: string;
  tipo_combustible: ValeCombustible['tipo_combustible'];
  cantidad_galones: number;
  precio_unitario?: number | null;
  proveedor?: string | null;
  observaciones?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ValeCombustibleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/vales-combustible`;

  listar(
    filters: {
      equipo_id?: number;
      proyecto_id?: number;
      parte_diario_id?: number;
      estado?: string;
      tipo_combustible?: string;
      fecha_desde?: string;
      fecha_hasta?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Observable<ValeCombustibleListResponse> {
    let params = new HttpParams();
    if (filters.equipo_id) params = params.set('equipo_id', String(filters.equipo_id));
    if (filters.proyecto_id) params = params.set('proyecto_id', String(filters.proyecto_id));
    if (filters.parte_diario_id)
      params = params.set('parte_diario_id', String(filters.parte_diario_id));
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.tipo_combustible) params = params.set('tipo_combustible', filters.tipo_combustible);
    if (filters.fecha_desde) params = params.set('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params = params.set('fecha_hasta', filters.fecha_hasta);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<ValeCombustibleListResponse>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<ValeCombustible> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}`)
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as ValeCombustible));
  }

  crear(dto: CreateValeDto): Observable<ValeCombustible> {
    return this.http
      .post<Record<string, unknown>>(this.apiUrl, dto)
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as ValeCombustible));
  }

  actualizar(id: number, dto: Partial<CreateValeDto>): Observable<ValeCombustible> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, dto)
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as ValeCombustible));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  registrar(id: number): Observable<ValeCombustible> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/registrar`, {})
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as ValeCombustible));
  }

  anular(id: number): Observable<ValeCombustible> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/anular`, {})
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as ValeCombustible));
  }
}
