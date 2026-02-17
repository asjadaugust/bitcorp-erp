import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Provider } from '../models/provider.model';
import { ProviderDocument } from '../models/provider-document.model';

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
      correo_electronico: apiData.correo_electronico,
      is_active: apiData.is_active,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
    };
  }

  getAll(filters: any = {}): Observable<Provider[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);

    // For dropdowns, request all providers (up to 100 max)
    // This ensures dropdowns show all available options
    if (!filters.limit) {
      params = params.set('limit', '100');
    } else {
      params = params.set('limit', filters.limit.toString());
    }

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        // Handle paginated response format: { success: true, data: [], pagination: {...} }
        const providers = response.data || response;

        // Handle empty array or null
        if (!Array.isArray(providers)) {
          return [];
        }

        return providers.map((p: any) => this.mapApiToProvider(p));
      })
    );
  }

  getById(id: number | string): Observable<Provider> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        // Handle wrapped response format: { success: true, data: {...} }
        const provider = response.data || response;
        return this.mapApiToProvider(provider);
      })
    );
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
      correo_electronico: provider.correo_electronico,
      is_active: provider.is_active !== undefined ? provider.is_active : true,
    };
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((response) => {
        // Handle wrapped response format: { success: true, data: {...} }
        const provider = response.data || response;
        return this.mapApiToProvider(provider);
      })
    );
  }

  update(id: number | string, provider: Partial<Provider>): Observable<Provider> {
    // Send Spanish snake_case to backend
    // Use !== undefined so empty strings can clear fields
    const payload: any = {};
    if (provider.ruc !== undefined) payload.ruc = provider.ruc;
    if (provider.razon_social !== undefined) payload.razon_social = provider.razon_social;
    if (provider.nombre_comercial !== undefined)
      payload.nombre_comercial = provider.nombre_comercial;
    if (provider.tipo_proveedor !== undefined) payload.tipo_proveedor = provider.tipo_proveedor;
    if (provider.direccion !== undefined) payload.direccion = provider.direccion;
    if (provider.telefono !== undefined) payload.telefono = provider.telefono;
    if (provider.correo_electronico !== undefined)
      payload.correo_electronico = provider.correo_electronico;
    if (provider.is_active !== undefined) payload.is_active = provider.is_active;

    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map((response) => {
        // Handle wrapped response format: { success: true, data: {...} }
        const provider = response.data || response;
        return this.mapApiToProvider(provider);
      })
    );
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAuditLogs(id: number | string): Observable<any[]> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}/logs`)
      .pipe(map((response) => response.data || response));
  }

  lookupRuc(ruc: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/ruc/${ruc}/lookup`)
      .pipe(map((response) => response.data || response));
  }

  getDocuments(providerId: number | string): Observable<ProviderDocument[]> {
    return this.http
      .get<any>(`${this.apiUrl}/${providerId}/documents`)
      .pipe(map((response) => response.data || response));
  }

  createDocument(
    providerId: number | string,
    document: Partial<ProviderDocument>
  ): Observable<ProviderDocument> {
    return this.http
      .post<any>(`${this.apiUrl}/${providerId}/documents`, document)
      .pipe(map((response) => response.data || response));
  }

  updateDocument(
    id: number | string,
    document: Partial<ProviderDocument>
  ): Observable<ProviderDocument> {
    return this.http
      .put<any>(`${this.apiUrl}/documents/${id}`, document)
      .pipe(map((response) => response.data || response));
  }

  deleteDocument(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/documents/${id}`);
  }

  uploadDocumentFile(
    file: File
  ): Observable<{
    url: string;
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<any>(`${this.apiUrl}/documents/upload`, formData)
      .pipe(map((response) => response.data || response));
  }
}
