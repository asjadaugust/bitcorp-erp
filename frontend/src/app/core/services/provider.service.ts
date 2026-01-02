import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Provider } from '../models/provider.model';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/providers`;

  getAll(filters: any = {}): Observable<Provider[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get<Provider[]>(this.apiUrl, { params });
  }

  getById(id: number | string): Observable<Provider> {
    return this.http.get<Provider>(`${this.apiUrl}/${id}`);
  }

  create(provider: Omit<Provider, 'id'>): Observable<Provider> {
    const payload = {
      ruc: provider.ruc,
      razon_social: provider.razon_social,
      nombre_comercial: provider.nombre_comercial,
      tipo_proveedor: provider.tipo_proveedor,
      direccion: provider.direccion,
      telefono: provider.telefono,
      email: provider.email,
      // Map other fields if necessary
    };
    return this.http.post<Provider>(this.apiUrl, payload);
  }

  update(id: number | string, provider: Partial<Provider>): Observable<Provider> {
    const payload: any = {};
    if (provider.ruc) payload.ruc = provider.ruc;
    if (provider.razon_social) payload.razon_social = provider.razon_social;
    if (provider.nombre_comercial) payload.nombre_comercial = provider.nombre_comercial;
    if (provider.tipo_proveedor) payload.tipo_proveedor = provider.tipo_proveedor;
    if (provider.direccion) payload.direccion = provider.direccion;
    if (provider.telefono) payload.telefono = provider.telefono;
    if (provider.email) payload.email = provider.email;
    if (provider.is_active !== undefined) payload.is_active = provider.is_active;
    
    return this.http.put<Provider>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
