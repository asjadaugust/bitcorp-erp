import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export type EstadoDocumento = 'VIGENTE' | 'OBSOLETO' | 'EN_REVISION' | 'ANULADO';

export interface SigDocument {
  id: number;
  legacyId?: string;
  codigo: string;
  titulo: string;
  tipoDocumento?: string;
  isoStandard?: string;
  version?: string;
  fechaEmision?: Date | string;
  fechaRevision?: Date | string;
  archivoUrl?: string;
  estado: EstadoDocumento;
  creadoPor?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Relations
  creador?: {
    id: number;
    full_name: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SigService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sig`;

  getDocumentsPaginated(params?: {
    page?: number;
    limit?: number;
    tipo?: string;
    estado?: string;
  }): Observable<PaginatedResponse<SigDocument>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.tipo) httpParams = httpParams.set('tipo', params.tipo);
    if (params?.estado) httpParams = httpParams.set('estado', params.estado);
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/documents`, { params: httpParams })
      .pipe(
        map((response) => {
          const data = (response?.['data'] ?? response) as SigDocument[];
          const pagination = (response?.[
            'pagination'
          ] as PaginatedResponse<SigDocument>['pagination']) ?? {
            page: 1,
            limit: params?.limit ?? 20,
            total: Array.isArray(data) ? data.length : 0,
            total_pages: 1,
          };
          return { data: Array.isArray(data) ? data : [], pagination };
        })
      );
  }

  getDocuments(): Observable<SigDocument[]> {
    return this.http.get<SigDocument[]>(`${this.apiUrl}/documents`);
  }

  getDocument(id: string | number): Observable<SigDocument> {
    return this.http.get<SigDocument>(`${this.apiUrl}/documents/${id}`);
  }

  createDocument(document: Partial<SigDocument>): Observable<SigDocument> {
    return this.http.post<SigDocument>(`${this.apiUrl}/documents`, document);
  }

  updateDocument(id: string | number, document: Partial<SigDocument>): Observable<SigDocument> {
    return this.http.put<SigDocument>(`${this.apiUrl}/documents/${id}`, document);
  }

  deleteDocument(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/documents/${id}`);
  }
}
