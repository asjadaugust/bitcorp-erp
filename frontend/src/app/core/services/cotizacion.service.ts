import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Cotizacion {
  id: number;
  codigo: string;
  solicitud_equipo_id: number;
  proveedor_id: number;
  proveedor_nombre: string | null;
  proveedor_ruc: string | null;
  descripcion_equipo: string | null;
  tarifa_propuesta: number;
  tipo_tarifa: string;
  moneda: string;
  horas_incluidas: number | null;
  penalidad_exceso: number | null;
  plazo_entrega_dias: number | null;
  condiciones_pago: string | null;
  condiciones_especiales: string | null;
  garantia: string | null;
  disponibilidad: string | null;
  observaciones: string | null;
  puntaje: number | null;
  motivo_seleccion: string | null;
  estado: string;
  evaluado_por: number | null;
  fecha_evaluacion: string | null;
  orden_alquiler_id: number | null;
  creado_por: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComparacionResponse {
  solicitud: {
    id: number;
    codigo: string;
    tipo_equipo: string;
    cantidad: number;
    fecha_requerida: string;
    prioridad: string;
    estado: string;
  };
  cotizaciones: Cotizacion[];
  resumen: {
    total_cotizaciones: number;
    cotizaciones_evaluadas: number;
    cotizacion_seleccionada: number | null;
    tarifa_minima: number | null;
    tarifa_maxima: number | null;
    tarifa_promedio: number | null;
  };
}

export interface CotizacionListResponse {
  data: Cotizacion[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cotizaciones`;

  listar(
    filters: {
      solicitud_equipo_id?: number;
      proveedor_id?: number;
      estado?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Observable<CotizacionListResponse> {
    let params = new HttpParams();
    if (filters.solicitud_equipo_id)
      params = params.set('solicitud_equipo_id', String(filters.solicitud_equipo_id));
    if (filters.proveedor_id) params = params.set('proveedor_id', String(filters.proveedor_id));
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<CotizacionListResponse>(this.apiUrl, { params });
  }

  obtener(id: number): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.apiUrl}/${id}`);
  }

  obtenerComparacion(solicitudId: number): Observable<ComparacionResponse> {
    return this.http.get<ComparacionResponse>(`${this.apiUrl}/comparacion/${solicitudId}`);
  }

  crear(dto: Record<string, unknown>): Observable<Cotizacion> {
    return this.http
      .post<Record<string, unknown>>(this.apiUrl, dto)
      .pipe(map((r) => (r?.['data'] ?? r) as unknown as Cotizacion));
  }

  actualizar(id: number, dto: Record<string, unknown>): Observable<Cotizacion> {
    return this.http.put<Cotizacion>(`${this.apiUrl}/${id}`, dto);
  }

  evaluar(id: number, puntaje: number, observaciones?: string): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.apiUrl}/${id}/evaluar`, {
      puntaje,
      observaciones,
    });
  }

  seleccionar(
    id: number,
    motivoSeleccion?: string,
    proveedorUnico?: boolean
  ): Observable<{ cotizacion: Cotizacion; orden_alquiler_id: number }> {
    return this.http.post<{ cotizacion: Cotizacion; orden_alquiler_id: number }>(
      `${this.apiUrl}/${id}/seleccionar`,
      { motivo_seleccion: motivoSeleccion, proveedor_unico: proveedorUnico }
    );
  }

  rechazar(id: number, motivo?: string): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(`${this.apiUrl}/${id}/rechazar`, { motivo });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
