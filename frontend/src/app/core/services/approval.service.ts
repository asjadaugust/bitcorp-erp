import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface PlantillaPasoDto {
  id: number;
  plantilla_id: number;
  paso_numero: number;
  nombre_paso: string;
  tipo_aprobador: string;
  rol?: string;
  usuario_id?: number;
  logica_aprobacion: string;
  es_opcional: boolean;
}

export interface PlantillaAprobacionDto {
  id: number;
  tenant_id?: number;
  nombre: string;
  module_name: string;
  proyecto_id?: number;
  version: number;
  estado: string;
  descripcion?: string;
  created_at: string;
  created_by?: number;
  pasos?: PlantillaPasoDto[];
}

export interface PasoActualInfoDto {
  nombre_paso: string;
  tipo_aprobador: string;
  rol?: string;
  usuario_aprobador_id?: number;
}

export interface PasoSolicitudDto {
  id: number;
  solicitud_id: number;
  paso_numero: number;
  aprobador_id?: number;
  estado_paso: string;
  accion_fecha?: string;
  comentario?: string;
  nombre_paso?: string;
  tipo_aprobador?: string;
  rol?: string;
  usuario_aprobador_id?: number;
}

export interface SolicitudAprobacionDto {
  id: number;
  tenant_id?: number;
  plantilla_id?: number;
  plantilla_version?: number;
  module_name: string;
  entity_id: number;
  proyecto_id?: number;
  usuario_solicitante_id: number;
  titulo: string;
  descripcion?: string;
  estado: string;
  paso_actual: number;
  fecha_creacion: string;
  fecha_completado?: string;
  completado_por_id?: number;
  pasos?: PasoSolicitudDto[];
  paso_actual_info?: PasoActualInfoDto;
}

export interface DashboardItemDto {
  id: number;
  tipo: 'template' | 'adhoc';
  titulo: string;
  estado: string;
  module_name?: string;
  fecha_creacion: string;
  usuario_solicitante_id: number;
  paso_actual?: number;
  total_pasos?: number;
  paso_actual_info?: PasoActualInfoDto;
}

export interface SolicitudAdhocDto {
  id: number;
  usuario_solicitante_id: number;
  titulo: string;
  descripcion?: string;
  aprobadores: number[];
  usuarios_cc: number[];
  logica_aprobacion: string;
  estado: string;
  fecha_creacion: string;
  fecha_completado?: string;
}

export interface DashboardStatsDto {
  pendientes_recibidos: number;
  pendientes_enviados: number;
  aprobados_hoy: number;
  rechazados_hoy: number;
}

export interface UserSearchResult {
  id: number;
  nombre: string;
  email: string;
  rol?: string;
}

export interface AuditoriaItem {
  id: number;
  accion: string;
  usuario_id: number;
  paso_numero?: number;
  comentario?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CrearPlantillaDto {
  nombre: string;
  module_name: string;
  proyecto_id?: number;
  descripcion?: string;
  pasos: {
    paso_numero: number;
    nombre_paso: string;
    tipo_aprobador: 'ROLE' | 'USER_ID';
    rol?: string;
    usuario_id?: number;
    logica_aprobacion: 'ALL_MUST_APPROVE' | 'FIRST_APPROVES';
    es_opcional?: boolean;
  }[];
}

export interface CrearAdhocDto {
  titulo: string;
  descripcion?: string;
  aprobadores: number[];
  usuarios_cc?: number[];
  logica_aprobacion?: 'ALL_MUST_APPROVE' | 'FIRST_APPROVES';
}

// ─── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ApprovalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/approvals`;

  // Templates
  getTemplates(): Observable<PlantillaAprobacionDto[]> {
    return this.http.get<PlantillaAprobacionDto[]>(`${this.apiUrl}/templates`);
  }

  getTemplate(id: number): Observable<PlantillaAprobacionDto> {
    return this.http.get<PlantillaAprobacionDto>(`${this.apiUrl}/templates/${id}`);
  }

  createTemplate(dto: CrearPlantillaDto): Observable<PlantillaAprobacionDto> {
    return this.http.post<PlantillaAprobacionDto>(`${this.apiUrl}/templates`, dto);
  }

  updateTemplate(id: number, dto: CrearPlantillaDto): Observable<PlantillaAprobacionDto> {
    return this.http.put<PlantillaAprobacionDto>(`${this.apiUrl}/templates/${id}`, dto);
  }

  activateTemplate(id: number): Observable<PlantillaAprobacionDto> {
    return this.http.post<PlantillaAprobacionDto>(`${this.apiUrl}/templates/${id}/activate`, {});
  }

  archiveTemplate(id: number): Observable<PlantillaAprobacionDto> {
    return this.http.post<PlantillaAprobacionDto>(`${this.apiUrl}/templates/${id}/archive`, {});
  }

  // Dashboard
  getDashboardRecibidos(): Observable<DashboardItemDto[]> {
    return this.http.get<DashboardItemDto[]>(`${this.apiUrl}/dashboard/recibidos`);
  }

  getDashboardEnviados(): Observable<DashboardItemDto[]> {
    return this.http.get<DashboardItemDto[]>(`${this.apiUrl}/dashboard/enviados`);
  }

  getDashboardStats(): Observable<DashboardStatsDto> {
    return this.http.get<DashboardStatsDto>(`${this.apiUrl}/dashboard/stats`);
  }

  // Requests
  getRequests(): Observable<SolicitudAprobacionDto[]> {
    return this.http.get<SolicitudAprobacionDto[]>(`${this.apiUrl}/requests`);
  }

  getRequest(id: number): Observable<SolicitudAprobacionDto> {
    return this.http.get<SolicitudAprobacionDto>(`${this.apiUrl}/requests/${id}`);
  }

  approveRequest(id: number, comentario?: string): Observable<SolicitudAprobacionDto> {
    return this.http.post<SolicitudAprobacionDto>(`${this.apiUrl}/requests/${id}/approve`, {
      comentario,
    });
  }

  rejectRequest(id: number, comentario: string): Observable<SolicitudAprobacionDto> {
    return this.http.post<SolicitudAprobacionDto>(`${this.apiUrl}/requests/${id}/reject`, {
      comentario,
    });
  }

  getRequestAudit(id: number): Observable<AuditoriaItem[]> {
    return this.http.get<AuditoriaItem[]>(`${this.apiUrl}/requests/${id}/audit`);
  }

  // Ad-hoc
  getAdhocList(): Observable<{ enviados: SolicitudAdhocDto[]; pendientes: SolicitudAdhocDto[] }> {
    return this.http.get<{ enviados: SolicitudAdhocDto[]; pendientes: SolicitudAdhocDto[] }>(
      `${this.apiUrl}/adhoc`
    );
  }

  createAdhoc(dto: CrearAdhocDto): Observable<SolicitudAdhocDto> {
    return this.http.post<SolicitudAdhocDto>(`${this.apiUrl}/adhoc`, dto);
  }

  respondAdhoc(
    id: number,
    respuesta: 'APROBADO' | 'RECHAZADO',
    comentario?: string
  ): Observable<SolicitudAdhocDto> {
    return this.http.post<SolicitudAdhocDto>(`${this.apiUrl}/adhoc/${id}/respond`, {
      respuesta,
      comentario,
    });
  }

  cancelRequest(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/requests/${id}/cancel`, {});
  }

  searchUsers(query: string): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(`${environment.apiUrl}/users/search`, {
      params: { q: query },
    });
  }
}
