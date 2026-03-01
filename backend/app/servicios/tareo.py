"""Servicio para tareos (timesheets).

Replica TimesheetService del BFF Node.js.
"""

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.tareo import (
    DetalleTareoDto,
    TareoActualizar,
    TareoCrear,
    TareoDetalleDto,
    TareoListaDto,
)
from app.modelos.rrhh import DetalleTareo, Tareo

logger = obtener_logger(__name__)


def _fecha_str(val: date | datetime | None) -> str | None:
    return val.isoformat() if val else None


def _a_lista_dto(e: Tareo) -> TareoListaDto:
    return TareoListaDto(
        id=e.id,
        trabajador_id=e.trabajador_id,
        periodo=e.periodo,
        total_dias_trabajados=e.total_dias_trabajados,
        total_horas=float(e.total_horas) if e.total_horas else 0,
        estado=e.estado,
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: Tareo) -> TareoDetalleDto:
    return TareoDetalleDto(
        id=e.id,
        trabajador_id=e.trabajador_id,
        periodo=e.periodo,
        total_dias_trabajados=e.total_dias_trabajados,
        total_horas=float(e.total_horas) if e.total_horas else 0,
        monto_calculado=float(e.monto_calculado) if e.monto_calculado else None,
        estado=e.estado,
        observaciones=e.observaciones,
        creado_por=e.creado_por,
        aprobado_por=e.aprobado_por,
        aprobado_en=_fecha_str(e.aprobado_en),
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


def _a_detalle_tareo_dto(e: DetalleTareo) -> DetalleTareoDto:
    return DetalleTareoDto(
        id=e.id,
        tareo_id=e.tareo_id,
        proyecto_id=e.proyecto_id,
        fecha=e.fecha.isoformat(),
        horas_trabajadas=float(e.horas_trabajadas) if e.horas_trabajadas else None,
        tarifa_hora=float(e.tarifa_hora) if e.tarifa_hora else None,
        monto=float(e.monto) if e.monto else None,
        observaciones=e.observaciones,
    )


# Valid state transitions
_TRANSICIONES = {
    "enviar": ("BORRADOR", "ENVIADO"),
    "aprobar": ("ENVIADO", "APROBADO"),
    "rechazar": ("ENVIADO", "RECHAZADO"),
    "reabrir": ("RECHAZADO", "BORRADOR"),
}


class ServicioTareo:
    """Servicio para gestión de tareos (timesheets)."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _obtener_entidad(self, tareo_id: int) -> Tareo:
        resultado = await self.db.execute(
            select(Tareo).where(Tareo.id == tareo_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Tareo", tareo_id)
        return entidad

    async def listar(
        self,
        *,
        periodo: str | None = None,
        estado: str | None = None,
        trabajador_id: int | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[TareoListaDto], int]:
        """Listar tareos con filtros y paginación."""
        consulta = select(Tareo)

        if periodo:
            consulta = consulta.where(Tareo.periodo == periodo)
        if estado:
            consulta = consulta.where(Tareo.estado == estado)
        if trabajador_id:
            consulta = consulta.where(Tareo.trabajador_id == trabajador_id)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Tareo.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("tareos_listados", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, tareo_id: int) -> TareoDetalleDto:
        """Obtener tareo por ID."""
        entidad = await self._obtener_entidad(tareo_id)
        return _a_detalle_dto(entidad)

    async def crear(self, datos: TareoCrear, usuario_id: int) -> TareoDetalleDto:
        """Crear un nuevo tareo."""
        entidad = Tareo(
            trabajador_id=datos.trabajador_id,
            periodo=datos.periodo,
            observaciones=datos.observaciones,
            creado_por=usuario_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("tareo_creado", id=entidad.id)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, tareo_id: int, datos: TareoActualizar
    ) -> TareoDetalleDto:
        """Actualizar un tareo (solo en BORRADOR)."""
        entidad = await self._obtener_entidad(tareo_id)
        if entidad.estado != "BORRADOR":
            raise ReglaDeNegocioError.estado_invalido(
                "tareo", entidad.estado, "actualizar", ["BORRADOR"]
            )

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("tareo_actualizado", id=tareo_id)
        return _a_detalle_dto(entidad)

    async def _transicionar(
        self, tareo_id: int, accion: str, usuario_id: int
    ) -> TareoDetalleDto:
        """Cambiar estado del tareo según las transiciones válidas."""
        estado_origen, estado_destino = _TRANSICIONES[accion]
        entidad = await self._obtener_entidad(tareo_id)

        if entidad.estado != estado_origen:
            raise ReglaDeNegocioError.estado_invalido(
                "tareo", entidad.estado, accion, [estado_origen]
            )

        entidad.estado = estado_destino
        if accion == "aprobar":
            entidad.aprobado_por = usuario_id
            entidad.aprobado_en = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("tareo_transicion", id=tareo_id, accion=accion, estado=estado_destino)
        return _a_detalle_dto(entidad)

    async def enviar(self, tareo_id: int, usuario_id: int) -> TareoDetalleDto:
        return await self._transicionar(tareo_id, "enviar", usuario_id)

    async def aprobar(self, tareo_id: int, usuario_id: int) -> TareoDetalleDto:
        return await self._transicionar(tareo_id, "aprobar", usuario_id)

    async def rechazar(self, tareo_id: int, usuario_id: int) -> TareoDetalleDto:
        return await self._transicionar(tareo_id, "rechazar", usuario_id)

    async def reabrir(self, tareo_id: int, usuario_id: int) -> TareoDetalleDto:
        return await self._transicionar(tareo_id, "reabrir", usuario_id)

    async def obtener_detalles(self, tareo_id: int) -> list[DetalleTareoDto]:
        """Obtener líneas de detalle de un tareo."""
        # Verify tareo exists
        await self._obtener_entidad(tareo_id)

        resultado = await self.db.execute(
            select(DetalleTareo)
            .where(DetalleTareo.tareo_id == tareo_id)
            .order_by(DetalleTareo.fecha)
        )
        entidades = list(resultado.scalars().all())
        return [_a_detalle_tareo_dto(e) for e in entidades]
