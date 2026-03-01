"""Servicio para cotizaciones de proveedor."""

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ReglaDeNegocioError
from app.esquemas.cotizacion import (
    CotizacionActualizar,
    CotizacionCrear,
    CotizacionDetalleDto,
    CotizacionListaDto,
    EvaluarCotizacion,
    SeleccionarCotizacion,
)
from app.modelos.equipo import CotizacionProveedor

logger = obtener_logger(__name__)


def _a_lista_dto(c: CotizacionProveedor) -> CotizacionListaDto:
    return CotizacionListaDto(
        id=c.id, codigo=c.codigo, solicitud_equipo_id=c.solicitud_equipo_id,
        proveedor_id=c.proveedor_id, descripcion_equipo=c.descripcion_equipo,
        tarifa_propuesta=float(c.tarifa_propuesta), tipo_tarifa=c.tipo_tarifa,
        moneda=c.moneda, estado=c.estado, puntaje=c.puntaje, is_active=c.is_active,
    )


def _a_detalle_dto(c: CotizacionProveedor) -> CotizacionDetalleDto:
    return CotizacionDetalleDto(
        id=c.id, codigo=c.codigo, solicitud_equipo_id=c.solicitud_equipo_id,
        proveedor_id=c.proveedor_id, descripcion_equipo=c.descripcion_equipo,
        tarifa_propuesta=float(c.tarifa_propuesta), tipo_tarifa=c.tipo_tarifa,
        moneda=c.moneda, estado=c.estado, puntaje=c.puntaje, is_active=c.is_active,
        horas_incluidas=float(c.horas_incluidas) if c.horas_incluidas else None,
        penalidad_exceso=float(c.penalidad_exceso) if c.penalidad_exceso else None,
        plazo_entrega_dias=c.plazo_entrega_dias, condiciones_pago=c.condiciones_pago,
        condiciones_especiales=c.condiciones_especiales, garantia=c.garantia,
        disponibilidad=c.disponibilidad, observaciones=c.observaciones,
        motivo_seleccion=c.motivo_seleccion, evaluado_por=c.evaluado_por,
        fecha_evaluacion=c.fecha_evaluacion, orden_alquiler_id=c.orden_alquiler_id,
        creado_por=c.creado_por, created_at=c.created_at,
    )


async def _generar_codigo(db: AsyncSession) -> str:
    result = await db.execute(
        select(func.count()).select_from(CotizacionProveedor)
    )
    count = result.scalar_one()
    return f"COT-{count + 1:04d}"


