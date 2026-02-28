import { PlantillaAprobacion } from '../../models/plantilla-aprobacion.model';
import { PlantillaPaso } from '../../models/plantilla-paso.model';
import { SolicitudAprobacion } from '../../models/solicitud-aprobacion.model';
import { PasoSolicitud } from '../../models/paso-solicitud.model';
import { SolicitudAdhoc } from '../../models/solicitud-adhoc.model';
import { RespuestaAdhoc } from '../../models/respuesta-adhoc.model';
import { AuditoriaAprobacion } from '../../models/auditoria-aprobacion.model';

// ─── Output DTOs ──────────────────────────────────────────────────────────────

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

export interface RespuestaAdhocDto {
  id: number;
  solicitud_adhoc_id: number;
  aprobador_id: number;
  respuesta: string;
  comentario?: string;
  fecha_respuesta: string;
}

export interface SolicitudAdhocDto {
  id: number;
  tenant_id?: number;
  usuario_solicitante_id: number;
  titulo: string;
  descripcion?: string;
  aprobadores: number[];
  usuarios_cc: number[];
  logica_aprobacion: string;
  estado: string;
  fecha_creacion: string;
  fecha_completado?: string;
  archivos_adjuntos?: Record<string, unknown>;
}

export interface AuditoriaAprobacionDto {
  id: number;
  solicitud_id?: number;
  solicitud_adhoc_id?: number;
  plantilla_version?: number;
  accion: string;
  usuario_id: number;
  paso_numero?: number;
  comentario?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardStatsDto {
  pendientes_recibidos: number;
  pendientes_enviados: number;
  aprobados_hoy: number;
  rechazados_hoy: number;
}

// ─── Input DTOs ───────────────────────────────────────────────────────────────

export interface CrearPasoDto {
  paso_numero: number;
  nombre_paso: string;
  tipo_aprobador: 'ROLE' | 'USER_ID';
  rol?: string;
  usuario_id?: number;
  logica_aprobacion: 'ALL_MUST_APPROVE' | 'FIRST_APPROVES';
  es_opcional?: boolean;
}

export interface CrearPlantillaDto {
  nombre: string;
  module_name: 'daily_report' | 'valorizacion' | 'solicitud_equipo' | 'adhoc';
  proyecto_id?: number;
  descripcion?: string;
  pasos: CrearPasoDto[];
}

export interface InstanciarSolicitudDto {
  module_name: 'daily_report' | 'valorizacion' | 'solicitud_equipo';
  entity_id: number;
  proyecto_id?: number;
  titulo: string;
  descripcion?: string;
}

export interface ResponderSolicitudDto {
  comentario?: string;
}

export interface CrearAdhocDto {
  titulo: string;
  descripcion?: string;
  aprobadores: number[];
  usuarios_cc?: number[];
  logica_aprobacion?: 'ALL_MUST_APPROVE' | 'FIRST_APPROVES';
  archivos_adjuntos?: Record<string, unknown>;
}

// ─── Transformer Functions ────────────────────────────────────────────────────

export function toPlantillaPasoDto(paso: PlantillaPaso): PlantillaPasoDto {
  return {
    id: paso.id,
    plantilla_id: paso.plantillaId,
    paso_numero: paso.pasoNumero,
    nombre_paso: paso.nombrePaso,
    tipo_aprobador: paso.tipoAprobador,
    rol: paso.rol,
    usuario_id: paso.usuarioId,
    logica_aprobacion: paso.logicaAprobacion,
    es_opcional: paso.esOpcional,
  };
}

export function toPlantillaDto(plantilla: PlantillaAprobacion): PlantillaAprobacionDto {
  return {
    id: plantilla.id,
    tenant_id: plantilla.tenantId,
    nombre: plantilla.nombre,
    module_name: plantilla.moduleName,
    proyecto_id: plantilla.proyectoId,
    version: plantilla.version,
    estado: plantilla.estado,
    descripcion: plantilla.descripcion,
    created_at: plantilla.createdAt?.toISOString(),
    created_by: plantilla.createdBy,
    pasos: plantilla.pasos?.map(toPlantillaPasoDto),
  };
}

export function toPasoSolicitudDto(
  paso: PasoSolicitud,
  plantillaPaso?: PlantillaPaso
): PasoSolicitudDto {
  return {
    id: paso.id,
    solicitud_id: paso.solicitudId,
    paso_numero: paso.pasoNumero,
    aprobador_id: paso.aprobadorId,
    estado_paso: paso.estadoPaso,
    accion_fecha: paso.accionFecha?.toISOString(),
    comentario: paso.comentario,
    nombre_paso: plantillaPaso?.nombrePaso,
    tipo_aprobador: plantillaPaso?.tipoAprobador,
    rol: plantillaPaso?.rol,
    usuario_aprobador_id: plantillaPaso?.usuarioId,
  };
}

export function toSolicitudDto(
  solicitud: SolicitudAprobacion,
  plantillaPasos?: PlantillaPaso[]
): SolicitudAprobacionDto {
  const pasoMap = new Map<number, PlantillaPaso>();
  if (plantillaPasos) {
    for (const pp of plantillaPasos) {
      pasoMap.set(pp.pasoNumero, pp);
    }
  }

  const currentPP = pasoMap.get(solicitud.pasoActual);

  return {
    id: solicitud.id,
    tenant_id: solicitud.tenantId,
    plantilla_id: solicitud.plantillaId,
    plantilla_version: solicitud.plantillaVersion,
    module_name: solicitud.moduleName,
    entity_id: solicitud.entityId,
    proyecto_id: solicitud.proyectoId,
    usuario_solicitante_id: solicitud.usuarioSolicitanteId,
    titulo: solicitud.titulo,
    descripcion: solicitud.descripcion,
    estado: solicitud.estado,
    paso_actual: solicitud.pasoActual,
    fecha_creacion: solicitud.fechaCreacion?.toISOString(),
    fecha_completado: solicitud.fechaCompletado?.toISOString(),
    completado_por_id: solicitud.completadoPorId,
    pasos: solicitud.pasos?.map((p) => toPasoSolicitudDto(p, pasoMap.get(p.pasoNumero))),
    paso_actual_info: currentPP
      ? {
          nombre_paso: currentPP.nombrePaso,
          tipo_aprobador: currentPP.tipoAprobador,
          rol: currentPP.rol,
          usuario_aprobador_id: currentPP.usuarioId,
        }
      : undefined,
  };
}

export function toAdhocDto(adhoc: SolicitudAdhoc): SolicitudAdhocDto {
  return {
    id: adhoc.id,
    tenant_id: adhoc.tenantId,
    usuario_solicitante_id: adhoc.usuarioSolicitanteId,
    titulo: adhoc.titulo,
    descripcion: adhoc.descripcion,
    aprobadores: adhoc.aprobadores,
    usuarios_cc: adhoc.usuariosCc,
    logica_aprobacion: adhoc.logicaAprobacion,
    estado: adhoc.estado,
    fecha_creacion: adhoc.fechaCreacion?.toISOString(),
    fecha_completado: adhoc.fechaCompletado?.toISOString(),
    archivos_adjuntos: adhoc.archivosAdjuntos,
  };
}

export function toRespuestaAdhocDto(r: RespuestaAdhoc): RespuestaAdhocDto {
  return {
    id: r.id,
    solicitud_adhoc_id: r.solicitudAdhocId,
    aprobador_id: r.aprobadorId,
    respuesta: r.respuesta,
    comentario: r.comentario,
    fecha_respuesta: r.fechaRespuesta?.toISOString(),
  };
}

export function toAuditoriaDto(a: AuditoriaAprobacion): AuditoriaAprobacionDto {
  return {
    id: a.id,
    solicitud_id: a.solicitudId,
    solicitud_adhoc_id: a.solicitudAdhocId,
    plantilla_version: a.plantillaVersion,
    accion: a.accion,
    usuario_id: a.usuarioId,
    paso_numero: a.pasoNumero,
    comentario: a.comentario,
    timestamp: a.timestamp?.toISOString(),
    metadata: a.metadata,
  };
}
