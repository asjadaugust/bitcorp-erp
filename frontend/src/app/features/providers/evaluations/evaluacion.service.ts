import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CriterioSeleccionEvaluacion {
  id: number;
  seleccion_evaluacion: string | null;
  proveedor_de: string | null;
  aspecto: string | null;
  aspecto_peso: number | null;
  criterio_seleccion: string | null;
  criterio_seleccion_peso: number | null;
  parametro: string | null;
  punto: number | null;
  puntaje: number | null;
}

export interface EvaluacionProveedorLista {
  id: number;
  ruc: string | null;
  razon_social: string | null;
  puntaje: number | null;
  resultado: string | null;
  accion: string | null;
  fecha_evaluacion: string | null;
}

export interface EvaluacionProveedorDetalle {
  id: number;
  legacy_id: string | null;
  ruc: string | null;
  razon_social: string | null;
  precio: string | null;
  plazo_pago: string | null;
  calidad: string | null;
  plazo_cumplimiento: string | null;
  ubicacion: string | null;
  atencion_cliente: string | null;
  sgc: string | null;
  sgsst: string | null;
  sga: string | null;
  puntaje: number | null;
  resultado: string | null;
  accion: string | null;
  parametro_valor: string | null;
  observacion: string | null;
  fecha_evaluacion: string | null;
  evaluado_por: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface EvaluacionProveedorCrear {
  ruc: string | null;
  razon_social: string | null;
  precio: string | null;
  plazo_pago: string | null;
  calidad: string | null;
  plazo_cumplimiento: string | null;
  ubicacion: string | null;
  atencion_cliente: string | null;
  sgc: string | null;
  sgsst: string | null;
  sga: string | null;
  puntaje: number | null;
  observacion: string | null;
  fecha_evaluacion: string | null;
  evaluado_por: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class EvaluacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/providers/evaluations';

  getCriterios(): Observable<CriterioSeleccionEvaluacion[]> {
    return this.http.get<CriterioSeleccionEvaluacion[]>(`${this.baseUrl}/criterios`);
  }

  getEvaluaciones(
    page = 1,
    limit = 100,
    resultado?: string
  ): Observable<PaginatedResponse<EvaluacionProveedorLista>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (resultado) params = params.set('resultado', resultado);
    return this.http.get<PaginatedResponse<EvaluacionProveedorLista>>(
      `${this.baseUrl}/evaluaciones`,
      { params }
    );
  }

  getEvaluacion(id: number): Observable<EvaluacionProveedorDetalle> {
    return this.http.get<EvaluacionProveedorDetalle>(`${this.baseUrl}/evaluaciones/${id}`);
  }

  getByProveedor(ruc: string): Observable<EvaluacionProveedorLista[]> {
    return this.http.get<EvaluacionProveedorLista[]>(
      `${this.baseUrl}/evaluaciones/proveedor/${ruc}`
    );
  }

  createEvaluacion(data: EvaluacionProveedorCrear): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/evaluaciones`, data);
  }

  updateEvaluacion(
    id: number,
    data: Partial<EvaluacionProveedorCrear>
  ): Observable<EvaluacionProveedorDetalle> {
    return this.http.put<EvaluacionProveedorDetalle>(`${this.baseUrl}/evaluaciones/${id}`, data);
  }

  deleteEvaluacion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/evaluaciones/${id}`);
  }
}
