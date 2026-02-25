import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface OrdenAlquiler {
  id: number;
  codigo: string;
  solicitud_equipo_id: number | null;
  proveedor_id: number;
  proveedor_nombre: string | null;
  equipo_id: number | null;
  proyecto_id: number | null;
  descripcion_equipo: string;
  fecha_orden: string;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  tarifa_acordada: number;
  tipo_tarifa: 'HORA' | 'DIA' | 'MES';
  moneda: 'PEN' | 'USD';
  tipo_cambio: number | null;
  horas_incluidas: number | null;
  penalidad_exceso: number | null;
  condiciones_especiales: string | null;
  observaciones: string | null;
  estado: 'BORRADOR' | 'ENVIADO' | 'CONFIRMADO' | 'CANCELADO';
  enviado_a: string | null;
  fecha_envio: string | null;
  confirmado_por: string | null;
  fecha_confirmacion: string | null;
  motivo_cancelacion: string | null;
  creado_por: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrdenAlquilerListResponse {
  data: OrdenAlquiler[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

@Injectable({ providedIn: 'root' })
export class OrdenAlquilerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ordenes-alquiler`;

  listar(
    filters: {
      proveedor_id?: number;
      estado?: string;
      proyecto_id?: number;
      page?: number;
      limit?: number;
    } = {}
  ): Observable<OrdenAlquilerListResponse> {
    let params = new HttpParams();
    if (filters.proveedor_id) params = params.set('proveedor_id', String(filters.proveedor_id));
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.proyecto_id) params = params.set('proyecto_id', String(filters.proyecto_id));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<OrdenAlquilerListResponse>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<OrdenAlquiler> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}`)
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as OrdenAlquiler));
  }

  crear(dto: Partial<OrdenAlquiler>): Observable<OrdenAlquiler> {
    return this.http
      .post<Record<string, unknown>>(this.apiUrl, dto)
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as OrdenAlquiler));
  }

  actualizar(id: number, dto: Partial<OrdenAlquiler>): Observable<OrdenAlquiler> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, dto)
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as OrdenAlquiler));
  }

  enviar(id: number, enviadoA?: string): Observable<OrdenAlquiler> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/enviar`, { enviado_a: enviadoA })
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as OrdenAlquiler));
  }

  confirmar(id: number, confirmadoPor?: string): Observable<OrdenAlquiler> {
    return this.http
      .post<
        Record<string, unknown>
      >(`${this.apiUrl}/${id}/confirmar`, { confirmado_por: confirmadoPor })
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as OrdenAlquiler));
  }

  cancelar(id: number, motivoCancelacion?: string): Observable<OrdenAlquiler> {
    return this.http
      .post<
        Record<string, unknown>
      >(`${this.apiUrl}/${id}/cancelar`, { motivo_cancelacion: motivoCancelacion })
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as OrdenAlquiler));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
