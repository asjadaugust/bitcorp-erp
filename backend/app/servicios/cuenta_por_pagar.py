"""Servicio para cuentas por pagar.

Replica AccountsPayableService del BFF Node.js.
"""

from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.cuenta_por_pagar import (
    CuentaPorPagarActualizar,
    CuentaPorPagarCrear,
    CuentaPorPagarDetalleDto,
    CuentaPorPagarListaDto,
)
from app.modelos.administracion import CuentaPorPagar

logger = obtener_logger(__name__)


def _a_lista_dto(e: CuentaPorPagar) -> CuentaPorPagarListaDto:
    return CuentaPorPagarListaDto(
        id=e.id,
        proveedor_id=e.proveedor_id,
        numero_factura=e.numero_factura,
        fecha_emision=e.fecha_emision.isoformat(),
        fecha_vencimiento=e.fecha_vencimiento.isoformat(),
        monto_total=float(e.monto_total),
        monto_pagado=float(e.monto_pagado),
        saldo=float(e.saldo) if e.saldo is not None else None,
        moneda=e.moneda,
        estado=e.estado,
    )


def _a_detalle_dto(e: CuentaPorPagar) -> CuentaPorPagarDetalleDto:
    return CuentaPorPagarDetalleDto(
        id=e.id,
        proveedor_id=e.proveedor_id,
        numero_factura=e.numero_factura,
        fecha_emision=e.fecha_emision.isoformat(),
        fecha_vencimiento=e.fecha_vencimiento.isoformat(),
        monto_total=float(e.monto_total),
        monto_pagado=float(e.monto_pagado),
        saldo=float(e.saldo) if e.saldo is not None else None,
        moneda=e.moneda,
        estado=e.estado,
        observaciones=e.observaciones,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


class ServicioCuentaPorPagar:
    """Servicio para gestión de cuentas por pagar."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        tenant_id: int,
        *,
        estado: str | None = None,
        proveedor_id: int | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[CuentaPorPagarListaDto], int]:
        """Listar cuentas por pagar con filtros y paginación."""
        consulta = select(CuentaPorPagar).where(CuentaPorPagar.tenant_id == tenant_id)

        if estado:
            consulta = consulta.where(CuentaPorPagar.estado == estado)
        if proveedor_id:
            consulta = consulta.where(CuentaPorPagar.proveedor_id == proveedor_id)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(CuentaPorPagar.fecha_vencimiento.asc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("cuentas_por_pagar_listadas", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def listar_pendientes(
        self, tenant_id: int
    ) -> list[CuentaPorPagarListaDto]:
        """Listar cuentas pendientes."""
        resultado = await self.db.execute(
            select(CuentaPorPagar)
            .where(
                CuentaPorPagar.tenant_id == tenant_id,
                CuentaPorPagar.estado == "PENDIENTE",
            )
            .order_by(CuentaPorPagar.fecha_vencimiento.asc())
        )
        entidades = list(resultado.scalars().all())
        return [_a_lista_dto(e) for e in entidades]

    async def obtener_por_id(
        self, tenant_id: int, cuenta_id: int
    ) -> CuentaPorPagarDetalleDto:
        """Obtener cuenta por pagar por ID."""
        resultado = await self.db.execute(
            select(CuentaPorPagar).where(
                CuentaPorPagar.id == cuenta_id,
                CuentaPorPagar.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CuentaPorPagar", str(cuenta_id))
        return _a_detalle_dto(entidad)

    async def crear(
        self, tenant_id: int, datos: CuentaPorPagarCrear
    ) -> CuentaPorPagarDetalleDto:
        """Crear una cuenta por pagar."""
        entidad = CuentaPorPagar(
            proveedor_id=datos.proveedor_id,
            numero_factura=datos.numero_factura,
            fecha_emision=date.fromisoformat(datos.fecha_emision),
            fecha_vencimiento=date.fromisoformat(datos.fecha_vencimiento),
            monto_total=datos.monto_total,
            monto_pagado=0,
            saldo=datos.monto_total,
            moneda=datos.moneda,
            observaciones=datos.observaciones,
            tenant_id=tenant_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("cuenta_por_pagar_creada", id=entidad.id)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, tenant_id: int, cuenta_id: int, datos: CuentaPorPagarActualizar
    ) -> CuentaPorPagarDetalleDto:
        """Actualizar una cuenta por pagar."""
        resultado = await self.db.execute(
            select(CuentaPorPagar).where(
                CuentaPorPagar.id == cuenta_id,
                CuentaPorPagar.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CuentaPorPagar", str(cuenta_id))

        campos = datos.model_dump(exclude_unset=True)
        if "fecha_vencimiento" in campos and campos["fecha_vencimiento"]:
            campos["fecha_vencimiento"] = date.fromisoformat(campos["fecha_vencimiento"])
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        # Recalcular saldo
        entidad.saldo = float(entidad.monto_total) - float(entidad.monto_pagado)
        if entidad.saldo <= 0:
            entidad.estado = "PAGADO"

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("cuenta_por_pagar_actualizada", id=cuenta_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, tenant_id: int, cuenta_id: int) -> None:
        """Eliminar una cuenta por pagar."""
        resultado = await self.db.execute(
            select(CuentaPorPagar).where(
                CuentaPorPagar.id == cuenta_id,
                CuentaPorPagar.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CuentaPorPagar", str(cuenta_id))

        entidad.estado = "ANULADO"
        await self.db.commit()
        logger.info("cuenta_por_pagar_eliminada", id=cuenta_id)

    async def obtener_resumen(self, tenant_id: int) -> dict[str, Any]:
        """Obtener resumen de cuentas por pagar."""
        r = await self.db.execute(
            select(
                func.count(CuentaPorPagar.id),
                func.coalesce(func.sum(CuentaPorPagar.saldo), 0),
            ).where(
                CuentaPorPagar.tenant_id == tenant_id,
                CuentaPorPagar.estado == "PENDIENTE",
            )
        )
        row = r.one()
        return {"total_pendientes": int(row[0]), "saldo_total": float(row[1])}
