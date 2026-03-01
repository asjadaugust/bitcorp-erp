"""Servicio para programación de pagos.

Replica PaymentScheduleService del BFF Node.js.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ValidacionError
from app.esquemas.programacion_pago import (
    DetallePagoCrear,
    DetalleProgramacionPagoDto,
    ProgramacionPagoActualizar,
    ProgramacionPagoCrear,
    ProgramacionPagoDetalleDto,
    ProgramacionPagoListaDto,
)
from app.modelos.administracion import DetalleProgramacionPago, ProgramacionPago

logger = obtener_logger(__name__)


def _detalle_a_dto(e: DetalleProgramacionPago) -> DetalleProgramacionPagoDto:
    return DetalleProgramacionPagoDto(
        id=e.id,
        programacion_pago_id=e.programacion_pago_id,
        valorizacion_id=e.valorizacion_id,
        concepto=e.concepto,
        monto=float(e.monto) if e.monto is not None else None,
    )


def _a_lista_dto(e: ProgramacionPago) -> ProgramacionPagoListaDto:
    return ProgramacionPagoListaDto(
        id=e.id,
        proveedor_id=e.proveedor_id,
        proyecto_id=e.proyecto_id,
        periodo=e.periodo,
        fecha_programada=e.fecha_programada.isoformat() if e.fecha_programada else None,
        monto_total=float(e.monto_total) if e.monto_total is not None else None,
        estado=e.estado,
    )


class ServicioProgramacionPago:
    """Servicio para gestión de programaciones de pago."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _obtener_entidad(self, prog_id: int) -> ProgramacionPago:
        resultado = await self.db.execute(
            select(ProgramacionPago).where(ProgramacionPago.id == prog_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("ProgramacionPago", str(prog_id))
        return entidad

    async def _obtener_detalles(self, prog_id: int) -> list[DetalleProgramacionPagoDto]:
        resultado = await self.db.execute(
            select(DetalleProgramacionPago).where(
                DetalleProgramacionPago.programacion_pago_id == prog_id
            )
        )
        return [_detalle_a_dto(e) for e in resultado.scalars().all()]

    async def _a_detalle_dto(self, e: ProgramacionPago) -> ProgramacionPagoDetalleDto:
        detalles = await self._obtener_detalles(e.id)
        return ProgramacionPagoDetalleDto(
            id=e.id,
            proveedor_id=e.proveedor_id,
            proyecto_id=e.proyecto_id,
            periodo=e.periodo,
            fecha_programada=e.fecha_programada.isoformat() if e.fecha_programada else None,
            monto_total=float(e.monto_total) if e.monto_total is not None else None,
            estado=e.estado,
            observaciones=e.observaciones,
            detalles=detalles,
            created_at=e.created_at.isoformat(),
            updated_at=e.updated_at.isoformat(),
        )

    async def listar(
        self,
        *,
        proveedor_id: int | None = None,
        estado: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[ProgramacionPagoListaDto], int]:
        """Listar programaciones de pago."""
        consulta = select(ProgramacionPago)

        if proveedor_id:
            consulta = consulta.where(ProgramacionPago.proveedor_id == proveedor_id)
        if estado:
            consulta = consulta.where(ProgramacionPago.estado == estado)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(ProgramacionPago.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, prog_id: int) -> ProgramacionPagoDetalleDto:
        """Obtener programación por ID con detalles."""
        entidad = await self._obtener_entidad(prog_id)
        return await self._a_detalle_dto(entidad)

    async def crear(self, datos: ProgramacionPagoCrear) -> ProgramacionPagoDetalleDto:
        """Crear una programación de pago."""
        entidad = ProgramacionPago(
            proveedor_id=datos.proveedor_id,
            proyecto_id=datos.proyecto_id,
            periodo=datos.periodo,
            fecha_programada=(
                date.fromisoformat(datos.fecha_programada) if datos.fecha_programada else None
            ),
            monto_total=datos.monto_total,
            observaciones=datos.observaciones,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("programacion_pago_creada", id=entidad.id)
        return await self._a_detalle_dto(entidad)

    async def actualizar(
        self, prog_id: int, datos: ProgramacionPagoActualizar
    ) -> ProgramacionPagoDetalleDto:
        """Actualizar una programación de pago."""
        entidad = await self._obtener_entidad(prog_id)
        if entidad.estado not in ("PROGRAMADO",):
            raise ValidacionError("Solo se puede actualizar en estado PROGRAMADO")

        campos = datos.model_dump(exclude_unset=True)
        if "fecha_programada" in campos and campos["fecha_programada"]:
            campos["fecha_programada"] = date.fromisoformat(campos["fecha_programada"])
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        return await self._a_detalle_dto(entidad)

    async def eliminar(self, prog_id: int) -> None:
        """Eliminar una programación de pago."""
        entidad = await self._obtener_entidad(prog_id)
        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("programacion_pago_eliminada", id=prog_id)

    async def aprobar(self, prog_id: int) -> ProgramacionPagoDetalleDto:
        """Aprobar: PROGRAMADO → APROBADO."""
        entidad = await self._obtener_entidad(prog_id)
        if entidad.estado != "PROGRAMADO":
            raise ValidacionError("Solo se puede aprobar desde PROGRAMADO")
        entidad.estado = "APROBADO"
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("programacion_pago_aprobada", id=prog_id)
        return await self._a_detalle_dto(entidad)

    async def procesar(self, prog_id: int) -> ProgramacionPagoDetalleDto:
        """Procesar: APROBADO → PROCESADO."""
        entidad = await self._obtener_entidad(prog_id)
        if entidad.estado != "APROBADO":
            raise ValidacionError("Solo se puede procesar desde APROBADO")
        entidad.estado = "PROCESADO"
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("programacion_pago_procesada", id=prog_id)
        return await self._a_detalle_dto(entidad)

    async def cancelar(self, prog_id: int) -> ProgramacionPagoDetalleDto:
        """Cancelar programación."""
        entidad = await self._obtener_entidad(prog_id)
        if entidad.estado == "PROCESADO":
            raise ValidacionError("No se puede cancelar una programación procesada")
        entidad.estado = "CANCELADO"
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("programacion_pago_cancelada", id=prog_id)
        return await self._a_detalle_dto(entidad)

    async def agregar_detalle(
        self, prog_id: int, datos: DetallePagoCrear
    ) -> ProgramacionPagoDetalleDto:
        """Agregar detalle a una programación."""
        entidad = await self._obtener_entidad(prog_id)
        detalle = DetalleProgramacionPago(
            programacion_pago_id=prog_id,
            valorizacion_id=datos.valorizacion_id,
            concepto=datos.concepto,
            monto=datos.monto,
        )
        self.db.add(detalle)
        await self.db.commit()
        await self.db.refresh(entidad)
        return await self._a_detalle_dto(entidad)

    async def eliminar_detalle(self, prog_id: int, detalle_id: int) -> ProgramacionPagoDetalleDto:
        """Eliminar un detalle de una programación."""
        await self._obtener_entidad(prog_id)  # Verify parent exists
        resultado = await self.db.execute(
            select(DetalleProgramacionPago).where(
                DetalleProgramacionPago.id == detalle_id,
                DetalleProgramacionPago.programacion_pago_id == prog_id,
            )
        )
        detalle = resultado.scalars().first()
        if not detalle:
            raise NoEncontradoError("DetalleProgramacionPago", str(detalle_id))
        await self.db.delete(detalle)
        await self.db.commit()

        entidad = await self._obtener_entidad(prog_id)
        return await self._a_detalle_dto(entidad)
