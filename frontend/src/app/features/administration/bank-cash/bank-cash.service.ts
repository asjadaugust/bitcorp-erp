import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- Interfaces -----------------------------------------------------------

export interface CuentaCajaBanco {
  id: number;
  numero_cuenta: string | null;
  cuenta: string | null;
  acceso_proyecto: string | null;
  estatus: string | null;
}

export interface CuentaCajaBancoDetalle extends CuentaCajaBanco {
  legacy_id: string | null;
  unidad_operativa_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FlujoCajaBanco {
  id: number;
  tipo_movimiento: string | null;
  fecha_movimiento: string | null;
  cuenta_origen: string | null;
  numero_cuenta_origen: string | null;
  concepto: string | null;
  moneda: string | null;
  total: number | null;
  voucher: string | null;
}

export interface FlujoCajaBancoDetalle extends FlujoCajaBanco {
  legacy_id: string | null;
  numero_cuenta_destino: string | null;
  cuenta_destino: string | null;
  total_letra: string | null;
  link_voucher: string | null;
  unidad_operativa_id: number | null;
  registrado_por: string | null;
  fecha_registro: string | null;
  actualizado_por: string | null;
  fecha_actualizacion: string | null;
  created_at: string | null;
  updated_at: string | null;
  detalles: DetalleMovimiento[];
}

export interface DetalleMovimiento {
  id: number;
  movimiento_legacy_id: string | null;
  item: number | null;
  programacion_legacy_id: string | null;
  cuenta_por_pagar_legacy_id: string | null;
  concepto: string | null;
  clasificacion: string | null;
  monto: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// --- Service --------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class BankCashService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/bank-cash';

  // --- Cuentas ------------------------------------------------------------

  getCuentas(): Observable<CuentaCajaBanco[]> {
    return this.http.get<CuentaCajaBanco[]>(`${this.baseUrl}/cuentas`);
  }

  getCuenta(id: number): Observable<CuentaCajaBancoDetalle> {
    return this.http.get<CuentaCajaBancoDetalle>(`${this.baseUrl}/cuentas/${id}`);
  }

  createCuenta(data: Partial<CuentaCajaBanco>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/cuentas`, data);
  }

  updateCuenta(id: number, data: Partial<CuentaCajaBanco>): Observable<CuentaCajaBanco> {
    return this.http.put<CuentaCajaBanco>(`${this.baseUrl}/cuentas/${id}`, data);
  }

  deleteCuenta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cuentas/${id}`);
  }

  // --- Flujos -------------------------------------------------------------

  getFlujos(params?: {
    page?: number;
    limit?: number;
    tipo_movimiento?: string;
    moneda?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    search?: string;
  }): Observable<PaginatedResponse<FlujoCajaBanco>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.tipo_movimiento)
      httpParams = httpParams.set('tipo_movimiento', params.tipo_movimiento);
    if (params?.moneda) httpParams = httpParams.set('moneda', params.moneda);
    if (params?.fecha_desde) httpParams = httpParams.set('fecha_desde', params.fecha_desde);
    if (params?.fecha_hasta) httpParams = httpParams.set('fecha_hasta', params.fecha_hasta);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<PaginatedResponse<FlujoCajaBanco>>(`${this.baseUrl}/flujos`, {
      params: httpParams,
    });
  }

  getFlujo(id: number): Observable<FlujoCajaBancoDetalle> {
    return this.http.get<FlujoCajaBancoDetalle>(`${this.baseUrl}/flujos/${id}`);
  }

  createFlujo(data: Partial<FlujoCajaBancoDetalle>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/flujos`, data);
  }

  updateFlujo(id: number, data: Partial<FlujoCajaBancoDetalle>): Observable<FlujoCajaBancoDetalle> {
    return this.http.put<FlujoCajaBancoDetalle>(`${this.baseUrl}/flujos/${id}`, data);
  }

  // --- Detalles -----------------------------------------------------------

  getDetalles(flujoId: number): Observable<DetalleMovimiento[]> {
    return this.http.get<DetalleMovimiento[]>(`${this.baseUrl}/flujos/${flujoId}/detalles`);
  }

  createDetalle(
    flujoId: number,
    data: { concepto?: string; clasificacion?: string; monto?: number }
  ): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/flujos/${flujoId}/detalles`, data);
  }

  deleteDetalle(flujoId: number, detalleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/flujos/${flujoId}/detalles/${detalleId}`);
  }
}
