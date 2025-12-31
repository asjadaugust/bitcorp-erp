import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Operator,
  CreateOperatorDto,
  OperatorCertification,
  OperatorSkill,
} from '../models/operator.model';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OperatorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/operators`;

  getAll(filters?: any): Observable<Operator[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    // Interceptor unwraps {success, data} automatically
    return this.http.get<Operator[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Operator> {
    return this.http.get<Operator>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateOperatorDto): Observable<Operator> {
    return this.http.post<Operator>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Operator>): Observable<Operator> {
    return this.http.put<Operator>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAvailable(): Observable<Operator[]> {
    return this.http.get<Operator[]>(`${this.apiUrl}/available`);
  }

  getCertifications(operatorId: number): Observable<OperatorCertification[]> {
    return this.http.get<OperatorCertification[]>(`${this.apiUrl}/${operatorId}/certifications`);
  }

  addCertification(
    operatorId: number,
    data: Partial<OperatorCertification>
  ): Observable<OperatorCertification> {
    return this.http.post<OperatorCertification>(
      `${this.apiUrl}/${operatorId}/certifications`,
      data
    );
  }

  getSkills(operatorId: number): Observable<OperatorSkill[]> {
    return this.http.get<OperatorSkill[]>(`${this.apiUrl}/${operatorId}/skills`);
  }

  addSkill(operatorId: number, data: Partial<OperatorSkill>): Observable<OperatorSkill> {
    return this.http.post<OperatorSkill>(`${this.apiUrl}/${operatorId}/skills`, data);
  }

  searchBySkill(skill: string, projectId?: number): Observable<Operator[]> {
    let params = new HttpParams().set('skill', skill);
    if (projectId) params = params.set('project_id', projectId);
    return this.http.get<Operator[]>(`${this.apiUrl}/search-by-skill`, { params });
  }

  getPerformance(id: number, months?: number): Observable<any> {
    let params = new HttpParams();
    if (months) params = params.set('months', months);
    return this.http.get<any>(`${this.apiUrl}/${id}/performance`, { params });
  }

  notify(operatorId: number, message: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${operatorId}/notify`, { message });
  }
}
