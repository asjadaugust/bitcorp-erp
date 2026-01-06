import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

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
