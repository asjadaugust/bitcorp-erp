"""Servicio para contratos.

Replica ContractService del BFF Node.js (core CRUD + lifecycle).
"""

from typing import Any

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, selectinload

from app.config.logging import obtener_logger
from app.core.excepciones import (
    ConflictoError,
    NoEncontradoError,
    ReglaDeNegocioError,
    ValidacionError,
)
from app.esquemas.contrato import (
    AdendaCrear,
    ContratoActualizar,
    ContratoCrear,
    ContratoDetalleDto,
    ContratoListaDto,
)
from app.modelos.equipo import ContratoAdenda, Equipo
from app.modelos.proveedores import Proveedor

logger = obtener_logger(__name__)


# ─── Valid sort fields ──────────────────────────────────────────────────────

_CAMPOS_ORDENAMIENTO: dict[str, str] = {
    "numero_contrato": "numero_contrato",
    "fecha_contrato": "fecha_contrato",
    "fecha_inicio": "fecha_inicio",
    "fecha_fin": "fecha_fin",
    "estado": "estado",
    "moneda": "moneda",
    "tarifa": "tarifa",
    "created_at": "created_at",
    "updated_at": "updated_at",
}


def _a_lista_dto(c: ContratoAdenda) -> ContratoListaDto:
    return ContratoListaDto(
        id=c.id,
        numero_contrato=c.numero_contrato,
        tipo=c.tipo,
        equipo_id=c.equipo_id,
        contrato_padre_id=c.contrato_padre_id,
        fecha_contrato=c.fecha_contrato,
        fecha_inicio=c.fecha_inicio,
        fecha_fin=c.fecha_fin,
        moneda=c.moneda,
        tipo_tarifa=c.tipo_tarifa,
        tarifa=float(c.tarifa) if c.tarifa is not None else None,
        modalidad=c.modalidad,
        estado=c.estado,
        proveedor_id=c.proveedor_id,
        incluye_motor=c.incluye_motor,
        incluye_operador=c.incluye_operador,
        horas_incluidas=c.horas_incluidas,
        penalidad_exceso=float(c.penalidad_exceso) if c.penalidad_exceso is not None else None,
        tenant_id=c.tenant_id,
        created_at=c.created_at,
        updated_at=c.updated_at,
        equipo_codigo=c.equipo.codigo_equipo if c.equipo else None,
        equipo_marca=c.equipo.marca if c.equipo else None,
        equipo_modelo=c.equipo.modelo if c.equipo else None,
        proveedor_razon_social=(
            c.proveedor.razon_social if c.proveedor else None
        ),
    )


def _a_detalle_dto(c: ContratoAdenda) -> ContratoDetalleDto:
    return ContratoDetalleDto(
        id=c.id,
        numero_contrato=c.numero_contrato,
        tipo=c.tipo,
        equipo_id=c.equipo_id,
        contrato_padre_id=c.contrato_padre_id,
        fecha_contrato=c.fecha_contrato,
        fecha_inicio=c.fecha_inicio,
        fecha_fin=c.fecha_fin,
        moneda=c.moneda,
        tipo_tarifa=c.tipo_tarifa,
        tarifa=float(c.tarifa) if c.tarifa is not None else None,
        modalidad=c.modalidad,
        estado=c.estado,
        proveedor_id=c.proveedor_id,
        incluye_motor=c.incluye_motor,
        incluye_operador=c.incluye_operador,
        horas_incluidas=c.horas_incluidas,
        penalidad_exceso=float(c.penalidad_exceso) if c.penalidad_exceso is not None else None,
        tenant_id=c.tenant_id,
        created_at=c.created_at,
        updated_at=c.updated_at,
        equipo_codigo=c.equipo.codigo_equipo if c.equipo else None,
        equipo_marca=c.equipo.marca if c.equipo else None,
        equipo_modelo=c.equipo.modelo if c.equipo else None,
        proveedor_razon_social=(
            c.proveedor.razon_social if c.proveedor else None
        ),
        # Detail-only fields
        legacy_id=c.legacy_id,
        costo_adicional_motor=(
            float(c.costo_adicional_motor) if c.costo_adicional_motor is not None else None
        ),
        condiciones_especiales=c.condiciones_especiales,
        documento_url=c.documento_url,
        creado_por=c.creado_por,
        minimo_por=c.minimo_por,
        cantidad_minima=float(c.cantidad_minima) if c.cantidad_minima is not None else None,
        documento_acredita=c.documento_acredita,
        fecha_acreditada=c.fecha_acreditada,
        jurisdiccion=c.jurisdiccion,
        plazo_texto=c.plazo_texto,
        motivo_resolucion=c.motivo_resolucion,
        fecha_resolucion=c.fecha_resolucion,
        monto_liquidacion=(
            float(c.monto_liquidacion) if c.monto_liquidacion is not None else None
        ),
        causal_resolucion=c.causal_resolucion,
        resuelto_por=c.resuelto_por,
        fecha_liquidacion=c.fecha_liquidacion,
        liquidado_por=c.liquidado_por,
        observaciones_liquidacion=c.observaciones_liquidacion,
        adendas=[_a_lista_dto(a) for a in (c.adendas or [])],
    )


