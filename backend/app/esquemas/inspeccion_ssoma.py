"""Esquemas Pydantic para inspecciones SSOMA y reportes acto/condicion."""

from pydantic import BaseModel


# --- ListaActoCondicionInseguro (read-only) ---


class ActoCondicionInseguroDto(BaseModel):
    id: int
    codigo: str | None = None
    acto_condicion: str | None = None
    categoria: str | None = None


# --- SeguimientoInspeccion (child) ---


class SeguimientoInspeccionDto(BaseModel):
    id: int
    fecha: str | None = None
    inspector_dni: str | None = None
    inspector: str | None = None
    descripcion_inspeccion: str | None = None
    link_evidencia: str | None = None
    fecha_proxima_inspeccion: str | None = None
    avance_estimado: int | None = None


class SeguimientoInspeccionCrear(BaseModel):
    fecha: str | None = None
    inspector_dni: str | None = None
    inspector: str | None = None
    descripcion_inspeccion: str | None = None
    link_evidencia: str | None = None
    fecha_proxima_inspeccion: str | None = None
    avance_estimado: int | None = None


# --- SeguimientoInspeccionSsoma (parent) ---


class InspeccionSsomaListaDto(BaseModel):
    id: int
    fecha_hallazgo: str | None = None
    lugar_hallazgo: str | None = None
    tipo_inspeccion: str | None = None
    nivel_riesgo: str | None = None
    estado: str | None = None
    inspector: str | None = None


class InspeccionSsomaDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    fecha_hallazgo: str | None = None
    lugar_hallazgo: str | None = None
    tipo_inspeccion: str | None = None
    inspector_dni: str | None = None
    inspector: str | None = None
    descripcion_hallazgo: str | None = None
    link_foto: str | None = None
    nivel_riesgo: str | None = None
    causas_hallazgo: str | None = None
    responsable_subsanacion: str | None = None
    fecha_subsanacion: str | None = None
    estado: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    seguimientos: list[SeguimientoInspeccionDto] = []


class InspeccionSsomaCrear(BaseModel):
    fecha_hallazgo: str | None = None
    lugar_hallazgo: str | None = None
    tipo_inspeccion: str | None = None
    inspector_dni: str | None = None
    inspector: str | None = None
    descripcion_hallazgo: str | None = None
    link_foto: str | None = None
    nivel_riesgo: str | None = None
    causas_hallazgo: str | None = None
    responsable_subsanacion: str | None = None
    fecha_subsanacion: str | None = None
    estado: str | None = None


class InspeccionSsomaActualizar(BaseModel):
    fecha_hallazgo: str | None = None
    lugar_hallazgo: str | None = None
    tipo_inspeccion: str | None = None
    inspector_dni: str | None = None
    inspector: str | None = None
    descripcion_hallazgo: str | None = None
    link_foto: str | None = None
    nivel_riesgo: str | None = None
    causas_hallazgo: str | None = None
    responsable_subsanacion: str | None = None
    fecha_subsanacion: str | None = None
    estado: str | None = None


# --- ReporteActoCondicion ---


class ReporteActoCondicionListaDto(BaseModel):
    id: int
    fecha_evento: str | None = None
    lugar: str | None = None
    tipo_reporte: str | None = None
    acto_condicion: str | None = None
    reportado_por_nombre: str | None = None
    estado: str | None = None


class ReporteActoCondicionDetalleDto(BaseModel):
    id: int
    legacy_id: str | None = None
    # Section 1: Reporter info
    reportado_por_dni: str | None = None
    reportado_por_nombre: str | None = None
    cargo: str | None = None
    empresa_reportante: str | None = None
    # Section 2: Incident info
    fecha_evento: str | None = None
    lugar: str | None = None
    empresa: str | None = None
    sistema_gestion: str | None = None
    tipo_reporte: str | None = None
    codigo_acto_condicion: str | None = None
    acto_condicion: str | None = None
    # Section 3: Damage
    dano_a: str | None = None
    descripcion: str | None = None
    como_actue: str | None = None
    # Section 4: 5-Why
    por_que_1: str | None = None
    por_que_2: str | None = None
    por_que_3: str | None = None
    por_que_4: str | None = None
    por_que_5: str | None = None
    # Section 5: Corrective action
    accion_correctiva: str | None = None
    estado: str | None = None
    # Metadata
    registrado_por_dni: str | None = None
    registrado_por: str | None = None
    fecha_registro: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class ReporteActoCondicionCrear(BaseModel):
    # Section 1: Reporter info
    reportado_por_dni: str | None = None
    reportado_por_nombre: str | None = None
    cargo: str | None = None
    empresa_reportante: str | None = None
    # Section 2: Incident info
    fecha_evento: str | None = None
    lugar: str | None = None
    empresa: str | None = None
    sistema_gestion: str | None = None
    tipo_reporte: str | None = None
    codigo_acto_condicion: str | None = None
    acto_condicion: str | None = None
    # Section 3: Damage
    dano_a: str | None = None
    descripcion: str | None = None
    como_actue: str | None = None
    # Section 4: 5-Why
    por_que_1: str | None = None
    por_que_2: str | None = None
    por_que_3: str | None = None
    por_que_4: str | None = None
    por_que_5: str | None = None
    # Section 5: Corrective action
    accion_correctiva: str | None = None
    estado: str | None = None


class ReporteActoCondicionActualizar(BaseModel):
    reportado_por_dni: str | None = None
    reportado_por_nombre: str | None = None
    cargo: str | None = None
    empresa_reportante: str | None = None
    fecha_evento: str | None = None
    lugar: str | None = None
    empresa: str | None = None
    sistema_gestion: str | None = None
    tipo_reporte: str | None = None
    codigo_acto_condicion: str | None = None
    acto_condicion: str | None = None
    dano_a: str | None = None
    descripcion: str | None = None
    como_actue: str | None = None
    por_que_1: str | None = None
    por_que_2: str | None = None
    por_que_3: str | None = None
    por_que_4: str | None = None
    por_que_5: str | None = None
    accion_correctiva: str | None = None
    estado: str | None = None
