"""Servicio para APU (Analisis de Precios Unitarios) con motor de cálculo recursivo."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError, ReglaDeNegocioError
from app.esquemas.apu import (
    ApuActualizar,
    ApuCalculoDto,
    ApuCrear,
    ApuDetalleDto,
    ApuDropdownDto,
    ApuInsumoActualizar,
    ApuInsumoCrear,
    ApuInsumoDto,
    ApuListaDto,
)
from app.modelos.presupuestos import Apu, ApuInsumo, Insumo

logger = obtener_logger(__name__)

MAX_RECURSION_DEPTH = 5


def _a_lista_dto(e: Apu, precio_unitario: float = 0) -> ApuListaDto:
    return ApuListaDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        unidad_medida=e.unidad_medida,
        rendimiento=float(e.rendimiento),
        precio_unitario=precio_unitario,
        created_at=e.created_at.isoformat(),
    )


class ServicioApu:
    """Servicio para gestión de APU con cálculo recursivo."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _obtener_apu(self, apu_id: int) -> Apu:
        resultado = await self.db.execute(
            select(Apu).where(Apu.id == apu_id, Apu.is_active.is_(True))
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("APU", apu_id)
        return entidad

    async def _obtener_lineas(self, apu_id: int) -> list[ApuInsumo]:
        resultado = await self.db.execute(
            select(ApuInsumo)
            .where(ApuInsumo.apu_id == apu_id, ApuInsumo.is_active.is_(True))
            .order_by(ApuInsumo.tipo, ApuInsumo.orden)
        )
        return list(resultado.scalars().all())

    async def _calcular_precio_unitario(
        self, apu_id: int, depth: int = 0
    ) -> float:
        """Calcula el precio unitario de un APU recursivamente."""
        if depth >= MAX_RECURSION_DEPTH:
            raise ReglaDeNegocioError(
                f"Profundidad máxima de recursión ({MAX_RECURSION_DEPTH}) alcanzada",
                "APU_MAX_DEPTH",
            )

        apu = await self._obtener_apu(apu_id)
        lineas = await self._obtener_lineas(apu_id)
        rendimiento = float(apu.rendimiento)
        jornada = float(apu.jornada)

        total_mo = 0.0
        total_ma = 0.0
        total_eq = 0.0
        total_sc = 0.0

        for linea in lineas:
            precio = await self._resolver_precio(linea, depth)
            cantidad = float(linea.cantidad)

            if linea.tipo == "MANO_OBRA":
                total_mo += cantidad * precio * jornada / rendimiento
            elif linea.tipo == "EQUIPO":
                total_eq += cantidad * precio * jornada / rendimiento
            elif linea.tipo == "MATERIAL":
                aporte = float(linea.aporte) if linea.aporte else 0
                total_ma += aporte * precio
            elif linea.tipo == "SUBCONTRATO":
                aporte = float(linea.aporte) if linea.aporte else 0
                total_sc += aporte * precio

        # Herramientas manuales = porcentaje de mano de obra
        total_hm = 0.0
        for linea in lineas:
            if linea.tipo == "HERRAMIENTAS" and linea.es_porcentaje:
                pct = float(linea.porcentaje) if linea.porcentaje else 0
                total_hm += pct / 100.0 * total_mo

        return total_mo + total_ma + total_eq + total_hm + total_sc

    async def _resolver_precio(self, linea: ApuInsumo, depth: int) -> float:
        """Resuelve el precio de una línea: override > sub-APU > insumo default."""
        if linea.precio is not None:
            return float(linea.precio)

        if linea.sub_apu_id:
            return await self._calcular_precio_unitario(linea.sub_apu_id, depth + 1)

        if linea.insumo_id:
            resultado = await self.db.execute(
                select(Insumo).where(Insumo.id == linea.insumo_id)
            )
            insumo = resultado.scalars().first()
            if insumo:
                return float(insumo.precio_unitario)

        return 0.0

    async def _construir_lineas_dto(
        self, apu: Apu, lineas: list[ApuInsumo], depth: int = 0
    ) -> dict:
        """Construye DTOs de líneas agrupados por tipo con costos calculados."""
        rendimiento = float(apu.rendimiento)
        jornada = float(apu.jornada)
        grupos: dict[str, list[ApuInsumoDto]] = {
            "MANO_OBRA": [],
            "MATERIAL": [],
            "EQUIPO": [],
            "HERRAMIENTAS": [],
            "SUBCONTRATO": [],
        }

        total_mo = 0.0

        # First pass: calculate all non-HERRAMIENTAS costs
        for linea in lineas:
            if linea.tipo == "HERRAMIENTAS":
                continue

            precio = await self._resolver_precio(linea, depth)
            cantidad = float(linea.cantidad)
            aporte = float(linea.aporte) if linea.aporte else 0
            costo = 0.0

            if linea.tipo in ("MANO_OBRA", "EQUIPO"):
                costo = cantidad * precio * jornada / rendimiento
            elif linea.tipo in ("MATERIAL", "SUBCONTRATO"):
                costo = aporte * precio

            if linea.tipo == "MANO_OBRA":
                total_mo += costo

            # Denormalize names
            insumo_nombre = None
            insumo_unidad = None
            sub_apu_nombre = None

            if linea.insumo_id:
                resultado = await self.db.execute(
                    select(Insumo).where(Insumo.id == linea.insumo_id)
                )
                insumo = resultado.scalars().first()
                if insumo:
                    insumo_nombre = insumo.nombre
                    insumo_unidad = insumo.unidad_medida

            if linea.sub_apu_id:
                resultado = await self.db.execute(
                    select(Apu).where(Apu.id == linea.sub_apu_id)
                )
                sub_apu = resultado.scalars().first()
                if sub_apu:
                    sub_apu_nombre = sub_apu.nombre

            dto = ApuInsumoDto(
                id=linea.id,
                apu_id=linea.apu_id,
                insumo_id=linea.insumo_id,
                sub_apu_id=linea.sub_apu_id,
                tipo=linea.tipo,
                cantidad=cantidad,
                precio=precio,
                aporte=aporte if aporte else None,
                es_porcentaje=linea.es_porcentaje,
                porcentaje=float(linea.porcentaje) if linea.porcentaje else None,
                orden=linea.orden,
                insumo_nombre=insumo_nombre,
                insumo_unidad=insumo_unidad,
                sub_apu_nombre=sub_apu_nombre,
                costo=round(costo, 4),
            )
            grupos.setdefault(linea.tipo, []).append(dto)

        # Second pass: calculate HERRAMIENTAS (depends on total_mo)
        for linea in lineas:
            if linea.tipo != "HERRAMIENTAS":
                continue

            pct = float(linea.porcentaje) if linea.porcentaje else 0
            costo = pct / 100.0 * total_mo if linea.es_porcentaje else 0

            dto = ApuInsumoDto(
                id=linea.id,
                apu_id=linea.apu_id,
                insumo_id=linea.insumo_id,
                sub_apu_id=linea.sub_apu_id,
                tipo=linea.tipo,
                cantidad=float(linea.cantidad),
                precio=None,
                aporte=None,
                es_porcentaje=linea.es_porcentaje,
                porcentaje=pct if pct else None,
                orden=linea.orden,
                insumo_nombre=None,
                insumo_unidad=None,
                sub_apu_nombre=None,
                costo=round(costo, 4),
            )
            grupos["HERRAMIENTAS"].append(dto)

        total_eq = sum(d.costo for d in grupos.get("EQUIPO", []))
        total_ma = sum(d.costo for d in grupos.get("MATERIAL", []))
        total_hm = sum(d.costo for d in grupos.get("HERRAMIENTAS", []))
        total_sc = sum(d.costo for d in grupos.get("SUBCONTRATO", []))
        precio_unitario = total_mo + total_ma + total_eq + total_hm + total_sc

        return {
            "mano_obra": grupos.get("MANO_OBRA", []),
            "materiales": grupos.get("MATERIAL", []),
            "equipos": grupos.get("EQUIPO", []),
            "herramientas": grupos.get("HERRAMIENTAS", []),
            "subcontratos": grupos.get("SUBCONTRATO", []),
            "total_mano_obra": round(total_mo, 4),
            "total_materiales": round(total_ma, 4),
            "total_equipos": round(total_eq, 4),
            "total_herramientas": round(total_hm, 4),
            "total_subcontratos": round(total_sc, 4),
            "precio_unitario": round(precio_unitario, 4),
        }

    # ── CRUD ──────────────────────────────────────────────────────────────────

    async def listar(
        self,
        *,
        busqueda: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[ApuListaDto], int]:
        """Listar APUs con paginación."""
        consulta = select(Apu).where(Apu.is_active.is_(True))

        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                Apu.nombre.ilike(patron) | Apu.codigo.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Apu.codigo)
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        # Calculate precio_unitario for each APU in the list
        dtos = []
        for e in entidades:
            try:
                pu = await self._calcular_precio_unitario(e.id)
            except ReglaDeNegocioError:
                pu = 0
            dtos.append(_a_lista_dto(e, round(pu, 4)))

        logger.info("apus_listados", total=total)
        return dtos, total

    async def obtener_por_id(self, apu_id: int) -> ApuDetalleDto:
        """Obtener APU por ID con líneas agrupadas y costos calculados."""
        apu = await self._obtener_apu(apu_id)
        lineas = await self._obtener_lineas(apu_id)
        calculo = await self._construir_lineas_dto(apu, lineas)

        return ApuDetalleDto(
            id=apu.id,
            codigo=apu.codigo,
            nombre=apu.nombre,
            unidad_medida=apu.unidad_medida,
            rendimiento=float(apu.rendimiento),
            jornada=float(apu.jornada),
            descripcion=apu.descripcion,
            created_at=apu.created_at.isoformat(),
            updated_at=apu.updated_at.isoformat(),
            **calculo,
        )

    async def crear(self, datos: ApuCrear) -> ApuDetalleDto:
        """Crear un nuevo APU."""
        existente = await self.db.execute(
            select(Apu).where(Apu.codigo == datos.codigo, Apu.is_active.is_(True))
        )
        if existente.scalars().first():
            raise ConflictoError(f"Ya existe un APU con código '{datos.codigo}'")

        entidad = Apu(
            codigo=datos.codigo,
            nombre=datos.nombre,
            unidad_medida=datos.unidad_medida,
            rendimiento=datos.rendimiento,
            jornada=datos.jornada,
            descripcion=datos.descripcion,
            tenant_id=1,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("apu_creado", id=entidad.id, codigo=entidad.codigo)
        return await self.obtener_por_id(entidad.id)

    async def actualizar(self, apu_id: int, datos: ApuActualizar) -> ApuDetalleDto:
        """Actualizar cabecera de APU."""
        apu = await self._obtener_apu(apu_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(apu, campo, valor)

        await self.db.commit()
        await self.db.refresh(apu)
        logger.info("apu_actualizado", id=apu_id)
        return await self.obtener_por_id(apu_id)

    async def eliminar(self, apu_id: int) -> None:
        """Eliminar (soft delete) un APU."""
        apu = await self._obtener_apu(apu_id)
        apu.is_active = False
        await self.db.commit()
        logger.info("apu_eliminado", id=apu_id)

    # ── Insumo lines ─────────────────────────────────────────────────────────

    async def agregar_insumo(
        self, apu_id: int, datos: ApuInsumoCrear
    ) -> ApuDetalleDto:
        """Agregar un insumo o sub-APU a un APU."""
        await self._obtener_apu(apu_id)

        if not datos.insumo_id and not datos.sub_apu_id:
            raise ReglaDeNegocioError(
                "Debe especificar insumo_id o sub_apu_id", "APU_REF_REQUIRED"
            )

        if datos.sub_apu_id:
            await self._obtener_apu(datos.sub_apu_id)

        linea = ApuInsumo(
            apu_id=apu_id,
            insumo_id=datos.insumo_id,
            sub_apu_id=datos.sub_apu_id,
            tipo=datos.tipo,
            cantidad=datos.cantidad,
            precio=datos.precio,
            aporte=datos.aporte,
            es_porcentaje=datos.es_porcentaje,
            porcentaje=datos.porcentaje,
            orden=datos.orden,
            tenant_id=1,
        )
        self.db.add(linea)
        await self.db.commit()
        logger.info("apu_insumo_agregado", apu_id=apu_id, linea_id=linea.id)
        return await self.obtener_por_id(apu_id)

    async def actualizar_insumo(
        self, apu_id: int, linea_id: int, datos: ApuInsumoActualizar
    ) -> ApuDetalleDto:
        """Actualizar una línea de insumo en un APU."""
        await self._obtener_apu(apu_id)

        resultado = await self.db.execute(
            select(ApuInsumo).where(
                ApuInsumo.id == linea_id,
                ApuInsumo.apu_id == apu_id,
                ApuInsumo.is_active.is_(True),
            )
        )
        linea = resultado.scalars().first()
        if not linea:
            raise NoEncontradoError("Línea de APU", linea_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(linea, campo, valor)

        await self.db.commit()
        logger.info("apu_insumo_actualizado", apu_id=apu_id, linea_id=linea_id)
        return await self.obtener_por_id(apu_id)

    async def eliminar_insumo(self, apu_id: int, linea_id: int) -> ApuDetalleDto:
        """Eliminar una línea de insumo de un APU."""
        await self._obtener_apu(apu_id)

        resultado = await self.db.execute(
            select(ApuInsumo).where(
                ApuInsumo.id == linea_id,
                ApuInsumo.apu_id == apu_id,
                ApuInsumo.is_active.is_(True),
            )
        )
        linea = resultado.scalars().first()
        if not linea:
            raise NoEncontradoError("Línea de APU", linea_id)

        linea.is_active = False
        await self.db.commit()
        logger.info("apu_insumo_eliminado", apu_id=apu_id, linea_id=linea_id)
        return await self.obtener_por_id(apu_id)

    # ── Special operations ───────────────────────────────────────────────────

    async def duplicar(self, apu_id: int) -> ApuDetalleDto:
        """Duplicar un APU con todas sus líneas."""
        apu_original = await self._obtener_apu(apu_id)
        lineas = await self._obtener_lineas(apu_id)

        nuevo_codigo = f"{apu_original.codigo}-COPIA"
        nuevo_apu = Apu(
            codigo=nuevo_codigo,
            nombre=f"{apu_original.nombre} (Copia)",
            unidad_medida=apu_original.unidad_medida,
            rendimiento=apu_original.rendimiento,
            jornada=apu_original.jornada,
            descripcion=apu_original.descripcion,
            tenant_id=1,
        )
        self.db.add(nuevo_apu)
        await self.db.flush()

        for linea in lineas:
            nueva_linea = ApuInsumo(
                apu_id=nuevo_apu.id,
                insumo_id=linea.insumo_id,
                sub_apu_id=linea.sub_apu_id,
                tipo=linea.tipo,
                cantidad=linea.cantidad,
                precio=linea.precio,
                aporte=linea.aporte,
                es_porcentaje=linea.es_porcentaje,
                porcentaje=linea.porcentaje,
                orden=linea.orden,
                tenant_id=1,
            )
            self.db.add(nueva_linea)

        await self.db.commit()
        await self.db.refresh(nuevo_apu)
        logger.info("apu_duplicado", original_id=apu_id, nuevo_id=nuevo_apu.id)
        return await self.obtener_por_id(nuevo_apu.id)

    async def calcular(self, apu_id: int) -> ApuCalculoDto:
        """Calcular el desglose completo del precio unitario."""
        apu = await self._obtener_apu(apu_id)
        lineas = await self._obtener_lineas(apu_id)
        calculo = await self._construir_lineas_dto(apu, lineas)

        return ApuCalculoDto(
            apu_id=apu.id,
            codigo=apu.codigo,
            nombre=apu.nombre,
            unidad_medida=apu.unidad_medida,
            rendimiento=float(apu.rendimiento),
            jornada=float(apu.jornada),
            **calculo,
        )

    async def listar_dropdown(self) -> list[ApuDropdownDto]:
        """Listar APUs para dropdown (sin paginación)."""
        resultado = await self.db.execute(
            select(Apu).where(Apu.is_active.is_(True)).order_by(Apu.codigo)
        )
        entidades = list(resultado.scalars().all())

        dtos = []
        for e in entidades:
            try:
                pu = await self._calcular_precio_unitario(e.id)
            except ReglaDeNegocioError:
                pu = 0
            dtos.append(
                ApuDropdownDto(
                    id=e.id,
                    codigo=e.codigo,
                    nombre=e.nombre,
                    unidad_medida=e.unidad_medida,
                    precio_unitario=round(pu, 4),
                )
            )
        return dtos
