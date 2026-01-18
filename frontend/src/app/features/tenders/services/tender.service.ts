import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, map } from 'rxjs';

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
        return response as any as Tender[];
      })
    );
  }

  getTender(id: string | number): Observable<Tender> {
    // Backend returns: { success: true, data: Tender }
    return this.http.get<ApiResponse<Tender>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data) // Unwrap data from response
    );
  }

  createTender(tender: Partial<Tender>): Observable<Tender> {
    // Backend returns: { success: true, data: Tender }
    return this.http.post<ApiResponse<Tender>>(this.apiUrl, tender).pipe(
      map((response) => response.data) // Unwrap data from response
    );
  }

  updateTender(id: string | number, tender: Partial<Tender>): Observable<Tender> {
    // Backend returns: { success: true, data: Tender }
    return this.http.put<ApiResponse<Tender>>(`${this.apiUrl}/${id}`, tender).pipe(
      map((response) => response.data) // Unwrap data from response
    );
  }

  deleteTender(id: string | number): Observable<void> {
    // Backend returns: { success: true, data: null } or no content
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
