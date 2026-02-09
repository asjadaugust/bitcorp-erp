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
   * Frontend uses: equipment_id, contract_id, period_start, period_end, amount, status (lowercase)
   */
  private mapBackendToFrontend(backendData: any): Valuation {
    return {
      id: backendData.id,
      equipment_id: backendData.equipo_id || backendData.equipment_id,
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
      equipment: backendData.equipment,
    };
  }

  /**
   * Map frontend model to backend DTO for create/update operations
   */
  private mapFrontendToBackend(frontendData: any): any {
    const fechaInicio = frontendData.fecha_inicio || frontendData.period_start;
    // Generate periodo (YYYY-MM) from start date if not provided
    const periodo = frontendData.periodo || (fechaInicio ? fechaInicio.substring(0, 7) : '');

    return {
      ...frontendData,
      equipo_id:
        frontendData.equipo_id || frontendData.equipment_id
          ? Number(frontendData.equipo_id || frontendData.equipment_id)
          : null,
      contrato_id:
        frontendData.contrato_id || frontendData.contract_id
          ? Number(frontendData.contrato_id || frontendData.contract_id)
          : null,
      fecha_inicio: fechaInicio,
      fecha_fin: frontendData.fecha_fin || frontendData.period_end,
      total_valorizado:
        frontendData.total_valorizado || frontendData.amount
          ? Number(frontendData.total_valorizado || frontendData.amount)
          : 0,
      costo_base:
        frontendData.costo_base || frontendData.base_amount
          ? Number(frontendData.costo_base || frontendData.base_amount)
          : 0,
      cargos_adicionales:
        frontendData.cargos_adicionales || frontendData.overtime_amount
          ? Number(frontendData.cargos_adicionales || frontendData.overtime_amount)
          : 0,
      costo_combustible:
        frontendData.costo_combustible || frontendData.fuel_amount
          ? Number(frontendData.costo_combustible || frontendData.fuel_amount)
          : 0,
      estado: this.mapEstadoFrontendToBackend(frontendData.estado || frontendData.status),
      numero_valorizacion: frontendData.numero_valorizacion || frontendData.invoice_number,
      periodo: periodo, // Required by backend

      // Remove frontend-only fields
      contract_id: undefined,
      equipment_id: undefined,
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
      equipment: undefined,
    };
  }

  /**
   * Map backend estado (UPPERCASE) to frontend status (lowercase)
   */
  private mapEstadoBackendToFrontend(estado: string): string {
    if (!estado) return 'pending';
    const estadoMap: Record<string, string> = {
      PENDIENTE: 'pending',
      EN_REVISION: 'under_review',
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
      under_review: 'EN_REVISION',
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

    // DEFAULT LIMIT: Set limit to 100 if not specified to avoid pagination issues
    // This ensures list views and dropdowns show all valuations by default
    if (!filters.limit) {
      params = params.set('limit', '100');
    }

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

  /**
   * Submit valuation for review (PENDIENTE → EN_REVISION)
   */
  submitForReview(id: number | string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/submit-review`, {})
      .pipe(map((response) => response?.data || response));
  }

  /**
   * Approve valuation (EN_REVISION → APROBADO)
   */
  approve(id: number | string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(map((response) => response?.data || response));
  }

  /**
   * Reject valuation (any state → RECHAZADO)
   */
  reject(id: number | string, reason: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/reject`, { reason: reason })
      .pipe(map((response) => response?.data || response));
  }

  /**
   * Mark valuation as paid (APROBADO → PAGADO)
   */
  markAsPaid(
    id: number | string,
    paymentData: { fecha_pago: string; metodo_pago: string; referencia_pago: string }
  ): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/mark-paid`, paymentData)
      .pipe(map((response) => response?.data || response));
  }
}
