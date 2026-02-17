import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ManagedUser,
  CreateUserRequest,
  UpdateUserRequest,
  RoleOption,
} from '../../../core/models/managed-user.model';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getAll(filters?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<ManagedUser>> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ApiResponse<ManagedUser[]>>(this.apiUrl, { params }).pipe(
      map((response) => ({
        data: response.data || [],
        pagination: response.pagination || { page: 1, limit: 10, total: 0, total_pages: 0 },
      }))
    );
  }

  getById(id: number): Observable<ManagedUser> {
    return this.http
      .get<ApiResponse<ManagedUser>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => (response.data ? response.data : (response as unknown as ManagedUser)))
      );
  }

  create(data: CreateUserRequest): Observable<ManagedUser> {
    return this.http
      .post<ApiResponse<ManagedUser>>(this.apiUrl, data)
      .pipe(
        map((response) => (response.data ? response.data : (response as unknown as ManagedUser)))
      );
  }

  update(id: number, data: UpdateUserRequest): Observable<ManagedUser> {
    return this.http
      .put<ApiResponse<ManagedUser>>(`${this.apiUrl}/${id}`, data)
      .pipe(
        map((response) => (response.data ? response.data : (response as unknown as ManagedUser)))
      );
  }

  changePassword(id: number, newPassword: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.patch<ApiResponse<{ message: string }>>(`${this.apiUrl}/${id}/password`, {
      new_password: newPassword,
    });
  }

  toggleActive(id: number): Observable<ManagedUser> {
    return this.http
      .patch<ApiResponse<ManagedUser>>(`${this.apiUrl}/${id}/toggle-active`, {})
      .pipe(
        map((response) => (response.data ? response.data : (response as unknown as ManagedUser)))
      );
  }

  getRoles(): Observable<RoleOption[]> {
    return this.http
      .get<ApiResponse<RoleOption[]>>(`${this.apiUrl}/roles`)
      .pipe(
        map((response) => (response.data ? response.data : (response as unknown as RoleOption[])))
      );
  }
}
