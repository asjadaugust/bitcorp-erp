import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CostCenter {
  id: string;
  codigo: string;
  nombre: string;
  presupuesto: number;
  descripcion?: string;
  project_id?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AccountsPayable {
  id: number;
  proveedor_id: number;
  provider?: Provider; // Use standard Provider
  project_id?: string;
  cost_center_id?: string;
  legacy_id?: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_total: number;
  monto_pagado: number;
  saldo: number;
  moneda: string;
  estado: string;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentSchedule {
  id: number;
  schedule_date: string;
  payment_date: string;
  total_amount: number;
  currency: string;
  status: 'draft' | 'approved' | 'processed' | 'cancelled';
  description?: string;
  periodo?: string;
  details?: PaymentScheduleDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface PaymentScheduleDetail {
  id: number;
  payment_schedule_id: number;
  accounts_payable_id: number; // Linked accounts payable
  accounts_payable?: AccountsPayable;
  amount_to_pay: number;
  created_at?: string;
}

export interface Provider {
  id: number;
  razonSocial: string;
  nombreComercial?: string;
  ruc: string;
  tipoProveedor?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AdministrationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;
  private apUrl = `${environment.apiUrl}/accounts-payable`;
  private psUrl = `${environment.apiUrl}/payment-schedules`;
  private providersUrl = `${environment.apiUrl}/providers`;

  // Cost Centers
  getCostCenters(): Observable<CostCenter[]> {
    return this.http
      .get<any>(`${this.apiUrl}/cost-centers`)
      .pipe(map((res) => res.data || res));
  }

  getCostCenter(id: string): Observable<CostCenter> {
    return this.http
      .get<any>(`${this.apiUrl}/cost-centers/${id}`)
      .pipe(map((res) => res.data || res));
  }

  createCostCenter(costCenter: any): Observable<CostCenter> {
    return this.http.post<CostCenter>(`${this.apiUrl}/cost-centers`, costCenter);
  }

  updateCostCenter(id: string, costCenter: any): Observable<CostCenter> {
    return this.http.put<CostCenter>(`${this.apiUrl}/cost-centers/${id}`, costCenter);
  }

  deleteCostCenter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cost-centers/${id}`);
  }

  getProviders(): Observable<Provider[]> {
    return this.http
      .get<any>(this.providersUrl)
      .pipe(map((res) => res.data || res));
  }

  // Accounts Payable (Spanish snake_case DTOs)
  getAccountsPayable(): Observable<AccountsPayable[]> {
    return this.http
      .get<any>(this.apUrl)
      .pipe(map((res) => res.data || res));
  }

  getAccountsPayableById(id: number): Observable<AccountsPayable> {
    return this.http
      .get<any>(`${this.apUrl}/${id}`)
      .pipe(map((res) => res.data || res));
  }

  createAccountsPayable(data: Partial<AccountsPayable>): Observable<AccountsPayable> {
    return this.http.post<AccountsPayable>(this.apUrl, data);
  }

  updateAccountsPayable(id: number, data: Partial<AccountsPayable>): Observable<AccountsPayable> {
    return this.http.put<AccountsPayable>(`${this.apUrl}/${id}`, data);
  }

  deleteAccountsPayable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apUrl}/${id}`);
  }

  getPendingAccountsPayable(): Observable<AccountsPayable[]> {
    return this.http
      .get<any>(`${this.apUrl}/pending`)
      .pipe(map((res) => res.data || res));
  }

  // Payment Schedules (English properties from Entity)
  getPaymentSchedules(): Observable<PaymentSchedule[]> {
    return this.http
      .get<any>(this.psUrl)
      .pipe(map((res) => res.data || res));
  }

  getPaymentScheduleById(id: number): Observable<PaymentSchedule> {
    return this.http
      .get<any>(`${this.psUrl}/${id}`)
      .pipe(map((res) => res.data || res));
  }

  createPaymentSchedule(data: Partial<PaymentSchedule>): Observable<PaymentSchedule> {
    return this.http.post<PaymentSchedule>(this.psUrl, data);
  }

  updatePaymentSchedule(id: number, data: Partial<PaymentSchedule>): Observable<PaymentSchedule> {
    return this.http.put<PaymentSchedule>(`${this.psUrl}/${id}`, data);
  }

  deletePaymentSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.psUrl}/${id}`);
  }

  addPaymentScheduleDetail(
    scheduleId: number,
    data: { accounts_payable_id: number; amount_to_pay: number }
  ): Observable<PaymentScheduleDetail> {
    return this.http.post<PaymentScheduleDetail>(`${this.psUrl}/${scheduleId}/details`, data);
  }

  removePaymentScheduleDetail(
    scheduleId: number,
    detailId: number
  ): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.psUrl}/${scheduleId}/details/${detailId}`
    );
  }

  // Workflow actions
  approvePaymentSchedule(id: number): Observable<PaymentSchedule> {
    return this.http.post<PaymentSchedule>(`${this.psUrl}/${id}/approve`, {});
  }

  processPaymentSchedule(id: number): Observable<PaymentSchedule> {
    return this.http.post<PaymentSchedule>(`${this.psUrl}/${id}/process`, {});
  }

  cancelPaymentSchedule(id: number): Observable<PaymentSchedule> {
    return this.http.post<PaymentSchedule>(`${this.psUrl}/${id}/cancel`, {});
  }
}
