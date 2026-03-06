import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PartidaItem {
  id: number;
  presupuesto_id: number;
  edt_id: number | null;
  apu_id: number | null;
  codigo: string;
  descripcion: string;
  unidad_medida: string;
  metrado: number;
  precio_unitario: number;
  parcial: number;
  fase: string | null;
  orden: number;
}

export interface PresupuestoListItem {
  id: number;
  proyecto_id: number;
  codigo: string;
  nombre: string;
  fecha: string;
  version: number;
  estado: string;
  total_presupuestado: number;
  created_at: string;
}

export interface PresupuestoDetail {
  id: number;
  proyecto_id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  fecha: string;
  version: number;
  estado: string;
  total_presupuestado: number;
  created_at: string;
  updated_at: string;
  partidas: PartidaItem[];
}

export interface FaseResumen {
  fase: string;
  cantidad_partidas: number;
  subtotal: number;
}

export interface PresupuestoResumen {
  presupuesto_id: number;
  codigo: string;
  nombre: string;
  fases: FaseResumen[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class PresupuestoService {
  private apiUrl = `${environment.apiUrl}/presupuestos`;
  private http = inject(HttpClient);

  getAllPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    proyecto_id?: number;
  }): Observable<{
    data: PresupuestoListItem[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.proyecto_id)
      httpParams = httpParams.set('proyecto_id', params.proyecto_id.toString());
    return this.http.get<Record<string, unknown>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        const data = (response?.['data'] as PresupuestoListItem[]) ?? [];
        const pagination = (response?.['pagination'] as {
          page: number;
          limit: number;
          total: number;
          total_pages: number;
        }) ?? { page: 1, limit: params?.limit ?? 20, total: data.length, total_pages: 1 };
        return { data, pagination };
      })
    );
  }

  getById(id: number): Observable<PresupuestoDetail> {
    return this.http.get<PresupuestoDetail>(`${this.apiUrl}/${id}`);
  }

  create(data: {
    proyecto_id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    fecha: string;
    version?: number;
    estado?: string;
  }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, data);
  }

  update(
    id: number,
    data: {
      nombre?: string;
      descripcion?: string;
      fecha?: string;
      version?: number;
      estado?: string;
    }
  ): Observable<PresupuestoDetail> {
    return this.http.put<PresupuestoDetail>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addPartida(
    presupuestoId: number,
    data: {
      edt_id?: number;
      apu_id?: number;
      codigo: string;
      descripcion: string;
      unidad_medida: string;
      metrado?: number;
      precio_unitario?: number;
      fase?: string;
      orden?: number;
    }
  ): Observable<PresupuestoDetail> {
    return this.http.post<PresupuestoDetail>(`${this.apiUrl}/${presupuestoId}/partidas`, data);
  }

  updatePartida(
    presupuestoId: number,
    partidaId: number,
    data: {
      edt_id?: number;
      apu_id?: number;
      descripcion?: string;
      unidad_medida?: string;
      metrado?: number;
      precio_unitario?: number;
      fase?: string;
      orden?: number;
    }
  ): Observable<PresupuestoDetail> {
    return this.http.put<PresupuestoDetail>(
      `${this.apiUrl}/${presupuestoId}/partidas/${partidaId}`,
      data
    );
  }

  removePartida(presupuestoId: number, partidaId: number): Observable<PresupuestoDetail> {
    return this.http.delete<PresupuestoDetail>(
      `${this.apiUrl}/${presupuestoId}/partidas/${partidaId}`
    );
  }

  recalculate(presupuestoId: number): Observable<PresupuestoDetail> {
    return this.http.post<PresupuestoDetail>(`${this.apiUrl}/${presupuestoId}/recalcular`, {});
  }

  getResumen(presupuestoId: number): Observable<PresupuestoResumen> {
    return this.http.get<PresupuestoResumen>(`${this.apiUrl}/${presupuestoId}/resumen`);
  }
}
