import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface BackendModule {
  id: string;
  codigo: string;
  nombre_es: string;
  nombre_en?: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  nivel: number;
  orden: number;
  parent_id?: string;
  is_active: boolean;
  permissions: {
    puede_ver: boolean;
    puede_crear: boolean;
    puede_editar: boolean;
    puede_eliminar: boolean;
    puede_aprobar: boolean;
  };
  pages?: any[];
}

export interface BackendUserInfo {
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    roles: string[];
  };
  active_project: any;
  assigned_projects: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Get modules with permissions for the current user */
  getModules(): Observable<{ success: boolean; data: BackendModule[] }> {
    return this.http.get<{ success: boolean; data: BackendModule[] }>(
      `${this.baseUrl}/dashboard/modules`
    );
  }

  /** Get current user information and project assignments */
  getUserInfo(): Observable<{ success: boolean; data: BackendUserInfo }> {
    return this.http.get<{ success: boolean; data: BackendUserInfo }>(
      `${this.baseUrl}/dashboard/user-info`
    );
  }

  /** Switch active project */
  switchProject(project_id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/dashboard/switch-project`, { project_id });
  }

  /** Get dashboard statistics */
  getStats(project_id?: string): Observable<any> {
    const params: any = {};
    if (project_id) {
      params.project_id = project_id;
    }
    return this.http.get(`${this.baseUrl}/dashboard/stats`, { params });
  }
}
