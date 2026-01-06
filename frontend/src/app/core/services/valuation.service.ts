import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Valuation } from '../models/valuation.model';

@Injectable({
  providedIn: 'root',
})
export class ValuationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/valuations`;

  getAll(filters: any = {}): Observable<Valuation[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.contract_id) params = params.set('contract_id', filters.contract_id);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        // Handle paginated response from backend
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        // Fallback to direct array if not paginated
        return Array.isArray(response) ? response : [];
      })
    );
  }

  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`);
  }

  getById(id: number | string): Observable<Valuation> {
    return this.http.get<Valuation>(`${this.apiUrl}/${id}`);
  }

  create(valuation: Omit<Valuation, 'id'>): Observable<Valuation> {
    return this.http.post<Valuation>(this.apiUrl, valuation);
  }

  update(id: number | string, valuation: Partial<Valuation>): Observable<Valuation> {
    return this.http.put<Valuation>(`${this.apiUrl}/${id}`, valuation);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  calculate(data: { contract_id: string; month: number; year: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/calculate`, data);
  }

  generate(data: { contract_id?: string; month: number; year: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate`, data);
  }

  downloadPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
