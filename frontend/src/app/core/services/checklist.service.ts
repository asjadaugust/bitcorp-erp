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
      id: apiData.id,
      codigo: apiData.codigo,
      nombre: apiData.nombre,
      tipoEquipo: apiData.tipo_equipo || apiData.tipoEquipo,
      descripcion: apiData.descripcion,
      frecuencia: apiData.frecuencia,
      activo: apiData.activo,
      createdBy: apiData.created_by || apiData.createdBy,
      createdAt: apiData.created_at || apiData.createdAt,
      updatedAt: apiData.updated_at || apiData.updatedAt,
      items: apiData.items || [],
    };
  }

  // ============================================
  // TEMPLATE METHODS
  // ============================================

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
        const dataArray = response?.data || response;
        if (Array.isArray(dataArray)) {
          return dataArray.map((item) => this.mapApiToChecklistTemplate(item));
        }
        return [];
      })
    );
  }

  getTemplateById(id: number): Observable<ChecklistTemplate> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/templates/${id}`).pipe(
      map((response) => {
        const data = response?.data || response;
        return this.mapApiToChecklistTemplate(data);
      })
    );
  }

  createTemplate(data: Partial<ChecklistTemplate>): Observable<ChecklistTemplate> {
    return this.http.post<ChecklistTemplate>(`${this.apiUrl}/templates`, data);
  }

  updateTemplate(id: number, data: Partial<ChecklistTemplate>): Observable<ChecklistTemplate> {
    return this.http.put<ChecklistTemplate>(`${this.apiUrl}/templates/${id}`, data);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  // ============================================
  // ITEM METHODS
  // ============================================

  createItem(data: Partial<ChecklistItem>): Observable<ChecklistItem> {
    return this.http.post<ChecklistItem>(`${this.apiUrl}/items`, data);
  }

  updateItem(id: number, data: Partial<ChecklistItem>): Observable<ChecklistItem> {
    return this.http.put<ChecklistItem>(`${this.apiUrl}/items/${id}`, data);
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
    return this.http.get<ChecklistInspection>(`${this.apiUrl}/inspections/${id}`);
  }

  getInspectionWithResults(id: number): Observable<InspectionWithResults> {
    return this.http.get<InspectionWithResults>(`${this.apiUrl}/inspections/${id}/with-results`);
  }

  createInspection(data: Partial<ChecklistInspection>): Observable<ChecklistInspection> {
    return this.http.post<ChecklistInspection>(`${this.apiUrl}/inspections`, data);
  }

  updateInspection(
    id: number,
    data: Partial<ChecklistInspection>
  ): Observable<ChecklistInspection> {
    return this.http.put<ChecklistInspection>(`${this.apiUrl}/inspections/${id}`, data);
  }

  completeInspection(id: number): Observable<ChecklistInspection> {
    return this.http.post<ChecklistInspection>(`${this.apiUrl}/inspections/${id}/complete`, {});
  }

  cancelInspection(id: number): Observable<ChecklistInspection> {
    return this.http.post<ChecklistInspection>(`${this.apiUrl}/inspections/${id}/cancel`, {});
  }

  // ============================================
  // RESULT METHODS
  // ============================================

  getResultsByInspection(inspectionId: number): Observable<ChecklistResult[]> {
    return this.http.get<ChecklistResult[]>(`${this.apiUrl}/inspections/${inspectionId}/results`);
  }

  saveResult(data: Partial<ChecklistResult>): Observable<ChecklistResult> {
    return this.http.post<ChecklistResult>(`${this.apiUrl}/results`, data);
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

    return this.http.get<ChecklistStats>(`${this.apiUrl}/inspections/stats`, { params });
  }
}
