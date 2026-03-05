import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UtilizacionEquipoDto {
  equipo_id: number;
  codigo_equipo: string;
  horas_totales: number;
  horas_trabajadas: number;
  horas_inactivas: number;
  tasa_utilizacion: number;
  costo_por_hora: number;
  costo_total: number;
  periodo_inicio: string;
  periodo_fin: string;
}

export interface TendenciaUtilizacionDto {
  fecha: string;
  tasa_utilizacion: number;
  horas_trabajadas: number;
  costo: number;
}

export interface FlotaEquipoResumenDto {
  codigo_equipo: string;
  tasa_utilizacion: number;
}

export interface FlotaUtilizacionDto {
  total_equipos: number;
  equipos_activos: number;
  tasa_utilizacion_promedio: number;
  costo_total: number;
  mejores_equipos: FlotaEquipoResumenDto[];
  equipos_sub_utilizados: FlotaEquipoResumenDto[];
}

export interface CombustibleEquipoDto {
  equipo_id: number;
  total_combustible_consumido: number;
  promedio_combustible_por_hora: number;
  costo_total_combustible: number;
  costo_promedio_por_hora: number;
  eficiencia: 'buena' | 'promedio' | 'deficiente';
}

export interface TendenciaCombustibleDto {
  fecha: string;
  combustible_consumido: number;
  costo_combustible: number;
  combustible_por_hora: number;
}

// apiResponseInterceptor auto-unwraps { success, data } → data, so services return the DTO directly.
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);

  obtenerUtilizacionEquipo(
    equipoId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<UtilizacionEquipoDto> {
    return this.http.get<UtilizacionEquipoDto>(`/api/analytics/equipment/${equipoId}/utilization`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
  }

  obtenerTendenciaUtilizacion(
    equipoId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<TendenciaUtilizacionDto[]> {
    return this.http.get<TendenciaUtilizacionDto[]>(
      `/api/analytics/equipment/${equipoId}/utilization-trend`,
      { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } }
    );
  }

  obtenerFlotaUtilizacion(fechaInicio: string, fechaFin: string): Observable<FlotaUtilizacionDto> {
    return this.http.get<FlotaUtilizacionDto>(`/api/analytics/fleet/utilization`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
  }

  obtenerCombustibleEquipo(
    equipoId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<CombustibleEquipoDto> {
    return this.http.get<CombustibleEquipoDto>(`/api/analytics/equipment/${equipoId}/fuel`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
  }

  obtenerTendenciaCombustible(
    equipoId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<TendenciaCombustibleDto[]> {
    return this.http.get<TendenciaCombustibleDto[]>(
      `/api/analytics/equipment/${equipoId}/fuel-trend`,
      { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } }
    );
  }
}
