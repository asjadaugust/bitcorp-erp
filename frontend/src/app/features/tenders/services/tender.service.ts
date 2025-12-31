import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface Tender {
  id: string;
  title: string;
  client: string;
  submissionDeadline: Date;
  status: 'Open' | 'Submitted' | 'Won' | 'Lost';
  budget: number;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TenderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tenders`;

  getTenders(): Observable<Tender[]> {
    return this.http.get<Tender[]>(this.apiUrl);
  }

  getTender(id: string): Observable<Tender> {
    return this.http.get<Tender>(`${this.apiUrl}/${id}`);
  }

  createTender(tender: Partial<Tender>): Observable<Tender> {
    return this.http.post<Tender>(this.apiUrl, tender);
  }

  updateTender(id: string, tender: Partial<Tender>): Observable<Tender> {
    return this.http.put<Tender>(`${this.apiUrl}/${id}`, tender);
  }

  deleteTender(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
