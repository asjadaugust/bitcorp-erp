"""Servicio para solicitudes de aprobación.
"""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ValidacionError
from app.esquemas.aprobacion import (
    AuditoriaDto,
    DashboardAprobacionesDto,
    PasoSolicitudDto,
    SolicitudCrear,
    SolicitudDetalleDto,
    SolicitudListaDto,
)
from app.modelos.aprobaciones import (
    AuditoriaAprobacion,
    PasoSolicitud,
    PlantillaAprobacion,
    PlantillaPaso,
    SolicitudAprobacion,
)

logger = obtener_logger(__name__)


def _paso_a_dto(e: PasoSolicitud) -> PasoSolicitudDto:
    return PasoSolicitudDto(
        id=e.id,
        paso_numero=e.paso_numero,
        aprobador_id=e.aprobador_id,
        estado_paso=e.estado_paso,
        accion_fecha=e.accion_fecha.isoformat() if e.accion_fecha else None,
        comentario=e.comentario,
    )


def _a_lista_dto(e: SolicitudAprobacion) -> SolicitudListaDto:
    return SolicitudListaDto(
        id=e.id,
        module_name=e.module_name,
        entity_id=e.entity_id,
        titulo=e.titulo,
        estado=e.estado,
        paso_actual=e.paso_actual,
        fecha_creacion=e.fecha_creacion.isoformat(),
        usuario_solicitante_id=e.usuario_solicitante_id,
    )


