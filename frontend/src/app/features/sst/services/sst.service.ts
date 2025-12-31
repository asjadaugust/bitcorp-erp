import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface SafetyIncident {
  id: string;
  date: Date;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  location: string;
  reportedBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SstService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sst`;

  getIncidents(): Observable<SafetyIncident[]> {
    return this.http.get<SafetyIncident[]>(`${this.apiUrl}/incidents`);
  }

  getIncident(id: string): Observable<SafetyIncident> {
    return this.http.get<SafetyIncident>(`${this.apiUrl}/incidents/${id}`);
  }

  createIncident(incident: Partial<SafetyIncident>): Observable<SafetyIncident> {
    return this.http.post<SafetyIncident>(`${this.apiUrl}/incidents`, incident);
  }

  updateIncident(id: string, incident: Partial<SafetyIncident>): Observable<SafetyIncident> {
    return this.http.put<SafetyIncident>(`${this.apiUrl}/incidents/${id}`, incident);
  }

  deleteIncident(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/incidents/${id}`);
  }
}
