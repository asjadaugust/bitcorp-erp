import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApuInsumoLine {
  id: number;
  apu_id: number;
  insumo_id: number | null;
  sub_apu_id: number | null;
  tipo: string;
  cantidad: number;
  precio: number | null;
  aporte: number | null;
  es_porcentaje: boolean;
  porcentaje: number | null;
  orden: number;
  insumo_nombre: string | null;
  insumo_unidad: string | null;
  sub_apu_nombre: string | null;
  costo: number;
}

export interface ApuListItem {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  rendimiento: number;
  precio_unitario: number;
  created_at: string;
}

export interface ApuDetail {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  rendimiento: number;
  jornada: number;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  mano_obra: ApuInsumoLine[];
  materiales: ApuInsumoLine[];
  equipos: ApuInsumoLine[];
  herramientas: ApuInsumoLine[];
  subcontratos: ApuInsumoLine[];
  total_mano_obra: number;
  total_materiales: number;
  total_equipos: number;
  total_herramientas: number;
  total_subcontratos: number;
  precio_unitario: number;
}

export interface ApuDropdownItem {
  id: number;
  codigo: string;
  nombre: string;
  unidad_medida: string;
  precio_unitario: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApuService {
  private apiUrl = `${environment.apiUrl}/apus`;
  private http = inject(HttpClient);

  getAllPaginated(params?: { page?: number; limit?: number; search?: string }): Observable<{
    data: ApuListItem[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<Record<string, unknown>>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        const data = (response?.['data'] as ApuListItem[]) ?? [];
        const pagination = (response?.['pagination'] as {
          page: number;
          limit: number;
          total: number;
          total_pages: number;
        }) ?? { page: 1, limit: params?.limit ?? 20, total: data.length, total_pages: 1 };
        return { data, pagination };
      })
    );
  }

  getDropdownOptions(): Observable<ApuDropdownItem[]> {
    return this.http.get<ApuDropdownItem[]>(`${this.apiUrl}/dropdown`);
  }

  getById(id: number): Observable<ApuDetail> {
    return this.http.get<ApuDetail>(`${this.apiUrl}/${id}`);
  }

  create(data: {
    codigo: string;
    nombre: string;
    unidad_medida: string;
    rendimiento?: number;
    jornada?: number;
    descripcion?: string;
  }): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, data);
  }

  update(
    id: number,
    data: {
      nombre?: string;
      unidad_medida?: string;
      rendimiento?: number;
      jornada?: number;
      descripcion?: string;
    }
  ): Observable<ApuDetail> {
    return this.http.put<ApuDetail>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addInsumo(
    apuId: number,
    data: {
      insumo_id?: number;
      sub_apu_id?: number;
      tipo: string;
      cantidad?: number;
      precio?: number;
      aporte?: number;
      es_porcentaje?: boolean;
      porcentaje?: number;
      orden?: number;
    }
  ): Observable<ApuDetail> {
    return this.http.post<ApuDetail>(`${this.apiUrl}/${apuId}/insumos`, data);
  }

  updateInsumo(
    apuId: number,
    lineId: number,
    data: {
      cantidad?: number;
      precio?: number;
      aporte?: number;
      es_porcentaje?: boolean;
      porcentaje?: number;
      orden?: number;
    }
  ): Observable<ApuDetail> {
    return this.http.put<ApuDetail>(`${this.apiUrl}/${apuId}/insumos/${lineId}`, data);
  }

  removeInsumo(apuId: number, lineId: number): Observable<ApuDetail> {
    return this.http.delete<ApuDetail>(`${this.apiUrl}/${apuId}/insumos/${lineId}`);
  }

  duplicate(apuId: number): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${this.apiUrl}/${apuId}/duplicar`, {});
  }

  calculate(apuId: number): Observable<ApuDetail> {
    return this.http.get<ApuDetail>(`${this.apiUrl}/${apuId}/calcular`);
  }
}