class ServicioSolicitudAprobacion:
    """Servicio para gestión de solicitudes de aprobación."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _obtener_pasos(self, solicitud_id: int) -> list[PasoSolicitudDto]:
        resultado = await self.db.execute(
            select(PasoSolicitud)
            .where(PasoSolicitud.solicitud_id == solicitud_id)
            .order_by(PasoSolicitud.paso_numero)
        )
        return [_paso_a_dto(e) for e in resultado.scalars().all()]

    async def _a_detalle_dto(self, e: SolicitudAprobacion) -> SolicitudDetalleDto:
        pasos = await self._obtener_pasos(e.id)
        return SolicitudDetalleDto(
            id=e.id,
            plantilla_id=e.plantilla_id,
            plantilla_version=e.plantilla_version,
            module_name=e.module_name,
            entity_id=e.entity_id,
            proyecto_id=e.proyecto_id,
            usuario_solicitante_id=e.usuario_solicitante_id,
            titulo=e.titulo,
            descripcion=e.descripcion,
            estado=e.estado,
            paso_actual=e.paso_actual,
            pasos=pasos,
            fecha_creacion=e.fecha_creacion.isoformat(),
            fecha_completado=e.fecha_completado.isoformat() if e.fecha_completado else None,
        )

    async def _registrar_auditoria(
        self,
        tenant_id: int,
        solicitud_id: int,
        accion: str,
        usuario_id: int,
        paso_numero: int | None = None,
        comentario: str | None = None,
    ) -> None:
        audit = AuditoriaAprobacion(
            tenant_id=tenant_id,
            solicitud_id=solicitud_id,
            accion=accion,
            usuario_id=usuario_id,
            paso_numero=paso_numero,
            comentario=comentario,
        )
        self.db.add(audit)

    async def listar(
        self,
        tenant_id: int,
        *,
        module_name: str | None = None,
        estado: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[SolicitudListaDto], int]:
        """Listar solicitudes de aprobación."""
        consulta = select(SolicitudAprobacion).where(
            SolicitudAprobacion.tenant_id == tenant_id
        )
        if module_name:
            consulta = consulta.where(SolicitudAprobacion.module_name == module_name)
        if estado:
            consulta = consulta.where(SolicitudAprobacion.estado == estado)

        conteo = await self.db.execute(select(func.count()).select_from(consulta.subquery()))
        total: int = conteo.scalar_one()

        consulta = consulta.order_by(SolicitudAprobacion.fecha_creacion.desc())
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        return [_a_lista_dto(e) for e in resultado.scalars().all()], total

    async def obtener_por_id(
        self, tenant_id: int, solicitud_id: int
    ) -> SolicitudDetalleDto:
        """Obtener solicitud por ID."""
        resultado = await self.db.execute(
            select(SolicitudAprobacion).where(
                SolicitudAprobacion.id == solicitud_id,
                SolicitudAprobacion.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SolicitudAprobacion", str(solicitud_id))
        return await self._a_detalle_dto(entidad)

    async def crear(
        self, tenant_id: int, usuario_id: int, datos: SolicitudCrear
    ) -> SolicitudDetalleDto:
        """Crear solicitud basada en plantilla, copiando pasos."""
        # Obtener plantilla
        r_pl = await self.db.execute(
            select(PlantillaAprobacion).where(
                PlantillaAprobacion.id == datos.plantilla_id,
                PlantillaAprobacion.tenant_id == tenant_id,
                PlantillaAprobacion.estado == "ACTIVO",
            )
        )
        plantilla = r_pl.scalars().first()
        if not plantilla:
            raise NoEncontradoError("PlantillaAprobacion", str(datos.plantilla_id))

        solicitud = SolicitudAprobacion(
            tenant_id=tenant_id,
            plantilla_id=plantilla.id,
            plantilla_version=plantilla.version,
            module_name=datos.module_name,
            entity_id=datos.entity_id,
            proyecto_id=datos.proyecto_id,
            usuario_solicitante_id=usuario_id,
            titulo=datos.titulo,
            descripcion=datos.descripcion,
        )
        self.db.add(solicitud)
        await self.db.flush()

        # Copiar pasos de la plantilla
        r_pasos = await self.db.execute(
            select(PlantillaPaso)
            .where(PlantillaPaso.plantilla_id == plantilla.id)
            .order_by(PlantillaPaso.paso_numero)
        )
        for paso_tpl in r_pasos.scalars().all():
            paso = PasoSolicitud(
                tenant_id=tenant_id,
                solicitud_id=solicitud.id,
                paso_numero=paso_tpl.paso_numero,
                aprobador_id=paso_tpl.usuario_id,
                estado_paso="PENDIENTE",
            )
            self.db.add(paso)

        await self._registrar_auditoria(tenant_id, solicitud.id, "CREATED", usuario_id)
        await self.db.commit()
        await self.db.refresh(solicitud)
        logger.info("solicitud_creada", id=solicitud.id)
        return await self._a_detalle_dto(solicitud)

    async def aprobar_paso(
        self,
        tenant_id: int,
        solicitud_id: int,
        usuario_id: int,
        comentario: str | None = None,
    ) -> SolicitudDetalleDto:
        """Aprobar el paso actual de la solicitud."""
        resultado = await self.db.execute(
            select(SolicitudAprobacion).where(
                SolicitudAprobacion.id == solicitud_id,
                SolicitudAprobacion.tenant_id == tenant_id,
            )
        )
        solicitud = resultado.scalars().first()
        if not solicitud:
            raise NoEncontradoError("SolicitudAprobacion", str(solicitud_id))

        if solicitud.estado not in ("PENDIENTE", "EN_REVISION"):
            raise ValidacionError("La solicitud no está en estado aprobable")

        # Buscar paso actual pendiente
        r_paso = await self.db.execute(
            select(PasoSolicitud).where(
                PasoSolicitud.solicitud_id == solicitud_id,
                PasoSolicitud.paso_numero == solicitud.paso_actual,
                PasoSolicitud.estado_paso == "PENDIENTE",
            )
        )
        paso = r_paso.scalars().first()
        if not paso:
            raise ValidacionError("No hay paso pendiente en el número actual")

        paso.estado_paso = "APROBADO"
        paso.aprobador_id = usuario_id
        paso.accion_fecha = datetime.utcnow()
        paso.comentario = comentario

        solicitud.estado = "EN_REVISION"
        await self._registrar_auditoria(
            tenant_id, solicitud_id, "STEP_APPROVED", usuario_id,
            paso_numero=solicitud.paso_actual, comentario=comentario,
        )

        # Check if there are more steps
        r_next = await self.db.execute(
            select(PasoSolicitud).where(
                PasoSolicitud.solicitud_id == solicitud_id,
                PasoSolicitud.paso_numero > solicitud.paso_actual,
                PasoSolicitud.estado_paso == "PENDIENTE",
            ).order_by(PasoSolicitud.paso_numero)
        )
        siguiente = r_next.scalars().first()
        if siguiente:
            solicitud.paso_actual = siguiente.paso_numero
        else:
            solicitud.estado = "APROBADO"
            solicitud.fecha_completado = datetime.utcnow()
            solicitud.completado_por_id = usuario_id
            await self._registrar_auditoria(
                tenant_id, solicitud_id, "COMPLETED", usuario_id
            )

        await self.db.commit()
        await self.db.refresh(solicitud)
        return await self._a_detalle_dto(solicitud)

    async def rechazar_paso(
        self,
        tenant_id: int,
        solicitud_id: int,
        usuario_id: int,
        comentario: str | None = None,
    ) -> SolicitudDetalleDto:
        """Rechazar la solicitud en el paso actual."""
        resultado = await self.db.execute(
            select(SolicitudAprobacion).where(
                SolicitudAprobacion.id == solicitud_id,
                SolicitudAprobacion.tenant_id == tenant_id,
            )
        )
        solicitud = resultado.scalars().first()
        if not solicitud:
            raise NoEncontradoError("SolicitudAprobacion", str(solicitud_id))

        if solicitud.estado not in ("PENDIENTE", "EN_REVISION"):
            raise ValidacionError("La solicitud no está en estado rechazable")

        r_paso = await self.db.execute(
            select(PasoSolicitud).where(
                PasoSolicitud.solicitud_id == solicitud_id,
                PasoSolicitud.paso_numero == solicitud.paso_actual,
                PasoSolicitud.estado_paso == "PENDIENTE",
            )
        )
        paso = r_paso.scalars().first()
        if paso:
            paso.estado_paso = "RECHAZADO"
            paso.aprobador_id = usuario_id
            paso.accion_fecha = datetime.utcnow()
            paso.comentario = comentario

        solicitud.estado = "RECHAZADO"
        solicitud.fecha_completado = datetime.utcnow()
        solicitud.completado_por_id = usuario_id

        await self._registrar_auditoria(
            tenant_id, solicitud_id, "REJECTED", usuario_id,
            paso_numero=solicitud.paso_actual, comentario=comentario,
        )
        await self.db.commit()
        await self.db.refresh(solicitud)
        return await self._a_detalle_dto(solicitud)

    async def cancelar(
        self, tenant_id: int, solicitud_id: int, usuario_id: int
    ) -> SolicitudDetalleDto:
        """Cancelar solicitud."""
        resultado = await self.db.execute(
            select(SolicitudAprobacion).where(
                SolicitudAprobacion.id == solicitud_id,
                SolicitudAprobacion.tenant_id == tenant_id,
            )
        )
        solicitud = resultado.scalars().first()
        if not solicitud:
            raise NoEncontradoError("SolicitudAprobacion", str(solicitud_id))

        if solicitud.estado in ("APROBADO", "RECHAZADO", "CANCELADO"):
            raise ValidacionError("La solicitud ya está finalizada")

        solicitud.estado = "CANCELADO"
        solicitud.fecha_completado = datetime.utcnow()

        await self._registrar_auditoria(
            tenant_id, solicitud_id, "CANCELLED", usuario_id
        )
        await self.db.commit()
        await self.db.refresh(solicitud)
        return await self._a_detalle_dto(solicitud)

    async def obtener_auditoria(
        self, tenant_id: int, solicitud_id: int
    ) -> list[AuditoriaDto]:
        """Obtener trail de auditoría de una solicitud."""
        resultado = await self.db.execute(
            select(AuditoriaAprobacion)
            .where(
                AuditoriaAprobacion.solicitud_id == solicitud_id,
                AuditoriaAprobacion.tenant_id == tenant_id,
            )
            .order_by(AuditoriaAprobacion.timestamp)
        )
        return [
            AuditoriaDto(
                id=e.id,
                accion=e.accion,
                usuario_id=e.usuario_id,
                paso_numero=e.paso_numero,
                comentario=e.comentario,
                timestamp=e.timestamp.isoformat(),
                metadata=e.metadata_json,
            )
            for e in resultado.scalars().all()
        ]

    async def obtener_dashboard(
        self, tenant_id: int, usuario_id: int
    ) -> DashboardAprobacionesDto:
        """Obtener estadísticas del dashboard de aprobaciones."""
        # Pendientes recibidos (where user is aprobador)
        r_rec = await self.db.execute(
            select(func.count(func.distinct(PasoSolicitud.solicitud_id))).where(
                PasoSolicitud.tenant_id == tenant_id,
                PasoSolicitud.aprobador_id == usuario_id,
                PasoSolicitud.estado_paso == "PENDIENTE",
            )
        )
        pendientes_recibidos: int = r_rec.scalar_one()

        # Pendientes enviados
        r_env = await self.db.execute(
            select(func.count(SolicitudAprobacion.id)).where(
                SolicitudAprobacion.tenant_id == tenant_id,
                SolicitudAprobacion.usuario_solicitante_id == usuario_id,
                SolicitudAprobacion.estado.in_(["PENDIENTE", "EN_REVISION"]),
            )
        )
        pendientes_enviados: int = r_env.scalar_one()

        # Aprobados
        r_apr = await self.db.execute(
            select(func.count(SolicitudAprobacion.id)).where(
                SolicitudAprobacion.tenant_id == tenant_id,
                SolicitudAprobacion.usuario_solicitante_id == usuario_id,
                SolicitudAprobacion.estado == "APROBADO",
            )
        )
        aprobados: int = r_apr.scalar_one()

        # Rechazados
        r_rch = await self.db.execute(
            select(func.count(SolicitudAprobacion.id)).where(
                SolicitudAprobacion.tenant_id == tenant_id,
                SolicitudAprobacion.usuario_solicitante_id == usuario_id,
                SolicitudAprobacion.estado == "RECHAZADO",
            )
        )
        rechazados: int = r_rch.scalar_one()

        return DashboardAprobacionesDto(
            pendientes_recibidos=pendientes_recibidos,
            pendientes_enviados=pendientes_enviados,
            aprobados=aprobados,
            rechazados=rechazados,
        )

    async def listar_recibidos(
        self, tenant_id: int, usuario_id: int
    ) -> list[SolicitudListaDto]:
        """Solicitudes donde el usuario es aprobador pendiente."""
        resultado = await self.db.execute(
            select(SolicitudAprobacion)
            .join(PasoSolicitud, PasoSolicitud.solicitud_id == SolicitudAprobacion.id)
            .where(
                SolicitudAprobacion.tenant_id == tenant_id,
                PasoSolicitud.aprobador_id == usuario_id,
                PasoSolicitud.estado_paso == "PENDIENTE",
            )
            .distinct()
            .order_by(SolicitudAprobacion.fecha_creacion.desc())
        )
        return [_a_lista_dto(e) for e in resultado.scalars().all()]

    async def listar_enviados(
        self, tenant_id: int, usuario_id: int
    ) -> list[SolicitudListaDto]:
        """Solicitudes enviadas por el usuario."""
        resultado = await self.db.execute(
            select(SolicitudAprobacion)
            .where(
                SolicitudAprobacion.tenant_id == tenant_id,
                SolicitudAprobacion.usuario_solicitante_id == usuario_id,
            )
            .order_by(SolicitudAprobacion.fecha_creacion.desc())
        )
        return [_a_lista_dto(e) for e in resultado.scalars().all()]
