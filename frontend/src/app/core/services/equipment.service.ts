import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Equipment, EquipmentListResponse } from '../models/equipment.model';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/equipment`;

  getAll(filters?: any): Observable<EquipmentListResponse> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }

    // For equipment list/dropdowns, request all items (up to 100 max by backend)
    // This prevents pagination cutting off equipment visibility in lists
    if (!filters?.limit) {
      params = params.set('limit', '100');
    }

    return this.http.get<EquipmentListResponse>(this.apiUrl, { params });
  }

  getById(id: string | number): Observable<Equipment> {
    // Interceptor already unwraps { success: true, data: equipment } to equipment
    return this.http.get<Equipment>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Equipment>): Observable<Equipment> {
    // Interceptor already unwraps { success: true, data: equipment } to equipment
    return this.http.post<Equipment>(this.apiUrl, data);
  }

  update(id: string | number, data: Partial<Equipment>): Observable<Equipment> {
    // Interceptor already unwraps { success: true, data: equipment } to equipment
    return this.http.put<Equipment>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAvailable(): Observable<Equipment[]> {
    // Interceptor already unwraps { success: true, data: [...] } to [...]
    return this.http.get<Equipment[]>(`${this.apiUrl}/available`);
  }

  getStatistics(): Observable<any> {
    // Interceptor already unwraps { success: true, data: stats } to stats
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }
}
