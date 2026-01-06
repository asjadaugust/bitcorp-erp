import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Provider } from '../models/provider.model';

/**
 * Provider Service with DTO mapping
 *
 * Following ARCHITECTURE.md guidelines:
 * - Backend returns Spanish snake_case field names
 * - Frontend uses English camelCase (Provider model)
 * - Service maps between formats
 */
@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/providers`;

  /**
   * Map API response (Spanish snake_case) to frontend model (English camelCase)
   */
  private mapApiToProvider(apiData: any): Provider {
    return {
      id: apiData.id,
      legacy_id: apiData.legacy_id,
      ruc: apiData.ruc,
      razon_social: apiData.razon_social,
      nombre_comercial: apiData.nombre_comercial,
      tipo_proveedor: apiData.tipo_proveedor,
      direccion: apiData.direccion,
      telefono: apiData.telefono,
      email: apiData.email,
      is_active: apiData.is_active,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
    };
  }

  getAll(filters: any = {}): Observable<Provider[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);

    return this.http
      .get<any[]>(this.apiUrl, { params })
      .pipe(map((providers) => providers.map((p) => this.mapApiToProvider(p))));
  }

  getById(id: number | string): Observable<Provider> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`)
      .pipe(map((provider) => this.mapApiToProvider(provider)));
  }

  create(provider: Omit<Provider, 'id'>): Observable<Provider> {
    // Send Spanish snake_case to backend
    const payload = {
      ruc: provider.ruc,
      razon_social: provider.razon_social,
      nombre_comercial: provider.nombre_comercial,
      tipo_proveedor: provider.tipo_proveedor,
      direccion: provider.direccion,
      telefono: provider.telefono,
      email: provider.email,
    };
    return this.http
      .post<any>(this.apiUrl, payload)
      .pipe(map((provider) => this.mapApiToProvider(provider)));
  }

  update(id: number | string, provider: Partial<Provider>): Observable<Provider> {
    // Send Spanish snake_case to backend
    const payload: any = {};
    if (provider.ruc) payload.ruc = provider.ruc;
    if (provider.razon_social) payload.razon_social = provider.razon_social;
    if (provider.nombre_comercial) payload.nombre_comercial = provider.nombre_comercial;
    if (provider.tipo_proveedor) payload.tipo_proveedor = provider.tipo_proveedor;
    if (provider.direccion) payload.direccion = provider.direccion;
    if (provider.telefono) payload.telefono = provider.telefono;
    if (provider.email) payload.email = provider.email;
    if (provider.is_active !== undefined) payload.is_active = provider.is_active;

    return this.http
      .put<any>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((provider) => this.mapApiToProvider(provider)));
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
