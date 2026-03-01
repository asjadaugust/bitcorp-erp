"""Servicio para centros de costo.
"""

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.centro_costo import (
    CentroCostoActualizar,
    CentroCostoCrear,
    CentroCostoDetalleDto,
    CentroCostoListaDto,
)
from app.modelos.administracion import CentroCosto

logger = obtener_logger(__name__)


def _a_lista_dto(entidad: CentroCosto) -> CentroCostoListaDto:
    return CentroCostoListaDto(
        id=entidad.id,
        legacy_id=entidad.legacy_id,
        codigo=entidad.codigo,
        nombre=entidad.nombre,
        proyecto_id=entidad.proyecto_id,
        presupuesto=float(entidad.presupuesto) if entidad.presupuesto is not None else None,
        is_active=entidad.is_active,
    )


def _a_detalle_dto(entidad: CentroCosto) -> CentroCostoDetalleDto:
    return CentroCostoDetalleDto(
        id=entidad.id,
        legacy_id=entidad.legacy_id,
        codigo=entidad.codigo,
        nombre=entidad.nombre,
        descripcion=entidad.descripcion,
        proyecto_id=entidad.proyecto_id,
        presupuesto=float(entidad.presupuesto) if entidad.presupuesto is not None else None,
        is_active=entidad.is_active,
        created_at=entidad.created_at.isoformat(),
        updated_at=entidad.updated_at.isoformat(),
    )


class ServicioCentroCosto:
    """Servicio para gestión de centros de costo."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        tenant_id: int,
        *,
        busqueda: str | None = None,
        proyecto_id: int | None = None,
        is_active: bool | None = True,
        pagina: int = 1,
        limite: int = 20,
        ordenar_por: str = "codigo",
        orden: str = "ASC",
    ) -> tuple[list[CentroCostoListaDto], int]:
        """Listar centros de costo con filtros y paginación."""
        campos_ordenables: dict[str, Any] = {
            "codigo": CentroCosto.codigo,
            "nombre": CentroCosto.nombre,
            "presupuesto": CentroCosto.presupuesto,
            "created_at": CentroCosto.created_at,
        }

        consulta = select(CentroCosto).where(CentroCosto.tenant_id == tenant_id)

        if is_active is not None:
            consulta = consulta.where(CentroCosto.is_active == is_active)

        if proyecto_id is not None:
            consulta = consulta.where(CentroCosto.proyecto_id == proyecto_id)

        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                CentroCosto.codigo.ilike(patron) | CentroCosto.nombre.ilike(patron)
            )

        # Contar total
        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total = resultado_conteo.scalar_one()

        # Ordenar
        campo_orden: Any = campos_ordenables.get(ordenar_por, CentroCosto.codigo)
        if orden.upper() == "DESC":
            consulta = consulta.order_by(campo_orden.desc())
        else:
            consulta = consulta.order_by(campo_orden.asc())

        # Paginar
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info(
            "centros_costo_listados",
            total=total,
            pagina=pagina,
            limite=limite,
        )
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, tenant_id: int, cc_id: int) -> CentroCostoDetalleDto:
        """Obtener centro de costo por ID."""
        resultado = await self.db.execute(
            select(CentroCosto).where(
                CentroCosto.id == cc_id,
                CentroCosto.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CentroCosto", str(cc_id))
        return _a_detalle_dto(entidad)

    async def obtener_por_codigo(
        self, tenant_id: int, codigo: str
    ) -> CentroCostoDetalleDto | None:
        """Obtener centro de costo por código."""
        resultado = await self.db.execute(
            select(CentroCosto).where(
                CentroCosto.codigo == codigo,
                CentroCosto.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            return None
        return _a_detalle_dto(entidad)

    async def listar_por_proyecto(
        self, tenant_id: int, proyecto_id: int
    ) -> list[CentroCostoListaDto]:
        """Listar centros de costo activos de un proyecto."""
        resultado = await self.db.execute(
            select(CentroCosto)
            .where(
                CentroCosto.proyecto_id == proyecto_id,
                CentroCosto.tenant_id == tenant_id,
                CentroCosto.is_active.is_(True),
            )
            .order_by(CentroCosto.codigo.asc())
        )
        entidades = list(resultado.scalars().all())
        return [_a_lista_dto(e) for e in entidades]

    async def crear(
        self, tenant_id: int, datos: CentroCostoCrear
    ) -> CentroCostoDetalleDto:
        """Crear un nuevo centro de costo."""
        # Verificar unicidad de código
        existente = await self.obtener_por_codigo(tenant_id, datos.codigo)
        if existente:
            raise ConflictoError(
                f"Centro de costo con código '{datos.codigo}' ya existe",
                {"campo": "codigo", "valor": datos.codigo},
            )

        entidad = CentroCosto(
            codigo=datos.codigo,
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            proyecto_id=datos.proyecto_id,
            presupuesto=datos.presupuesto,
            is_active=datos.is_active,
            tenant_id=tenant_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)

        logger.info(
            "centro_costo_creado",
            id=entidad.id,
            codigo=entidad.codigo,
        )
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, tenant_id: int, cc_id: int, datos: CentroCostoActualizar
    ) -> CentroCostoDetalleDto:
        """Actualizar un centro de costo existente."""
        resultado = await self.db.execute(
            select(CentroCosto).where(
                CentroCosto.id == cc_id,
                CentroCosto.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CentroCosto", str(cc_id))

        # Verificar unicidad de código si se cambia
        if datos.codigo is not None and datos.codigo != entidad.codigo:
            duplicado = await self.obtener_por_codigo(tenant_id, datos.codigo)
            if duplicado and duplicado.id != cc_id:
                raise ConflictoError(
                    f"Centro de costo con código '{datos.codigo}' ya existe",
                    {"campo": "codigo", "valor": datos.codigo},
                )

        # Aplicar cambios parciales
        campos_actualizar = datos.model_dump(exclude_unset=True)
        for campo, valor in campos_actualizar.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)

        logger.info(
            "centro_costo_actualizado",
            id=cc_id,
            campos=list(campos_actualizar.keys()),
        )
        return _a_detalle_dto(entidad)

    async def eliminar(self, tenant_id: int, cc_id: int) -> None:
        """Eliminar (soft delete) un centro de costo."""
        resultado = await self.db.execute(
            select(CentroCosto).where(
                CentroCosto.id == cc_id,
                CentroCosto.tenant_id == tenant_id,
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("CentroCosto", str(cc_id))

        entidad.is_active = False
        await self.db.commit()

        logger.info("centro_costo_eliminado", id=cc_id)

    async def obtener_presupuesto_total(
        self, tenant_id: int, proyecto_id: int
    ) -> float:
        """Calcular presupuesto total de centros de costo activos de un proyecto."""
        resultado = await self.db.execute(
            select(func.coalesce(func.sum(CentroCosto.presupuesto), 0)).where(
                CentroCosto.proyecto_id == proyecto_id,
                CentroCosto.tenant_id == tenant_id,
                CentroCosto.is_active.is_(True),
            )
        )
        total_raw: Any = resultado.scalar_one()
        return float(total_raw) if total_raw is not None else 0.0

    async def contar_activos(self, tenant_id: int) -> int:
        """Contar centros de costo activos."""
        resultado = await self.db.execute(
            select(func.count(CentroCosto.id)).where(
                CentroCosto.tenant_id == tenant_id,
                CentroCosto.is_active.is_(True),
            )
        )
        return resultado.scalar_one()
