import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ─── EDT Interfaces ──────────────────────────────────────────────────────

export interface EquipoEdtLista {
  id: number;
  parte_diario_id: number | null;
  edt_id: number | null;
  porcentaje: number | null;
  edt_nombre: string | null;
  actividad: string | null;
}

export interface EquipoEdtCrear {
  parte_diario_id?: number;
  parte_diario_legacy_id?: string;
  edt_id?: number;
  porcentaje?: number;
  edt_nombre?: string;
  actividad?: string;
}

export interface EquipoEdtActualizar {
  edt_id?: number;
  porcentaje?: number;
  edt_nombre?: string;
  actividad?: string;
}

export interface ValidacionPorcentaje {
  valid: boolean;
  total: number;
}

// ─── Combustible Interfaces ──────────────────────────────────────────────

export interface EquipoCombustibleLista {
  id: number;
  numero_vale_salida: number | null;
  fecha: string | null;
  cantidad: number | null;
  precio_unitario_sin_igv: number | null;
  importe: number | null;
  comentario: string | null;
}

export interface EquipoCombustibleCrear {
  valorizacion_legacy_id?: string;
  numero_vale_salida?: number;
  fecha?: string;
  horometro_odometro?: string;
  inicial?: number;
  cantidad?: number;
  precio_unitario_sin_igv?: number;
  comentario?: string;
}

export interface EquipoCombustibleActualizar {
  numero_vale_salida?: number;
  fecha?: string;
  horometro_odometro?: string;
  inicial?: number;
  cantidad?: number;
  precio_unitario_sin_igv?: number;
  comentario?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root',
})
export class EquipoAsociacionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/equipment/associations`;

  // ── EDT ──

  getEdtList(parteDiarioId: number): Observable<EquipoEdtLista[]> {
    const params = new HttpParams().set('parte_diario_id', parteDiarioId.toString());
    return this.http.get<EquipoEdtLista[]>(`${this.apiUrl}/edt`, { params });
  }

  createEdt(data: EquipoEdtCrear): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/edt`, data);
  }

  validateEdt(parteDiarioId: number): Observable<ValidacionPorcentaje> {
    return this.http.get<ValidacionPorcentaje>(`${this.apiUrl}/edt/validate/${parteDiarioId}`);
  }

  getEdtDetail(id: number): Observable<EquipoEdtLista> {
    return this.http.get<EquipoEdtLista>(`${this.apiUrl}/edt/${id}`);
  }

  updateEdt(id: number, data: EquipoEdtActualizar): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(`${this.apiUrl}/edt/${id}`, data);
  }

  deleteEdt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/edt/${id}`);
  }

  // ── Combustible ──

  getCombustibleList(valorizacionLegacyId: string): Observable<EquipoCombustibleLista[]> {
    const params = new HttpParams().set('valorizacion_legacy_id', valorizacionLegacyId);
    return this.http.get<EquipoCombustibleLista[]>(`${this.apiUrl}/combustible`, { params });
  }

  createCombustible(data: EquipoCombustibleCrear): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/combustible`, data);
  }

  getCombustibleDetail(id: number): Observable<EquipoCombustibleLista> {
    return this.http.get<EquipoCombustibleLista>(`${this.apiUrl}/combustible/${id}`);
  }

  updateCombustible(id: number, data: EquipoCombustibleActualizar): Observable<{ id: number }> {
    return this.http.put<{ id: number }>(`${this.apiUrl}/combustible/${id}`, data);
  }

  deleteCombustible(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/combustible/${id}`);
  }
}
