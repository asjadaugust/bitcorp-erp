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
  getAll(filters: Record<string, string | number | undefined> = {}): Observable<Valuation[]> {
    let params = new HttpParams();
    if (filters['search']) params = params.set('search', filters['search']);
    if (filters['estado']) params = params.set('estado', filters['estado']);
    if (filters['contrato_id']) params = params.set('contrato_id', filters['contrato_id']);
    if (filters['equipo_id']) params = params.set('equipo_id', filters['equipo_id']);
    if (filters['periodo']) params = params.set('periodo', filters['periodo']);

    // Default limit to 100 if not specified
    if (!filters['limit']) {
      params = params.set('limit', '100');
    }
    // Prevent caching
    params = params.set('_t', new Date().getTime().toString());

    return this.http.get<Record<string, unknown>>(this.apiUrl, { params }).pipe(
      map((response) => {
        let data: unknown = response;
        if (response && typeof response === 'object' && 'data' in response) {
          data = response['data'];
        }
        return Array.isArray(data)
          ? data.map((item) => this.toCamelCase(item as Record<string, unknown>))
          : [];
      })
    );
  }

  getAnalytics(): Observable<unknown> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/analytics`);
  }

  getById(id: number | string): Observable<Valuation> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) =>
          this.toCamelCase((response?.['data'] || response) as Record<string, unknown>)
        )
      );
  }

  create(valuation: Partial<Valuation>): Observable<Valuation> {
    const payload = this.toSnakeCase(valuation);
    return this.http
      .post<Record<string, unknown>>(this.apiUrl, payload)
      .pipe(
        map((response) =>
          this.toCamelCase((response?.['data'] || response) as Record<string, unknown>)
        )
      );
  }

  update(id: number | string, valuation: Partial<Valuation>): Observable<Valuation> {
    const payload = this.toSnakeCase(valuation);
    // console.log('Update Payload:', payload);
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        map((response) =>
          this.toCamelCase((response?.['data'] || response) as Record<string, unknown>)
        )
      );
  }

  private toSnakeCase(valuation: Partial<Valuation>): Record<string, unknown> {
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

  private toCamelCase(data: Record<string, unknown>): Valuation {
    const equipoObj = data['equipo'] as Record<string, unknown> | undefined;
    const contratoObj = data['contrato'] as Record<string, unknown> | undefined;
    const objDict = data;

    return {
      id: data['id'],
      legacyId: data['legacy_id'],
      equipoId: data['equipo_id'],
      contratoId: data['contrato_id'],
      proyectoId: data['proyecto_id'],
      periodo: data['periodo'],
      fechaInicio: data['fecha_inicio'],
      fechaFin: data['fecha_fin'],
      diasTrabajados: data['dias_trabajados'],
      horasTrabajadas: data['horas_trabajadas'],
      combustibleConsumido: data['combustible_consumido'],
      costoBase: data['costo_base'],
      costoCombustible: data['costo_combustible'],
      cargosAdicionales: data['cargos_adicionales'],
      importeManipuleo: data['importe_manipuleo'],
      importeGastoObra: data['importe_gasto_obra'],
      importeAdelanto: data['importe_adelanto'],
      importeExcesoCombustible: data['importe_exceso_combustible'],
      totalValorizado: data['total_valorizado'],
      numeroValorizacion: data['numero_valorizacion'],
      tipoCambio: data['tipo_cambio'],
      descuentoPorcentaje: data['descuento_porcentaje'],
      descuentoMonto: data['descuento_monto'],
      igvPorcentaje: data['igv_porcentaje'],
      igvMonto: data['igv_monto'],
      totalConIgv: data['total_con_igv'],
      estado: data['estado'],
      observaciones: data['observaciones'],
      creadoPor: data['creado_por'],
      aprobadoPor: data['aprobado_por'],
      aprobadoEn: data['aprobado_en'],
      validadoPor: data['validado_por'],
      validadoEn: data['validado_en'],
      conformidadProveedor: data['conformidad_proveedor'],
      conformidadFecha: data['conformidad_fecha'],
      conformidadObservaciones: data['conformidad_observaciones'],
      createdAt: data['created_at'],
      updatedAt: data['updated_at'],
      equipo: equipoObj
        ? {
            id: equipoObj['id'] as number,
            codigo: equipoObj['codigo'] as string,
            codigo_equipo: equipoObj['codigo'] as string, // Keep for legacy
            nombre: equipoObj['nombre'] as string,
            marca: (equipoObj['marca'] as string) || '',
            modelo: (equipoObj['modelo'] as string) || '',
          }
        : undefined,
      contrato: contratoObj
        ? {
            id: contratoObj['id'] as number,
            codigo: contratoObj['codigo'] as string,
            numero_contrato: contratoObj['codigo'] as string, // Keep for legacy
            nombre_proyecto: contratoObj['nombre_proyecto'] as string,
            proveedor: contratoObj['proveedor'] as unknown,
          }
        : undefined,
      creador: data['creador'],
      aprobador: data['aprobador'],
      validador: data['validador'],

      // Shorthand and joined fields for better template access
      cliente_nombre:
        data['cliente_nombre'] || (contratoObj?.['proveedor'] as any)?.['razon_social'],
      proveedor_nombre:
        data['proveedor_nombre'] || (contratoObj?.['proveedor'] as any)?.['razon_social'],
      codigo_equipo: data['codigo_equipo'] || equipoObj?.['codigo'],
      contrato_numero: data['contrato_numero'] || contratoObj?.['codigo'],

      // Flattened financial metrics for quick access
      tipoTarifa: data['tipoTarifa'] || contratoObj?.['tipo_tarifa'],
      tarifa: data['tarifa'] || contratoObj?.['tarifa'],
      horasTotales: data['horasTotales'] || data['horas_trabajadas'],
      montoBruto: data['montoBruto'] || data['total_valorizado'],
      montoNeto: data['montoNeto'] || data['total_con_igv'],

      // Ids
      equipmentId: data['equipo_id'] || data['equipoId'],
      contractId: data['contrato_id'] || data['contratoId'],

      deadlines: data['deadlines'],
    } as unknown as Valuation;
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  calculate(data: { contrato_id: string; month: number; year: number }): Observable<unknown> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/calculate`, data);
  }

  generate(data: { contrato_id?: string; month: number; year: number }): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/generate`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  getSummary(id: number | string): Observable<ValuationSummary> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}/summary`).pipe(
      map((response) => {
        const data = (response?.['data'] || response) as Record<string, unknown>;
        const financiero = data['financiero'] as Record<string, unknown> | undefined;
        // Flatten for template compatibility
        return {
          ...data,
          horas_trabajadas: (financiero?.['cantidad'] as number) || 0,
          monto_horas: (financiero?.['valorizacion_bruta'] as number) || 0,
          horas_stand_by: 0,
          tarifa_stand_by: 0,
          monto_stand_by: 0,
          penalidad_exceso: (financiero?.['importe_exceso_combustible'] as number) || 0,
          descuentos:
            ((financiero?.['importe_combustible'] as number) || 0) +
            ((financiero?.['importe_manipuleo_combustible'] as number) || 0) +
            ((financiero?.['importe_gasto_obra'] as number) || 0) +
            ((financiero?.['importe_adelanto'] as number) || 0),
          subtotal: (financiero?.['valorizacion_neta'] as number) || 0,
          igv: (financiero?.['igv'] as number) || 0,
          total: (financiero?.['neto_facturar'] as number) || 0,
        } as unknown as ValuationSummary;
      })
    );
  }

  downloadPdf(id: number | string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  /** Submit draft (BORRADOR → PENDIENTE) */
  submitDraft(id: number | string): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/submit-draft`, {})
      .pipe(map((response) => response?.['data'] || response));
  }

  /** Submit valuation for review (PENDIENTE → EN_REVISION) */
  submitForReview(id: number | string): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/submit-review`, {})
      .pipe(map((response) => response?.['data'] || response));
  }

  /** Approve valuation (EN_REVISION → APROBADO) */
  approve(id: number | string): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/approve`, {})
      .pipe(map((response) => response?.['data'] || response));
  }

  /** Reject valuation (any state → RECHAZADO) */
  reject(id: number | string, reason: string): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/reject`, { reason })
      .pipe(map((response) => response?.['data'] || response));
  }

  /** Validate valuation (EN_REVISION → VALIDADO) */
  validate(id: number | string): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/validate`, {})
      .pipe(map((response) => response?.['data'] || response));
  }

  /** Reopen rejected valuation (RECHAZADO → BORRADOR) */
  reopen(id: number | string): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/reopen`, {})
      .pipe(map((response) => response?.['data'] || response));
  }

  /** Register provider conformity */
  registerConformidad(
    id: number | string,
    data: { fecha?: string; observaciones?: string }
  ): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/conformidad`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  /** Mark valuation as paid (APROBADO → PAGADO) */
  markAsPaid(id: number | string, paymentData: PaymentData): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/mark-paid`, paymentData)
      .pipe(map((response) => response?.['data'] || response));
  }

  /** Get valuation registry (consolidated cross-project) */
  getRegistry(filters?: Record<string, string | number | undefined>): Observable<unknown> {
    let params = new HttpParams();
    if (filters?.['proyecto_id']) params = params.set('proyecto_id', filters['proyecto_id']);
    if (filters?.['periodo_desde']) params = params.set('periodo_desde', filters['periodo_desde']);
    if (filters?.['periodo_hasta']) params = params.set('periodo_hasta', filters['periodo_hasta']);
    if (filters?.['estado']) params = params.set('estado', filters['estado']);
    if (filters?.['proveedor']) params = params.set('proveedor', filters['proveedor']);
    if (filters?.['equipo_id']) params = params.set('equipo_id', filters['equipo_id']);
    if (filters?.['page']) params = params.set('page', filters['page'].toString());
    if (filters?.['limit']) params = params.set('limit', filters['limit'].toString());

    // Backend returns { success, data: [...], pagination: { total, page, limit, total_pages } }
    // The apiResponseInterceptor does NOT unwrap paginated responses (pagination key present)
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/registry`, { params }).pipe(
      map((response) => {
        const items = (response['data'] as Record<string, unknown>[]) || [];
        const pagination = response['pagination'] as Record<string, number> | undefined;
        return {
          data: items.map((item) => this.toCamelCase(item)),
          total: pagination?.['total'] || items.length,
          summary: null,
        };
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  // ─── Payment Document Methods (WS-5) ───

  getPaymentDocuments(valuationId: number): Observable<Record<string, unknown>[]> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${valuationId}/payment-documents`)
      .pipe(
        map((response) => {
          const data = response?.['data'] || response;
          return Array.isArray(data) ? data : [];
        })
      );
  }

  createPaymentDocument(valuationId: number, data: Record<string, unknown>): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${valuationId}/payment-documents`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  updatePaymentDocument(docId: number, data: Record<string, unknown>): Observable<unknown> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/payment-documents/${docId}`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  checkPaymentDocsComplete(valuationId: number): Observable<{ complete: boolean }> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${valuationId}/payment-documents/check`)
      .pipe(map((response) => (response?.['data'] || response) as { complete: boolean }));
  }

  // ─── Valorizar (calculation engine) ───

  valorizar(id: number | string): Observable<Valuation> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/valorizar`, {})
      .pipe(
        map((response) =>
          this.toCamelCase((response?.['data'] || response) as Record<string, unknown>)
        )
      );
  }

  getResumen(id: number | string): Observable<Record<string, unknown>> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${id}/resumen`)
      .pipe(map((response) => (response?.['data'] || response) as Record<string, unknown>));
  }

  getResumenAcumulado(id: number | string): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}/resumen-acumulado`).pipe(
      map((response) => {
        const data = response?.['data'] || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  getPartesDetalle(id: number | string): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}/partes-detalle`).pipe(
      map((response) => {
        const data = response?.['data'] || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  getCombustibleDetalle(id: number | string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}/combustible-detalle`).pipe(
      map((response) => {
        // Interceptor unwraps {success, data} → data automatically for non-paginated
        // Backend returns { items, total_galones, precio_promedio, total_importe, ratio }
        // Frontend template expects { vales, resumen: { total_galones, ... } }
        const d = (response?.['data'] || response) as Record<string, unknown>;
        return {
          vales: (d['items'] as unknown[]) || [],
          resumen: {
            total_galones: d['total_galones'],
            precio_promedio: d['precio_promedio'],
            total_importe: d['total_importe'],
            ratio: d['ratio'],
          },
        };
      })
    );
  }

  getGastosObra(id: number | string): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}/gastos-obra`).pipe(
      map((response) => {
        const data = response?.['data'] || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  createGastoObra(valId: number, data: Record<string, unknown>): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${valId}/gastos-obra`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  updateGastoObra(gastoId: number, data: Record<string, unknown>): Observable<unknown> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/gastos-obra/${gastoId}`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  deleteGastoObra(gastoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/gastos-obra/${gastoId}`);
  }

  getAdelantos(id: number | string): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}/adelantos`).pipe(
      map((response) => {
        const data = response?.['data'] || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  createAdelanto(contractId: number, data: Record<string, unknown>): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`/api/contracts/${contractId}/adelantos`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  deleteAdelanto(adelantoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/adelantos/${adelantoId}`);
  }

  getAnalisisCombustible(id: number | string): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}/analisis-combustible`).pipe(
      map((response) => {
        const data = response?.['data'] || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  updateAnalisisCombustible(
    analisisId: number,
    data: { ratio_control?: number; precio_unitario?: number }
  ): Observable<unknown> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/analisis-combustible/${analisisId}`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  // ─── Recalculate & Discount Events (Anexo B) ───

  recalculate(id: number | string): Observable<Valuation> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${id}/recalculate`, {})
      .pipe(
        map((response) =>
          this.toCamelCase((response?.['data'] || response) as Record<string, unknown>)
        )
      );
  }

  getDiscountEvents(valuationId: number): Observable<Record<string, unknown>[]> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/${valuationId}/discount-events`)
      .pipe(
        map((response) => {
          const data = response?.['data'] || response;
          return Array.isArray(data) ? data : [];
        })
      );
  }

  createDiscountEvent(
    valuationId: number,
    data: {
      fecha: string;
      tipo: string;
      subtipo?: string;
      horas_descuento?: number;
      dias_descuento?: number;
      horas_horometro_mecanica?: number | null;
      descripcion?: string;
    }
  ): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${valuationId}/discount-events`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  deleteDiscountEvent(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/discount-events/${eventId}`);
  }

  // ─── Manual Deductions (WS-38) ───

  getManualDeductions(valuationId: number): Observable<DeduccionManual[]> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${valuationId}/deducciones`).pipe(
      map((response) => {
        const data = response?.['data'] || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  createManualDeduction(
    valuationId: number,
    data: {
      tipo: string;
      concepto: string;
      monto: number;
      num_documento?: string;
      fecha?: string;
      observaciones?: string;
    }
  ): Observable<unknown> {
    return this.http
      .post<Record<string, unknown>>(`${this.apiUrl}/${valuationId}/deducciones`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  updateManualDeduction(
    deduccionId: number,
    data: {
      tipo?: string;
      concepto?: string;
      monto?: number;
      num_documento?: string;
      fecha?: string;
      observaciones?: string;
    }
  ): Observable<unknown> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/deducciones/${deduccionId}`, data)
      .pipe(map((response) => response?.['data'] || response));
  }

  deleteManualDeduction(deduccionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/deducciones/${deduccionId}`);
  }
}

export interface DeduccionManual {
  id: number;
  valorizacion_id: number;
  tipo: string;
  concepto: string;
  num_documento?: string;
  fecha?: string;
  monto: number;
  observaciones?: string;
  creado_por?: number;
  created_at: string;
  updated_at: string;
}
