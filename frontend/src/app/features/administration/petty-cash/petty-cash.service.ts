import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─── Interfaces ───────────────────────────────────────────────────────────

export interface CajaChica {
  id: number;
  numero_caja: string | null;
  saldo_inicial: number | null;
  ingreso_total: number | null;
  salida_total: number | null;
  saldo_final: number | null;
  fecha_apertura: string | null;
  estatus: string | null;
}

export interface CajaChicaDetalle extends CajaChica {
  legacy_id: string | null;
  fecha_cierre: string | null;
  created_at: string | null;
  updated_at: string | null;
  solicitudes: SolicitudCaja[];
  movimientos: MovimientoCaja[];
}

export interface SolicitudCaja {
  id: number;
  fecha_solicitud: string | null;
  dni_usuario: string | null;
  nombre: string | null;
  motivo: string | null;
  monto_solicitado: number | null;
  monto_rendido: number | null;
  monto_devuelto_reembolsado: number | null;
  estatus: string | null;
}

export interface MovimientoCaja {
  id: number;
  fecha_movimiento: string | null;
  numero_caja: string | null;
  rubro: string | null;
  detalle: string | null;
  monto: number | null;
  entrada_salida: string | null;
  registrado_por: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PettyCashService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/petty-cash';

  // ─── Cajas ────────────────────────────────────────────────────────────

  getCajas(): Observable<CajaChica[]> {
    return this.http.get<CajaChica[]>(`${this.baseUrl}/cajas`);
  }

  getCaja(id: number): Observable<CajaChicaDetalle> {
    return this.http.get<CajaChicaDetalle>(`${this.baseUrl}/cajas/${id}`);
  }

  createCaja(data: {
    numero_caja: string;
    saldo_inicial: number;
    fecha_apertura: string;
  }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/cajas`, data);
  }

  updateCaja(id: number, data: Partial<CajaChica>): Observable<CajaChica> {
    return this.http.put<CajaChica>(`${this.baseUrl}/cajas/${id}`, data);
  }

  deleteCaja(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cajas/${id}`);
  }

  closeCaja(id: number): Observable<CajaChicaDetalle> {
    return this.http.post<CajaChicaDetalle>(`${this.baseUrl}/cajas/${id}/cerrar`, {});
  }

  // ─── Solicitudes ──────────────────────────────────────────────────────

  getSolicitudes(): Observable<SolicitudCaja[]> {
    return this.http.get<SolicitudCaja[]>(`${this.baseUrl}/solicitudes`);
  }

  createSolicitud(data: Partial<SolicitudCaja>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/solicitudes`, data);
  }

  updateSolicitud(id: number, data: Partial<SolicitudCaja>): Observable<SolicitudCaja> {
    return this.http.put<SolicitudCaja>(`${this.baseUrl}/solicitudes/${id}`, data);
  }

  // ─── Movimientos ──────────────────────────────────────────────────────

  getMovimientos(numeroCaja?: string): Observable<MovimientoCaja[]> {
    const params = numeroCaja ? `?numero_caja=${numeroCaja}` : '';
    return this.http.get<MovimientoCaja[]>(`${this.baseUrl}/movimientos${params}`);
  }

  createMovimiento(data: Partial<MovimientoCaja>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.baseUrl}/movimientos`, data);
  }
}
