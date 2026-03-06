"""Servicio para equipo EDT y combustible."""

from datetime import date

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.equipo_edt import (
    EquipoCombustibleDetalleDto,
    EquipoCombustibleListaDto,
    EquipoEdtDetalleDto,
    EquipoEdtListaDto,
    ValidacionPorcentaje,
)
from app.modelos.equipo import EquipoCombustible, EquipoEdt, ParteDiario

logger = obtener_logger(__name__)


def _iso(val) -> str | None:
    return val.isoformat() if val else None


# --- Mappers ---


def _edt_a_lista_dto(e: EquipoEdt) -> EquipoEdtListaDto:
    return EquipoEdtListaDto(
        id=e.id,
        parte_diario_id=e.parte_diario_id,
        edt_id=e.edt_id,
        porcentaje=float(e.porcentaje) if e.porcentaje is not None else None,
        edt_nombre=e.edt_nombre,
        actividad=e.actividad,
    )


def _edt_a_detalle_dto(e: EquipoEdt) -> EquipoEdtDetalleDto:
    return EquipoEdtDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        parte_diario_legacy_id=e.parte_diario_legacy_id,
        parte_diario_id=e.parte_diario_id,
        edt_id=e.edt_id,
        porcentaje=float(e.porcentaje) if e.porcentaje is not None else None,
        edt_nombre=e.edt_nombre,
        actividad=e.actividad,
        created_at=_iso(e.created_at),
    )


def _combustible_a_lista_dto(e: EquipoCombustible) -> EquipoCombustibleListaDto:
    return EquipoCombustibleListaDto(
        id=e.id,
        numero_vale_salida=e.numero_vale_salida,
        fecha=_iso(e.fecha),
        cantidad=float(e.cantidad) if e.cantidad is not None else None,
        precio_unitario_sin_igv=(
            float(e.precio_unitario_sin_igv)
            if e.precio_unitario_sin_igv is not None
            else None
        ),
        importe=float(e.importe) if e.importe is not None else None,
        comentario=e.comentario,
    )


def _combustible_a_detalle_dto(e: EquipoCombustible) -> EquipoCombustibleDetalleDto:
    return EquipoCombustibleDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        valorizacion_legacy_id=e.valorizacion_legacy_id,
        numero_vale_salida=e.numero_vale_salida,
        fecha=_iso(e.fecha),
        horometro_odometro=e.horometro_odometro,
        inicial=float(e.inicial) if e.inicial is not None else None,
        cantidad=float(e.cantidad) if e.cantidad is not None else None,
        precio_unitario_sin_igv=(
            float(e.precio_unitario_sin_igv)
            if e.precio_unitario_sin_igv is not None
            else None
        ),
        importe=float(e.importe) if e.importe is not None else None,
        comentario=e.comentario,
        created_at=_iso(e.created_at),
    )


