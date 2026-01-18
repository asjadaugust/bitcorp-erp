import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../models/project.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  /**
   * Map backend DTO (Spanish snake_case) to frontend model (Spanish camelCase)
   * Backend returns: codigo, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin, estado, presupuesto, cliente
   * Frontend expects: codigo, nombre, descripcion, ubicacion, fechaInicio, fechaFin, estado, presupuesto, cliente
   */
  private mapApiToProject(apiProject: any): Project {
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

  getAll(filters?: any): Observable<Project[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    // Interceptor already unwraps {success, data} -> data
    return this.http
      .get<any[]>(this.apiUrl, { params })
      .pipe(map((data) => data.map((p) => this.mapApiToProject(p))));
  }

  getById(id: string): Observable<Project> {
    // Interceptor already unwraps {success, data} -> data
    return this.http
      .get<any>(`${this.apiUrl}/${id}`)
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
    // Support both Spanish (from Project model) and English (from form) field names
    const apiData = {
      code: (project as any).code || project.codigo,
      name: (project as any).name || project.nombre,
      description: (project as any).description || project.descripcion,
      location: (project as any).location || project.ubicacion,
      start_date: (project as any).startDate || project.fechaInicio,
      end_date: (project as any).endDate || project.fechaFin,
      status: (project as any).status || project.estado,
      budget: (project as any).budget || project.presupuesto,
      client: (project as any).client || project.cliente,
    };
    return this.http
      .post<any>(this.apiUrl, apiData)
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
    // Support both Spanish (from Project model) and English (from form) field names
    const apiData: any = {};

    const code = (project as any).code || project.codigo;
    const name = (project as any).name || project.nombre;
    const description = (project as any).description || project.descripcion;
    const location = (project as any).location || project.ubicacion;
    const startDate = (project as any).startDate || project.fechaInicio;
    const endDate = (project as any).endDate || project.fechaFin;
    const status = (project as any).status || project.estado;
    const budget = (project as any).budget || project.presupuesto;
    const client = (project as any).client || project.cliente;

    if (code) apiData.code = code;
    if (name) apiData.name = name;
    if (description) apiData.description = description;
    if (location) apiData.location = location;
    if (startDate) apiData.start_date = startDate;
    if (endDate) apiData.end_date = endDate;
    if (status) apiData.status = status;
    if (budget) apiData.budget = budget;
    if (client) apiData.client = client;

    return this.http
      .put<any>(`${this.apiUrl}/${id}`, apiData)
      .pipe(map((data) => this.mapApiToProject(data)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
