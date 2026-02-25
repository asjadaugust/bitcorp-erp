import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PrecalentamientoConfig {
  id: number;
  tipo_equipo_id: number;
  tipo_equipo_codigo: string;
  tipo_equipo_nombre: string;
  categoria_prd: string;
  horas_precalentamiento: number;
  activo: boolean;
  updated_at: string;
}

export interface HorasPrecalentamiento {
  tipo_equipo_id: number;
  horas_precalentamiento: number;
}

@Injectable({ providedIn: 'root' })
export class PrecalentamientoConfigService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/precalentamiento-config`;

  /** Lista todas las configuraciones ordenadas por categoría */
  listar(): Observable<PrecalentamientoConfig[]> {
    return this.http.get<Record<string, unknown>>(this.apiUrl).pipe(map((r) => r.data ?? r));
  }

  /** Obtiene la configuración para un tipo_equipo_id */
  obtenerPorTipoEquipo(tipoEquipoId: number): Observable<PrecalentamientoConfig> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/tipo-equipo/${tipoEquipoId}`)
      .pipe(map((r) => r.data ?? r));
  }

  /** Obtiene solo las horas de precalentamiento (endpoint ligero) */
  obtenerHoras(tipoEquipoId: number): Observable<HorasPrecalentamiento> {
    return this.http
      .get<Record<string, unknown>>(`${this.apiUrl}/tipo-equipo/${tipoEquipoId}/horas`)
      .pipe(map((r) => r.data ?? r));
  }

  /** Actualiza las horas de precalentamiento para un tipo_equipo_id */
  actualizar(
    tipoEquipoId: number,
    horasPrecalentamiento: number
  ): Observable<PrecalentamientoConfig> {
    return this.http
      .put<Record<string, unknown>>(`${this.apiUrl}/tipo-equipo/${tipoEquipoId}`, {
        horas_precalentamiento: horasPrecalentamiento,
      })
      .pipe(map((r) => r.data ?? r));
  }
}
