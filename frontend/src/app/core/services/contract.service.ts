import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Contract } from '../models/contract.model';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/contracts`;

  /**
   * Map backend DTO (Spanish snake_case) to frontend model
   * Backend returns all Spanish fields directly
   */
  private mapBackendToFrontend(backendData: any): Contract {
    // Compute display fields
    const equipoInfo =
      backendData.equipo_marca && backendData.equipo_modelo && backendData.equipo_placa
        ? `${backendData.equipo_marca} ${backendData.equipo_modelo} / ${backendData.equipo_placa}`
        : backendData.equipo_marca && backendData.equipo_modelo
          ? `${backendData.equipo_marca} ${backendData.equipo_modelo}`
          : '';

    return {
      // Core fields from API (Spanish snake_case)
      id: backendData.id,
      legacy_id: backendData.legacy_id,
      numero_contrato: backendData.numero_contrato,
      equipo_id: backendData.equipo_id,
      equipo_codigo: backendData.equipo_codigo,
      equipo_marca: backendData.equipo_marca,
      equipo_modelo: backendData.equipo_modelo,
      equipo_placa: backendData.equipo_placa,
      proveedor_id: backendData.proveedor_id,
      tipo: backendData.tipo,
      contrato_padre_id: backendData.contrato_padre_id,
      fecha_contrato: backendData.fecha_contrato,
      fecha_inicio: backendData.fecha_inicio,
      fecha_fin: backendData.fecha_fin,
      duracion_dias: backendData.duracion_dias,
      moneda: backendData.moneda,
      tipo_tarifa: backendData.tipo_tarifa,
      tarifa: backendData.tarifa,
      modalidad: backendData.modalidad,
      minimo_por: backendData.minimo_por,
      incluye_motor: backendData.incluye_motor,
      incluye_operador: backendData.incluye_operador,
      costo_adicional_motor: backendData.costo_adicional_motor,
      horas_incluidas: backendData.horas_incluidas,
      penalidad_exceso: backendData.penalidad_exceso,
      documento_acredita: backendData.documento_acredita,
      fecha_acreditada: backendData.fecha_acreditada,
      jurisdiccion: backendData.jurisdiccion,
      plazo_texto: backendData.plazo_texto,
      motivo_resolucion: backendData.motivo_resolucion,
      fecha_resolucion: backendData.fecha_resolucion,
      monto_liquidacion: backendData.monto_liquidacion,
      condiciones_especiales: backendData.condiciones_especiales,
      documento_url: backendData.documento_url,
      estado: backendData.estado,
      created_at: backendData.created_at,
      updated_at: backendData.updated_at,
      creado_por: backendData.creado_por,

      // Computed display fields
      modalidad_display: this.translateModalidad(backendData.modalidad),
      tipo_tarifa_display: this.translateTipoTarifa(backendData.tipo_tarifa),
      proveedor_razon_social: backendData.proveedor_razon_social || '',
      equipo_info: equipoInfo,
    } as any;
  }

  /**
   * Map frontend model to backend DTO for create/update operations
   */
  /**
   * Map frontend model to backend DTO for create/update operations
   */
  private mapFrontendToBackend(frontendData: any): any {
    return {
      ...frontendData,
      // Ensure specific fields are mapped correctly
      equipo_id: frontendData.equipo_id ? Number(frontendData.equipo_id) : null,
      proveedor_id: frontendData.proveedor_id ? Number(frontendData.proveedor_id) : null,
      tarifa: frontendData.tarifa ? Number(frontendData.tarifa) : 0,
      costo_adicional_motor: frontendData.costo_adicional_motor
        ? Number(frontendData.costo_adicional_motor)
        : 0,
      horas_incluidas: frontendData.horas_incluidas ? Number(frontendData.horas_incluidas) : 0,
      penalidad_exceso: frontendData.penalidad_exceso ? Number(frontendData.penalidad_exceso) : 0,

      // Default required fields if missing
      tipo: frontendData.tipo || 'CONTRATO',
      incluye_motor: !!frontendData.incluye_motor,
      incluye_operador: !!frontendData.incluye_operador,

      // Estado already in uppercase from frontend
      estado: frontendData.estado || 'ACTIVO',

      // Remove computed display fields
      proveedor_razon_social: undefined,
      equipo_info: undefined,
      modalidad_display: undefined,
      tipo_tarifa_display: undefined,
    };
  }

  private translateModalidad(modalidad: string): string {
    if (!modalidad) return '-';
    const map: Record<string, string> = {
      alquiler_seco: 'Alquiler Seco',
      alquiler_con_operador: 'Alquiler con Operador',
      alquiler_todo_costo: 'Alquiler Todo Costo',
      servicio: 'Servicio',
    };
    return map[modalidad] || modalidad;
  }

  private translateTipoTarifa(tipo: string): string {
    if (!tipo) return '-';
    const map: Record<string, string> = {
      POR_HORA: 'Por Hora',
      POR_DIA: 'Por Día',
      FIJO: 'Fijo',
    };
    return map[tipo] || tipo;
  }

  getAll(filters: any = {}): Observable<Contract[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.equipmentId) params = params.set('equipmentId', filters.equipmentId);

    // DEFAULT LIMIT: Backend defaults to limit=10, but for dropdowns/lists we want all
    // Set default limit to 100 to show all contracts unless explicitly filtered
    if (!filters.limit) {
      params = params.set('limit', '100');
    }

    // API might return paginated response: {success, data, pagination}
    // Extract data array if it exists, otherwise return as-is
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        let data = response;
        if (response && typeof response === 'object' && 'data' in response) {
          data = response.data;
        }
        const contracts = Array.isArray(data) ? data : [];
        return contracts.map((c) => this.mapBackendToFrontend(c));
      })
    );
  }

  getById(id: string): Observable<Contract> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        // Handle both direct data and wrapped response
        const data = response?.data || response;
        return this.mapBackendToFrontend(data);
      })
    );
  }

  create(contract: Omit<Contract, 'id'>): Observable<Contract> {
    const backendData = this.mapFrontendToBackend(contract);
    return this.http.post<any>(this.apiUrl, backendData).pipe(
      map((response) => {
        const data = response?.data || response;
        return this.mapBackendToFrontend(data);
      })
    );
  }

  update(id: string, contract: Partial<Contract>): Observable<Contract> {
    const backendData = this.mapFrontendToBackend(contract);
    return this.http.put<any>(`${this.apiUrl}/${id}`, backendData).pipe(
      map((response) => {
        const data = response?.data || response;
        return this.mapBackendToFrontend(data);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  resolver(
    id: string,
    data: {
      causal_resolucion: string;
      motivo_resolucion: string;
      fecha_resolucion: string;
      monto_liquidacion?: number;
    }
  ): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/resolver`, data)
      .pipe(map((res) => res?.data || res));
  }

  liquidationCheck(id: string): Observable<{
    puede_liquidar: boolean;
    contrato_estado: string;
    valorizaciones_pendientes: number;
    total_valorizaciones: number;
    tiene_acta_devolucion: boolean;
    observaciones: string[];
  }> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}/liquidation-check`)
      .pipe(map((res) => res?.data || res));
  }

  liquidar(
    id: string,
    data: {
      fecha_liquidacion: string;
      monto_liquidacion?: number;
      observaciones_liquidacion?: string;
    }
  ): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${id}/liquidar`, data)
      .pipe(map((res) => res?.data || res));
  }

  getAddendums(contractId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${contractId}/addendums`).pipe(
      map((response: any) => {
        const data = response?.data || response;
        const addendums = Array.isArray(data) ? data : [];
        return addendums.map((a) => this.mapBackendToFrontend(a));
      })
    );
  }

  createAddendum(contractId: string, data: any): Observable<any> {
    const backendData = this.mapFrontendToBackend(data);
    return this.http.post<any>(`${this.apiUrl}/${contractId}/addendums`, backendData).pipe(
      map((response) => {
        const responseData = response?.data || response;
        return this.mapBackendToFrontend(responseData);
      })
    );
  }

  downloadPdf(contractId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${contractId}/pdf`, { responseType: 'blob' });
  }

  // ─── Annex methods (WS-3) ───

  getAnnexes(contractId: string, tipo?: 'A' | 'B'): Observable<any[]> {
    let params = new HttpParams();
    if (tipo) params = params.set('tipo', tipo);
    return this.http.get<any>(`${this.apiUrl}/${contractId}/annexes`, { params }).pipe(
      map((response) => {
        const data = response?.data || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  saveAnnexes(contractId: string, tipo: 'A' | 'B', items: any[]): Observable<any[]> {
    return this.http.put<any>(`${this.apiUrl}/${contractId}/annexes/${tipo}`, { items }).pipe(
      map((response) => {
        const data = response?.data || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  // ─── Required Document methods (WS-4) ───

  getRequiredDocuments(contractId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/${contractId}/required-documents`).pipe(
      map((response) => {
        const data = response?.data || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  initializeRequiredDocuments(contractId: string): Observable<any[]> {
    return this.http
      .post<any>(`${this.apiUrl}/${contractId}/required-documents/initialize`, {})
      .pipe(
        map((response) => {
          const data = response?.data || response;
          return Array.isArray(data) ? data : [];
        })
      );
  }

  updateRequiredDocument(docId: number, data: any): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/required-documents/${docId}`, data)
      .pipe(map((response) => response?.data || response));
  }

  // ─── Obligaciones del Arrendador (WS-21) ───

  getObligaciones(contractId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/${contractId}/obligaciones`).pipe(
      map((response) => {
        const data = response?.data || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  initializeObligaciones(contractId: string): Observable<any[]> {
    return this.http.post<any>(`${this.apiUrl}/${contractId}/obligaciones/initialize`, {}).pipe(
      map((response) => {
        const data = response?.data || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  updateObligacion(
    obligacionId: number,
    data: { estado?: string; fecha_compromiso?: string | null; observaciones?: string | null }
  ): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/obligaciones/${obligacionId}`, data)
      .pipe(map((response) => response?.data || response));
  }
}
