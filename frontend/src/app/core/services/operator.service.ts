import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Operator,
  CreateOperatorDto,
  OperatorCertification,
  OperatorSkill,
  OperatorDisponibilidad,
  OperatorRendimiento,
  DisponibilidadProgramada,
} from '../models/operator.model';

import { environment } from '../../../environments/environment';

// Generic API wrapper shape returned by the backend
interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

@Injectable({ providedIn: 'root' })
export class OperatorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/operators`;

  getAllPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    estado?: string;
    proyecto_id?: number;
  }): Observable<PaginatedResponse<Operator>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.estado) httpParams = httpParams.set('status', params.estado);
    if (params?.proyecto_id)
      httpParams = httpParams.set('proyecto_id', params.proyecto_id.toString());
    return this.http.get<ApiResponse<Operator[]>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        const data = (response && 'data' in response ? response.data : response) as Operator[];
        const pagination = (response?.[
          'pagination'
        ] as PaginatedResponse<Operator>['pagination']) ?? {
          page: 1,
          limit: params?.limit ?? 20,
          total: Array.isArray(data) ? data.length : 0,
          total_pages: 1,
        };
        return { data: Array.isArray(data) ? data : [], pagination };
      })
    );
  }

  getAll(filters?: Record<string, string | number | undefined>): Observable<Operator[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined) params = params.set(key, String(filters[key]));
      });
    }
    // API returns paginated response: {success, data, pagination}
    // Interceptor does NOT unwrap when pagination exists, so we extract data here
    return this.http.get<ApiResponse<Operator[]>>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data as Operator[];
        }
        return Array.isArray(response) ? (response as unknown as Operator[]) : [];
      })
    );
  }

  getById(id: number): Observable<Operator> {
    return this.http.get<ApiResponse<Operator>>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data as Operator;
        }
        return response as unknown as Operator;
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
    return this.http.get<ApiResponse<Operator[]>>(`${this.apiUrl}/available`).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data as Operator[];
        }
        return Array.isArray(response) ? (response as unknown as Operator[]) : [];
      })
    );
  }

  getCertifications(operatorId: number): Observable<OperatorCertification[]> {
    return this.http
      .get<ApiResponse<OperatorCertification[]>>(`${this.apiUrl}/${operatorId}/certifications`)
      .pipe(
        map((response) => {
          if (response && typeof response === 'object' && 'data' in response) {
            return response.data as OperatorCertification[];
          }
          return Array.isArray(response) ? (response as unknown as OperatorCertification[]) : [];
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
    return this.http.get<ApiResponse<OperatorSkill[]>>(`${this.apiUrl}/${operatorId}/skills`).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data as OperatorSkill[];
        }
        return Array.isArray(response) ? (response as unknown as OperatorSkill[]) : [];
      })
    );
  }

  addSkill(operatorId: number, data: Partial<OperatorSkill>): Observable<OperatorSkill> {
    return this.http.post<OperatorSkill>(`${this.apiUrl}/${operatorId}/skills`, data);
  }

  searchBySkill(skill: string, projectId?: number): Observable<Operator[]> {
    let params = new HttpParams().set('skill', skill);
    if (projectId) params = params.set('project_id', projectId);
    return this.http
      .get<ApiResponse<Operator[]>>(`${this.apiUrl}/search-by-skill`, { params })
      .pipe(
        map((response) => {
          if (response && typeof response === 'object' && 'data' in response) {
            return response.data as Operator[];
          }
          return Array.isArray(response) ? (response as unknown as Operator[]) : [];
        })
      );
  }

  getPerformance(id: number, dias?: number): Observable<OperatorRendimiento> {
    let params = new HttpParams();
    if (dias !== undefined) params = params.set('dias', dias);
    return this.http.get<OperatorRendimiento>(`${this.apiUrl}/${id}/performance`, { params });
  }

  getAvailability(id: number): Observable<OperatorDisponibilidad> {
    return this.http.get<OperatorDisponibilidad>(`${this.apiUrl}/${id}/availability`);
  }

  notify(operatorId: number, message: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${operatorId}/notify`, { message });
  }

  getProgramacionMensual(mesAnio: string): Observable<DisponibilidadProgramada[]> {
    return this.http.get<DisponibilidadProgramada[]>(`${this.apiUrl}/programacion`, {
      params: { mes: mesAnio },
    });
  }

  setDisponibilidad(
    operadorId: number,
    fecha: string,
    disponible: boolean,
    observacion?: string
  ): Observable<DisponibilidadProgramada> {
    return this.http.post<DisponibilidadProgramada>(`${this.apiUrl}/${operadorId}/disponibilidad`, {
      fecha,
      disponible,
      observacion,
    });
  }
}
