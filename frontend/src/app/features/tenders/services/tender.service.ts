import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export type EstadoLicitacion = 'PUBLICADO' | 'EVALUACION' | 'ADJUDICADO' | 'DESIERTO' | 'CANCELADO';

export interface Tender {
  id: number;
  legacyId?: string;
  codigo: string;
  nombre: string;
  entidadConvocante: string;
  montoReferencial: number;
  fechaConvocatoria?: Date | string;
  fechaPresentacion?: Date | string;
  estado: EstadoLicitacion;
  observaciones?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

@Injectable({
  providedIn: 'root',
})
export class TenderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tenders`;

  getTenders(): Observable<Tender[]> {
    return this.http.get<Tender[]>(this.apiUrl);
  }

  getTender(id: string | number): Observable<Tender> {
    return this.http.get<Tender>(`${this.apiUrl}/${id}`);
  }

  createTender(tender: Partial<Tender>): Observable<Tender> {
    return this.http.post<Tender>(this.apiUrl, tender);
  }

  updateTender(id: string | number, tender: Partial<Tender>): Observable<Tender> {
    return this.http.put<Tender>(`${this.apiUrl}/${id}`, tender);
  }

  deleteTender(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
