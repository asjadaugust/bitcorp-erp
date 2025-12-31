import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FuelRecord } from '../models/fuel-record.model';

@Injectable({
  providedIn: 'root',
})
export class FuelService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fuel`;

  getAll(filters: any = {}): Observable<FuelRecord[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.equipment_id) params = params.set('equipment_id', filters.equipment_id);
    if (filters.start_date) params = params.set('start_date', filters.start_date);
    if (filters.end_date) params = params.set('end_date', filters.end_date);

    return this.http.get<FuelRecord[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<FuelRecord> {
    return this.http.get<FuelRecord>(`${this.apiUrl}/${id}`);
  }

  create(record: Omit<FuelRecord, 'id'>): Observable<FuelRecord> {
    const payload = {
      ...record,
      fueling_date: record.date,
    };
    return this.http.post<FuelRecord>(this.apiUrl, payload);
  }

  update(id: number, record: Partial<FuelRecord>): Observable<FuelRecord> {
    const payload: any = { ...record };
    if (record.date) {
      payload.fueling_date = record.date;
    }
    return this.http.put<FuelRecord>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
