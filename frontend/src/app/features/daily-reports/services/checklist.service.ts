import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  equipment_type_id?: string;
  is_active: boolean;
  items: ChecklistItem[];
  created_at?: Date;
  updated_at?: Date;
}

export interface ChecklistItem {
  id?: string;
  template_id: string;
  item_text: string;
  item_order: number;
  is_required: boolean;
  is_checked?: boolean;
  notes?: string;
}

export interface ChecklistResponse {
  id: string;
  report_id: string;
  template_id: string;
  completed_at?: Date;
  items: ChecklistItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private apiUrl = `${environment.apiUrl}/checklists`;
  private templatesCache$ = new BehaviorSubject<ChecklistTemplate[]>([]);

  constructor(private http: HttpClient) {}

  // Templates
  getTemplates(): Observable<ChecklistTemplate[]> {
    return this.http.get<ChecklistTemplate[]>(`${this.apiUrl}/templates`).pipe(
      tap(templates => this.templatesCache$.next(templates))
    );
  }

  getTemplateById(id: string): Observable<ChecklistTemplate> {
    return this.http.get<ChecklistTemplate>(`${this.apiUrl}/templates/${id}`);
  }

  getTemplatesByEquipmentType(equipmentTypeId: string): Observable<ChecklistTemplate[]> {
    return this.http.get<ChecklistTemplate[]>(
      `${this.apiUrl}/templates/equipment-type/${equipmentTypeId}`
    );
  }

  createTemplate(template: Partial<ChecklistTemplate>): Observable<ChecklistTemplate> {
    return this.http.post<ChecklistTemplate>(`${this.apiUrl}/templates`, template).pipe(
      tap(() => this.getTemplates().subscribe())
    );
  }

  updateTemplate(id: string, template: Partial<ChecklistTemplate>): Observable<ChecklistTemplate> {
    return this.http.put<ChecklistTemplate>(`${this.apiUrl}/templates/${id}`, template).pipe(
      tap(() => this.getTemplates().subscribe())
    );
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`).pipe(
      tap(() => this.getTemplates().subscribe())
    );
  }

  // Checklist responses
  getChecklistsByReport(reportId: string): Observable<ChecklistResponse[]> {
    return this.http.get<ChecklistResponse[]>(`${this.apiUrl}/report/${reportId}`);
  }

  createChecklist(checklist: {
    report_id: string;
    template_id: string;
    items: ChecklistItem[];
  }): Observable<ChecklistResponse> {
    return this.http.post<ChecklistResponse>(this.apiUrl, checklist);
  }

  updateChecklist(id: string, checklist: {
    items: ChecklistItem[];
    completed_at?: Date;
  }): Observable<ChecklistResponse> {
    return this.http.put<ChecklistResponse>(`${this.apiUrl}/${id}`, checklist);
  }

  deleteChecklist(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Utility methods
  validateChecklist(items: ChecklistItem[]): boolean {
    return items
      .filter(item => item.is_required)
      .every(item => item.is_checked);
  }

  getCompletionPercentage(items: ChecklistItem[]): number {
    if (items.length === 0) return 0;
    const checkedCount = items.filter(item => item.is_checked).length;
    return Math.round((checkedCount / items.length) * 100);
  }

  get cachedTemplates$(): Observable<ChecklistTemplate[]> {
    return this.templatesCache$.asObservable();
  }
}
