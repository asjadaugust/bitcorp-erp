import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface SigDocument {
  id: string;
  title: string;
  code: string;
  category: 'Quality' | 'Environment' | 'Safety';
  fileUrl: string;
  version: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SigService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sig`;

  getDocuments(): Observable<SigDocument[]> {
    return this.http.get<SigDocument[]>(`${this.apiUrl}/documents`);
  }

  getDocument(id: string): Observable<SigDocument> {
    return this.http.get<SigDocument>(`${this.apiUrl}/documents/${id}`);
  }

  createDocument(document: Partial<SigDocument>): Observable<SigDocument> {
    return this.http.post<SigDocument>(`${this.apiUrl}/documents`, document);
  }

  updateDocument(id: string, document: Partial<SigDocument>): Observable<SigDocument> {
    return this.http.put<SigDocument>(`${this.apiUrl}/documents/${id}`, document);
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/documents/${id}`);
  }
}
