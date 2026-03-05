import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ChecklistTemplate,
  ChecklistItem,
  ChecklistInspection,
  ChecklistResult,
  InspectionWithResults,
  ChecklistStats,
  ObservationsResponse,
} from '../models/checklist.model';

// Response wrapper interfaces
interface _ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// Filter interfaces
interface TemplateFilters {
  activo?: boolean;
  tipoEquipo?: string;
  search?: string;
}

interface InspectionFilters {
  page?: number;
  limit?: number;
  equipoId?: number;
  trabajadorId?: number;
  estado?: string;
  resultadoGeneral?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

interface StatsFilters {
  equipoId?: number;
  trabajadorId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChecklistService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/checklists`;

  // ============================================================================
  // MAPPING FUNCTIONS
  // ============================================================================

  /**
   * Map backend ChecklistTemplateListDto (Spanish snake_case) to frontend ChecklistTemplate (camelCase)
   */
  private mapApiToChecklistTemplate(apiData: Record<string, unknown>): ChecklistTemplate {
    return {
      id: apiData['id'] as number,
      codigo: apiData['codigo'] as string,
      nombre: apiData['nombre'] as string,
      tipoEquipo: (apiData['tipo_equipo'] || apiData['tipoEquipo']) as string,
      descripcion: apiData['descripcion'] as string | undefined,
      frecuencia: apiData['frecuencia'] as any,
      activo: apiData['activo'] !== undefined ? (apiData['activo'] as boolean) : true,
      createdBy: (apiData['created_by'] || apiData['createdBy']) as number,
      createdAt: (apiData['created_at'] || apiData['createdAt']) as string,
      updatedAt: (apiData['updated_at'] || apiData['updatedAt']) as string,
      items: (apiData['items'] as ChecklistItem[]) || [],
    };
  }

  // ============================================
  // TEMPLATE METHODS
  // ============================================

  getAllTemplatesPaginated(params?: { page?: number; limit?: number; activo?: boolean; tipoEquipo?: string; search?: string }): Observable<{ data: ChecklistTemplate[]; pagination: { page: number; limit: number; total: number; total_pages: number } }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.activo !== undefined) httpParams = httpParams.set('activo', params.activo.toString());
    if (params?.tipoEquipo) httpParams = httpParams.set('tipoEquipo', params.tipoEquipo);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/templates`, { params: httpParams }).pipe(
      map((response) => {
        const dataArray = response?.['data'] || response;
        const data = Array.isArray(dataArray)
          ? dataArray.map((item) => this.mapApiToChecklistTemplate(item as Record<string, unknown>))
          : [];
        const rawPagination = response?.['pagination'] as Record<string, unknown> | undefined;
        const pagination = rawPagination
          ? { page: rawPagination['page'] as number, limit: rawPagination['limit'] as number, total: rawPagination['total'] as number, total_pages: (rawPagination['total_pages'] || rawPagination['totalPages']) as number }
          : { page: 1, limit: params?.limit ?? 20, total: data.length, total_pages: 1 };
        return { data, pagination };
      })
    );
  }

  getAllTemplates(filters?: TemplateFilters): Observable<ChecklistTemplate[]> {
    let params = new HttpParams();
    if (filters?.activo !== undefined) {
      params = params.set('activo', filters.activo.toString());
    }
    if (filters?.tipoEquipo) {
      params = params.set('tipoEquipo', filters.tipoEquipo);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    // Handle paginated response {success, data, pagination}
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/templates`, { params }).pipe(
      map((response) => {
        const dataArray = response?.['data'] || response;
        if (Array.isArray(dataArray)) {
          return dataArray.map((item) =>
            this.mapApiToChecklistTemplate(item as Record<string, unknown>)
          );
        }
        return [];
      })
    );
  }

  getTemplateById(id: number): Observable<ChecklistTemplate> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/templates/${id}`).pipe(
      map((response) => {
        const data = response?.['data'] || response;
        return this.mapApiToChecklistTemplate(data as Record<string, unknown>);
      })
    );
  }

  createTemplate(data: Partial<ChecklistTemplate>): Observable<ChecklistTemplate> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/templates`, data)
      .pipe(
        map((res) =>
          this.mapApiToChecklistTemplate((res?.['data'] || res) as Record<string, unknown>)
        )
      );
  }

  updateTemplate(id: number, data: Partial<ChecklistTemplate>): Observable<ChecklistTemplate> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/templates/${id}`, data)
      .pipe(
        map((res) =>
          this.mapApiToChecklistTemplate((res?.['data'] || res) as Record<string, unknown>)
        )
      );
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  // ============================================
  // ITEM METHODS
  // ============================================

  createItem(data: Partial<ChecklistItem>): Observable<ChecklistItem> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/items`, data)
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistItem));
  }

  updateItem(id: number, data: Partial<ChecklistItem>): Observable<ChecklistItem> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/items/${id}`, data)
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistItem));
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}`);
  }

  // ============================================
  // INSPECTION METHODS
  // ============================================

  getAllInspections(
    filters?: InspectionFilters
  ): Observable<PaginatedResponse<ChecklistInspection>> {
    let params = new HttpParams();

    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters?.equipoId) {
      params = params.set('equipoId', filters.equipoId.toString());
    }
    if (filters?.trabajadorId) {
      params = params.set('trabajadorId', filters.trabajadorId.toString());
    }
    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }
    if (filters?.resultadoGeneral) {
      params = params.set('resultadoGeneral', filters.resultadoGeneral);
    }
    if (filters?.fechaDesde) {
      params = params.set('fechaDesde', filters.fechaDesde);
    }
    if (filters?.fechaHasta) {
      params = params.set('fechaHasta', filters.fechaHasta);
    }

    return this.http.get<PaginatedResponse<ChecklistInspection>>(`${this.apiUrl}/inspections`, {
      params,
    });
  }

  getInspectionById(id: number): Observable<ChecklistInspection> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/inspections/${id}`)
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistInspection));
  }

  getInspectionWithResults(id: number): Observable<InspectionWithResults> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/inspections/${id}/with-results`)
      .pipe(map((res) => (res?.['data'] || res) as unknown as InspectionWithResults));
  }

  createInspection(data: Partial<ChecklistInspection>): Observable<ChecklistInspection> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/inspections`, data)
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistInspection));
  }

  updateInspection(
    id: number,
    data: Partial<ChecklistInspection>
  ): Observable<ChecklistInspection> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/inspections/${id}`, data)
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistInspection));
  }

  completeInspection(id: number): Observable<ChecklistInspection> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/inspections/${id}/complete`, {})
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistInspection));
  }

  cancelInspection(id: number): Observable<ChecklistInspection> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/inspections/${id}/cancel`, {})
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistInspection));
  }

  // ============================================
  // RESULT METHODS
  // ============================================

  getResultsByInspection(inspectionId: number): Observable<ChecklistResult[]> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/inspections/${inspectionId}/results`)
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistResult[]));
  }

  saveResult(data: Partial<ChecklistResult>): Observable<ChecklistResult> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/results`, data)
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistResult));
  }

  // ============================================
  // STATS METHODS
  // ============================================

  getInspectionStats(filters?: StatsFilters): Observable<ChecklistStats> {
    let params = new HttpParams();

    if (filters?.equipoId) {
      params = params.set('equipoId', filters.equipoId.toString());
    }
    if (filters?.trabajadorId) {
      params = params.set('trabajadorId', filters.trabajadorId.toString());
    }
    if (filters?.fechaDesde) {
      params = params.set('fechaDesde', filters.fechaDesde);
    }
    if (filters?.fechaHasta) {
      params = params.set('fechaHasta', filters.fechaHasta);
    }

    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/inspections/stats`, { params })
      .pipe(map((res) => (res?.['data'] || res) as unknown as ChecklistStats));
  }

  /**
   * Get overdue inspections based on template frequency rules
   */
  getOverdueInspections(): Observable<OverdueInspection[]> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/inspections/overdue`)
      .pipe(map((res) => (res?.['data'] || res) as unknown as OverdueInspection[]));
  }

  getObservations(
    filters: {
      fechaDesde?: string;
      fechaHasta?: string;
      equipoId?: number;
      accionRequerida?: string;
      esCritico?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ): Observable<ObservationsResponse> {
    let params = new HttpParams();
    if (filters.fechaDesde) params = params.set('fecha_desde', filters.fechaDesde);
    if (filters.fechaHasta) params = params.set('fecha_hasta', filters.fechaHasta);
    if (filters.equipoId) params = params.set('equipo_id', String(filters.equipoId));
    if (filters.accionRequerida) params = params.set('accion_requerida', filters.accionRequerida);
    if (filters.esCritico !== undefined)
      params = params.set('es_critico', String(filters.esCritico));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    // apiResponseInterceptor unwraps {success, data} → data
    return this.http.get<ObservationsResponse>(`${this.apiUrl}/observations`, { params });
  }
}

export interface OverdueInspection {
  equipo_id: number;
  codigo_equipo: string;
  marca: string | null;
  modelo: string | null;
  categoria_prd: string | null;
  plantilla_id: number;
  plantilla_codigo: string;
  plantilla_nombre: string;
  frecuencia: string;
  ultima_inspeccion: string | null;
  dias_vencido: number;
  fecha_vencimiento: string;
}
