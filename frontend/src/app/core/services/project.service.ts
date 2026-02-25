import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../models/project.model';
import { StatsSummary } from '../models/stats.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;
  private http = inject(HttpClient);

  /**
   * Map backend DTO (Spanish snake_case) to frontend model (Spanish camelCase)
   * Backend returns: codigo, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin, estado, presupuesto, cliente
   * Frontend expects: codigo, nombre, descripcion, ubicacion, fechaInicio, fechaFin, estado, presupuesto, cliente
   */
  private mapApiToProject(apiProject: Record<string, unknown>): Project {
    return {
      id: apiProject.id,
      codigo: apiProject.codigo || apiProject.project_code || apiProject.code || '',
      nombre: apiProject.nombre || apiProject.project_name || apiProject.name || '',
      descripcion: apiProject.descripcion || apiProject.description || '',
      ubicacion: apiProject.ubicacion || apiProject.location || '',
      fechaInicio: apiProject.fecha_inicio || apiProject.start_date || '',
      fechaFin: apiProject.fecha_fin || apiProject.end_date || apiProject.estimated_end_date || '',
      estado: apiProject.estado || apiProject.status || 'ACTIVO',
      presupuesto: apiProject.presupuesto || apiProject.budget || apiProject.total_budget || 0,
      cliente: apiProject.cliente || apiProject.client || apiProject.client_name || '',
      isActive:
        apiProject.is_active !== undefined ? apiProject.is_active : apiProject.status === 'ACTIVO',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at,
    };
  }

  getAll(filters?: Record<string, string | number | undefined>): Observable<Project[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    // Interceptor does NOT unwrap paginated responses {success, data, pagination}
    // So we need to extract data ourselves
    return this.http.get<Record<string, unknown>>(this.apiUrl, { params }).pipe(
      map((response) => {
        // Handle paginated response
        const dataArray = response?.data || response;
        if (Array.isArray(dataArray)) {
          return dataArray.map((p) => this.mapApiToProject(p));
        }
        return [];
      })
    );
  }

  getById(id: string): Observable<Project> {
    // Interceptor already unwraps {success, data} -> data
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}`)
      .pipe(map((data) => this.mapApiToProject(data)));
  }

  create(
    project: Partial<Project> & {
      code?: string;
      name?: string;
      client?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      status?: string;
      budget?: number;
      description?: string;
    }
  ): Observable<Project> {
    // Support only Spanish snake_case (from API) replace English camelCase with Spanish snake_case
    const apiData = {
      codigo: (project as Record<string, unknown>).code as string || project.codigo,
      nombre: (project as Record<string, unknown>).name as string || project.nombre,
      descripcion: (project as Record<string, unknown>).description as string || project.descripcion,
      ubicacion: (project as Record<string, unknown>).location as string || project.ubicacion,
      fecha_inicio: (project as Record<string, unknown>).startDate as string || project.fechaInicio,
      fecha_fin: (project as Record<string, unknown>).endDate as string || project.fechaFin,
      estado: (project as Record<string, unknown>).status as string || project.estado,
      presupuesto: (project as Record<string, unknown>).budget as number || project.presupuesto,
      cliente: (project as Record<string, unknown>).client as string || project.cliente,
    };
    return this.http
      .post<Record<string, unknown>>(this.apiUrl, apiData)
      .pipe(map((data) => this.mapApiToProject(data)));
  }

  update(
    id: string,
    project: Partial<Project> & {
      code?: string;
      name?: string;
      client?: string;
      startDate?: string;
      endDate?: string;
      location?: string;
      status?: string;
      budget?: number;
      description?: string;
    }
  ): Observable<Project> {
    // Support only Spanish snake_case (from API) replace English camelCase with Spanish snake_case
    const apiData: Record<string, unknown> = {};

    const code = (project as Record<string, unknown>).code as string || project.codigo;
    const name = (project as Record<string, unknown>).name as string || project.nombre;
    const description = (project as Record<string, unknown>).description as string || project.descripcion;
    const location = (project as Record<string, unknown>).location as string || project.ubicacion;
    const startDate = (project as Record<string, unknown>).startDate as string || project.fechaInicio;
    const endDate = (project as Record<string, unknown>).endDate as string || project.fechaFin;
    const status = (project as Record<string, unknown>).status as string || project.estado;
    const budget = (project as Record<string, unknown>).budget as number || project.presupuesto;
    const client = (project as Record<string, unknown>).client as string || project.cliente;

    // Use !== undefined so empty strings / 0 can clear fields
    if (code !== undefined) apiData.codigo = code;
    if (name !== undefined) apiData.nombre = name;
    if (description !== undefined) apiData.descripcion = description;
    if (location !== undefined) apiData.ubicacion = location;
    if (startDate !== undefined) apiData.fecha_inicio = startDate;
    if (endDate !== undefined) apiData.fecha_fin = endDate;
    if (status !== undefined) apiData.estado = status;
    if (budget !== undefined) apiData.presupuesto = budget;
    if (client !== undefined) apiData.cliente = client;

    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, apiData)
      .pipe(map((data) => this.mapApiToProject(data)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(filters?: { startDate?: string; endDate?: string }): Observable<StatsSummary> {
    let params = new HttpParams();
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);

    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/stats`, { params })
      .pipe(map((response) => response?.data || response));
  }
}
