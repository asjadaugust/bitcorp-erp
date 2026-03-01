"""Servicio para plantillas de aprobación.

Replica ApprovalTemplateService del BFF Node.js.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError, ValidacionError
from app.esquemas.aprobacion import (
    PlantillaCrear,
    PlantillaDetalleDto,
    PlantillaListaDto,
    PlantillaPasoDto,
)
from app.modelos.aprobaciones import PlantillaAprobacion, PlantillaPaso

logger = obtener_logger(__name__)


def _paso_a_dto(e: PlantillaPaso) -> PlantillaPasoDto:
    return PlantillaPasoDto(
        id=e.id,
        paso_numero=e.paso_numero,
        nombre_paso=e.nombre_paso,
        tipo_aprobador=e.tipo_aprobador,
        rol=e.rol,
        usuario_id=e.usuario_id,
        logica_aprobacion=e.logica_aprobacion,
        es_opcional=e.es_opcional,
    )


def _a_lista_dto(e: PlantillaAprobacion) -> PlantillaListaDto:
    return PlantillaListaDto(
        id=e.id,
        nombre=e.nombre,
        module_name=e.module_name,
        proyecto_id=e.proyecto_id,
        version=e.version,
        estado=e.estado,
    )


class ServicioPlantillaAprobacion:
    """Servicio para gestión de plantillas de aprobación."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _obtener_pasos(self, plantilla_id: int) -> list[PlantillaPasoDto]:
        resultado = await self.db.execute(
            select(PlantillaPaso)
            .where(PlantillaPaso.plantilla_id == plantilla_id)
            .order_by(PlantillaPaso.paso_numero)
        )
        return [_paso_a_dto(e) for e in resultado.scalars().all()]

    async def _a_detalle_dto(self, e: PlantillaAprobacion) -> PlantillaDetalleDto:
        pasos = await self._obtener_pasos(e.id)
        return PlantillaDetalleDto(
            id=e.id,
            nombre=e.nombre,
            module_name=e.module_name,
            proyecto_id=e.proyecto_id,
            version=e.version,
            estado=e.estado,
            descripcion=e.descripcion,
            pasos=pasos,
            created_at=e.created_at.isoformat(),
            created_by=e.created_by,
        )

    async def listar(
        self,
        tenant_id: int,
        *,
        module_name: str | None = None,
        estado: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[PlantillaListaDto], int]:
        """Listar plantillas de aprobación."""
        consulta = select(PlantillaAprobacion).where(
            PlantillaAprobacion.tenant_id == tenant_id
        )
        if module_name:
            consulta = consulta.where(PlantillaAprobacion.module_name == module_name)
        if estado:
            consulta = consulta.where(PlantillaAprobacion.estado == estado)

        conteo = await self.db.execute(select(func.count()).select_from(consulta.subquery()))
        total: int = conteo.scalar_one()

        consulta = consulta.order_by(PlantillaAprobacion.created_at.desc())
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        return [_a_lista_dto(e) for e in resultado.scalars().all()], total

    async def obtener_por_id(
        self, tenant_id: int, plantilla_id: int
    ) -> PlantillaDetalleDto:
        """Obtener plantilla por ID con sus pasos."""
        resultado = await self.db.execute(
            select(PlantillaAprobacion).where(
                PlantillaAprobacion.id == plantilla_id,
                PlantillaAprobacion.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("PlantillaAprobacion", str(plantilla_id))
        return await self._a_detalle_dto(entidad)

    async def crear(
        self, tenant_id: int, usuario_id: int, datos: PlantillaCrear
    ) -> PlantillaDetalleDto:
        """Crear plantilla con pasos."""
        entidad = PlantillaAprobacion(
            tenant_id=tenant_id,
            nombre=datos.nombre,
            module_name=datos.module_name,
            proyecto_id=datos.proyecto_id,
            descripcion=datos.descripcion,
            created_by=usuario_id,
        )
        self.db.add(entidad)
        await self.db.flush()

        for paso_datos in datos.pasos:
            paso = PlantillaPaso(
                tenant_id=tenant_id,
                plantilla_id=entidad.id,
                paso_numero=paso_datos.paso_numero,
                nombre_paso=paso_datos.nombre_paso,
                tipo_aprobador=paso_datos.tipo_aprobador,
                rol=paso_datos.rol,
                usuario_id=paso_datos.usuario_id,
                logica_aprobacion=paso_datos.logica_aprobacion,
                es_opcional=paso_datos.es_opcional,
            )
            self.db.add(paso)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("plantilla_creada", id=entidad.id)
        return await self._a_detalle_dto(entidad)

    async def activar(self, tenant_id: int, plantilla_id: int) -> PlantillaDetalleDto:
        """Activar plantilla."""
        resultado = await self.db.execute(
            select(PlantillaAprobacion).where(
                PlantillaAprobacion.id == plantilla_id,
                PlantillaAprobacion.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("PlantillaAprobacion", str(plantilla_id))
        if entidad.estado == "ACTIVO":
            raise ValidacionError("La plantilla ya está activa")
        entidad.estado = "ACTIVO"
        await self.db.commit()
        await self.db.refresh(entidad)
        return await self._a_detalle_dto(entidad)

    async def archivar(self, tenant_id: int, plantilla_id: int) -> PlantillaDetalleDto:
        """Archivar plantilla."""
        resultado = await self.db.execute(
            select(PlantillaAprobacion).where(
                PlantillaAprobacion.id == plantilla_id,
                PlantillaAprobacion.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("PlantillaAprobacion", str(plantilla_id))
        entidad.estado = "ARCHIVADO"
        await self.db.commit()
        await self.db.refresh(entidad)
        return await self._a_detalle_dto(entidad)
