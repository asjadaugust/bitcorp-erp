import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ChecklistType = 'pre_shift' | 'during_shift' | 'end_shift' | 'maintenance';
export type ChecklistStatus = 'pending' | 'passed' | 'warning' | 'failed';

export interface ChecklistItem {
  item_id: string;
  description: string;
  category?: string;
  required: boolean;
  response?: 'ok' | 'not_ok' | 'na';
  notes?: string;
  photo_url?: string;
}

export interface ChecklistTemplate {
  id: string;
  checklist_type: ChecklistType;
  equipment_category_id?: string;
  template_name: string;
  description?: string;
  items: ChecklistItem[];
  is_active: boolean;
  company_id: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EquipmentChecklist {
  id: string;
  template_id?: string;
  equipment_id: string;
  operator_id?: string;
  daily_report_id?: string;
  checklist_date: Date;
  checklist_type: ChecklistType;
  items: ChecklistItem[];
  overall_status: ChecklistStatus;
  observations?: string;
  photos?: ChecklistPhoto[];
  signed_by?: string;
  signature_url?: string;
  company_id: string;
  created_at: Date;
  updated_at: Date;
  equipment_code?: string;
  equipment_name?: string;
  operator_name?: string;
  template_name?: string;
}

export interface ChecklistPhoto {
  photo_url: string;
  description?: string;
  timestamp: Date;
}

export interface ChecklistTemplateFilter {
  checklist_type?: ChecklistType;
  equipment_category_id?: string;
  is_active?: boolean;
  company_id?: string;
}

export interface ChecklistFilter {
  equipment_id?: string;
  operator_id?: string;
  daily_report_id?: string;
  checklist_type?: ChecklistType;
  overall_status?: ChecklistStatus;
  start_date?: string;
  end_date?: string;
  company_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateTemplateDto {
  checklist_type: ChecklistType;
  equipment_category_id?: string;
  template_name: string;
  description?: string;
  items: ChecklistItem[];
  is_active?: boolean;
  company_id: string;
  created_by?: string;
}

export interface CreateChecklistDto {
  template_id?: string;
  equipment_id: string;
  operator_id?: string;
  daily_report_id?: string;
  checklist_type: ChecklistType;
  items: ChecklistItem[];
  observations?: string;
  photos?: ChecklistPhoto[];
  signed_by?: string;
  signature_url?: string;
  company_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private apiUrl = `${environment.apiUrl}/checklists`;

  constructor(private http: HttpClient) {}

  // ============================================================================
  // CHECKLIST TEMPLATES
  // ============================================================================

  getAllTemplates(filters?: ChecklistTemplateFilter): Observable<ChecklistTemplate[]> {
    let params = new HttpParams();
    
    if (filters?.checklist_type) params = params.set('checklist_type', filters.checklist_type);
    if (filters?.equipment_category_id) params = params.set('equipment_category_id', filters.equipment_category_id);
    if (filters?.is_active !== undefined) params = params.set('is_active', String(filters.is_active));
    if (filters?.company_id) params = params.set('company_id', filters.company_id);

    return this.http.get<ChecklistTemplate[]>(`${this.apiUrl}/templates`, { params });
  }

  getTemplateById(id: string): Observable<ChecklistTemplate> {
    return this.http.get<ChecklistTemplate>(`${this.apiUrl}/templates/${id}`);
  }

  createTemplate(template: CreateTemplateDto): Observable<ChecklistTemplate> {
    return this.http.post<ChecklistTemplate>(`${this.apiUrl}/templates`, template);
  }

  updateTemplate(id: string, updates: Partial<CreateTemplateDto>): Observable<ChecklistTemplate> {
    return this.http.put<ChecklistTemplate>(`${this.apiUrl}/templates/${id}`, updates);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  // ============================================================================
  // EQUIPMENT CHECKLISTS
  // ============================================================================

  getAllChecklists(filters?: ChecklistFilter): Observable<EquipmentChecklist[]> {
    let params = new HttpParams();
    
    if (filters?.equipment_id) params = params.set('equipment_id', filters.equipment_id);
    if (filters?.operator_id) params = params.set('operator_id', filters.operator_id);
    if (filters?.daily_report_id) params = params.set('daily_report_id', filters.daily_report_id);
    if (filters?.checklist_type) params = params.set('checklist_type', filters.checklist_type);
    if (filters?.overall_status) params = params.set('overall_status', filters.overall_status);
    if (filters?.start_date) params = params.set('start_date', filters.start_date);
    if (filters?.end_date) params = params.set('end_date', filters.end_date);
    if (filters?.company_id) params = params.set('company_id', filters.company_id);
    if (filters?.page) params = params.set('page', String(filters.page));
    if (filters?.limit) params = params.set('limit', String(filters.limit));

    return this.http.get<EquipmentChecklist[]>(this.apiUrl, { params });
  }

  getChecklistById(id: string): Observable<EquipmentChecklist> {
    return this.http.get<EquipmentChecklist>(`${this.apiUrl}/${id}`);
  }

  createChecklist(checklist: CreateChecklistDto): Observable<EquipmentChecklist> {
    return this.http.post<EquipmentChecklist>(this.apiUrl, checklist);
  }

  updateChecklist(id: string, updates: Partial<CreateChecklistDto>): Observable<EquipmentChecklist> {
    return this.http.put<EquipmentChecklist>(`${this.apiUrl}/${id}`, updates);
  }

  deleteChecklist(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================

  getChecklistSummary(filters?: { company_id?: string; start_date?: string; end_date?: string }): Observable<any> {
    let params = new HttpParams();
    
    if (filters?.company_id) params = params.set('company_id', filters.company_id);
    if (filters?.start_date) params = params.set('start_date', filters.start_date);
    if (filters?.end_date) params = params.set('end_date', filters.end_date);

    return this.http.get(`${this.apiUrl}/analytics/summary`, { params });
  }

  getEquipmentChecklistHistory(equipmentId: string, limit: number = 10): Observable<any> {
    let params = new HttpParams().set('limit', String(limit));
    return this.http.get(`${this.apiUrl}/analytics/equipment/${equipmentId}/history`, { params });
  }
}
