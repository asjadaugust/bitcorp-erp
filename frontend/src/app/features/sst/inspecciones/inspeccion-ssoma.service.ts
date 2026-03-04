import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- Inspecciones ---

export interface InspeccionSsomaLista {
  id: number;
  fecha_hallazgo: string | null;
  lugar_hallazgo: string | null;
  tipo_inspeccion: string | null;
  nivel_riesgo: string | null;
  estado: string | null;
  inspector: string | null;
}

export interface SeguimientoInspeccion {
  id: number;
  fecha: string | null;
  inspector_dni: string | null;
  inspector: string | null;
  descripcion_inspeccion: string | null;
  link_evidencia: string | null;
  fecha_proxima_inspeccion: string | null;
  avance_estimado: number | null;
}

export interface InspeccionSsomaDetalle extends InspeccionSsomaLista {
  legacy_id: string | null;
  inspector_dni: string | null;
  descripcion_hallazgo: string | null;
  link_foto: string | null;
  causas_hallazgo: string | null;
  responsable_subsanacion: string | null;
  fecha_subsanacion: string | null;
  created_at: string | null;
  updated_at: string | null;
  seguimientos: SeguimientoInspeccion[];
}

// --- Reportes Acto/Condicion ---

export interface ReporteActoCondicionLista {
  id: number;
  fecha_evento: string | null;
  lugar: string | null;
  tipo_reporte: string | null;
  acto_condicion: string | null;
  reportado_por_nombre: string | null;
  estado: string | null;
}

export interface ReporteActoCondicionDetalle extends ReporteActoCondicionLista {
  legacy_id: string | null;
  reportado_por_dni: string | null;
  cargo: string | null;
  empresa_reportante: string | null;
  empresa: string | null;
  sistema_gestion: string | null;
  codigo_acto_condicion: string | null;
  dano_a: string | null;
  descripcion: string | null;
  como_actue: string | null;
  por_que_1: string | null;
  por_que_2: string | null;
  por_que_3: string | null;
  por_que_4: string | null;
  por_que_5: string | null;
  accion_correctiva: string | null;
  registrado_por_dni: string | null;
  registrado_por: string | null;
  fecha_registro: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ActoCondicionInseguro {
  id: number;
  codigo: string | null;
  acto_condicion: string | null;
  categoria: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class InspeccionSsomaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/sst';

  // --- Inspecciones SSOMA ---

  getInspecciones(
    page = 1,
    limit = 100,
    tipo_inspeccion?: string,
    nivel_riesgo?: string,
    estado?: string
  ): Observable<PaginatedResponse<InspeccionSsomaLista>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (tipo_inspeccion) params = params.set('tipo_inspeccion', tipo_inspeccion);
    if (nivel_riesgo) params = params.set('nivel_riesgo', nivel_riesgo);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PaginatedResponse<InspeccionSsomaLista>>(`${this.baseUrl}/inspecciones`, {
      params,
    });
  }

  getInspeccion(id: number): Observable<InspeccionSsomaDetalle> {
    return this.http.get<InspeccionSsomaDetalle>(`${this.baseUrl}/inspecciones/${id}`);
  }

  createInspeccion(data: Partial<InspeccionSsomaDetalle>): Observable<InspeccionSsomaDetalle> {
    return this.http.post<InspeccionSsomaDetalle>(`${this.baseUrl}/inspecciones`, data);
  }

  updateInspeccion(
    id: number,
    data: Partial<InspeccionSsomaDetalle>
  ): Observable<InspeccionSsomaDetalle> {
    return this.http.put<InspeccionSsomaDetalle>(`${this.baseUrl}/inspecciones/${id}`, data);
  }

  deleteInspeccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/inspecciones/${id}`);
  }

  // --- Seguimientos ---

  createSeguimiento(
    inspeccionId: number,
    data: Partial<SeguimientoInspeccion>
  ): Observable<SeguimientoInspeccion> {
    return this.http.post<SeguimientoInspeccion>(
      `${this.baseUrl}/inspecciones/${inspeccionId}/seguimientos`,
      data
    );
  }

  deleteSeguimiento(inspeccionId: number, seguimientoId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/inspecciones/${inspeccionId}/seguimientos/${seguimientoId}`
    );
  }

  // --- Reportes Acto/Condicion ---

  getReportes(
    page = 1,
    limit = 100,
    tipo_reporte?: string,
    estado?: string
  ): Observable<PaginatedResponse<ReporteActoCondicionLista>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (tipo_reporte) params = params.set('tipo_reporte', tipo_reporte);
    if (estado) params = params.set('estado', estado);
    return this.http.get<PaginatedResponse<ReporteActoCondicionLista>>(
      `${this.baseUrl}/reportes-acto-condicion`,
      { params }
    );
  }

  getReporte(id: number): Observable<ReporteActoCondicionDetalle> {
    return this.http.get<ReporteActoCondicionDetalle>(
      `${this.baseUrl}/reportes-acto-condicion/${id}`
    );
  }

  createReporte(
    data: Partial<ReporteActoCondicionDetalle>
  ): Observable<ReporteActoCondicionDetalle> {
    return this.http.post<ReporteActoCondicionDetalle>(
      `${this.baseUrl}/reportes-acto-condicion`,
      data
    );
  }

  updateReporte(
    id: number,
    data: Partial<ReporteActoCondicionDetalle>
  ): Observable<ReporteActoCondicionDetalle> {
    return this.http.put<ReporteActoCondicionDetalle>(
      `${this.baseUrl}/reportes-acto-condicion/${id}`,
      data
    );
  }

  deleteReporte(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reportes-acto-condicion/${id}`);
  }

  // --- Catalogo Actos/Condiciones ---

  getActosCondicion(): Observable<ActoCondicionInseguro[]> {
    return this.http.get<ActoCondicionInseguro[]>(`${this.baseUrl}/actos-condicion`);
  }
}
