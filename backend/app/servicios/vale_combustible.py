"""Servicio para vales de combustible."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.vale_combustible import (
    ValeCombustibleActualizar,
    ValeCombustibleCrear,
    ValeCombustibleDetalleDto,
    ValeCombustibleListaDto,
)
from app.modelos.equipo import ValeCombustible

logger = obtener_logger(__name__)


def _a_lista_dto(v: ValeCombustible) -> ValeCombustibleListaDto:
    return ValeCombustibleListaDto(
        id=v.id, codigo=v.codigo, equipo_id=v.equipo_id,
        fecha=v.fecha, numero_vale=v.numero_vale,
        tipo_combustible=v.tipo_combustible,
        cantidad_galones=float(v.cantidad_galones),
        monto_total=float(v.monto_total) if v.monto_total else None,
        estado=v.estado,
    )


def _a_detalle_dto(v: ValeCombustible) -> ValeCombustibleDetalleDto:
    return ValeCombustibleDetalleDto(
        id=v.id, codigo=v.codigo, equipo_id=v.equipo_id,
        fecha=v.fecha, numero_vale=v.numero_vale,
        tipo_combustible=v.tipo_combustible,
        cantidad_galones=float(v.cantidad_galones),
        monto_total=float(v.monto_total) if v.monto_total else None,
        estado=v.estado, parte_diario_id=v.parte_diario_id,
        proyecto_id=v.proyecto_id,
        precio_unitario=float(v.precio_unitario) if v.precio_unitario else None,
        proveedor=v.proveedor, observaciones=v.observaciones,
        creado_por=v.creado_por, created_at=v.created_at,
    )


async def _generar_codigo(db: AsyncSession) -> str:
    result = await db.execute(select(func.count()).select_from(ValeCombustible))
    count = result.scalar_one()
    return f"VCB-{count + 1:04d}"


class ServicioValeCombustible:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self, tenant_id: int, *, estado: str | None = None,
        tipo_combustible: str | None = None, page: int = 1, limit: int = 10,
    ) -> tuple[list[ValeCombustibleListaDto], int]:
        stmt = select(ValeCombustible)
        if estado:
            stmt = stmt.where(ValeCombustible.estado == estado)
        if tipo_combustible:
            stmt = stmt.where(ValeCombustible.tipo_combustible == tipo_combustible)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(ValeCombustible.fecha.desc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        return [_a_lista_dto(v) for v in result.scalars().all()], total

    async def listar_por_equipo(
        self, tenant_id: int, equipo_id: int
    ) -> list[ValeCombustibleListaDto]:
        stmt = select(ValeCombustible).where(
            ValeCombustible.equipo_id == equipo_id,
        ).order_by(ValeCombustible.fecha.desc())
        result = await self.db.execute(stmt)
        return [_a_lista_dto(v) for v in result.scalars().all()]

    async def obtener_por_id(self, tenant_id: int, vale_id: int) -> ValeCombustibleDetalleDto:
        result = await self.db.execute(
            select(ValeCombustible).where(ValeCombustible.id == vale_id)
        )
        v = result.scalars().first()
        if not v:
            raise NoEncontradoError("Vale de combustible", vale_id)
        return _a_detalle_dto(v)

    async def crear(
        self, tenant_id: int, datos: ValeCombustibleCrear, user_id: int
    ) -> ValeCombustibleDetalleDto:
        codigo = await _generar_codigo(self.db)
        # Auto-calc monto_total
        monto_total = None
        if datos.precio_unitario:
            monto_total = round(datos.cantidad_galones * datos.precio_unitario, 2)
        v = ValeCombustible(
            codigo=codigo,
            **datos.model_dump(),
            monto_total=monto_total,
            creado_por=user_id,
        )
        self.db.add(v)
        await self.db.commit()
        await self.db.refresh(v)
        return _a_detalle_dto(v)

    async def actualizar(
        self, tenant_id: int, vale_id: int, datos: ValeCombustibleActualizar
    ) -> ValeCombustibleDetalleDto:
        result = await self.db.execute(
            select(ValeCombustible).where(ValeCombustible.id == vale_id)
        )
        v = result.scalars().first()
        if not v:
            raise NoEncontradoError("Vale de combustible", vale_id)
        if v.estado != "PENDIENTE":
            raise ReglaDeNegocioError.estado_invalido(
                "Vale", v.estado, "actualizar", ["PENDIENTE"]
            )
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(v, campo, valor)
        # Recalc monto_total
        if v.precio_unitario and v.cantidad_galones:
            v.monto_total = round(float(v.cantidad_galones) * float(v.precio_unitario), 2)
        await self.db.commit()
        await self.db.refresh(v)
        return _a_detalle_dto(v)

    async def registrar(self, tenant_id: int, vale_id: int) -> ValeCombustibleDetalleDto:
        result = await self.db.execute(
            select(ValeCombustible).where(ValeCombustible.id == vale_id)
        )
        v = result.scalars().first()
        if not v:
            raise NoEncontradoError("Vale de combustible", vale_id)
        if v.estado != "PENDIENTE":
            raise ReglaDeNegocioError.estado_invalido(
                "Vale", v.estado, "registrar", ["PENDIENTE"]
            )
        v.estado = "REGISTRADO"
        await self.db.commit()
        await self.db.refresh(v)
        return _a_detalle_dto(v)

    async def anular(self, tenant_id: int, vale_id: int) -> ValeCombustibleDetalleDto:
        result = await self.db.execute(
            select(ValeCombustible).where(ValeCombustible.id == vale_id)
        )
        v = result.scalars().first()
        if not v:
            raise NoEncontradoError("Vale de combustible", vale_id)
        if v.estado == "ANULADO":
            raise ReglaDeNegocioError.estado_invalido(
                "Vale", v.estado, "anular", ["PENDIENTE", "REGISTRADO"]
            )
        v.estado = "ANULADO"
        await self.db.commit()
        await self.db.refresh(v)
        return _a_detalle_dto(v)
