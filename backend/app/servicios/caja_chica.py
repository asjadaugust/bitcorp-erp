"""Servicio para caja chica, solicitudes y movimientos."""

from datetime import date, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.caja_chica import (
    CajaChicaActualizar,
    CajaChicaCrear,
    CajaChicaDetalleDto,
    CajaChicaListaDto,
    MovimientoCajaCrear,
    MovimientoCajaDetalleDto,
    MovimientoCajaListaDto,
    SolicitudCajaActualizar,
    SolicitudCajaCrear,
    SolicitudCajaListaDto,
)
from app.modelos.administracion import CajaChica, MovimientoCaja, SolicitudCaja

logger = obtener_logger(__name__)


def _caja_a_lista_dto(e: CajaChica) -> CajaChicaListaDto:
    return CajaChicaListaDto(
        id=e.id,
        numero_caja=e.numero_caja,
        saldo_inicial=float(e.saldo_inicial) if e.saldo_inicial is not None else None,
        ingreso_total=float(e.ingreso_total) if e.ingreso_total is not None else None,
        salida_total=float(e.salida_total) if e.salida_total is not None else None,
        saldo_final=float(e.saldo_final) if e.saldo_final is not None else None,
        fecha_apertura=e.fecha_apertura.isoformat() if e.fecha_apertura else None,
        estatus=e.estatus,
    )


def _solicitud_a_lista_dto(e: SolicitudCaja) -> SolicitudCajaListaDto:
    return SolicitudCajaListaDto(
        id=e.id,
        fecha_solicitud=e.fecha_solicitud.isoformat() if e.fecha_solicitud else None,
        dni_usuario=e.dni_usuario,
        nombre=e.nombre,
        motivo=e.motivo,
        monto_solicitado=float(e.monto_solicitado) if e.monto_solicitado is not None else None,
        monto_rendido=float(e.monto_rendido) if e.monto_rendido is not None else None,
        monto_devuelto_reembolsado=(
            float(e.monto_devuelto_reembolsado) if e.monto_devuelto_reembolsado is not None else None
        ),
        estatus=e.estatus,
    )


def _movimiento_a_lista_dto(e: MovimientoCaja) -> MovimientoCajaListaDto:
    return MovimientoCajaListaDto(
        id=e.id,
        fecha_movimiento=e.fecha_movimiento.isoformat() if e.fecha_movimiento else None,
        numero_caja=e.numero_caja,
        rubro=e.rubro,
        detalle=e.detalle,
        monto=float(e.monto) if e.monto is not None else None,
        entrada_salida=e.entrada_salida,
        registrado_por=e.registrado_por,
    )


def _movimiento_a_detalle_dto(e: MovimientoCaja) -> MovimientoCajaDetalleDto:
    return MovimientoCajaDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        fecha_movimiento=e.fecha_movimiento.isoformat() if e.fecha_movimiento else None,
        numero_caja=e.numero_caja,
        rubro=e.rubro,
        fecha=e.fecha.isoformat() if e.fecha else None,
        ruc=e.ruc,
        razon_social=e.razon_social,
        tipo_documento=e.tipo_documento,
        serie_documento=e.serie_documento,
        numero_documento=e.numero_documento,
        detalle=e.detalle,
        monto=float(e.monto) if e.monto is not None else None,
        entrada_salida=e.entrada_salida,
        numero_solicitud=e.numero_solicitud,
        registrado_por=e.registrado_por,
        fecha_registro=e.fecha_registro.isoformat() if e.fecha_registro else None,
        aprobado_por=e.aprobado_por,
        created_at=e.created_at.isoformat() if e.created_at else None,
        updated_at=e.updated_at.isoformat() if e.updated_at else None,
    )


