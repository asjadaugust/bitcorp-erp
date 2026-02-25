import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FuelRecord, FuelListResponse } from '../models/fuel-record.model';

@Injectable({
  providedIn: 'root',
})
export class FuelService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fuel`;

  getAll(filters: Record<string, string | number | undefined> = {}): Observable<FuelListResponse> {
    let params = new HttpParams();
    if (filters['search']) params = params.set('search', filters['search']);
    if (filters['valorizacionId']) params = params.set('valorizacionId', filters['valorizacionId']);
    if (filters['startDate']) params = params.set('startDate', filters['startDate']);
    if (filters['endDate']) params = params.set('endDate', filters['endDate']);
    if (filters['tipoCombustible']) params = params.set('tipoCombustible', filters['tipoCombustible']);
    if (filters['page']) params = params.set('page', filters['page'].toString());
    if (filters['limit']) params = params.set('limit', filters['limit'].toString());

    return this.http.get<FuelListResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<FuelRecord> {
    // Interceptor already unwraps {success, data} -> data
    return this.http.get<FuelRecord>(`${this.apiUrl}/${id}`);
  }

  create(record: Omit<FuelRecord, 'id'>): Observable<FuelRecord> {
    // Interceptor already unwraps {success, data} -> data
    return this.http.post<FuelRecord>(this.apiUrl, record);
  }

  update(id: number, record: Partial<FuelRecord>): Observable<FuelRecord> {
    // Interceptor already unwraps {success, data} -> data
    return this.http.put<FuelRecord>(`${this.apiUrl}/${id}`, record);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
