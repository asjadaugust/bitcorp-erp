"""Servicio para caja y banco (bank cash flow)."""

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.caja_banco import (
    AdminCentroCostoDto,
    CuentaCajaBancoActualizar,
    CuentaCajaBancoCrear,
    CuentaCajaBancoDetalleDto,
    CuentaCajaBancoListaDto,
    DetalleMovimientoContableCrear,
    DetalleMovimientoContableDto,
    FlujoCajaBancoActualizar,
    FlujoCajaBancoCrear,
    FlujoCajaBancoDetalleDto,
    FlujoCajaBancoListaDto,
)
from app.modelos.administracion import (
    AdminCentroCosto,
    CuentaCajaBanco,
    DetalleMovimientoContable,
    FlujoCajaBanco,
)

logger = obtener_logger(__name__)


# --- Mappers ---


def _cuenta_a_lista_dto(e: CuentaCajaBanco) -> CuentaCajaBancoListaDto:
    return CuentaCajaBancoListaDto(
        id=e.id,
        numero_cuenta=e.numero_cuenta,
        cuenta=e.cuenta,
        acceso_proyecto=e.acceso_proyecto,
        estatus=e.estatus,
    )


def _cuenta_a_detalle_dto(e: CuentaCajaBanco) -> CuentaCajaBancoDetalleDto:
    return CuentaCajaBancoDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        numero_cuenta=e.numero_cuenta,
        cuenta=e.cuenta,
        acceso_proyecto=e.acceso_proyecto,
        unidad_operativa_id=e.unidad_operativa_id,
        estatus=e.estatus,
        created_at=e.created_at.isoformat() if e.created_at else None,
        updated_at=e.updated_at.isoformat() if e.updated_at else None,
    )


def _flujo_a_lista_dto(e: FlujoCajaBanco) -> FlujoCajaBancoListaDto:
    return FlujoCajaBancoListaDto(
        id=e.id,
        tipo_movimiento=e.tipo_movimiento,
        fecha_movimiento=e.fecha_movimiento.isoformat() if e.fecha_movimiento else None,
        cuenta_origen=e.cuenta_origen,
        numero_cuenta_origen=e.numero_cuenta_origen,
        concepto=e.concepto,
        moneda=e.moneda,
        total=float(e.total) if e.total is not None else None,
        voucher=e.voucher,
    )


def _flujo_a_detalle_dto(
    e: FlujoCajaBanco,
    detalles: list[DetalleMovimientoContableDto] | None = None,
) -> FlujoCajaBancoDetalleDto:
    return FlujoCajaBancoDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        tipo_movimiento=e.tipo_movimiento,
        fecha_movimiento=e.fecha_movimiento.isoformat() if e.fecha_movimiento else None,
        numero_cuenta_origen=e.numero_cuenta_origen,
        cuenta_origen=e.cuenta_origen,
        numero_cuenta_destino=e.numero_cuenta_destino,
        cuenta_destino=e.cuenta_destino,
        concepto=e.concepto,
        moneda=e.moneda,
        total=float(e.total) if e.total is not None else None,
        total_letra=e.total_letra,
        voucher=e.voucher,
        link_voucher=e.link_voucher,
        unidad_operativa_id=e.unidad_operativa_id,
        registrado_por=e.registrado_por,
        fecha_registro=e.fecha_registro.isoformat() if e.fecha_registro else None,
        actualizado_por=e.actualizado_por,
        fecha_actualizacion=e.fecha_actualizacion.isoformat() if e.fecha_actualizacion else None,
        created_at=e.created_at.isoformat() if e.created_at else None,
        updated_at=e.updated_at.isoformat() if e.updated_at else None,
        detalles=detalles or [],
    )


def _detalle_a_dto(e: DetalleMovimientoContable) -> DetalleMovimientoContableDto:
    return DetalleMovimientoContableDto(
        id=e.id,
        movimiento_legacy_id=e.movimiento_legacy_id,
        item=e.item,
        programacion_legacy_id=e.programacion_legacy_id,
        cuenta_por_pagar_legacy_id=e.cuenta_por_pagar_legacy_id,
        concepto=e.concepto,
        clasificacion=e.clasificacion,
        monto=float(e.monto) if e.monto is not None else None,
        created_at=e.created_at.isoformat() if e.created_at else None,
        updated_at=e.updated_at.isoformat() if e.updated_at else None,
    )


def _centro_costo_a_dto(e: AdminCentroCosto) -> AdminCentroCostoDto:
    return AdminCentroCostoDto(
        id=e.id,
        cuenta_por_pagar_legacy_id=e.cuenta_por_pagar_legacy_id,
        item=e.item,
        codigo_componente=e.codigo_componente,
        codigo_centro_costo=e.codigo_centro_costo,
        centro_costo=e.centro_costo,
        porcentaje=e.porcentaje,
        monto_final=float(e.monto_final) if e.monto_final is not None else None,
    )


