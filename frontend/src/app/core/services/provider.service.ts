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
      ruc: provider.tax_id,
      razon_social: provider.business_name,
      nombre_comercial: provider.commercial_name,
      tipo_proveedor: provider.provider_type,
      direccion: provider.address,
      telefono: provider.phone,
      email: provider.email,
      contacto_principal: provider.contact_name,
      condiciones_pago: provider.payment_terms,
      // Map other fields if necessary
    };
    return this.http.post<Provider>(this.apiUrl, payload);
  }

  update(id: number | string, provider: Partial<Provider>): Observable<Provider> {
    const payload: any = {};
    if (provider.tax_id) payload.ruc = provider.tax_id;
    if (provider.business_name) payload.razon_social = provider.business_name;
    if (provider.commercial_name) payload.nombre_comercial = provider.commercial_name;
    if (provider.provider_type) payload.tipo_proveedor = provider.provider_type;
    if (provider.address) payload.direccion = provider.address;
    if (provider.phone) payload.telefono = provider.phone;
    if (provider.email) payload.email = provider.email;
    if (provider.contact_name) payload.contacto_principal = provider.contact_name;
    if (provider.payment_terms) payload.condiciones_pago = provider.payment_terms;
    
    return this.http.put<Provider>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
