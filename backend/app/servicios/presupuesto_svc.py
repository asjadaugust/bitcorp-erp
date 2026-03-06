"""Servicio para Presupuesto y Partidas."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.presupuesto import (
    FaseResumenDto,
    PartidaActualizar,
    PartidaCrear,
    PartidaDto,
    PresupuestoActualizar,
    PresupuestoCrear,
    PresupuestoDetalleDto,
    PresupuestoListaDto,
    PresupuestoResumenDto,
)
from app.modelos.presupuestos import Presupuesto, PresupuestoPartida
from app.servicios.apu import ServicioApu

logger = obtener_logger(__name__)


def _a_lista_dto(e: Presupuesto) -> PresupuestoListaDto:
    return PresupuestoListaDto(
        id=e.id,
        proyecto_id=e.proyecto_id,
        codigo=e.codigo,
        nombre=e.nombre,
        fecha=e.fecha.isoformat(),
        version=e.version,
        estado=e.estado,
        total_presupuestado=float(e.total_presupuestado),
        created_at=e.created_at.isoformat(),
    )


def _a_partida_dto(p: PresupuestoPartida) -> PartidaDto:
    return PartidaDto(
        id=p.id,
        presupuesto_id=p.presupuesto_id,
        edt_id=p.edt_id,
        apu_id=p.apu_id,
        codigo=p.codigo,
        descripcion=p.descripcion,
        unidad_medida=p.unidad_medida,
        metrado=float(p.metrado),
        precio_unitario=float(p.precio_unitario),
        parcial=float(p.parcial),
        fase=p.fase,
        orden=p.orden,
    )


class ServicioPresupuesto:
    """Servicio para gestión de Presupuestos y Partidas."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _obtener_presupuesto(self, presupuesto_id: int) -> Presupuesto:
        resultado = await self.db.execute(
            select(Presupuesto).where(
                Presupuesto.id == presupuesto_id,
                Presupuesto.is_active.is_(True),
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Presupuesto", presupuesto_id)
        return entidad

    async def _obtener_partidas(
        self, presupuesto_id: int
    ) -> list[PresupuestoPartida]:
        resultado = await self.db.execute(
            select(PresupuestoPartida)
            .where(
                PresupuestoPartida.presupuesto_id == presupuesto_id,
                PresupuestoPartida.is_active.is_(True),
            )
            .order_by(PresupuestoPartida.fase, PresupuestoPartida.orden)
        )
        return list(resultado.scalars().all())

    async def _recalcular_total(self, presupuesto_id: int) -> None:
        """Recalcular total_presupuestado sumando parciales de partidas."""
        resultado = await self.db.execute(
            select(func.coalesce(func.sum(PresupuestoPartida.parcial), 0)).where(
                PresupuestoPartida.presupuesto_id == presupuesto_id,
                PresupuestoPartida.is_active.is_(True),
            )
        )
        total = resultado.scalar_one()

        presupuesto = await self._obtener_presupuesto(presupuesto_id)
        presupuesto.total_presupuestado = total
        await self.db.flush()

    # ── Presupuesto CRUD ─────────────────────────────────────────────────────

    async def listar(
        self,
        *,
        proyecto_id: int | None = None,
        busqueda: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[PresupuestoListaDto], int]:
        """Listar presupuestos con filtros y paginación."""
        consulta = select(Presupuesto).where(Presupuesto.is_active.is_(True))

        if proyecto_id:
            consulta = consulta.where(Presupuesto.proyecto_id == proyecto_id)
        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                Presupuesto.nombre.ilike(patron)
                | Presupuesto.codigo.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Presupuesto.codigo)
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("presupuestos_listados", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, presupuesto_id: int) -> PresupuestoDetalleDto:
        """Obtener presupuesto con todas sus partidas."""
        pres = await self._obtener_presupuesto(presupuesto_id)
        partidas = await self._obtener_partidas(presupuesto_id)

        return PresupuestoDetalleDto(
            id=pres.id,
            proyecto_id=pres.proyecto_id,
            codigo=pres.codigo,
            nombre=pres.nombre,
            descripcion=pres.descripcion,
            fecha=pres.fecha.isoformat(),
            version=pres.version,
            estado=pres.estado,
            total_presupuestado=float(pres.total_presupuestado),
            created_at=pres.created_at.isoformat(),
            updated_at=pres.updated_at.isoformat(),
            partidas=[_a_partida_dto(p) for p in partidas],
        )

    async def crear(self, datos: PresupuestoCrear) -> PresupuestoDetalleDto:
        """Crear un nuevo presupuesto."""
        existente = await self.db.execute(
            select(Presupuesto).where(
                Presupuesto.codigo == datos.codigo,
                Presupuesto.is_active.is_(True),
            )
        )
        if existente.scalars().first():
            raise ConflictoError(
                f"Ya existe un presupuesto con código '{datos.codigo}'"
            )

        entidad = Presupuesto(
            proyecto_id=datos.proyecto_id,
            codigo=datos.codigo,
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            fecha=date.fromisoformat(datos.fecha),
            version=datos.version,
            estado=datos.estado,
            tenant_id=1,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("presupuesto_creado", id=entidad.id, codigo=entidad.codigo)
        return await self.obtener_por_id(entidad.id)

    async def actualizar(
        self, presupuesto_id: int, datos: PresupuestoActualizar
    ) -> PresupuestoDetalleDto:
        """Actualizar cabecera de presupuesto."""
        pres = await self._obtener_presupuesto(presupuesto_id)

        campos = datos.model_dump(exclude_unset=True)
        if "fecha" in campos and campos["fecha"]:
            campos["fecha"] = date.fromisoformat(campos["fecha"])
        for campo, valor in campos.items():
            setattr(pres, campo, valor)

        await self.db.commit()
        await self.db.refresh(pres)
        logger.info("presupuesto_actualizado", id=presupuesto_id)
        return await self.obtener_por_id(presupuesto_id)

    async def eliminar(self, presupuesto_id: int) -> None:
        """Eliminar (soft delete) un presupuesto."""
        pres = await self._obtener_presupuesto(presupuesto_id)
        pres.is_active = False
        await self.db.commit()
        logger.info("presupuesto_eliminado", id=presupuesto_id)

    # ── Partida management ───────────────────────────────────────────────────

    async def agregar_partida(
        self, presupuesto_id: int, datos: PartidaCrear
    ) -> PresupuestoDetalleDto:
        """Agregar una partida al presupuesto."""
        await self._obtener_presupuesto(presupuesto_id)

        precio_unitario = datos.precio_unitario

        # If apu_id is provided, auto-fill precio_unitario from APU
        if datos.apu_id and datos.precio_unitario == 0:
            servicio_apu = ServicioApu(self.db)
            try:
                pu = await servicio_apu._calcular_precio_unitario(datos.apu_id)
                precio_unitario = round(pu, 4)
            except Exception:
                pass

        parcial = round(datos.metrado * precio_unitario, 2)

        partida = PresupuestoPartida(
            presupuesto_id=presupuesto_id,
            edt_id=datos.edt_id,
            apu_id=datos.apu_id,
            codigo=datos.codigo,
            descripcion=datos.descripcion,
            unidad_medida=datos.unidad_medida,
            metrado=datos.metrado,
            precio_unitario=precio_unitario,
            parcial=parcial,
            fase=datos.fase,
            orden=datos.orden,
            tenant_id=1,
        )
        self.db.add(partida)
        await self.db.flush()
        await self._recalcular_total(presupuesto_id)
        await self.db.commit()

        logger.info(
            "partida_agregada",
            presupuesto_id=presupuesto_id,
            partida_id=partida.id,
        )
        return await self.obtener_por_id(presupuesto_id)

    async def actualizar_partida(
        self, presupuesto_id: int, partida_id: int, datos: PartidaActualizar
    ) -> PresupuestoDetalleDto:
        """Actualizar una partida del presupuesto."""
        await self._obtener_presupuesto(presupuesto_id)

        resultado = await self.db.execute(
            select(PresupuestoPartida).where(
                PresupuestoPartida.id == partida_id,
                PresupuestoPartida.presupuesto_id == presupuesto_id,
                PresupuestoPartida.is_active.is_(True),
            )
        )
        partida = resultado.scalars().first()
        if not partida:
            raise NoEncontradoError("Partida", partida_id)

        campos = datos.model_dump(exclude_unset=True)

        # If apu_id changed and no explicit precio_unitario, auto-fill from APU
        if "apu_id" in campos and campos["apu_id"] and "precio_unitario" not in campos:
            servicio_apu = ServicioApu(self.db)
            try:
                pu = await servicio_apu._calcular_precio_unitario(campos["apu_id"])
                campos["precio_unitario"] = round(pu, 4)
            except Exception:
                pass

        for campo, valor in campos.items():
            setattr(partida, campo, valor)

        # Recalculate parcial
        partida.parcial = round(
            float(partida.metrado) * float(partida.precio_unitario), 2
        )

        await self.db.flush()
        await self._recalcular_total(presupuesto_id)
        await self.db.commit()

        logger.info(
            "partida_actualizada",
            presupuesto_id=presupuesto_id,
            partida_id=partida_id,
        )
        return await self.obtener_por_id(presupuesto_id)

    async def eliminar_partida(
        self, presupuesto_id: int, partida_id: int
    ) -> PresupuestoDetalleDto:
        """Eliminar una partida del presupuesto."""
        await self._obtener_presupuesto(presupuesto_id)

        resultado = await self.db.execute(
            select(PresupuestoPartida).where(
                PresupuestoPartida.id == partida_id,
                PresupuestoPartida.presupuesto_id == presupuesto_id,
                PresupuestoPartida.is_active.is_(True),
            )
        )
        partida = resultado.scalars().first()
        if not partida:
            raise NoEncontradoError("Partida", partida_id)

        partida.is_active = False
        await self.db.flush()
        await self._recalcular_total(presupuesto_id)
        await self.db.commit()

        logger.info(
            "partida_eliminada",
            presupuesto_id=presupuesto_id,
            partida_id=partida_id,
        )
        return await self.obtener_por_id(presupuesto_id)

    # ── Special operations ───────────────────────────────────────────────────

    async def recalcular(self, presupuesto_id: int) -> PresupuestoDetalleDto:
        """Recalcular todas las partidas desde precios APU actuales."""
        await self._obtener_presupuesto(presupuesto_id)
        partidas = await self._obtener_partidas(presupuesto_id)
        servicio_apu = ServicioApu(self.db)

        for partida in partidas:
            if partida.apu_id:
                try:
                    pu = await servicio_apu._calcular_precio_unitario(partida.apu_id)
                    partida.precio_unitario = round(pu, 4)
                    partida.parcial = round(
                        float(partida.metrado) * float(partida.precio_unitario), 2
                    )
                except Exception:
                    pass

        await self.db.flush()
        await self._recalcular_total(presupuesto_id)
        await self.db.commit()

        logger.info("presupuesto_recalculado", id=presupuesto_id)
        return await self.obtener_por_id(presupuesto_id)

    async def resumen(self, presupuesto_id: int) -> PresupuestoResumenDto:
        """Resumen por fase con subtotales."""
        pres = await self._obtener_presupuesto(presupuesto_id)
        partidas = await self._obtener_partidas(presupuesto_id)

        fases: dict[str, list[PresupuestoPartida]] = {}
        for p in partidas:
            fase_key = p.fase or "Sin Fase"
            fases.setdefault(fase_key, []).append(p)

        fases_dto = []
        total = 0.0
        for fase_nombre, items in fases.items():
            subtotal = sum(float(p.parcial) for p in items)
            total += subtotal
            fases_dto.append(
                FaseResumenDto(
                    fase=fase_nombre,
                    cantidad_partidas=len(items),
                    subtotal=round(subtotal, 2),
                )
            )

        return PresupuestoResumenDto(
            presupuesto_id=pres.id,
            codigo=pres.codigo,
            nombre=pres.nombre,
            fases=fases_dto,
            total=round(total, 2),
        )
