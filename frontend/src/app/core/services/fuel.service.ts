import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FuelRecord, FuelListResponse, FuelResponse } from '../models/fuel-record.model';

@Injectable({
  providedIn: 'root',
})
export class FuelService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fuel`;

  getAll(filters: any = {}): Observable<FuelListResponse> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.valorizacionId) params = params.set('valorizacionId', filters.valorizacionId);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.tipoCombustible) params = params.set('tipoCombustible', filters.tipoCombustible);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<FuelListResponse>(this.apiUrl, { params });
  }

  getById(id: number): Observable<FuelRecord> {
    return this.http
      .get<FuelResponse>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  create(record: Omit<FuelRecord, 'id'>): Observable<FuelRecord> {
    return this.http.post<FuelResponse>(this.apiUrl, record).pipe(map((response) => response.data));
  }

  update(id: number, record: Partial<FuelRecord>): Observable<FuelRecord> {
    return this.http
      .put<FuelResponse>(`${this.apiUrl}/${id}`, record)
      .pipe(map((response) => response.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
