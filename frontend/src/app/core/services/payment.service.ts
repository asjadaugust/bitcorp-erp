import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PaymentRecordList,
  PaymentRecordDetail,
  PaymentSummary,
  CreatePaymentRecord,
  UpdatePaymentRecord,
  ReconcilePayment,
  PaymentRecordQuery,
  PaginatedPaymentResponse,
} from '../models/payment-record.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments`;

  /**
   * Get all payments with filters and pagination
   */
  getPayments(filters: PaymentRecordQuery = {}): Observable<PaginatedPaymentResponse> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.valorizacion_id)
      params = params.set('valorizacion_id', filters.valorizacion_id.toString());
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.conciliado !== undefined)
      params = params.set('conciliado', filters.conciliado.toString());
    if (filters.metodo_pago) params = params.set('metodo_pago', filters.metodo_pago);
    if (filters.fecha_desde) params = params.set('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params = params.set('fecha_hasta', filters.fecha_hasta);
    if (filters.moneda) params = params.set('moneda', filters.moneda);

    return this.http.get<PaginatedPaymentResponse>(this.apiUrl, { params });
  }

  /**
   * Get single payment by ID
   */
  getPaymentById(id: number): Observable<PaymentRecordDetail> {
    // Note: API response is auto-unwrapped by apiResponseInterceptor
    return this.http.get<PaymentRecordDetail>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all payments for a specific valuation
   */
  getPaymentsByValuation(valuationId: number): Observable<PaymentRecordList[]> {
    // Note: API response is auto-unwrapped by apiResponseInterceptor
    return this.http.get<PaymentRecordList[]>(
      `${environment.apiUrl}/valuations/${valuationId}/payments`
    );
  }

  /**
   * Get payment summary for a valuation
   */
  getPaymentSummary(valuationId: number): Observable<PaymentSummary> {
    // Note: API response is auto-unwrapped by apiResponseInterceptor
    return this.http.get<PaymentSummary>(
      `${environment.apiUrl}/valuations/${valuationId}/payment-summary`
    );
  }

  /**
   * Create new payment
   */
  createPayment(data: CreatePaymentRecord): Observable<PaymentRecordDetail> {
    // Note: API response is auto-unwrapped by apiResponseInterceptor
    return this.http.post<PaymentRecordDetail>(this.apiUrl, data);
  }

  /**
   * Update existing payment
   */
  updatePayment(id: number, data: UpdatePaymentRecord): Observable<PaymentRecordDetail> {
    // Note: API response is auto-unwrapped by apiResponseInterceptor
    return this.http.put<PaymentRecordDetail>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Reconcile payment with bank statement
   */
  reconcilePayment(id: number, data: ReconcilePayment): Observable<PaymentRecordDetail> {
    // Note: API response is auto-unwrapped by apiResponseInterceptor
    return this.http.post<PaymentRecordDetail>(`${this.apiUrl}/${id}/reconcile`, data);
  }

  /**
   * Cancel payment (soft delete - sets estado to ANULADO)
   */
  cancelPayment(id: number, reason: string): Observable<void> {
    return this.http
      .delete<{ success: boolean }>(`${this.apiUrl}/${id}`, {
        body: { razon: reason },
      })
      .pipe(map(() => undefined));
  }

  /**
   * Helper: Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'PEN'): string {
    const symbol = currency === 'PEN' ? 'S/' : currency === 'USD' ? '$' : currency;
    return `${symbol} ${amount.toFixed(2)}`;
  }

  /**
   * Helper: Get payment method label
   */
  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      TRANSFERENCIA: 'Transferencia Bancaria',
      CHEQUE: 'Cheque',
      EFECTIVO: 'Efectivo',
      LETRA: 'Letra de Cambio',
      DEPOSITO: 'Depósito Bancario',
      OTROS: 'Otros',
    };
    return labels[method] || method;
  }

  /**
   * Helper: Get payment status label
   */
  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADO: 'Confirmado',
      RECHAZADO: 'Rechazado',
      ANULADO: 'Anulado',
    };
    return labels[status] || status;
  }

  /**
   * Helper: Get payment status color
   */
  getPaymentStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDIENTE: 'warning',
      CONFIRMADO: 'success',
      RECHAZADO: 'danger',
      ANULADO: 'secondary',
    };
    return colors[status] || 'secondary';
  }

  /**
   * Helper: Get summary status label
   */
  getSummaryStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      SIN_PAGOS: 'Sin Pagos',
      PAGO_PARCIAL: 'Pago Parcial',
      PAGO_COMPLETO: 'Pago Completo',
    };
    return labels[status] || status;
  }

  /**
   * Helper: Get summary status color
   */
  getSummaryStatusColor(status: string): string {
    const colors: Record<string, string> = {
      SIN_PAGOS: 'secondary',
      PAGO_PARCIAL: 'warning',
      PAGO_COMPLETO: 'success',
    };
    return colors[status] || 'secondary';
  }
}