class ServicioCajaChica:
    """Servicio para gestión de caja chica, solicitudes y movimientos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Caja Chica ──────────────────────────────────────────────────

    async def listar_cajas(self) -> list[CajaChicaListaDto]:
        """Listar todas las cajas chicas."""
        resultado = await self.db.execute(
            select(CajaChica).order_by(CajaChica.id.desc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("cajas_chicas_listadas", total=len(entidades))
        return [_caja_a_lista_dto(e) for e in entidades]

    async def obtener_caja(self, caja_id: int) -> CajaChicaDetalleDto:
        """Obtener caja chica por ID con solicitudes y movimientos."""
        resultado = await self.db.execute(
            select(CajaChica).where(CajaChica.id == caja_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CajaChica", str(caja_id))

        # SolicitudCaja has no FK to CajaChica in the legacy schema,
        # so we return an empty list here. Solicitudes are managed via
        # their own standalone endpoints (/api/petty-cash/solicitudes).
        solicitudes: list[SolicitudCajaListaDto] = []

        # Fetch nested movimientos by numero_caja
        res_mov = await self.db.execute(
            select(MovimientoCaja).where(
                MovimientoCaja.numero_caja == entidad.numero_caja
            )
        )
        movimientos = [_movimiento_a_lista_dto(m) for m in res_mov.scalars().all()]

        return CajaChicaDetalleDto(
            id=entidad.id,
            legacy_id=entidad.legacy_id,
            numero_caja=entidad.numero_caja,
            saldo_inicial=float(entidad.saldo_inicial) if entidad.saldo_inicial is not None else None,
            ingreso_total=float(entidad.ingreso_total) if entidad.ingreso_total is not None else None,
            salida_total=float(entidad.salida_total) if entidad.salida_total is not None else None,
            saldo_final=float(entidad.saldo_final) if entidad.saldo_final is not None else None,
            fecha_apertura=entidad.fecha_apertura.isoformat() if entidad.fecha_apertura else None,
            fecha_cierre=entidad.fecha_cierre.isoformat() if entidad.fecha_cierre else None,
            estatus=entidad.estatus,
            created_at=entidad.created_at.isoformat() if entidad.created_at else None,
            updated_at=entidad.updated_at.isoformat() if entidad.updated_at else None,
            solicitudes=solicitudes,
            movimientos=movimientos,
        )

    async def crear_caja(self, datos: CajaChicaCrear) -> CajaChica:
        """Crear una nueva caja chica."""
        saldo_inicial = datos.saldo_inicial or 0
        entidad = CajaChica(
            numero_caja=datos.numero_caja,
            saldo_inicial=saldo_inicial,
            ingreso_total=0,
            salida_total=0,
            saldo_final=saldo_inicial,
            fecha_apertura=date.fromisoformat(datos.fecha_apertura) if datos.fecha_apertura else None,
            estatus="ABIERTA",
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("caja_chica_creada", id=entidad.id)
        return entidad

    async def actualizar_caja(self, caja_id: int, datos: CajaChicaActualizar) -> CajaChica:
        """Actualizar una caja chica."""
        resultado = await self.db.execute(
            select(CajaChica).where(CajaChica.id == caja_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CajaChica", str(caja_id))

        campos = datos.model_dump(exclude_unset=True)
        if "fecha_apertura" in campos and campos["fecha_apertura"]:
            campos["fecha_apertura"] = date.fromisoformat(campos["fecha_apertura"])
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("caja_chica_actualizada", id=caja_id)
        return entidad

    async def eliminar_caja(self, caja_id: int) -> None:
        """Eliminar una caja chica."""
        resultado = await self.db.execute(
            select(CajaChica).where(CajaChica.id == caja_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CajaChica", str(caja_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("caja_chica_eliminada", id=caja_id)

    async def cerrar_caja(self, caja_id: int) -> CajaChicaDetalleDto:
        """Cerrar una caja chica recalculando saldos."""
        resultado = await self.db.execute(
            select(CajaChica).where(CajaChica.id == caja_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CajaChica", str(caja_id))

        # Query all movimientos for this caja's numero_caja
        res_mov = await self.db.execute(
            select(MovimientoCaja).where(
                MovimientoCaja.numero_caja == entidad.numero_caja
            )
        )
        movimientos = list(res_mov.scalars().all())

        # Recalculate totals
        ingreso_total = sum(
            float(m.monto) for m in movimientos
            if m.entrada_salida == "ENTRADA" and m.monto is not None
        )
        salida_total = sum(
            float(m.monto) for m in movimientos
            if m.entrada_salida == "SALIDA" and m.monto is not None
        )
        saldo_inicial = float(entidad.saldo_inicial) if entidad.saldo_inicial is not None else 0

        entidad.ingreso_total = ingreso_total
        entidad.salida_total = salida_total
        entidad.saldo_final = saldo_inicial + ingreso_total - salida_total
        entidad.estatus = "CERRADA"
        entidad.fecha_cierre = date.today()

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("caja_chica_cerrada", id=caja_id)

        return await self.obtener_caja(caja_id)

    # ─── Solicitudes ─────────────────────────────────────────────────

    async def listar_solicitudes(self) -> list[SolicitudCajaListaDto]:
        """Listar todas las solicitudes de caja."""
        resultado = await self.db.execute(
            select(SolicitudCaja).order_by(SolicitudCaja.id.desc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("solicitudes_caja_listadas", total=len(entidades))
        return [_solicitud_a_lista_dto(e) for e in entidades]

    async def obtener_solicitud(self, sol_id: int) -> SolicitudCajaListaDto:
        """Obtener solicitud de caja por ID."""
        resultado = await self.db.execute(
            select(SolicitudCaja).where(SolicitudCaja.id == sol_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SolicitudCaja", str(sol_id))
        return _solicitud_a_lista_dto(entidad)

    async def crear_solicitud(self, datos: SolicitudCajaCrear) -> SolicitudCaja:
        """Crear una solicitud de caja."""
        entidad = SolicitudCaja(
            fecha_solicitud=datetime.fromisoformat(datos.fecha_solicitud) if datos.fecha_solicitud else None,
            dni_usuario=datos.dni_usuario,
            nombre=datos.nombre,
            motivo=datos.motivo,
            monto_solicitado=datos.monto_solicitado,
            estatus="PENDIENTE",
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("solicitud_caja_creada", id=entidad.id)
        return entidad

    async def actualizar_solicitud(
        self, sol_id: int, datos: SolicitudCajaActualizar
    ) -> SolicitudCajaListaDto:
        """Actualizar una solicitud de caja."""
        resultado = await self.db.execute(
            select(SolicitudCaja).where(SolicitudCaja.id == sol_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("SolicitudCaja", str(sol_id))

        campos = datos.model_dump(exclude_unset=True)
        if "fecha_solicitud" in campos and campos["fecha_solicitud"]:
            campos["fecha_solicitud"] = datetime.fromisoformat(campos["fecha_solicitud"])
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        # Auto-calculate monto_devuelto_reembolsado when monto_rendido is set
        if entidad.monto_solicitado is not None and entidad.monto_rendido is not None:
            entidad.monto_devuelto_reembolsado = (
                float(entidad.monto_solicitado) - float(entidad.monto_rendido)
            )

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("solicitud_caja_actualizada", id=sol_id)
        return _solicitud_a_lista_dto(entidad)

    # ─── Movimientos ─────────────────────────────────────────────────

    async def listar_movimientos(
        self, numero_caja: str | None = None
    ) -> list[MovimientoCajaListaDto]:
        """Listar movimientos de caja, opcionalmente filtrados por numero_caja."""
        consulta = select(MovimientoCaja)
        if numero_caja:
            consulta = consulta.where(MovimientoCaja.numero_caja == numero_caja)
        consulta = consulta.order_by(MovimientoCaja.id.desc())

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("movimientos_caja_listados", total=len(entidades))
        return [_movimiento_a_lista_dto(e) for e in entidades]

    async def obtener_movimiento(self, mov_id: int) -> MovimientoCajaDetalleDto:
        """Obtener movimiento de caja por ID."""
        resultado = await self.db.execute(
            select(MovimientoCaja).where(MovimientoCaja.id == mov_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("MovimientoCaja", str(mov_id))
        return _movimiento_a_detalle_dto(entidad)

    async def crear_movimiento(self, datos: MovimientoCajaCrear) -> MovimientoCaja:
        """Crear un movimiento de caja. Validates parent caja is not closed."""
        # Find parent CajaChica by numero_caja
        if datos.numero_caja:
            res_caja = await self.db.execute(
                select(CajaChica).where(CajaChica.numero_caja == datos.numero_caja)
            )
            caja = res_caja.scalars().first()
            if caja and caja.estatus == "CERRADA":
                raise HTTPException(
                    status_code=422,
                    detail="No se puede agregar movimiento a caja cerrada",
                )

        entidad = MovimientoCaja(
            fecha_movimiento=datetime.fromisoformat(datos.fecha_movimiento) if datos.fecha_movimiento else None,
            numero_caja=datos.numero_caja,
            rubro=datos.rubro,
            fecha=date.fromisoformat(datos.fecha) if datos.fecha else None,
            ruc=datos.ruc,
            razon_social=datos.razon_social,
            tipo_documento=datos.tipo_documento,
            serie_documento=datos.serie_documento,
            numero_documento=datos.numero_documento,
            detalle=datos.detalle,
            monto=datos.monto,
            entrada_salida=datos.entrada_salida,
        )
        self.db.add(entidad)

        # Update parent caja totals
        if datos.numero_caja and datos.monto is not None:
            res_caja = await self.db.execute(
                select(CajaChica).where(CajaChica.numero_caja == datos.numero_caja)
            )
            caja = res_caja.scalars().first()
            if caja:
                if datos.entrada_salida == "ENTRADA":
                    caja.ingreso_total = float(caja.ingreso_total or 0) + float(datos.monto)
                elif datos.entrada_salida == "SALIDA":
                    caja.salida_total = float(caja.salida_total or 0) + float(datos.monto)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("movimiento_caja_creado", id=entidad.id)
        return entidad