class ServicioContrato:
    """Servicio para gestión de contratos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _recargar_para_detalle(self, contrato_id: int) -> ContratoAdenda:
        """Re-query contract with eagerly loaded relationships for DTO."""
        result = await self.db.execute(
            select(ContratoAdenda)
            .options(selectinload(ContratoAdenda.adendas))
            .where(ContratoAdenda.id == contrato_id)
        )
        contrato = result.scalars().unique().first()
        if not contrato:
            raise NoEncontradoError("Contrato", contrato_id)
        return contrato

    # ─── Listar (paginated, filtered, sorted) ───────────────────────────

    async def listar(
        self,
        tenant_id: int,
        *,
        estado: str | None = None,
        equipment_id: int | None = None,
        provider_id: int | None = None,
        search: str | None = None,
        sort_by: str = "fecha_inicio",
        sort_order: str = "DESC",
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[ContratoListaDto], int]:
        """Listar contratos con filtros, paginación y ordenamiento."""
        stmt = (
            select(ContratoAdenda)
            .outerjoin(Equipo, ContratoAdenda.equipo_id == Equipo.id)
            .outerjoin(
                Proveedor,
                ContratoAdenda.proveedor_id == Proveedor.id,
            )
            .options(
                contains_eager(ContratoAdenda.equipo),
                contains_eager(ContratoAdenda.proveedor),
            )
            .where(
                ContratoAdenda.tenant_id == tenant_id,
                ContratoAdenda.tipo == "CONTRATO",
            )
        )

        if estado:
            stmt = stmt.where(ContratoAdenda.estado == estado)
        else:
            stmt = stmt.where(ContratoAdenda.estado != "CANCELADO")

        if equipment_id:
            stmt = stmt.where(ContratoAdenda.equipo_id == equipment_id)
        if provider_id:
            stmt = stmt.where(ContratoAdenda.proveedor_id == provider_id)
        if search:
            patron = f"%{search}%"
            stmt = stmt.where(
                or_(
                    ContratoAdenda.numero_contrato.ilike(patron),
                    Proveedor.razon_social.ilike(patron),
                    Equipo.modelo.ilike(patron),
                )
            )

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Sort
        col_name = _CAMPOS_ORDENAMIENTO.get(sort_by, "fecha_inicio")
        col = getattr(ContratoAdenda, col_name, ContratoAdenda.fecha_inicio)
        order = col.desc() if sort_order.upper() == "DESC" else col.asc()
        stmt = stmt.order_by(order)

        # Paginate
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        contratos = list(result.scalars().unique().all())

        logger.info("contratos_listados", total=total, returned=len(contratos), page=page)
        return [_a_lista_dto(c) for c in contratos], total

    # ─── Obtener por ID ─────────────────────────────────────────────────

    async def obtener_por_id(self, tenant_id: int, contrato_id: int) -> ContratoDetalleDto:
        """Obtener un contrato por su ID con adendas."""
        result = await self.db.execute(
            select(ContratoAdenda)
            .options(selectinload(ContratoAdenda.adendas))
            .where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        contrato = result.scalars().unique().first()
        if not contrato:
            raise NoEncontradoError("Contrato", contrato_id)

        return _a_detalle_dto(contrato)

    # ─── Obtener por número ─────────────────────────────────────────────

    async def obtener_por_numero(
        self, tenant_id: int, numero: str
    ) -> ContratoDetalleDto:
        """Obtener un contrato por numero_contrato."""
        result = await self.db.execute(
            select(ContratoAdenda)
            .options(selectinload(ContratoAdenda.adendas))
            .where(
                ContratoAdenda.numero_contrato == numero,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        contrato = result.scalars().unique().first()
        if not contrato:
            raise NoEncontradoError("Contrato", numero)
        return _a_detalle_dto(contrato)

    # ─── Crear ──────────────────────────────────────────────────────────

    async def crear(
        self, tenant_id: int, datos: ContratoCrear, creado_por: int
    ) -> ContratoDetalleDto:
        """Crear un nuevo contrato con validaciones."""
        # Date validation
        if datos.fecha_fin <= datos.fecha_inicio:
            raise ValidacionError("La fecha fin debe ser posterior a la fecha inicio")

        # Uniqueness check
        existente = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.numero_contrato == datos.numero_contrato,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        if existente.scalars().first():
            raise ConflictoError(
                f"El número de contrato '{datos.numero_contrato}' ya existe"
            )

        # Overlap check
        if datos.equipo_id:
            overlap = await self._verificar_solapamiento(
                tenant_id, datos.equipo_id, datos.fecha_inicio, datos.fecha_fin
            )
            if overlap:
                raise ReglaDeNegocioError(
                    "El equipo ya tiene un contrato activo para este período"
                )

        contrato = ContratoAdenda(
            numero_contrato=datos.numero_contrato,
            equipo_id=datos.equipo_id,
            tipo="CONTRATO",
            estado="ACTIVO",
            fecha_contrato=datos.fecha_contrato,
            fecha_inicio=datos.fecha_inicio,
            fecha_fin=datos.fecha_fin,
            moneda=datos.moneda,
            tipo_tarifa=datos.tipo_tarifa,
            tarifa=datos.tarifa,
            modalidad=datos.modalidad,
            incluye_motor=datos.incluye_motor,
            incluye_operador=datos.incluye_operador,
            costo_adicional_motor=datos.costo_adicional_motor,
            horas_incluidas=datos.horas_incluidas,
            penalidad_exceso=datos.penalidad_exceso,
            condiciones_especiales=datos.condiciones_especiales,
            documento_url=datos.documento_url,
            proveedor_id=datos.proveedor_id,
            minimo_por=datos.minimo_por,
            cantidad_minima=datos.cantidad_minima,
            documento_acredita=datos.documento_acredita,
            fecha_acreditada=datos.fecha_acreditada,
            jurisdiccion=datos.jurisdiccion,
            plazo_texto=datos.plazo_texto,
            creado_por=creado_por,
            tenant_id=tenant_id,
        )
        self.db.add(contrato)
        await self.db.commit()

        contrato = await self._recargar_para_detalle(contrato.id)
        logger.info("contrato_creado", id=contrato.id, numero=contrato.numero_contrato)
        return _a_detalle_dto(contrato)

    # ─── Actualizar ─────────────────────────────────────────────────────

    async def actualizar(
        self,
        tenant_id: int,
        contrato_id: int,
        datos: ContratoActualizar,
        _actualizado_por: int,
    ) -> ContratoDetalleDto:
        """Actualizar un contrato existente."""
        result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        contrato = result.scalars().first()
        if not contrato:
            raise NoEncontradoError("Contrato", contrato_id)

        campos = datos.model_dump(exclude_unset=True)

        # Date validation
        fecha_inicio = campos.get("fecha_inicio", contrato.fecha_inicio)
        fecha_fin = campos.get("fecha_fin", contrato.fecha_fin)
        if "fecha_inicio" in campos or "fecha_fin" in campos:
            if fecha_fin <= fecha_inicio:
                raise ValidacionError("La fecha fin debe ser posterior a la fecha inicio")

        # Uniqueness check if changing numero
        if "numero_contrato" in campos and campos["numero_contrato"] != contrato.numero_contrato:
            dup = await self.db.execute(
                select(ContratoAdenda).where(
                    ContratoAdenda.numero_contrato == campos["numero_contrato"],
                    ContratoAdenda.tenant_id == tenant_id,
                    ContratoAdenda.id != contrato_id,
                )
            )
            if dup.scalars().first():
                raise ConflictoError(
                    f"El número de contrato '{campos['numero_contrato']}' ya existe"
                )

        for campo, valor in campos.items():
            setattr(contrato, campo, valor)

        await self.db.commit()

        contrato = await self._recargar_para_detalle(contrato_id)
        logger.info("contrato_actualizado", id=contrato_id)
        return _a_detalle_dto(contrato)

    # ─── Eliminar (soft delete: CANCELADO) ──────────────────────────────

    async def eliminar(self, tenant_id: int, contrato_id: int) -> None:
        """Soft delete: marcar contrato como CANCELADO."""
        result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        contrato = result.scalars().first()
        if not contrato:
            raise NoEncontradoError("Contrato", contrato_id)

        contrato.estado = "CANCELADO"
        await self.db.commit()
        logger.info("contrato_eliminado", id=contrato_id)

    # ─── Adendas ────────────────────────────────────────────────────────

    async def listar_adendas(
        self, tenant_id: int, contrato_id: int
    ) -> list[ContratoListaDto]:
        """Listar adendas de un contrato padre."""
        # Verify parent exists
        parent = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        if not parent.scalars().first():
            raise NoEncontradoError("Contrato", contrato_id)

        result = await self.db.execute(
            select(ContratoAdenda)
            .where(
                ContratoAdenda.contrato_padre_id == contrato_id,
                ContratoAdenda.tipo == "ADENDA",
                ContratoAdenda.tenant_id == tenant_id,
            )
            .order_by(ContratoAdenda.created_at.asc())
        )
        adendas = list(result.scalars().unique().all())
        return [_a_lista_dto(a) for a in adendas]

    async def crear_adenda(
        self, tenant_id: int, datos: AdendaCrear, creado_por: int
    ) -> ContratoDetalleDto:
        """Crear una adenda (extensión de contrato) atomicamente."""
        # Get parent
        parent_result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == datos.contrato_padre_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        parent = parent_result.scalars().first()
        if not parent:
            raise NoEncontradoError("Contrato", datos.contrato_padre_id)

        if parent.tipo != "CONTRATO":
            raise ReglaDeNegocioError("Solo se pueden crear adendas de un contrato principal")

        # Validate extension
        if datos.fecha_fin <= parent.fecha_fin:
            raise ReglaDeNegocioError(
                "La nueva fecha fin debe ser posterior a la fecha fin actual del contrato"
            )

        # Check unique numero
        dup = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.numero_contrato == datos.numero_contrato,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        if dup.scalars().first():
            raise ConflictoError(
                f"El número de contrato '{datos.numero_contrato}' ya existe"
            )

        # Atomic: create adenda + update parent fecha_fin
        adenda = ContratoAdenda(
            numero_contrato=datos.numero_contrato,
            equipo_id=parent.equipo_id,
            tipo="ADENDA",
            estado="ACTIVO",
            contrato_padre_id=parent.id,
            fecha_contrato=datos.fecha_contrato or parent.fecha_contrato,
            fecha_inicio=parent.fecha_inicio,
            fecha_fin=datos.fecha_fin,
            moneda=parent.moneda,
            tipo_tarifa=parent.tipo_tarifa,
            tarifa=parent.tarifa,
            modalidad=parent.modalidad,
            incluye_motor=parent.incluye_motor,
            incluye_operador=parent.incluye_operador,
            costo_adicional_motor=parent.costo_adicional_motor,
            horas_incluidas=parent.horas_incluidas,
            penalidad_exceso=parent.penalidad_exceso,
            proveedor_id=parent.proveedor_id,
            creado_por=creado_por,
            tenant_id=tenant_id,
        )
        self.db.add(adenda)

        # Update parent
        parent.fecha_fin = datos.fecha_fin

        await self.db.commit()

        adenda = await self._recargar_para_detalle(adenda.id)
        logger.info(
            "adenda_creada",
            adenda_id=adenda.id,
            parent_id=parent.id,
            nueva_fecha_fin=str(datos.fecha_fin),
        )
        return _a_detalle_dto(adenda)

    # ─── Contar activos ─────────────────────────────────────────────────

    async def contar_activos(self, tenant_id: int) -> int:
        """Contar contratos activos (tipo=CONTRATO, estado=ACTIVO)."""
        result = await self.db.execute(
            select(func.count()).where(
                ContratoAdenda.tenant_id == tenant_id,
                ContratoAdenda.tipo == "CONTRATO",
                ContratoAdenda.estado == "ACTIVO",
            )
        )
        return result.scalar_one()

    # ─── Resolver (PRD §12) ─────────────────────────────────────────────

    async def resolver(
        self,
        tenant_id: int,
        contrato_id: int,
        *,
        causal_resolucion: str,
        motivo_resolucion: str,
        fecha_resolucion: Any,
        monto_liquidacion: float | None = None,
        usuario_id: int,
    ) -> ContratoDetalleDto:
        """Resolver contrato: ACTIVO/VENCIDO → RESUELTO."""
        result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        contrato = result.scalars().first()
        if not contrato:
            raise NoEncontradoError("Contrato", contrato_id)

        if contrato.estado not in ("ACTIVO", "VENCIDO"):
            raise ConflictoError(
                f"No se puede resolver un contrato en estado {contrato.estado}. "
                "Solo contratos ACTIVO o VENCIDO."
            )

        if not causal_resolucion:
            raise ValidacionError("La causal de resolución es requerida")
        if not motivo_resolucion or not motivo_resolucion.strip():
            raise ValidacionError("El motivo de resolución es requerido")

        contrato.estado = "RESUELTO"
        contrato.causal_resolucion = causal_resolucion
        contrato.motivo_resolucion = motivo_resolucion.strip()
        contrato.fecha_resolucion = fecha_resolucion
        contrato.resuelto_por = usuario_id
        if monto_liquidacion is not None:
            contrato.monto_liquidacion = monto_liquidacion

        await self.db.commit()

        contrato = await self._recargar_para_detalle(contrato_id)
        logger.info("contrato_resuelto", id=contrato_id, causal=causal_resolucion)
        return _a_detalle_dto(contrato)

    # ─── Verificar liquidación ──────────────────────────────────────────

    async def verificar_liquidacion(
        self, tenant_id: int, contrato_id: int
    ) -> dict[str, Any]:
        """Verificar requisitos para liquidación."""
        result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        contrato = result.scalars().first()
        if not contrato:
            raise NoEncontradoError("Contrato", contrato_id)

        observaciones: list[str] = []

        if contrato.estado != "RESUELTO":
            observaciones.append(
                f"El contrato debe estar en estado RESUELTO (actual: {contrato.estado})"
            )

        # Stub: valorizaciones check (will be connected in Phase 2e)
        valorizaciones_pendientes = 0
        total_valorizaciones = 0

        # Stub: acta devolucion check
        tiene_acta = False

        if not tiene_acta:
            observaciones.append("No existe Acta de Devolución registrada para el equipo")

        return {
            "puede_liquidar": len(observaciones) == 0,
            "contrato_estado": contrato.estado,
            "valorizaciones_pendientes": valorizaciones_pendientes,
            "total_valorizaciones": total_valorizaciones,
            "tiene_acta_devolucion": tiene_acta,
            "observaciones": observaciones,
        }

    # ─── Liquidar ───────────────────────────────────────────────────────

    async def liquidar(
        self,
        tenant_id: int,
        contrato_id: int,
        *,
        fecha_liquidacion: Any,
        monto_liquidacion: float | None = None,
        observaciones_liquidacion: str | None = None,
        usuario_id: int,
    ) -> ContratoDetalleDto:
        """Liquidar contrato: RESUELTO → LIQUIDADO."""
        check = await self.verificar_liquidacion(tenant_id, contrato_id)
        if not check["puede_liquidar"]:
            raise ReglaDeNegocioError(
                f"No se puede liquidar: {'; '.join(check['observaciones'])}"
            )

        result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        contrato = result.scalars().first()
        if not contrato:
            raise NoEncontradoError("Contrato", contrato_id)

        contrato.estado = "LIQUIDADO"
        contrato.fecha_liquidacion = fecha_liquidacion
        contrato.liquidado_por = usuario_id
        if monto_liquidacion is not None:
            contrato.monto_liquidacion = monto_liquidacion
        if observaciones_liquidacion:
            contrato.observaciones_liquidacion = observaciones_liquidacion

        await self.db.commit()

        contrato = await self._recargar_para_detalle(contrato_id)
        logger.info("contrato_liquidado", id=contrato_id)
        return _a_detalle_dto(contrato)

    # ─── Overlap check (private) ────────────────────────────────────────

    async def _verificar_solapamiento(
        self,
        tenant_id: int,
        equipo_id: int,
        fecha_inicio: Any,
        fecha_fin: Any,
        excluir_id: int | None = None,
    ) -> bool:
        """Check if equipment has overlapping ACTIVO contracts."""
        stmt = (
            select(func.count())
            .where(
                ContratoAdenda.equipo_id == equipo_id,
                ContratoAdenda.tenant_id == tenant_id,
                ContratoAdenda.estado == "ACTIVO",
                ContratoAdenda.tipo == "CONTRATO",
                and_(
                    ContratoAdenda.fecha_inicio <= fecha_fin,
                    ContratoAdenda.fecha_fin >= fecha_inicio,
                ),
            )
        )
        if excluir_id:
            stmt = stmt.where(ContratoAdenda.id != excluir_id)

        result = await self.db.execute(stmt)
        count = result.scalar_one()
        return count > 0
