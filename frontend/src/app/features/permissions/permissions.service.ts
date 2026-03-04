import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Permiso {
  id: number;
  proceso: string;
  modulo: string;
  permiso: string;
  is_active: boolean;
}

export interface RolPermiso {
  id: number;
  rol_id: number;
  permiso_id: number;
}

export interface Rol {
  id: number;
  codigo: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/permissions';

  // ─── Permisos ─────────────────────────────────────────────────────────

  getPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(this.baseUrl);
  }

  getPermiso(id: number): Observable<Permiso> {
    return this.http.get<Permiso>(`${this.baseUrl}/${id}`);
  }

  createPermiso(data: Partial<Permiso>): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(this.baseUrl, data);
  }

  updatePermiso(id: number, data: Partial<Permiso>): Observable<Permiso> {
    return this.http.put<Permiso>(`${this.baseUrl}/${id}`, data);
  }

  deletePermiso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ─── Rol-Permiso ──────────────────────────────────────────────────────

  getRolPermisos(rolId: number): Observable<RolPermiso[]> {
    return this.http.get<RolPermiso[]>(`${this.baseUrl}/roles/${rolId}/permisos`);
  }

  assignPermiso(rolId: number, permisoId: number): Observable<RolPermiso> {
    return this.http.post<RolPermiso>(`${this.baseUrl}/roles/${rolId}/permisos`, {
      permiso_id: permisoId,
    });
  }

  revokePermiso(rolId: number, permisoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roles/${rolId}/permisos/${permisoId}`);
  }

  // ─── Roles ────────────────────────────────────────────────────────────

  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>('/api/users/roles');
  }
}
