import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Valuation, PaymentData, ValuationSummary } from '../models/valuation.model';

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
    return this.http
      .get<any>(`${this.apiUrl}/${id}`)
      .pipe(map((response) => this.toCamelCase(response?.data || response)));
  }

  create(valuation: Partial<Valuation>): Observable<Valuation> {
    const payload = this.toSnakeCase(valuation);
    return this.http
      .post<any>(this.apiUrl, payload)
      .pipe(map((response) => this.toCamelCase(response?.data || response)));
  }

  update(id: number | string, valuation: Partial<Valuation>): Observable<Valuation> {
    const payload = this.toSnakeCase(valuation);
    // console.log('Update Payload:', payload);
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, payload)
      .pipe(map((response) => this.toCamelCase(response?.data || response)));
  }

  private toSnakeCase(valuation: Partial<Valuation>): any {
    return {
      contrato_id: valuation.contratoId,
      equipo_id: valuation.equipoId,
      fecha_inicio: valuation.fechaInicio,
      fecha_fin: valuation.fechaFin,
      total_valorizado: valuation.totalValorizado,
      numero_valorizacion: valuation.numeroValorizacion,
      estado: valuation.estado,
      cargos_adicionales: valuation.cargosAdicionales,
      importe_manipuleo: valuation.importeManipuleo,
      importe_gasto_obra: valuation.importeGastoObra,
      importe_adelanto: valuation.importeAdelanto,
      importe_exceso_combustible: valuation.importeExcesoCombustible,
      costo_base: valuation.costoBase,
      costo_combustible: valuation.costoCombustible,
      periodo: valuation.periodo,
    };
  }

  private toCamelCase(data: any): Valuation {
    return {
      id: data.id,
      legacyId: data.legacy_id,
      equipoId: data.equipo_id,
      contratoId: data.contrato_id,
      proyectoId: data.proyecto_id,
      periodo: data.periodo,
      fechaInicio: data.fecha_inicio,
      fechaFin: data.fecha_fin,
      diasTrabajados: data.dias_trabajados,
      horasTrabajadas: data.horas_trabajadas,
      combustibleConsumido: data.combustible_consumido,
      costoBase: data.costo_base,
      costoCombustible: data.costo_combustible,
      cargosAdicionales: data.cargos_adicionales,
      importeManipuleo: data.importe_manipuleo,
      importeGastoObra: data.importe_gasto_obra,
      importeAdelanto: data.importe_adelanto,
      importeExcesoCombustible: data.importe_exceso_combustible,
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
      creadoPor: data.creado_por,
      aprobadoPor: data.aprobado_por,
      aprobadoEn: data.aprobado_en,
      validadoPor: data.validado_por,
      validadoEn: data.validado_en,
      conformidadProveedor: data.conformidad_proveedor,
      conformidadFecha: data.conformidad_fecha,
      conformidadObservaciones: data.conformidad_observaciones,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      equipo: data.equipo
        ? {
            id: data.equipo.id,
            codigo: data.equipo.codigo,
            codigo_equipo: data.equipo.codigo, // Keep for legacy
            nombre: data.equipo.nombre,
            marca: data.equipo.marca || '',
            modelo: data.equipo.modelo || '',
          }
        : undefined,
      contrato: data.contrato
        ? {
            id: data.contrato.id,
            codigo: data.contrato.codigo,
            numero_contrato: data.contrato.codigo, // Keep for legacy
            nombre_proyecto: data.contrato.nombre_proyecto,
            proveedor: data.contrato.proveedor,
          }
        : undefined,
      creador: data.creador,
      aprobador: data.aprobador,
      validador: data.validador,
      cliente_nombre: data.cliente_nombre,
      codigo_equipo: data.codigo_equipo,
    } as any;
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  calculate(data: { contrato_id: string; month: number; year: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/calculate`, data);
  }

  generate(data: { contrato_id?: string; month: number; year: number }): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/generate`, data)
      .pipe(map((response) => response?.data || response));
  }

  getSummary(id: number | string): Observable<ValuationSummary> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}/summary`)
      .pipe(map((response) => response?.data || response));
  }

  downloadPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  /** Submit draft (BORRADOR → PENDIENTE) */
  submitDraft(id: number | string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/submit-draft`, {})
      .pipe(map((response) => response?.data || response));
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

  /** Validate valuation (EN_REVISION → VALIDADO) */
  validate(id: number | string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/validate`, {})
      .pipe(map((response) => response?.data || response));
  }

  /** Reopen rejected valuation (RECHAZADO → BORRADOR) */
  reopen(id: number | string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/reopen`, {})
      .pipe(map((response) => response?.data || response));
  }

  /** Register provider conformity */
  registerConformidad(
    id: number | string,
    data: { fecha?: string; observaciones?: string }
  ): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/conformidad`, data)
      .pipe(map((response) => response?.data || response));
  }

  /** Mark valuation as paid (APROBADO → PAGADO) */
  markAsPaid(id: number | string, paymentData: PaymentData): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/mark-paid`, paymentData)
      .pipe(map((response) => response?.data || response));
  }

  /** Get valuation registry (consolidated cross-project) */
  getRegistry(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters?.proyecto_id) params = params.set('proyecto_id', filters.proyecto_id);
    if (filters?.periodo_desde) params = params.set('periodo_desde', filters.periodo_desde);
    if (filters?.periodo_hasta) params = params.set('periodo_hasta', filters.periodo_hasta);
    if (filters?.estado) params = params.set('estado', filters.estado);
    if (filters?.proveedor) params = params.set('proveedor', filters.proveedor);
    if (filters?.equipo_id) params = params.set('equipo_id', filters.equipo_id);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());

    console.log('[DEBUG] ValuationService.getRegistry calling API...');
    return this.http.get<any>(`${this.apiUrl}/registry`, { params }).pipe(
      map((response) => {
        console.log('[DEBUG] getRegistry raw response:', response);

        // 1. Unwrap the outer "data" envelope if it exists (standard API wrapper)
        // The API returns { success: true, data: { data: [], total: N, summary: ... } }
        let payload = response;
        if (response && response.data && !Array.isArray(response.data) && response.data.data) {
          payload = response.data;
        }

        console.log('[DEBUG] getRegistry payload keys:', payload ? Object.keys(payload) : 'null');

        // 2. Handle pagination/summary structure { data: [], total: N, summary: ... }
        if (payload && payload.summary && Array.isArray(payload.data)) {
          console.log('[DEBUG] Mapping paginated data, count:', payload.data.length);
          return {
            ...payload,
            data: payload.data.map((item: any) => this.toCamelCase(item)),
          };
        }

        // 3. Fallback for simple array or standard list response
        const list = Array.isArray(payload) ? payload : payload.data || [];
        console.log(
          '[DEBUG] Fallback mapping list, length:',
          Array.isArray(list) ? list.length : 'not-array'
        );

        return Array.isArray(list) ? list.map((item: any) => this.toCamelCase(item)) : list;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  // ─── Payment Document Methods (WS-5) ───

  getPaymentDocuments(valuationId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/${valuationId}/payment-documents`).pipe(
      map((response) => {
        const data = response?.data || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  createPaymentDocument(valuationId: number, data: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${valuationId}/payment-documents`, data)
      .pipe(map((response) => response?.data || response));
  }

  updatePaymentDocument(docId: number, data: any): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/payment-documents/${docId}`, data)
      .pipe(map((response) => response?.data || response));
  }

  checkPaymentDocsComplete(valuationId: number): Observable<{ complete: boolean }> {
    return this.http
      .get<any>(`${this.apiUrl}/${valuationId}/payment-documents/check`)
      .pipe(map((response) => response?.data || response));
  }

  // ─── Recalculate & Discount Events (Anexo B) ───

  recalculate(id: number | string): Observable<Valuation> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/recalculate`, {})
      .pipe(map((response) => this.toCamelCase(response?.data || response)));
  }

  getDiscountEvents(valuationId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/${valuationId}/discount-events`).pipe(
      map((response) => {
        const data = response?.data || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  createDiscountEvent(
    valuationId: number,
    data: {
      fecha: string;
      tipo: string;
      horas_descuento?: number;
      dias_descuento?: number;
      descripcion?: string;
    }
  ): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${valuationId}/discount-events`, data)
      .pipe(map((response) => response?.data || response));
  }

  deleteDiscountEvent(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/discount-events/${eventId}`);
  }
}
