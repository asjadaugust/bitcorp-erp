import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Categoria {
  id: number;
  codigo: string | null;
  nombre: string | null;
  descripcion: string | null;
}

export interface SolicitudMaterial {
  id: number;
  motivo: string | null;
  fecha_solicitud: string | null;
  solicitado_por: string | null;
}

export interface DetalleSolicitudMaterial {
  id: number;
  solicitud_legacy_id: string | null;
  producto: string | null;
  cantidad: number | null;
  unidad_medida: string | null;
  fecha_requerida: string | null;
  marca_sugerida: string | null;
  descripcion: string | null;
  link: string | null;
  estatus: string | null;
}

export interface SolicitudMaterialDetalle extends SolicitudMaterial {
  legacy_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  detalles: DetalleSolicitudMaterial[];
}

export interface Requerimiento {
  id: number;
  numero_requerimiento: number | null;
  motivo: string | null;
  fecha_requerimiento: string | null;
  solicitado_por: string | null;
}

export interface DetalleRequerimiento {
  id: number;
  requerimiento_legacy_id: string | null;
  producto: string | null;
  cantidad: number | null;
  unidad_medida: string | null;
  fecha_requerida: string | null;
  marca_sugerida: string | null;
  descripcion: string | null;
  link: string | null;
  estatus: string | null;
}

export interface RequerimientoDetalle extends Requerimiento {
  legacy_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  detalles: DetalleRequerimiento[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface CotizacionLogistica {
  id: number;
  numero_cotizacion: number | null;
}

@Injectable({ providedIn: 'root' })
export class SolicitudMaterialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/logistics/requests';

  // Categorias
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

  // Solicitudes Material
  getSolicitudes(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<PaginatedResponse<SolicitudMaterial>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<PaginatedResponse<SolicitudMaterial>>(
      `${this.baseUrl}/solicitudes-material`,
      {
        params: httpParams,
      }
    );
  }

  getSolicitud(id: number): Observable<SolicitudMaterialDetalle> {
    return this.http.get<SolicitudMaterialDetalle>(`${this.baseUrl}/solicitudes-material/${id}`);
  }

  createSolicitud(data: {
    motivo?: string;
    fecha_solicitud?: string;
    solicitado_por?: string;
    detalles?: any[];
  }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/solicitudes-material`, data);
  }

  updateSolicitud(id: number, data: Partial<SolicitudMaterial>): Observable<any> {
    return this.http.put(`${this.baseUrl}/solicitudes-material/${id}`, data);
  }

  deleteSolicitud(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/solicitudes-material/${id}`);
  }

  // Requerimientos
  getRequerimientos(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<PaginatedResponse<Requerimiento>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<PaginatedResponse<Requerimiento>>(`${this.baseUrl}/requerimientos`, {
      params: httpParams,
    });
  }

  getRequerimiento(id: number): Observable<RequerimientoDetalle> {
    return this.http.get<RequerimientoDetalle>(`${this.baseUrl}/requerimientos/${id}`);
  }

  createRequerimiento(data: {
    motivo?: string;
    fecha_requerimiento?: string;
    solicitado_por?: string;
    detalles?: any[];
  }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/requerimientos`, data);
  }

  updateRequerimiento(id: number, data: Partial<Requerimiento>): Observable<any> {
    return this.http.put(`${this.baseUrl}/requerimientos/${id}`, data);
  }

  deleteRequerimiento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/requerimientos/${id}`);
  }

  // Cotizaciones
  getCotizaciones(): Observable<CotizacionLogistica[]> {
    return this.http.get<CotizacionLogistica[]>(`${this.baseUrl}/cotizaciones-logistica`);
  }
}
