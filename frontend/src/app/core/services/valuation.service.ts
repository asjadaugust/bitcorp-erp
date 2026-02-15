import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Valuation, PaymentData } from '../models/valuation.model';

@Injectable({
  providedIn: 'root',
})
export class ValuationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/valuations`;

  /**
   * List valuations with optional filters
   */
  getAll(filters: any = {}): Observable<Valuation[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.contrato_id) params = params.set('contrato_id', filters.contrato_id);
    if (filters.equipo_id) params = params.set('equipo_id', filters.equipo_id);
    if (filters.periodo) params = params.set('periodo', filters.periodo);

    // Default limit to 100 if not specified
    if (!filters.limit) {
      params = params.set('limit', '100');
    }
    // Prevent caching
    params = params.set('_t', new Date().getTime().toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        let data = response;
        if (response && typeof response === 'object' && 'data' in response) {
          data = response.data;
        }
        return Array.isArray(data) ? data.map((item) => this.toCamelCase(item)) : [];
      })
    );
  }

  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`);
  }

  getById(id: number | string): Observable<Valuation> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.toCamelCase(response?.data || response))
    );
  }

  create(valuation: Partial<Valuation>): Observable<Valuation> {
    const payload = this.toSnakeCase(valuation);
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((response) => this.toCamelCase(response?.data || response))
    );
  }

  update(id: number | string, valuation: Partial<Valuation>): Observable<Valuation> {
    const payload = this.toSnakeCase(valuation);
    // console.log('Update Payload:', payload);
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map((response) => this.toCamelCase(response?.data || response))
    );
  }

  private toSnakeCase(valuation: Partial<Valuation>): any {
    return {
      contrato_id: valuation.contractId,
      equipo_id: valuation.equipmentId,
      fecha_inicio: valuation.fechaInicio,
      fecha_fin: valuation.fechaFin,
      total_valorizado: valuation.totalValorizado,
      numero_valorizacion: valuation.numeroValorizacion,
      estado: valuation.estado,
      cargos_adicionales: valuation.cargosAdicionales,
      costo_base: valuation.costoBase,
      costo_combustible: valuation.costoCombustible,
      periodo: valuation.periodo,
    };
  }

  private toCamelCase(data: any): Valuation {
    return {
      id: data.id,
      legacyId: data.legacy_id,
      equipmentId: data.equipo_id,
      contractId: data.contrato_id,
      projectId: data.proyecto_id,
      periodo: data.periodo,
      fechaInicio: data.fecha_inicio,
      fechaFin: data.fecha_fin,
      diasTrabajados: data.dias_trabajados,
      horasTrabajadas: data.horas_trabajadas,
      combustibleConsumido: data.combustible_consumido,
      costoBase: data.costo_base,
      costoCombustible: data.costo_combustible,
      cargosAdicionales: data.cargos_adicionales,
      totalValorizado: data.total_valorizado,
      numeroValorizacion: data.numero_valorizacion,
      tipoCambio: data.tipo_cambio,
      descuentoPorcentaje: data.descuento_porcentaje,
      descuentoMonto: data.descuento_monto,
      igvPorcentaje: data.igv_porcentaje,
      igvMonto: data.igv_monto,
      totalConIgv: data.total_con_igv,
      estado: data.estado,
      observaciones: data.observaciones,
      createdBy: data.creado_por,
      approvedBy: data.aprobado_por,
      approvedAt: data.aprobado_en,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      equipo: data.equipo ? {
        id: data.equipo.id,
        codigo_equipo: data.equipo.codigo,
        marca: data.equipo.nombre?.split(' ')[0] || '',
        modelo: data.equipo.nombre?.split(' ').slice(1).join(' ') || '',
      } : undefined,
      contrato: data.contrato,
    } as Valuation;
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  calculate(data: { contrato_id: string; month: number; year: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/calculate`, data);
  }

  generate(data: { contrato_id?: string; month: number; year: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate`, data);
  }

  downloadPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  /** Submit valuation for review (PENDIENTE → EN_REVISION) */
  submitForReview(id: number | string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/submit-review`, {})
      .pipe(map((response) => response?.data || response));
  }

  /** Approve valuation (EN_REVISION → APROBADO) */
  approve(id: number | string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(map((response) => response?.data || response));
  }

  /** Reject valuation (any state → RECHAZADO) */
  reject(id: number | string, reason: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/reject`, { reason })
      .pipe(map((response) => response?.data || response));
  }

  /** Mark valuation as paid (APROBADO → PAGADO) */
  markAsPaid(id: number | string, paymentData: PaymentData): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/mark-paid`, paymentData)
      .pipe(map((response) => response?.data || response));
  }
}