class ServicioEquipoAsociaciones:
    """Servicio para gestion de equipo EDT y combustible."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- EquipoEdt ---

    async def _get_parte_legacy_id(self, parte_diario_id: int) -> str | None:
        """Look up legacy_id for a ParteDiario by its integer PK."""
        result = await self.db.execute(
            select(ParteDiario.legacy_id).where(ParteDiario.id == parte_diario_id)
        )
        return result.scalar()

    async def listar_edt(
        self, parte_diario_id: int | None = None
    ) -> list[EquipoEdtListaDto]:
        """Listar registros de equipo EDT con filtro opcional por parte_diario_id."""
        consulta = select(EquipoEdt)
        if parte_diario_id is not None:
            conditions = [EquipoEdt.parte_diario_id == parte_diario_id]
            pd_legacy_id = await self._get_parte_legacy_id(parte_diario_id)
            if pd_legacy_id:
                conditions.append(EquipoEdt.parte_diario_legacy_id == pd_legacy_id)
            consulta = consulta.where(or_(*conditions))
        consulta = consulta.order_by(EquipoEdt.id.desc())
        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("equipo_edt_listados", total=len(entidades))
        return [_edt_a_lista_dto(e) for e in entidades]

    async def obtener_edt(self, edt_id: int) -> EquipoEdtDetalleDto:
        """Obtener registro de equipo EDT por ID."""
        resultado = await self.db.execute(
            select(EquipoEdt).where(EquipoEdt.id == edt_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EquipoEdt", str(edt_id))
        return _edt_a_detalle_dto(entidad)

    async def crear_edt(self, datos) -> EquipoEdt:
        """Crear un nuevo registro de equipo EDT."""
        entidad = EquipoEdt(
            parte_diario_id=datos.parte_diario_id,
            parte_diario_legacy_id=datos.parte_diario_legacy_id,
            edt_id=datos.edt_id,
            porcentaje=datos.porcentaje,
            edt_nombre=datos.edt_nombre,
            actividad=datos.actividad,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("equipo_edt_creado", id=entidad.id)
        return entidad

    async def actualizar_edt(self, edt_id: int, datos) -> EquipoEdt:
        """Actualizar un registro de equipo EDT."""
        resultado = await self.db.execute(
            select(EquipoEdt).where(EquipoEdt.id == edt_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EquipoEdt", str(edt_id))

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("equipo_edt_actualizado", id=edt_id)
        return entidad

    async def eliminar_edt(self, edt_id: int) -> None:
        """Eliminar un registro de equipo EDT."""
        resultado = await self.db.execute(
            select(EquipoEdt).where(EquipoEdt.id == edt_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EquipoEdt", str(edt_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("equipo_edt_eliminado", id=edt_id)

    async def validar_porcentaje(self, parte_diario_id: int) -> ValidacionPorcentaje:
        """Validar que los porcentajes de EDT suman 100% para un parte diario."""
        conditions = [EquipoEdt.parte_diario_id == parte_diario_id]
        pd_legacy_id = await self._get_parte_legacy_id(parte_diario_id)
        if pd_legacy_id:
            conditions.append(EquipoEdt.parte_diario_legacy_id == pd_legacy_id)
        resultado = await self.db.execute(
            select(func.coalesce(func.sum(EquipoEdt.porcentaje), 0)).where(
                or_(*conditions)
            )
        )
        total = float(resultado.scalar() or 0)
        total = round(total, 2)
        return ValidacionPorcentaje(valid=total == 100.0, total=total)

    # --- EquipoCombustible ---

    async def listar_combustible(
        self, valorizacion_legacy_id: str | None = None
    ) -> list[EquipoCombustibleListaDto]:
        """Listar registros de combustible con filtro opcional."""
        consulta = select(EquipoCombustible)
        if valorizacion_legacy_id is not None:
            consulta = consulta.where(
                EquipoCombustible.valorizacion_legacy_id == valorizacion_legacy_id
            )
        consulta = consulta.order_by(EquipoCombustible.id.desc())
        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("equipo_combustible_listados", total=len(entidades))
        return [_combustible_a_lista_dto(e) for e in entidades]

    async def obtener_combustible(self, comb_id: int) -> EquipoCombustibleDetalleDto:
        """Obtener registro de combustible por ID."""
        resultado = await self.db.execute(
            select(EquipoCombustible).where(EquipoCombustible.id == comb_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EquipoCombustible", str(comb_id))
        return _combustible_a_detalle_dto(entidad)

    async def crear_combustible(self, datos) -> EquipoCombustible:
        """Crear un nuevo registro de combustible con auto-calculo de importe."""
        importe = (datos.cantidad or 0) * (datos.precio_unitario_sin_igv or 0)
        entidad = EquipoCombustible(
            valorizacion_legacy_id=datos.valorizacion_legacy_id,
            numero_vale_salida=datos.numero_vale_salida,
            fecha=date.fromisoformat(datos.fecha) if datos.fecha else None,
            horometro_odometro=datos.horometro_odometro,
            inicial=datos.inicial,
            cantidad=datos.cantidad,
            precio_unitario_sin_igv=datos.precio_unitario_sin_igv,
            importe=importe,
            comentario=datos.comentario,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("equipo_combustible_creado", id=entidad.id)
        return entidad

    async def actualizar_combustible(self, comb_id: int, datos) -> EquipoCombustible:
        """Actualizar un registro de combustible con re-calculo de importe."""
        resultado = await self.db.execute(
            select(EquipoCombustible).where(EquipoCombustible.id == comb_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EquipoCombustible", str(comb_id))

        campos = datos.model_dump(exclude_unset=True)
        if "fecha" in campos and campos["fecha"]:
            campos["fecha"] = date.fromisoformat(campos["fecha"])
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        # Recalculate importe from current values
        entidad.importe = (
            float(entidad.cantidad) if entidad.cantidad is not None else 0
        ) * (
            float(entidad.precio_unitario_sin_igv)
            if entidad.precio_unitario_sin_igv is not None
            else 0
        )

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("equipo_combustible_actualizado", id=comb_id)
        return entidad

    async def eliminar_combustible(self, comb_id: int) -> None:
        """Eliminar un registro de combustible."""
        resultado = await self.db.execute(
            select(EquipoCombustible).where(EquipoCombustible.id == comb_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EquipoCombustible", str(comb_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("equipo_combustible_eliminado", id=comb_id)
