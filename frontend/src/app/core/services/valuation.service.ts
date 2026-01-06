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

  /**
   * Map backend DTO (Spanish snake_case) to frontend model
   * Backend uses: equipo_id, contrato_id, proyecto_id, estado (PENDIENTE/APROBADO/RECHAZADO/PAGADO)
   * Frontend uses: contract_id, period_start, period_end, amount, status (lowercase)
   */
  private mapBackendToFrontend(backendData: any): Valuation {
    return {
      id: backendData.id,
      contract_id: backendData.contrato_id || backendData.contract_id,
      period_start: backendData.fecha_inicio || backendData.period_start,
      period_end: backendData.fecha_fin || backendData.period_end,
      amount: backendData.total_valorizado || backendData.amount || 0,
      base_amount: backendData.costo_base || backendData.base_amount,
      overtime_amount: backendData.cargos_adicionales || backendData.overtime_amount,
      fuel_amount: backendData.costo_combustible || backendData.fuel_amount,
      status: this.mapEstadoBackendToFrontend(backendData.estado || backendData.status) as any,
      invoice_number: backendData.numero_valorizacion || backendData.invoice_number,
      issue_date: backendData.created_at || backendData.issue_date,
      payment_date: backendData.aprobado_en || backendData.payment_date,
      created_at: backendData.created_at,
      updated_at: backendData.updated_at,
      contract: backendData.contract,
    };
  }

  /**
   * Map frontend model to backend DTO for create/update operations
   */
  private mapFrontendToBackend(frontendData: any): any {
    return {
      ...frontendData,
      contrato_id: frontendData.contrato_id || frontendData.contract_id,
      fecha_inicio: frontendData.fecha_inicio || frontendData.period_start,
      fecha_fin: frontendData.fecha_fin || frontendData.period_end,
      total_valorizado: frontendData.total_valorizado || frontendData.amount,
      costo_base: frontendData.costo_base || frontendData.base_amount,
      cargos_adicionales: frontendData.cargos_adicionales || frontendData.overtime_amount,
      costo_combustible: frontendData.costo_combustible || frontendData.fuel_amount,
      estado: this.mapEstadoFrontendToBackend(frontendData.estado || frontendData.status),
      numero_valorizacion: frontendData.numero_valorizacion || frontendData.invoice_number,
      // Remove frontend-only fields
      contract_id: undefined,
      period_start: undefined,
      period_end: undefined,
      amount: undefined,
      base_amount: undefined,
      overtime_amount: undefined,
      fuel_amount: undefined,
      status: undefined,
      invoice_number: undefined,
      issue_date: undefined,
      payment_date: undefined,
      contract: undefined,
    };
  }

  /**
   * Map backend estado (UPPERCASE) to frontend status (lowercase)
   */
  private mapEstadoBackendToFrontend(estado: string): string {
    if (!estado) return 'pending';
    const estadoMap: Record<string, string> = {
      PENDIENTE: 'pending',
      APROBADO: 'approved',
      RECHAZADO: 'rejected',
      PAGADO: 'paid',
    };
    return estadoMap[estado.toUpperCase()] || estado.toLowerCase();
  }

  /**
   * Map frontend status (lowercase) to backend estado (UPPERCASE)
   */
  private mapEstadoFrontendToBackend(status: string): string {
    if (!status) return 'PENDIENTE';
    const statusMap: Record<string, string> = {
      pending: 'PENDIENTE',
      draft: 'PENDIENTE',
      submitted: 'PENDIENTE',
      under_review: 'PENDIENTE',
      approved: 'APROBADO',
      rejected: 'RECHAZADO',
      paid: 'PAGADO',
    };
    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }

  getAll(filters: any = {}): Observable<Valuation[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.contract_id) params = params.set('contract_id', filters.contract_id);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        // Handle paginated response from backend
        let data = response;
        if (response && typeof response === 'object' && 'data' in response) {
          data = response.data;
        }
        const valuations = Array.isArray(data) ? data : [];
        return valuations.map((v) => this.mapBackendToFrontend(v));
      })
    );
  }

  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`);
  }

  getById(id: number | string): Observable<Valuation> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        const data = response?.data || response;
        return this.mapBackendToFrontend(data);
      })
    );
  }

  create(valuation: Omit<Valuation, 'id'>): Observable<Valuation> {
    const backendData = this.mapFrontendToBackend(valuation);
    return this.http.post<any>(this.apiUrl, backendData).pipe(
      map((response) => {
        const data = response?.data || response;
        return this.mapBackendToFrontend(data);
      })
    );
  }

  update(id: number | string, valuation: Partial<Valuation>): Observable<Valuation> {
    const backendData = this.mapFrontendToBackend(valuation);
    return this.http.put<any>(`${this.apiUrl}/${id}`, backendData).pipe(
      map((response) => {
        const data = response?.data || response;
        return this.mapBackendToFrontend(data);
      })
    );
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
