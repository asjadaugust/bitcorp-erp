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

  /**
   * Maps API response to frontend Operator model
   * API returns Spanish snake_case (e.g., apellido_paterno, fecha_ingreso, is_active)
   * We now directly use the API fields without transformation
   */
  private mapOperator(apiOp: any): Operator {
    return {
      id: apiOp.id,
      legacy_id: apiOp.legacy_id,
      dni: apiOp.dni,
      nombres: apiOp.nombres,
      apellido_paterno: apiOp.apellido_paterno,
      apellido_materno: apiOp.apellido_materno,
      nombre_completo: apiOp.nombre_completo,
      fecha_nacimiento: apiOp.fecha_nacimiento,
      correo_electronico: apiOp.correo_electronico,
      telefono: apiOp.telefono,
      direccion: apiOp.direccion,
      fecha_ingreso: apiOp.fecha_ingreso,
      fecha_cese: apiOp.fecha_cese,
      tipo_contrato: apiOp.tipo_contrato,
      cargo: apiOp.cargo,
      especialidad: apiOp.especialidad,
      licencia_conducir: apiOp.licencia_conducir,
      operating_unit_id: apiOp.operating_unit_id,
      is_active: apiOp.is_active,
      created_at: apiOp.created_at,
      updated_at: apiOp.updated_at,
    };
  }

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
        return data.map((op: any) => this.mapOperator(op));
      })
    );
  }

  getById(id: number): Observable<Operator> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        const data =
          response && typeof response === 'object' && 'data' in response ? response.data : response;
        return this.mapOperator(data);
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
        return data.map((op: any) => this.mapOperator(op));
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
        return data.map((op: any) => this.mapOperator(op));
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