class ServicioCajaBanco:
    """Servicio para gestion de caja y banco."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- CuentaCajaBanco ---

    async def listar_cuentas(self) -> list[CuentaCajaBancoListaDto]:
        """Listar todas las cuentas de caja y banco."""
        resultado = await self.db.execute(
            select(CuentaCajaBanco).order_by(CuentaCajaBanco.id.desc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("cuentas_caja_banco_listadas", total=len(entidades))
        return [_cuenta_a_lista_dto(e) for e in entidades]

    async def obtener_cuenta(self, cuenta_id: int) -> CuentaCajaBancoDetalleDto:
        """Obtener cuenta de caja y banco por ID."""
        resultado = await self.db.execute(
            select(CuentaCajaBanco).where(CuentaCajaBanco.id == cuenta_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CuentaCajaBanco", str(cuenta_id))
        return _cuenta_a_detalle_dto(entidad)

    async def crear_cuenta(self, datos: CuentaCajaBancoCrear) -> CuentaCajaBanco:
        """Crear una nueva cuenta de caja y banco."""
        entidad = CuentaCajaBanco(
            numero_cuenta=datos.numero_cuenta,
            cuenta=datos.cuenta,
            acceso_proyecto=datos.acceso_proyecto,
            unidad_operativa_id=datos.unidad_operativa_id,
            estatus=datos.estatus or "ACTIVO",
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("cuenta_caja_banco_creada", id=entidad.id)
        return entidad

    async def actualizar_cuenta(
        self, cuenta_id: int, datos: CuentaCajaBancoActualizar
    ) -> CuentaCajaBanco:
        """Actualizar una cuenta de caja y banco."""
        resultado = await self.db.execute(
            select(CuentaCajaBanco).where(CuentaCajaBanco.id == cuenta_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CuentaCajaBanco", str(cuenta_id))

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("cuenta_caja_banco_actualizada", id=cuenta_id)
        return entidad

    async def eliminar_cuenta(self, cuenta_id: int) -> None:
        """Eliminar una cuenta de caja y banco."""
        resultado = await self.db.execute(
            select(CuentaCajaBanco).where(CuentaCajaBanco.id == cuenta_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CuentaCajaBanco", str(cuenta_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("cuenta_caja_banco_eliminada", id=cuenta_id)

    # --- FlujoCajaBanco ---

    async def listar_flujos(
        self,
        pagina: int = 1,
        limite: int = 20,
        tipo_movimiento: str | None = None,
        moneda: str | None = None,
        fecha_desde: str | None = None,
        fecha_hasta: str | None = None,
    ) -> tuple[list[FlujoCajaBancoListaDto], int]:
        """Listar flujos de caja y banco con paginacion y filtros."""
        consulta = select(FlujoCajaBanco)
        consulta_count = select(func.count()).select_from(FlujoCajaBanco)

        # Apply filters
        if tipo_movimiento:
            consulta = consulta.where(FlujoCajaBanco.tipo_movimiento == tipo_movimiento)
            consulta_count = consulta_count.where(
                FlujoCajaBanco.tipo_movimiento == tipo_movimiento
            )
        if moneda:
            consulta = consulta.where(FlujoCajaBanco.moneda == moneda)
            consulta_count = consulta_count.where(FlujoCajaBanco.moneda == moneda)
        if fecha_desde:
            fecha_d = date.fromisoformat(fecha_desde)
            consulta = consulta.where(FlujoCajaBanco.fecha_movimiento >= fecha_d)
            consulta_count = consulta_count.where(
                FlujoCajaBanco.fecha_movimiento >= fecha_d
            )
        if fecha_hasta:
            fecha_h = date.fromisoformat(fecha_hasta)
            consulta = consulta.where(FlujoCajaBanco.fecha_movimiento <= fecha_h)
            consulta_count = consulta_count.where(
                FlujoCajaBanco.fecha_movimiento <= fecha_h
            )

        # Count
        resultado_count = await self.db.execute(consulta_count)
        total = resultado_count.scalar() or 0

        # Paginate
        consulta = consulta.order_by(FlujoCajaBanco.id.desc())
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("flujos_caja_banco_listados", total=total, pagina=pagina)
        return [_flujo_a_lista_dto(e) for e in entidades], total

    async def obtener_flujo(self, flujo_id: int) -> FlujoCajaBancoDetalleDto:
        """Obtener flujo de caja y banco por ID con detalles de movimiento."""
        resultado = await self.db.execute(
            select(FlujoCajaBanco).where(FlujoCajaBanco.id == flujo_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("FlujoCajaBanco", str(flujo_id))

        # Fetch nested detalles via movimiento_legacy_id
        movimiento_key = entidad.legacy_id or str(entidad.id)
        res_det = await self.db.execute(
            select(DetalleMovimientoContable).where(
                DetalleMovimientoContable.movimiento_legacy_id == movimiento_key
            )
        )
        detalles = [_detalle_a_dto(d) for d in res_det.scalars().all()]

        return _flujo_a_detalle_dto(entidad, detalles)

    async def crear_flujo(self, datos: FlujoCajaBancoCrear) -> FlujoCajaBanco:
        """Crear un nuevo flujo de caja y banco."""
        entidad = FlujoCajaBanco(
            tipo_movimiento=datos.tipo_movimiento,
            fecha_movimiento=(
                date.fromisoformat(datos.fecha_movimiento) if datos.fecha_movimiento else None
            ),
            numero_cuenta_origen=datos.numero_cuenta_origen,
            cuenta_origen=datos.cuenta_origen,
            numero_cuenta_destino=datos.numero_cuenta_destino,
            cuenta_destino=datos.cuenta_destino,
            concepto=datos.concepto,
            moneda=datos.moneda,
            total=datos.total,
            total_letra=datos.total_letra,
            voucher=datos.voucher,
            link_voucher=datos.link_voucher,
            fecha_registro=datetime.now(),
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("flujo_caja_banco_creado", id=entidad.id)
        return entidad

    async def actualizar_flujo(
        self, flujo_id: int, datos: FlujoCajaBancoActualizar
    ) -> FlujoCajaBanco:
        """Actualizar un flujo de caja y banco."""
        resultado = await self.db.execute(
            select(FlujoCajaBanco).where(FlujoCajaBanco.id == flujo_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("FlujoCajaBanco", str(flujo_id))

        campos = datos.model_dump(exclude_unset=True)
        if "fecha_movimiento" in campos and campos["fecha_movimiento"]:
            campos["fecha_movimiento"] = date.fromisoformat(campos["fecha_movimiento"])
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        entidad.fecha_actualizacion = datetime.now()

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("flujo_caja_banco_actualizado", id=flujo_id)
        return entidad

    # --- DetalleMovimientoContable ---

    async def listar_detalles_flujo(
        self, flujo_id: int
    ) -> list[DetalleMovimientoContableDto]:
        """Listar detalles de movimiento contable para un flujo."""
        resultado = await self.db.execute(
            select(FlujoCajaBanco).where(FlujoCajaBanco.id == flujo_id)
        )
        flujo = resultado.scalars().first()
        if not flujo:
            raise NoEncontradoError("FlujoCajaBanco", str(flujo_id))

        movimiento_key = flujo.legacy_id or str(flujo.id)
        res_det = await self.db.execute(
            select(DetalleMovimientoContable)
            .where(DetalleMovimientoContable.movimiento_legacy_id == movimiento_key)
            .order_by(DetalleMovimientoContable.id)
        )
        entidades = list(res_det.scalars().all())
        logger.info("detalles_flujo_listados", flujo_id=flujo_id, total=len(entidades))
        return [_detalle_a_dto(e) for e in entidades]

    async def crear_detalle_flujo(
        self, flujo_id: int, datos: DetalleMovimientoContableCrear
    ) -> DetalleMovimientoContable:
        """Crear un detalle de movimiento contable para un flujo."""
        resultado = await self.db.execute(
            select(FlujoCajaBanco).where(FlujoCajaBanco.id == flujo_id)
        )
        flujo = resultado.scalars().first()
        if not flujo:
            raise NoEncontradoError("FlujoCajaBanco", str(flujo_id))

        movimiento_key = flujo.legacy_id or str(flujo.id)

        entidad = DetalleMovimientoContable(
            movimiento_legacy_id=movimiento_key,
            concepto=datos.concepto,
            clasificacion=datos.clasificacion,
            monto=datos.monto,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("detalle_flujo_creado", id=entidad.id, flujo_id=flujo_id)
        return entidad

    async def eliminar_detalle(self, detalle_id: int) -> None:
        """Eliminar un detalle de movimiento contable."""
        resultado = await self.db.execute(
            select(DetalleMovimientoContable).where(
                DetalleMovimientoContable.id == detalle_id
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("DetalleMovimientoContable", str(detalle_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("detalle_flujo_eliminado", id=detalle_id)

    # --- AdminCentroCosto ---

    async def listar_admin_centros_costo(
        self, cuenta_por_pagar_legacy_id: str | None = None
    ) -> list[AdminCentroCostoDto]:
        """Listar centros de costo administrativos (read-only)."""
        consulta = select(AdminCentroCosto)
        if cuenta_por_pagar_legacy_id:
            consulta = consulta.where(
                AdminCentroCosto.cuenta_por_pagar_legacy_id == cuenta_por_pagar_legacy_id
            )
        consulta = consulta.order_by(AdminCentroCosto.id)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("centros_costo_admin_listados", total=len(entidades))
        return [_centro_costo_a_dto(e) for e in entidades]
