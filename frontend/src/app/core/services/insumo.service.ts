import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface InsumoListItem {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  tipo: string;
  precio_unitario: number;
  created_at: string;
}

export interface InsumoDetail {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  tipo: string;
  precio_unitario: number;
  equipo_tipo_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface InsumoDropdownItem {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  tipo: string;
  precio_unitario: number;
}

@Injectable({
  providedIn: 'root',
})
export class InsumoService {
  private apiUrl = `${environment.apiUrl}/insumos`;
  private http = inject(HttpClient);

  getAllPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tipo?: string;
  }): Observable<{
    data: InsumoListItem[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    return this.http.get<Record<string, unknown>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        const data = (response?.['data'] as InsumoListItem[]) ?? [];
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

  getDropdownOptions(): Observable<InsumoDropdownItem[]> {
    return this.http.get<InsumoDropdownItem[]>(`${this.apiUrl}/dropdown`);
  }

  getById(id: number): Observable<InsumoDetail> {
    return this.http.get<InsumoDetail>(`${this.apiUrl}/${id}`);
  }

  create(data: {
    codigo: string;
    nombre: string;
    unidad_medida: string;
    tipo: string;
    precio_unitario?: number;
    equipo_tipo_id?: number;
  }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, data);
  }

  update(
    id: number,
    data: {
      nombre?: string;
      unidad_medida?: string;
      tipo?: string;
      precio_unitario?: number;
      equipo_tipo_id?: number;
    }
  ): Observable<InsumoDetail> {
    return this.http.put<InsumoDetail>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
