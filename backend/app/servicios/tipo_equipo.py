"""Servicio para tipos de equipo.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.tipo_equipo import CategoriaPrdDto, TipoEquipoDto
from app.modelos.equipo import TipoEquipo

logger = obtener_logger(__name__)

CATEGORIA_PRD_LABELS: dict[str, str] = {
    "MAQUINARIA_PESADA": "Maquinaria Pesada",
    "VEHICULOS_PESADOS": "Vehículos Pesados",
    "VEHICULOS_LIVIANOS": "Vehículos Livianos",
    "EQUIPOS_MENORES": "Equipos Menores",
}

CATEGORIAS_PRD_ORDEN: list[str] = [
    "MAQUINARIA_PESADA",
    "VEHICULOS_PESADOS",
    "VEHICULOS_LIVIANOS",
    "EQUIPOS_MENORES",
]


def _a_dto(entidad: TipoEquipo) -> TipoEquipoDto:
    return TipoEquipoDto(
        id=entidad.id,
        codigo=entidad.codigo,
        nombre=entidad.nombre,
        categoria_prd=entidad.categoria_prd,
        descripcion=entidad.descripcion,
        activo=entidad.activo,
    )


class ServicioTipoEquipo:
    """Servicio para gestión de tipos de equipo."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(self) -> list[TipoEquipoDto]:
        """Retornar todos los tipos activos, ordenados por categoría y nombre."""
        resultado = await self.db.execute(
            select(TipoEquipo)
            .where(TipoEquipo.activo.is_(True))
            .order_by(TipoEquipo.categoria_prd.asc(), TipoEquipo.nombre.asc())
        )
        tipos = list(resultado.scalars().all())

        logger.info("tipos_equipo_listados", total=len(tipos))
        return [_a_dto(t) for t in tipos]

    async def listar_agrupados(self) -> list[CategoriaPrdDto]:
        """Retornar tipos agrupados por categoria_prd."""
        tipos = await self.listar()

        grupos: list[CategoriaPrdDto] = []
        for cat in CATEGORIAS_PRD_ORDEN:
            tipos_cat = [t for t in tipos if t.categoria_prd == cat]
            if tipos_cat:
                grupos.append(
                    CategoriaPrdDto(
                        categoria_prd=cat,
                        label=CATEGORIA_PRD_LABELS.get(cat, cat),
                        tipos=tipos_cat,
                    )
                )
        return grupos

    async def listar_por_categoria(self, categoria_prd: str) -> list[TipoEquipoDto]:
        """Retornar tipos para una categoría específica."""
        resultado = await self.db.execute(
            select(TipoEquipo)
            .where(TipoEquipo.categoria_prd == categoria_prd, TipoEquipo.activo.is_(True))
            .order_by(TipoEquipo.nombre.asc())
        )
        tipos = list(resultado.scalars().all())
        return [_a_dto(t) for t in tipos]

    async def obtener_por_id(self, tipo_id: int) -> TipoEquipoDto:
        """Obtener un tipo de equipo por su ID."""
        resultado = await self.db.execute(
            select(TipoEquipo).where(TipoEquipo.id == tipo_id)
        )
        tipo = resultado.scalars().first()
        if not tipo:
            raise NoEncontradoError("TipoEquipo", str(tipo_id))
        return _a_dto(tipo)
