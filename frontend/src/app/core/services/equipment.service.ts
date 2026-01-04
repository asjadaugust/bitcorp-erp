import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Equipment, EquipmentListResponse, EquipmentResponse } from '../models/equipment.model';

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
    return this.http.get<EquipmentListResponse>(this.apiUrl, { params });
  }

  getById(id: string | number): Observable<Equipment> {
    return this.http
      .get<EquipmentResponse>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  create(data: Partial<Equipment>): Observable<Equipment> {
    return this.http
      .post<EquipmentResponse>(this.apiUrl, data)
      .pipe(map((response) => response.data));
  }

  update(id: string | number, data: Partial<Equipment>): Observable<Equipment> {
    return this.http
      .put<EquipmentResponse>(`${this.apiUrl}/${id}`, data)
      .pipe(map((response) => response.data));
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAvailable(): Observable<Equipment[]> {
    return this.http
      .get<EquipmentResponse>(`${this.apiUrl}/available`)
      .pipe(map((response) => response.data as any));
  }

  getStatistics(): Observable<any> {
    return this.http
      .get<{ success: true; data: any }>(`${this.apiUrl}/statistics`)
      .pipe(map((response) => response.data));
  }
}
