import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistroTrabajadorLista {
  id: number;
  trabajador_dni: string;
  proveedor_ruc: string | null;
  fecha_ingreso: string | null;
  fecha_cese: string | null;
  estatus: string;
  sub_grupo: string | null;
}

export interface ComportamientoHistorico {
  id: number;
  cargo: string | null;
  salario: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  numero_contrato: string | null;
}

export interface RegistroTrabajadorDetalle extends RegistroTrabajadorLista {
  legacy_id: string | null;
  unidad_operativa_legacy_id: string | null;
  fecha_registro: string | null;
  registrado_por: string | null;
  created_at: string | null;
  updated_at: string | null;
  comportamiento_historico: ComportamientoHistorico[];
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

@Injectable({ providedIn: 'root' })
export class WorkerRegistryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/hr/worker-registry';

  getRegistros(
    page = 1,
    limit = 100,
    estatus?: string,
    sub_grupo?: string,
    search?: string
  ): Observable<PaginatedResponse<RegistroTrabajadorLista>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (estatus) params = params.set('estatus', estatus);
    if (sub_grupo) params = params.set('sub_grupo', sub_grupo);
    if (search) params = params.set('search', search);
    return this.http.get<PaginatedResponse<RegistroTrabajadorLista>>(`${this.baseUrl}/registros`, {
      params,
    });
  }

  getRegistro(id: number): Observable<RegistroTrabajadorDetalle> {
    return this.http.get<RegistroTrabajadorDetalle>(`${this.baseUrl}/registros/${id}`);
  }

  createRegistro(data: Partial<RegistroTrabajadorDetalle>): Observable<RegistroTrabajadorDetalle> {
    return this.http.post<RegistroTrabajadorDetalle>(`${this.baseUrl}/registros`, data);
  }

  updateRegistro(
    id: number,
    data: Partial<RegistroTrabajadorDetalle>
  ): Observable<RegistroTrabajadorDetalle> {
    return this.http.put<RegistroTrabajadorDetalle>(`${this.baseUrl}/registros/${id}`, data);
  }

  deleteRegistro(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registros/${id}`);
  }

  addComportamiento(
    regId: number,
    data: Partial<ComportamientoHistorico>
  ): Observable<ComportamientoHistorico> {
    return this.http.post<ComportamientoHistorico>(
      `${this.baseUrl}/registros/${regId}/comportamiento`,
      data
    );
  }

  updateComportamiento(
    regId: number,
    chId: number,
    data: Partial<ComportamientoHistorico>
  ): Observable<ComportamientoHistorico> {
    return this.http.put<ComportamientoHistorico>(
      `${this.baseUrl}/registros/${regId}/comportamiento/${chId}`,
      data
    );
  }

  deleteComportamiento(regId: number, chId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/registros/${regId}/comportamiento/${chId}`);
  }
}
