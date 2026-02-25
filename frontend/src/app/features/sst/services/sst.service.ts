import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  providedIn: 'root',
})
export class SstService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sst`;

  getIncidents(): Observable<SafetyIncident[]> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/incidents`).pipe(
      map((response) => {
        const dataArray = (response as any)?.data || response;
        if (Array.isArray(dataArray)) {
          return dataArray.map((item) => this.mapApiToIncident(item));
        }
        return [];
      })
    );
  }

  getIncident(id: string): Observable<SafetyIncident> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/incidents/${id}`).pipe(
      map((response) => {
        const data = (response as any)?.data || response;
        return this.mapApiToIncident(data as Record<string, unknown>);
      })
    );
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

  /**
   * Map API snake_case response to camelCase SafetyIncident model
   */
  private mapApiToIncident(apiData: Record<string, unknown>): SafetyIncident {
    return {
      id: (apiData['id'] as number | undefined)?.toString() || (apiData['legacy_id'] as string),
      date: new Date(
        (apiData['fecha_incidente'] || apiData['date'] || apiData['created_at']) as string
      ),
      description: (apiData['descripcion'] as string) || (apiData['description'] as string) || '',
      severity: this.mapSeverity((apiData['severidad'] || apiData['severity']) as string),
      location: (apiData['ubicacion'] as string) || (apiData['location'] as string) || '',
      reportedBy: apiData['reportado_por']
        ? {
            firstName: 'Usuario',
            lastName: `#${apiData['reportado_por']}`,
          }
        : undefined,
      createdAt: new Date((apiData['created_at'] || apiData['createdAt']) as string),
    };
  }

  /**
   * Map Spanish severity levels to English
   */
  private mapSeverity(severity: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const severityMap: { [key: string]: 'Low' | 'Medium' | 'High' | 'Critical' } = {
      BAJA: 'Low',
      Baja: 'Low',
      Low: 'Low',
      MEDIA: 'Medium',
      Media: 'Medium',
      Medium: 'Medium',
      GRAVE: 'High',
      Grave: 'High',
      High: 'High',
      MUY_GRAVE: 'Critical',
      'Muy Grave': 'Critical',
      Critical: 'Critical',
    };
    return severityMap[severity] || 'Low';
  }
}
