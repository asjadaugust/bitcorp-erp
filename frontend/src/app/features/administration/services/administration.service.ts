import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

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
  provider_id: number;
  provider?: any;
  project_id?: string;
  cost_center_id?: string;
  document_type: string;
  document_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentSchedule {
  id: number;
  schedule_date: string;
  payment_date: string;
  total_amount: number;
  currency: string;
  status: string;
  description?: string;
  details?: PaymentScheduleDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface PaymentScheduleDetail {
  id: number;
  payment_schedule_id: number;
  accounts_payable_id: number;
  accounts_payable?: AccountsPayable;
  amount_to_pay: number;
  created_at?: string;
}

export interface Provider {
  C07001_Id: number;
  C07001_RazonSocial: string;
  C07001_NombreComercial?: string;
  C07001_RUC?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdministrationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;
  private apUrl = `${environment.apiUrl}/accounts-payable`;
  private psUrl = `${environment.apiUrl}/payment-schedules`;
  private providersUrl = `${environment.apiUrl}/providers`;

  // Cost Centers
  getCostCenters(): Observable<CostCenter[]> {
    return this.http.get<CostCenter[]>(`${this.apiUrl}/cost-centers`);
  }

  getCostCenter(id: string): Observable<CostCenter> {
    return this.http.get<CostCenter>(`${this.apiUrl}/cost-centers/${id}`);
  }

  createCostCenter(costCenter: Partial<CostCenter>): Observable<CostCenter> {
    return this.http.post<CostCenter>(`${this.apiUrl}/cost-centers`, costCenter);
  }

  updateCostCenter(id: string, costCenter: Partial<CostCenter>): Observable<CostCenter> {
    return this.http.put<CostCenter>(`${this.apiUrl}/cost-centers/${id}`, costCenter);
  }

  deleteCostCenter(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cost-centers/${id}`);
  }

  // Providers
  getProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(this.providersUrl);
  }

  // Accounts Payable
  getAccountsPayable(): Observable<AccountsPayable[]> {
    return this.http.get<AccountsPayable[]>(this.apUrl);
  }

  getAccountsPayableById(id: number): Observable<AccountsPayable> {
    return this.http.get<AccountsPayable>(`${this.apUrl}/${id}`);
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
    return this.http.get<AccountsPayable[]>(`${this.apUrl}/pending`);
  }

  // Payment Schedules
  getPaymentSchedules(): Observable<PaymentSchedule[]> {
    return this.http.get<PaymentSchedule[]>(this.psUrl);
  }

  getPaymentScheduleById(id: number): Observable<PaymentSchedule> {
    return this.http.get<PaymentSchedule>(`${this.psUrl}/${id}`);
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

  addPaymentScheduleDetail(scheduleId: number, data: { accounts_payable_id: number; amount_to_pay: number }): Observable<PaymentScheduleDetail> {
    return this.http.post<PaymentScheduleDetail>(`${this.psUrl}/${scheduleId}/details`, data);
  }

  removePaymentScheduleDetail(scheduleId: number, detailId: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.psUrl}/${scheduleId}/details/${detailId}`);
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
