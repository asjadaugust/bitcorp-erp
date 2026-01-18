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
    const equipmentInfo =
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
      condiciones_especiales: backendData.condiciones_especiales,
      documento_url: backendData.documento_url,
      estado: backendData.estado,
      created_at: backendData.created_at,
      updated_at: backendData.updated_at,
      creado_por: backendData.creado_por,

      // Computed display fields for table compatibility
      code: backendData.numero_contrato || backendData.equipo_codigo,
      provider_name: backendData.proveedor_razon_social || '',
      equipment_info: equipmentInfo,
      project_name: backendData.project_name,
      client_name: backendData.client_name,
      start_date: backendData.fecha_inicio,
      end_date: backendData.fecha_fin,
      status: this.mapEstadoBackendToFrontend(backendData.estado),
    } as any;
  }

  /**
   * Map frontend model to backend DTO for create/update operations
   */
  private mapFrontendToBackend(frontendData: any): any {
    return {
      ...frontendData,
      // Ensure Spanish field names are used
      equipo_id: frontendData.equipo_id,
      proveedor_id: frontendData.proveedor_id,
      // Map estado values (keep uppercase for backend)
      estado: this.mapEstadoFrontendToBackend(frontendData.estado),
      // Remove computed display fields
      code: undefined,
      provider_name: undefined,
      equipment_info: undefined,
      project_name: undefined,
      client_name: undefined,
      start_date: undefined,
      end_date: undefined,
      status: undefined,
    };
  }

  /**
   * Map backend estado (UPPERCASE) to frontend estado (lowercase)
   */
  private mapEstadoBackendToFrontend(estado: string): string {
    if (!estado) return 'activo';
    const estadoMap: Record<string, string> = {
      ACTIVO: 'activo',
      VENCIDO: 'vencido',
      CANCELADO: 'vencido', // Treat cancelled as expired
      BORRADOR: 'activo', // Treat draft as active
    };
    return estadoMap[estado] || estado.toLowerCase();
  }

  /**
   * Map frontend estado (lowercase) to backend estado (UPPERCASE)
   */
  private mapEstadoFrontendToBackend(estado: string): string {
    if (!estado) return 'ACTIVO';
    const estadoMap: Record<string, string> = {
      activo: 'ACTIVO',
      proximo_vencer: 'ACTIVO', // Near expiry is still active
      vencido: 'VENCIDO',
      extendido: 'ACTIVO', // Extended is active
    };
    return estadoMap[estado] || estado.toUpperCase();
  }

  getAll(filters: any = {}): Observable<Contract[]> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
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
}
