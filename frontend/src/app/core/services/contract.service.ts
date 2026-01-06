import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Contract } from '../models/contract.model';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/contracts`;

  getAll(filters: any = {}): Observable<Contract[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.equipmentId) params = params.set('equipmentId', filters.equipmentId);

    // API might return paginated response: {success, data, pagination}
    // Extract data array if it exists, otherwise return as-is
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return Array.isArray(response) ? response : [];
      })
    );
  }

  getById(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`);
  }

  create(contract: Omit<Contract, 'id'>): Observable<Contract> {
    return this.http.post<Contract>(this.apiUrl, contract);
  }

  update(id: string, contract: Partial<Contract>): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${id}`, contract);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAddendums(contractId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${contractId}/addendums`);
  }

  createAddendum(contractId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${contractId}/addendums`, data);
  }

  downloadPdf(contractId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${contractId}/pdf`, { responseType: 'blob' });
  }
}
