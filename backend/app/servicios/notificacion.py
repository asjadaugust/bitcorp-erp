"""Servicio para notificaciones.

Replica NotificationService del BFF Node.js.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.notificacion import (
    NotificacionCrear,
    NotificacionDetalleDto,
    NotificacionListaDto,
)
from app.modelos.publico import Notificacion

logger = obtener_logger(__name__)


def _a_lista_dto(e: Notificacion) -> NotificacionListaDto:
    return NotificacionListaDto(
        id=e.id,
        usuario_id=e.usuario_id,
        tipo=e.tipo,
        titulo=e.titulo,
        mensaje=e.mensaje,
        url=e.url,
        leido=e.leido,
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: Notificacion) -> NotificacionDetalleDto:
    return NotificacionDetalleDto(
        id=e.id,
        usuario_id=e.usuario_id,
        tipo=e.tipo,
        titulo=e.titulo,
        mensaje=e.mensaje,
        url=e.url,
        leido=e.leido,
        leido_at=e.leido_at.isoformat() if e.leido_at else None,
        data=e.data,
        created_at=e.created_at.isoformat(),
    )


class ServicioNotificacion:
    """Servicio para gestión de notificaciones."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        usuario_id: int,
        *,
        leido: bool | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[NotificacionListaDto], int]:
        """Listar notificaciones del usuario con filtros y paginación."""
        consulta = select(Notificacion).where(
            Notificacion.usuario_id == usuario_id,
            Notificacion.is_active.is_(True),
        )

        if leido is not None:
            consulta = consulta.where(Notificacion.leido == leido)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Notificacion.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("notificaciones_listadas", usuario_id=usuario_id, total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(
        self, usuario_id: int, notificacion_id: int
    ) -> NotificacionDetalleDto:
        """Obtener notificación por ID."""
        resultado = await self.db.execute(
            select(Notificacion).where(
                Notificacion.id == notificacion_id,
                Notificacion.usuario_id == usuario_id,
                Notificacion.is_active.is_(True),
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Notificacion", str(notificacion_id))
        return _a_detalle_dto(entidad)

    async def crear(
        self, datos: NotificacionCrear
    ) -> NotificacionDetalleDto:
        """Crear una nueva notificación."""
        entidad = Notificacion(
            usuario_id=datos.usuario_id,
            tipo=datos.tipo,
            titulo=datos.titulo,
            mensaje=datos.mensaje,
            url=datos.url,
            data=datos.data,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("notificacion_creada", id=entidad.id)
        return _a_detalle_dto(entidad)

    async def marcar_leido(
        self, usuario_id: int, notificacion_id: int
    ) -> NotificacionDetalleDto:
        """Marcar una notificación como leída."""
        resultado = await self.db.execute(
            select(Notificacion).where(
                Notificacion.id == notificacion_id,
                Notificacion.usuario_id == usuario_id,
                Notificacion.is_active.is_(True),
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Notificacion", str(notificacion_id))

        entidad.leido = True
        entidad.leido_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("notificacion_marcada_leida", id=notificacion_id)
        return _a_detalle_dto(entidad)

    async def marcar_todas_leidas(self, usuario_id: int) -> int:
        """Marcar todas las notificaciones del usuario como leídas."""
        ahora = datetime.utcnow()
        stmt = (
            update(Notificacion)
            .where(
                Notificacion.usuario_id == usuario_id,
                Notificacion.is_active.is_(True),
                Notificacion.leido.is_(False),
            )
            .values(leido=True, leido_at=ahora)
        )
        resultado = await self.db.execute(stmt)
        await self.db.commit()
        count: int = resultado.rowcount  # type: ignore[assignment]
        logger.info("notificaciones_marcadas_leidas", usuario_id=usuario_id, count=count)
        return count

    async def eliminar(self, usuario_id: int, notificacion_id: int) -> None:
        """Eliminar (soft delete) una notificación."""
        resultado = await self.db.execute(
            select(Notificacion).where(
                Notificacion.id == notificacion_id,
                Notificacion.usuario_id == usuario_id,
                Notificacion.is_active.is_(True),
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Notificacion", str(notificacion_id))

        entidad.is_active = False
        await self.db.commit()
        logger.info("notificacion_eliminada", id=notificacion_id)

    async def contar_no_leidas(self, usuario_id: int) -> int:
        """Contar notificaciones no leídas del usuario."""
        resultado = await self.db.execute(
            select(func.count(Notificacion.id)).where(
                Notificacion.usuario_id == usuario_id,
                Notificacion.is_active.is_(True),
                Notificacion.leido.is_(False),
            )
        )
        count: Any = resultado.scalar_one()
        return int(count)
