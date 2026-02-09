import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    // API returns paginated response: {success, data, pagination}
    // Interceptor does NOT unwrap when pagination exists, so we extract data here
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        // Handle both paginated {data: [...]} and direct array responses
        const data =
          response && typeof response === 'object' && 'data' in response
            ? response.data
            : Array.isArray(response)
              ? response
              : [];
        return data;
      })
    );
  }

  getById(id: number): Observable<Operator> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        return response && typeof response === 'object' && 'data' in response
          ? response.data
          : response;
      })
    );
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
    return this.http.get<any>(`${this.apiUrl}/available`).pipe(
      map((response) => {
        const data =
          response && typeof response === 'object' && 'data' in response
            ? response.data
            : Array.isArray(response)
              ? response
              : [];
        return data;
      })
    );
  }

  getCertifications(operatorId: number): Observable<OperatorCertification[]> {
    return this.http.get<any>(`${this.apiUrl}/${operatorId}/certifications`).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      })
    );
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
    return this.http.get<any>(`${this.apiUrl}/${operatorId}/skills`).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      })
    );
  }

  addSkill(operatorId: number, data: Partial<OperatorSkill>): Observable<OperatorSkill> {
    return this.http.post<OperatorSkill>(`${this.apiUrl}/${operatorId}/skills`, data);
  }

  searchBySkill(skill: string, projectId?: number): Observable<Operator[]> {
    let params = new HttpParams().set('skill', skill);
    if (projectId) params = params.set('project_id', projectId);
    return this.http.get<any>(`${this.apiUrl}/search-by-skill`, { params }).pipe(
      map((response) => {
        const data =
          response && typeof response === 'object' && 'data' in response
            ? response.data
            : Array.isArray(response)
              ? response
              : [];
        return data;
      })
    );
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
