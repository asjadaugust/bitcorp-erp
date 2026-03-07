import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, map } from 'rxjs';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export type EstadoLicitacion = 'PUBLICADO' | 'EVALUACION' | 'ADJUDICADO' | 'DESIERTO' | 'CANCELADO';

export interface Tender {
  id: number;
  legacy_id?: string; // snake_case to match backend
  codigo: string;
  nombre: string;
  entidad_convocante?: string; // snake_case to match backend
  monto_referencial?: number; // snake_case to match backend
  fecha_convocatoria?: string; // snake_case to match backend
  fecha_presentacion?: string; // snake_case to match backend
  estado: EstadoLicitacion;
  observaciones?: string;
  created_at?: string; // snake_case to match backend
  updated_at?: string; // snake_case to match backend
}

// Backend API response wrappers
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TenderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tenders`;

  getTendersPaginated(params?: {
    page?: number;
    limit?: number;
    estado?: string;
    tipo?: string;
  }): Observable<PaginatedResponse<Tender>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    return this.http.get<Record<string, unknown>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        const data = (response?.['data'] ?? response) as Tender[];
        const pagination = (response?.[
          'pagination'
        ] as PaginatedResponse<Tender>['pagination']) ?? {
          page: 1,
          limit: params?.limit ?? 20,
          total: Array.isArray(data) ? data.length : 0,
          total_pages: 1,
        };
        return { data: Array.isArray(data) ? data : [], pagination };
      })
    );
  }

  getTenders(): Observable<Tender[]> {
    // Backend returns: { success: true, data: Tender[], meta: {...} }
    // The api-response interceptor preserves responses with 'meta', so we get the full wrapped response
    return this.http.get<ApiResponse<Tender[]>>(this.apiUrl).pipe(
      map((response) => {
        // If interceptor preserved the response (has 'data' property), unwrap it
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }

        // If already unwrapped (shouldn't happen with our interceptor), return as is
        return response as unknown as Tender[];
      })
    );
  }

  getTender(id: string | number): Observable<Tender> {
    // Backend returns: { success: true, data: Tender }
    // But apiResponseInterceptor unwraps it automatically, so we get Tender directly
    return this.http.get<Tender>(`${this.apiUrl}/${id}`);
  }

  createTender(tender: Partial<Tender>): Observable<Tender> {
    // Backend returns: { success: true, data: Tender }
    // But apiResponseInterceptor unwraps it automatically, so we get Tender directly
    return this.http.post<Tender>(this.apiUrl, tender);
  }

  updateTender(id: string | number, tender: Partial<Tender>): Observable<Tender> {
    // Backend returns: { success: true, data: Tender }
    // But apiResponseInterceptor unwraps it automatically, so we get Tender directly
    return this.http.put<Tender>(`${this.apiUrl}/${id}`, tender);
  }

  deleteTender(id: string | number): Observable<void> {
    // Backend returns: { success: true, data: null } or no content
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
