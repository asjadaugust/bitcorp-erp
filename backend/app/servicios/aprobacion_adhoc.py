"""Servicio para aprobaciones ad-hoc.
"""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ValidacionError
from app.esquemas.aprobacion import (
    AdhocCrear,
    AdhocDetalleDto,
    AdhocListaDto,
    AdhocResponder,
)
from app.modelos.aprobaciones import AuditoriaAprobacion, RespuestaAdhoc, SolicitudAdhoc

logger = obtener_logger(__name__)


def _a_lista_dto(e: SolicitudAdhoc) -> AdhocListaDto:
    return AdhocListaDto(
        id=e.id,
        titulo=e.titulo,
        estado=e.estado,
        logica_aprobacion=e.logica_aprobacion,
        fecha_creacion=e.fecha_creacion.isoformat(),
        usuario_solicitante_id=e.usuario_solicitante_id,
    )


def _a_detalle_dto(e: SolicitudAdhoc) -> AdhocDetalleDto:
    return AdhocDetalleDto(
        id=e.id,
        titulo=e.titulo,
        descripcion=e.descripcion,
        aprobadores=e.aprobadores,
        usuarios_cc=e.usuarios_cc,
        logica_aprobacion=e.logica_aprobacion,
        estado=e.estado,
        fecha_creacion=e.fecha_creacion.isoformat(),
        fecha_completado=e.fecha_completado.isoformat() if e.fecha_completado else None,
        archivos_adjuntos=e.archivos_adjuntos,
        usuario_solicitante_id=e.usuario_solicitante_id,
    )


class ServicioAprobacionAdhoc:
    """Servicio para aprobaciones ad-hoc."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        tenant_id: int,
        *,
        estado: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[AdhocListaDto], int]:
        """Listar solicitudes ad-hoc."""
        consulta = select(SolicitudAdhoc).where(SolicitudAdhoc.tenant_id == tenant_id)
        if estado:
            consulta = consulta.where(SolicitudAdhoc.estado == estado)

        conteo = await self.db.execute(select(func.count()).select_from(consulta.subquery()))
        total: int = conteo.scalar_one()

        consulta = consulta.order_by(SolicitudAdhoc.fecha_creacion.desc())
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        return [_a_lista_dto(e) for e in resultado.scalars().all()], total

    async def obtener_por_id(
        self, tenant_id: int, adhoc_id: int
    ) -> AdhocDetalleDto:
        """Obtener solicitud ad-hoc por ID."""
        resultado = await self.db.execute(
            select(SolicitudAdhoc).where(
                SolicitudAdhoc.id == adhoc_id,
                SolicitudAdhoc.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SolicitudAdhoc", str(adhoc_id))
        return _a_detalle_dto(entidad)

    async def crear(
        self, tenant_id: int, usuario_id: int, datos: AdhocCrear
    ) -> AdhocDetalleDto:
        """Crear solicitud ad-hoc."""
        entidad = SolicitudAdhoc(
            tenant_id=tenant_id,
            usuario_solicitante_id=usuario_id,
            titulo=datos.titulo,
            descripcion=datos.descripcion,
            aprobadores=datos.aprobadores,
            usuarios_cc=datos.usuarios_cc,
            logica_aprobacion=datos.logica_aprobacion,
            archivos_adjuntos=datos.archivos_adjuntos,
        )
        self.db.add(entidad)
        await self.db.flush()

        # Registro de auditoría
        audit = AuditoriaAprobacion(
            tenant_id=tenant_id,
            solicitud_adhoc_id=entidad.id,
            accion="CREATED",
            usuario_id=usuario_id,
        )
        self.db.add(audit)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("adhoc_creada", id=entidad.id)
        return _a_detalle_dto(entidad)

    async def responder(
        self,
        tenant_id: int,
        adhoc_id: int,
        usuario_id: int,
        datos: AdhocResponder,
    ) -> AdhocDetalleDto:
        """Responder a solicitud ad-hoc."""
        resultado = await self.db.execute(
            select(SolicitudAdhoc).where(
                SolicitudAdhoc.id == adhoc_id,
                SolicitudAdhoc.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SolicitudAdhoc", str(adhoc_id))

        if entidad.estado != "PENDIENTE":
            raise ValidacionError("La solicitud no está pendiente")

        # Registrar respuesta
        respuesta = RespuestaAdhoc(
            tenant_id=tenant_id,
            solicitud_adhoc_id=adhoc_id,
            aprobador_id=usuario_id,
            respuesta=datos.respuesta,
            comentario=datos.comentario,
        )
        self.db.add(respuesta)

        # Evaluar si se completa
        if datos.respuesta == "RECHAZADO":
            entidad.estado = "RECHAZADO"
            entidad.fecha_completado = datetime.utcnow()
        elif entidad.logica_aprobacion == "FIRST_APPROVES":
            entidad.estado = "APROBADO"
            entidad.fecha_completado = datetime.utcnow()
        else:
            # ALL_MUST_APPROVE — check if all approved
            r_resp = await self.db.execute(
                select(func.count(RespuestaAdhoc.id)).where(
                    RespuestaAdhoc.solicitud_adhoc_id == adhoc_id,
                    RespuestaAdhoc.respuesta == "APROBADO",
                )
            )
            aprobados = r_resp.scalar_one() + 1  # +1 for current
            aprobs = entidad.aprobadores
            total_requeridos = len(aprobs) if isinstance(aprobs, list) else 0
            if aprobados >= total_requeridos:
                entidad.estado = "APROBADO"
                entidad.fecha_completado = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(entidad)
        return _a_detalle_dto(entidad)
