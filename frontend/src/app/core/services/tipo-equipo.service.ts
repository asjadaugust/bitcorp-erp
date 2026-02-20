import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CategoriaPrd =
  | 'MAQUINARIA_PESADA'
  | 'VEHICULOS_PESADOS'
  | 'VEHICULOS_LIVIANOS'
  | 'EQUIPOS_MENORES';

export interface TipoEquipo {
  id: number;
  codigo: string;
  nombre: string;
  categoria_prd: CategoriaPrd;
  descripcion: string | null;
  activo: boolean;
}

export interface CategoriaPrdGrupo {
  categoria_prd: CategoriaPrd;
  label: string;
  tipos: TipoEquipo[];
}

export const CATEGORIA_PRD_LABELS: Record<CategoriaPrd, string> = {
  MAQUINARIA_PESADA: 'Maquinaria Pesada',
  VEHICULOS_PESADOS: 'Vehículos Pesados',
  VEHICULOS_LIVIANOS: 'Vehículos Livianos',
  EQUIPOS_MENORES: 'Equipos Menores',
};

export const CATEGORIA_PRD_COLORS: Record<CategoriaPrd, string> = {
  MAQUINARIA_PESADA: 'badge-cat-maquinaria',
  VEHICULOS_PESADOS: 'badge-cat-pesado',
  VEHICULOS_LIVIANOS: 'badge-cat-liviano',
  EQUIPOS_MENORES: 'badge-cat-menor',
};

@Injectable({ providedIn: 'root' })
export class TipoEquipoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tipos-equipo`;

  listar(): Observable<TipoEquipo[]> {
    return this.http.get<any>(this.apiUrl).pipe(map((r) => r.data ?? r));
  }

  listarAgrupados(): Observable<CategoriaPrdGrupo[]> {
    return this.http.get<any>(`${this.apiUrl}/agrupados`).pipe(map((r) => r.data ?? r));
  }

  listarPorCategoria(categoriaPrd: CategoriaPrd): Observable<TipoEquipo[]> {
    return this.http
      .get<any>(`${this.apiUrl}/categoria/${categoriaPrd}`)
      .pipe(map((r) => r.data ?? r));
  }
}
