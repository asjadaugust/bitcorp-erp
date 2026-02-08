import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ChecklistTemplate,
  EquipmentChecklist,
  CreateChecklistTemplateDto,
  CreateChecklistDto,
  ChecklistFilters,
  ChecklistSummary,
} from '../models/checklist.models';

@Injectable({
  providedIn: 'root',
})
export class ChecklistService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/checklists`;

  // ============================================================================
  // CHECKLIST TEMPLATES
  // ============================================================================

  getAllTemplates(filters?: {
    checklist_type?: string;
    equipment_category_id?: string;
    is_active?: boolean;
  }): Observable<ChecklistTemplate[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<ChecklistTemplate[]>(`${this.apiUrl}/templates`, { params });
  }

  getTemplateById(id: string): Observable<ChecklistTemplate> {
    return this.http.get<ChecklistTemplate>(`${this.apiUrl}/templates/${id}`);
  }

  createTemplate(dto: CreateChecklistTemplateDto): Observable<ChecklistTemplate> {
    return this.http.post<ChecklistTemplate>(`${this.apiUrl}/templates`, dto);
  }

  updateTemplate(id: string, updates: Partial<ChecklistTemplate>): Observable<ChecklistTemplate> {
    return this.http.put<ChecklistTemplate>(`${this.apiUrl}/templates/${id}`, updates);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  // ============================================================================
  // EQUIPMENT CHECKLISTS
  // ============================================================================

  getAllChecklists(filters?: ChecklistFilters): Observable<EquipmentChecklist[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<EquipmentChecklist[]>(this.apiUrl, { params });
  }

  getChecklistById(id: string): Observable<EquipmentChecklist> {
    return this.http.get<EquipmentChecklist>(`${this.apiUrl}/${id}`);
  }

  createChecklist(dto: CreateChecklistDto): Observable<EquipmentChecklist> {
    return this.http.post<EquipmentChecklist>(this.apiUrl, dto);
  }

  updateChecklist(
    id: string,
    updates: Partial<EquipmentChecklist>
  ): Observable<EquipmentChecklist> {
    return this.http.put<EquipmentChecklist>(`${this.apiUrl}/${id}`, updates);
  }

  deleteChecklist(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================

  getChecklistSummary(filters?: {
    company_id?: string;
    start_date?: string;
    end_date?: string;
  }): Observable<ChecklistSummary> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<ChecklistSummary>(`${this.apiUrl}/analytics/summary`, { params });
  }

  getEquipmentChecklistHistory(equipmentId: string, limit = 10): Observable<EquipmentChecklist[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<EquipmentChecklist[]>(`${this.apiUrl}/equipment/${equipmentId}/history`, {
      params,
    });
  }
}