class ServicioCotizacion:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self, tenant_id: int, *, solicitud_id: int | None = None,
        estado: str | None = None, page: int = 1, limit: int = 10,
    ) -> tuple[list[CotizacionListaDto], int]:
        stmt = select(CotizacionProveedor).where(
            CotizacionProveedor.tenant_id == tenant_id,
            CotizacionProveedor.is_active.is_(True),
        )
        if solicitud_id:
            stmt = stmt.where(CotizacionProveedor.solicitud_equipo_id == solicitud_id)
        if estado:
            stmt = stmt.where(CotizacionProveedor.estado == estado)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(CotizacionProveedor.created_at.desc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        return [_a_lista_dto(c) for c in result.scalars().all()], total

    async def obtener_por_id(self, tenant_id: int, cot_id: int) -> CotizacionDetalleDto:
        result = await self.db.execute(
            select(CotizacionProveedor).where(
                CotizacionProveedor.id == cot_id, CotizacionProveedor.tenant_id == tenant_id
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Cotización", cot_id)
        return _a_detalle_dto(c)

    async def crear(
        self, tenant_id: int, datos: CotizacionCrear, user_id: int
    ) -> CotizacionDetalleDto:
        codigo = await _generar_codigo(self.db)
        c = CotizacionProveedor(
            codigo=codigo, **datos.model_dump(),
            tenant_id=tenant_id, creado_por=user_id,
        )
        self.db.add(c)
        await self.db.commit()
        await self.db.refresh(c)
        return _a_detalle_dto(c)

    async def actualizar(
        self, tenant_id: int, cot_id: int, datos: CotizacionActualizar
    ) -> CotizacionDetalleDto:
        result = await self.db.execute(
            select(CotizacionProveedor).where(
                CotizacionProveedor.id == cot_id, CotizacionProveedor.tenant_id == tenant_id
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Cotización", cot_id)
        if c.estado != "REGISTRADA":
            raise ReglaDeNegocioError.estado_invalido(
                "Cotización", c.estado, "actualizar", ["REGISTRADA"]
            )
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(c, campo, valor)
        await self.db.commit()
        await self.db.refresh(c)
        return _a_detalle_dto(c)

    async def evaluar(
        self, tenant_id: int, cot_id: int, datos: EvaluarCotizacion, user_id: int
    ) -> CotizacionDetalleDto:
        result = await self.db.execute(
            select(CotizacionProveedor).where(
                CotizacionProveedor.id == cot_id, CotizacionProveedor.tenant_id == tenant_id
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Cotización", cot_id)
        if c.estado != "REGISTRADA":
            raise ReglaDeNegocioError.estado_invalido(
                "Cotización", c.estado, "evaluar", ["REGISTRADA"]
            )
        c.estado = "EVALUADA"
        c.puntaje = datos.puntaje
        c.evaluado_por = user_id
        c.fecha_evaluacion = datetime.now(UTC)
        if datos.observaciones:
            c.observaciones = datos.observaciones
        await self.db.commit()
        await self.db.refresh(c)
        return _a_detalle_dto(c)

    async def seleccionar(
        self, tenant_id: int, cot_id: int, datos: SeleccionarCotizacion, user_id: int
    ) -> CotizacionDetalleDto:
        result = await self.db.execute(
            select(CotizacionProveedor).where(
                CotizacionProveedor.id == cot_id, CotizacionProveedor.tenant_id == tenant_id
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Cotización", cot_id)
        if c.estado != "EVALUADA":
            raise ReglaDeNegocioError.estado_invalido(
                "Cotización", c.estado, "seleccionar", ["EVALUADA"]
            )
        # Min 2 quotes rule check
        count_result = await self.db.execute(
            select(func.count()).where(
                CotizacionProveedor.solicitud_equipo_id == c.solicitud_equipo_id,
                CotizacionProveedor.tenant_id == tenant_id,
                CotizacionProveedor.is_active.is_(True),
            )
        )
        total_quotes = count_result.scalar_one()
        if total_quotes < 2:
            raise ReglaDeNegocioError(
                "Se requieren al menos 2 cotizaciones para seleccionar",
                "MIN_QUOTES_REQUIRED",
            )
        c.estado = "SELECCIONADA"
        c.motivo_seleccion = datos.motivo_seleccion
        # Reject others for same solicitud
        others = await self.db.execute(
            select(CotizacionProveedor).where(
                CotizacionProveedor.solicitud_equipo_id == c.solicitud_equipo_id,
                CotizacionProveedor.id != cot_id,
                CotizacionProveedor.tenant_id == tenant_id,
                CotizacionProveedor.estado != "RECHAZADA",
            )
        )
        for other in others.scalars().all():
            other.estado = "RECHAZADA"
        await self.db.commit()
        await self.db.refresh(c)
        return _a_detalle_dto(c)

    async def rechazar(self, tenant_id: int, cot_id: int) -> CotizacionDetalleDto:
        result = await self.db.execute(
            select(CotizacionProveedor).where(
                CotizacionProveedor.id == cot_id, CotizacionProveedor.tenant_id == tenant_id
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Cotización", cot_id)
        if c.estado in ("SELECCIONADA", "RECHAZADA"):
            raise ReglaDeNegocioError.estado_invalido(
                "Cotización", c.estado, "rechazar", ["REGISTRADA", "EVALUADA"]
            )
        c.estado = "RECHAZADA"
        await self.db.commit()
        await self.db.refresh(c)
        return _a_detalle_dto(c)
