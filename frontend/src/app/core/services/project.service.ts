import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Project } from '../models/project.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = '/api/projects';

  constructor(private http: HttpClient) {}

  private mapApiToProject(apiProject: any): Project {
    return {
      id: apiProject.id,
      codigo: apiProject.project_code || apiProject.code || '',
      nombre: apiProject.project_name || apiProject.name || '',
      descripcion: apiProject.description || '',
      ubicacion: apiProject.location || '',
      fechaInicio: apiProject.start_date || '',
      fechaFin: apiProject.end_date || apiProject.estimated_end_date || '',
      estado: apiProject.status || 'ACTIVO',
      presupuesto: apiProject.budget || apiProject.total_budget || 0,
      cliente: apiProject.client || apiProject.client_name || '',
      isActive: apiProject.status === 'ACTIVO',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at
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
    return this.http.get<ApiResponse<any[]> | any[]>(this.apiUrl, { params }).pipe(
      map(response => {
        const data = Array.isArray(response) ? response : (response.data || []);
        return data.map(p => this.mapApiToProject(p));
      })
    );
  }

  getById(id: string): Observable<Project> {
    return this.http.get<ApiResponse<any> | any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const data = response.data || response;
        return this.mapApiToProject(data);
      })
    );
  }

  create(project: Partial<Project>): Observable<Project> {
    const apiData = {
      project_code: project.codigo,
      project_name: project.nombre,
      description: project.descripcion,
      location: project.ubicacion,
      start_date: project.fechaInicio,
      end_date: project.fechaFin,
      status: project.estado,
      budget: project.presupuesto,
      client: project.cliente
    };
    return this.http.post<ApiResponse<any> | any>(this.apiUrl, apiData).pipe(
      map(response => this.mapApiToProject(response.data || response))
    );
  }

  update(id: string, project: Partial<Project>): Observable<Project> {
    const apiData: any = {};
    if (project.codigo) apiData.project_code = project.codigo;
    if (project.nombre) apiData.project_name = project.nombre;
    if (project.descripcion) apiData.description = project.descripcion;
    if (project.ubicacion) apiData.location = project.ubicacion;
    if (project.fechaInicio) apiData.start_date = project.fechaInicio;
    if (project.fechaFin) apiData.end_date = project.fechaFin;
    if (project.estado) apiData.status = project.estado;
    if (project.presupuesto) apiData.budget = project.presupuesto;
    if (project.cliente) apiData.client = project.cliente;

    return this.http.put<ApiResponse<any> | any>(`${this.apiUrl}/${id}`, apiData).pipe(
      map(response => this.mapApiToProject(response.data || response))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
