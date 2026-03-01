"""Servicio para checklists de inspección.

Replica ChecklistService del BFF Node.js.
"""

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError, ReglaDeNegocioError
from app.esquemas.checklist import (
    InspeccionCrear,
    InspeccionDetalleDto,
    InspeccionListaDto,
    ItemChecklistDto,
    PlantillaActualizar,
    PlantillaChecklistDetalleDto,
    PlantillaChecklistListaDto,
    PlantillaCrear,
)
from app.modelos.checklist import (
    ChecklistInspeccion,
    ChecklistItem,
    ChecklistPlantilla,
)

logger = obtener_logger(__name__)


def _a_plantilla_lista(e: ChecklistPlantilla) -> PlantillaChecklistListaDto:
    return PlantillaChecklistListaDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        tipo_equipo=e.tipo_equipo,
        frecuencia=e.frecuencia,
        activo=e.activo,
        created_at=e.created_at.isoformat(),
    )


def _a_plantilla_detalle(e: ChecklistPlantilla) -> PlantillaChecklistDetalleDto:
    return PlantillaChecklistDetalleDto(
        id=e.id,
        codigo=e.codigo,
        nombre=e.nombre,
        tipo_equipo=e.tipo_equipo,
        descripcion=e.descripcion,
        frecuencia=e.frecuencia,
        activo=e.activo,
        created_by=e.created_by,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


def _a_item_dto(e: ChecklistItem) -> ItemChecklistDto:
    return ItemChecklistDto(
        id=e.id,
        plantilla_id=e.plantilla_id,
        orden=e.orden,
        categoria=e.categoria,
        descripcion=e.descripcion,
        tipo_verificacion=e.tipo_verificacion,
        es_critico=e.es_critico,
        requiere_foto=e.requiere_foto,
    )


def _a_inspeccion_lista(e: ChecklistInspeccion) -> InspeccionListaDto:
    return InspeccionListaDto(
        id=e.id,
        codigo=e.codigo,
        equipo_id=e.equipo_id,
        trabajador_id=e.trabajador_id,
        fecha_inspeccion=e.fecha_inspeccion.isoformat(),
        estado=e.estado,
        resultado_general=e.resultado_general,
        items_conforme=e.items_conforme,
        items_no_conforme=e.items_no_conforme,
        items_total=e.items_total,
        created_at=e.created_at.isoformat(),
    )


def _a_inspeccion_detalle(e: ChecklistInspeccion) -> InspeccionDetalleDto:
    return InspeccionDetalleDto(
        id=e.id,
        codigo=e.codigo,
        plantilla_id=e.plantilla_id,
        equipo_id=e.equipo_id,
        trabajador_id=e.trabajador_id,
        fecha_inspeccion=e.fecha_inspeccion.isoformat(),
        estado=e.estado,
        resultado_general=e.resultado_general,
        items_conforme=e.items_conforme,
        items_no_conforme=e.items_no_conforme,
        items_total=e.items_total,
        observaciones_generales=e.observaciones_generales,
        requiere_mantenimiento=e.requiere_mantenimiento,
        equipo_operativo=e.equipo_operativo,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


async def _generar_codigo_inspeccion(db: AsyncSession) -> str:
    """Generar código único INS-YYYY-NNNN."""
    anio = datetime.utcnow().year
    resultado = await db.execute(
        select(func.count(ChecklistInspeccion.id)).where(
            ChecklistInspeccion.codigo.like(f"INS-{anio}-%")
        )
    )
    count = resultado.scalar_one()
    return f"INS-{anio}-{count + 1:04d}"


class ServicioChecklist:
    """Servicio para gestión de checklists de inspección."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Plantillas ─────────────────────────────────────────────────────

    async def listar_plantillas(
        self,
        *,
        tipo_equipo: str | None = None,
        activo: bool | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[PlantillaChecklistListaDto], int]:
        consulta = select(ChecklistPlantilla)

        if tipo_equipo:
            consulta = consulta.where(ChecklistPlantilla.tipo_equipo == tipo_equipo)
        if activo is not None:
            consulta = consulta.where(ChecklistPlantilla.activo == activo)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(ChecklistPlantilla.nombre)
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        return [_a_plantilla_lista(e) for e in entidades], total

    async def obtener_plantilla(self, plantilla_id: int) -> PlantillaChecklistDetalleDto:
        resultado = await self.db.execute(
            select(ChecklistPlantilla).where(ChecklistPlantilla.id == plantilla_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Plantilla Checklist", plantilla_id)
        return _a_plantilla_detalle(entidad)

    async def crear_plantilla(
        self, datos: PlantillaCrear, usuario_id: int
    ) -> PlantillaChecklistDetalleDto:
        existente = await self.db.execute(
            select(ChecklistPlantilla).where(ChecklistPlantilla.codigo == datos.codigo)
        )
        if existente.scalars().first():
            raise ConflictoError(f"Ya existe plantilla con código '{datos.codigo}'")

        entidad = ChecklistPlantilla(
            codigo=datos.codigo,
            nombre=datos.nombre,
            tipo_equipo=datos.tipo_equipo,
            descripcion=datos.descripcion,
            frecuencia=datos.frecuencia,
            created_by=usuario_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("plantilla_checklist_creada", id=entidad.id)
        return _a_plantilla_detalle(entidad)

    async def actualizar_plantilla(
        self, plantilla_id: int, datos: PlantillaActualizar
    ) -> PlantillaChecklistDetalleDto:
        resultado = await self.db.execute(
            select(ChecklistPlantilla).where(ChecklistPlantilla.id == plantilla_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Plantilla Checklist", plantilla_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        return _a_plantilla_detalle(entidad)

    async def obtener_items_plantilla(self, plantilla_id: int) -> list[ItemChecklistDto]:
        # Verify plantilla exists
        await self.obtener_plantilla(plantilla_id)

        resultado = await self.db.execute(
            select(ChecklistItem)
            .where(ChecklistItem.plantilla_id == plantilla_id)
            .order_by(ChecklistItem.orden)
        )
        entidades = list(resultado.scalars().all())
        return [_a_item_dto(e) for e in entidades]

    # ─── Inspecciones ───────────────────────────────────────────────────

    async def listar_inspecciones(
        self,
        *,
        equipo_id: int | None = None,
        estado: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[InspeccionListaDto], int]:
        consulta = select(ChecklistInspeccion)

        if equipo_id:
            consulta = consulta.where(ChecklistInspeccion.equipo_id == equipo_id)
        if estado:
            consulta = consulta.where(ChecklistInspeccion.estado == estado)

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(ChecklistInspeccion.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        return [_a_inspeccion_lista(e) for e in entidades], total

    async def obtener_inspeccion(self, inspeccion_id: int) -> InspeccionDetalleDto:
        resultado = await self.db.execute(
            select(ChecklistInspeccion).where(ChecklistInspeccion.id == inspeccion_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Inspección", inspeccion_id)
        return _a_inspeccion_detalle(entidad)

    async def crear_inspeccion(
        self, datos: InspeccionCrear
    ) -> InspeccionDetalleDto:
        codigo = await _generar_codigo_inspeccion(self.db)
        fecha = (
            date.fromisoformat(datos.fecha_inspeccion)
            if datos.fecha_inspeccion
            else date.today()
        )

        entidad = ChecklistInspeccion(
            codigo=codigo,
            plantilla_id=datos.plantilla_id,
            equipo_id=datos.equipo_id,
            trabajador_id=datos.trabajador_id,
            fecha_inspeccion=fecha,
            ubicacion=datos.ubicacion,
            observaciones_generales=datos.observaciones_generales,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("inspeccion_creada", id=entidad.id, codigo=codigo)
        return _a_inspeccion_detalle(entidad)

    async def completar_inspeccion(self, inspeccion_id: int) -> InspeccionDetalleDto:
        resultado = await self.db.execute(
            select(ChecklistInspeccion).where(ChecklistInspeccion.id == inspeccion_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Inspección", inspeccion_id)

        if entidad.estado != "EN_PROGRESO":
            raise ReglaDeNegocioError.estado_invalido(
                "inspección", entidad.estado, "completar", ["EN_PROGRESO"]
            )

        entidad.estado = "COMPLETADO"
        entidad.completado_en = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("inspeccion_completada", id=inspeccion_id)
        return _a_inspeccion_detalle(entidad)

    # ─── Estadísticas ───────────────────────────────────────────────────

    async def obtener_estadisticas(self) -> dict:
        """Estadísticas generales de checklists."""
        total_plantillas = await self.db.execute(
            select(func.count(ChecklistPlantilla.id))
        )
        total_inspecciones = await self.db.execute(
            select(func.count(ChecklistInspeccion.id))
        )
        completadas = await self.db.execute(
            select(func.count(ChecklistInspeccion.id)).where(
                ChecklistInspeccion.estado == "COMPLETADO"
            )
        )

        return {
            "total_plantillas": total_plantillas.scalar_one(),
            "total_inspecciones": total_inspecciones.scalar_one(),
            "inspecciones_completadas": completadas.scalar_one(),
        }
