import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface EdtDropdownItem {
  id: number;
  codigo: string;
  codigo_alfanumerico: string | null;
  nombre: string;
}

export interface EdtListItem {
  id: number;
  codigo: string;
  nombre: string;
  codigo_alfanumerico: string | null;
  unidad_medida: string | null;
  estado: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class EdtService {
  private apiUrl = `${environment.apiUrl}/edt`;
  private http = inject(HttpClient);

  getDropdownOptions(): Observable<EdtDropdownItem[]> {
    return this.http.get<EdtDropdownItem[]>(`${this.apiUrl}/dropdown`);
  }

  getAllPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    estado?: string;
  }): Observable<{
    data: EdtListItem[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    return this.http.get<Record<string, unknown>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        const dataArray = response?.['data'] || response;
        const data = Array.isArray(dataArray) ? (dataArray as EdtListItem[]) : [];
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

  create(data: {
    codigo: string;
    nombre: string;
    codigo_alfanumerico?: string;
    unidad_medida?: string;
    estado?: string;
  }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, data);
  }

  update(
    id: number,
    data: {
      nombre?: string;
      codigo_alfanumerico?: string;
      unidad_medida?: string;
      estado?: string;
    }
  ): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
