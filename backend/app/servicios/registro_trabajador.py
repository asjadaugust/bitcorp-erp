"""Servicio para registro de trabajador y comportamiento historico."""

from datetime import date, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.registro_trabajador import (
    ComportamientoHistoricoActualizar,
    ComportamientoHistoricoCrear,
    ComportamientoHistoricoDto,
    EdtTareoDto,
    RegistroTrabajadorActualizar,
    RegistroTrabajadorCrear,
    RegistroTrabajadorDetalleDto,
    RegistroTrabajadorListaDto,
)
from app.modelos.rrhh import (
    ComportamientoHistorico,
    EdtTareo,
    RegistroTrabajador,
)

logger = obtener_logger(__name__)


def _iso(val: datetime | date | None) -> str | None:
    """Convert datetime/date to ISO string or None."""
    return val.isoformat() if val else None


def _parent_link_key(parent: RegistroTrabajador) -> str:
    """Return the key used to link ComportamientoHistorico children to this parent."""
    return parent.legacy_id if parent.legacy_id else str(parent.id)


# --- Mappers ---


def _a_lista_dto(e: RegistroTrabajador) -> RegistroTrabajadorListaDto:
    return RegistroTrabajadorListaDto(
        id=e.id,
        trabajador_dni=e.trabajador_dni,
        proveedor_ruc=e.proveedor_ruc,
        fecha_ingreso=_iso(e.fecha_ingreso),
        fecha_cese=_iso(e.fecha_cese),
        estatus=e.estatus,
        sub_grupo=e.sub_grupo,
    )


def _a_detalle_dto(
    e: RegistroTrabajador,
    comportamientos: list[ComportamientoHistoricoDto],
) -> RegistroTrabajadorDetalleDto:
    return RegistroTrabajadorDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        unidad_operativa_legacy_id=e.unidad_operativa_legacy_id,
        trabajador_dni=e.trabajador_dni,
        proveedor_ruc=e.proveedor_ruc,
        fecha_ingreso=_iso(e.fecha_ingreso),
        fecha_cese=_iso(e.fecha_cese),
        estatus=e.estatus,
        fecha_registro=_iso(e.fecha_registro),
        registrado_por=e.registrado_por,
        sub_grupo=e.sub_grupo,
        created_at=_iso(e.created_at),
        updated_at=_iso(e.updated_at),
        comportamiento_historico=comportamientos,
    )


def _a_comportamiento_dto(e: ComportamientoHistorico) -> ComportamientoHistoricoDto:
    return ComportamientoHistoricoDto(
        id=e.id,
        cargo=e.cargo,
        salario=float(e.salario) if e.salario is not None else None,
        fecha_inicio=_iso(e.fecha_inicio),
        fecha_fin=_iso(e.fecha_fin),
        numero_contrato=e.numero_contrato,
    )


def _a_edt_tareo_dto(e: EdtTareo) -> EdtTareoDto:
    return EdtTareoDto(
        id=e.id,
        edt_id=e.edt_id,
        tareo_id=e.tareo_id,
        horas=float(e.horas) if e.horas is not None else None,
    )


class ServicioRegistroTrabajador:
    """Servicio para gestion de registro de trabajador."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── RegistroTrabajador ─────────────────────────────────────────────

    async def listar_registros(
        self,
        pagina: int = 1,
        limite: int = 20,
        estatus: str | None = None,
        sub_grupo: str | None = None,
        search: str | None = None,
    ) -> tuple[list[RegistroTrabajadorListaDto], int]:
        """Listar registros de trabajador con paginacion y filtros."""
        consulta = select(RegistroTrabajador)

        if estatus:
            consulta = consulta.where(RegistroTrabajador.estatus == estatus)
        if sub_grupo:
            consulta = consulta.where(RegistroTrabajador.sub_grupo == sub_grupo)
        if search:
            consulta = consulta.where(
                RegistroTrabajador.trabajador_dni.ilike(f"%{search}%")
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(RegistroTrabajador.id.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("registros_trabajador_listados", total=total, pagina=pagina)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_registro(self, reg_id: int) -> RegistroTrabajadorDetalleDto:
        """Obtener registro de trabajador con comportamiento historico."""
        resultado = await self.db.execute(
            select(RegistroTrabajador).where(RegistroTrabajador.id == reg_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("RegistroTrabajador", str(reg_id))

        # Fetch child comportamiento historico
        link_key = _parent_link_key(entidad)
        resultado_ch = await self.db.execute(
            select(ComportamientoHistorico).where(
                ComportamientoHistorico.registro_trabajador_legacy_id == link_key
            )
        )
        comportamientos = list(resultado_ch.scalars().all())
        comportamientos_dto = [_a_comportamiento_dto(c) for c in comportamientos]

        return _a_detalle_dto(entidad, comportamientos_dto)

    async def crear_registro(
        self, datos: RegistroTrabajadorCrear
    ) -> RegistroTrabajador:
        """Crear un nuevo registro de trabajador."""
        entidad = RegistroTrabajador(
            trabajador_dni=datos.trabajador_dni,
            proveedor_ruc=datos.proveedor_ruc,
            fecha_ingreso=(
                date.fromisoformat(datos.fecha_ingreso)
                if datos.fecha_ingreso
                else None
            ),
            fecha_cese=(
                date.fromisoformat(datos.fecha_cese)
                if datos.fecha_cese
                else None
            ),
            estatus=datos.estatus,
            sub_grupo=datos.sub_grupo,
            registrado_por=datos.registrado_por,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("registro_trabajador_creado", id=entidad.id)
        return entidad

    async def actualizar_registro(
        self, reg_id: int, datos: RegistroTrabajadorActualizar
    ) -> RegistroTrabajador:
        """Actualizar un registro de trabajador."""
        resultado = await self.db.execute(
            select(RegistroTrabajador).where(RegistroTrabajador.id == reg_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("RegistroTrabajador", str(reg_id))

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo in ("fecha_ingreso", "fecha_cese") and valor is not None:
                valor = date.fromisoformat(valor)
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("registro_trabajador_actualizado", id=reg_id)
        return entidad

    async def eliminar_registro(self, reg_id: int) -> None:
        """Eliminar registro de trabajador con cascade a comportamiento historico."""
        resultado = await self.db.execute(
            select(RegistroTrabajador).where(RegistroTrabajador.id == reg_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("RegistroTrabajador", str(reg_id))

        # Delete child comportamiento historico first
        link_key = _parent_link_key(entidad)
        await self.db.execute(
            delete(ComportamientoHistorico).where(
                ComportamientoHistorico.registro_trabajador_legacy_id == link_key
            )
        )

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("registro_trabajador_eliminado", id=reg_id)

    # ── ComportamientoHistorico (child of RegistroTrabajador) ──────────

    async def agregar_comportamiento(
        self, reg_id: int, datos: ComportamientoHistoricoCrear
    ) -> ComportamientoHistoricoDto:
        """Agregar un comportamiento historico a un registro de trabajador."""
        # Verify parent exists
        resultado = await self.db.execute(
            select(RegistroTrabajador).where(RegistroTrabajador.id == reg_id)
        )
        parent = resultado.scalars().first()
        if not parent:
            raise NoEncontradoError("RegistroTrabajador", str(reg_id))

        link_key = _parent_link_key(parent)
        entidad = ComportamientoHistorico(
            cargo=datos.cargo,
            salario=datos.salario,
            fecha_inicio=(
                date.fromisoformat(datos.fecha_inicio)
                if datos.fecha_inicio
                else None
            ),
            fecha_fin=(
                date.fromisoformat(datos.fecha_fin)
                if datos.fecha_fin
                else None
            ),
            numero_contrato=datos.numero_contrato,
            registro_trabajador_legacy_id=link_key,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("comportamiento_historico_agregado", id=entidad.id, reg_id=reg_id)
        return _a_comportamiento_dto(entidad)

    async def actualizar_comportamiento(
        self, ch_id: int, datos: ComportamientoHistoricoActualizar
    ) -> ComportamientoHistoricoDto:
        """Actualizar un comportamiento historico."""
        resultado = await self.db.execute(
            select(ComportamientoHistorico).where(ComportamientoHistorico.id == ch_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("ComportamientoHistorico", str(ch_id))

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo in ("fecha_inicio", "fecha_fin") and valor is not None:
                valor = date.fromisoformat(valor)
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("comportamiento_historico_actualizado", id=ch_id)
        return _a_comportamiento_dto(entidad)

    async def eliminar_comportamiento(self, ch_id: int) -> None:
        """Eliminar un comportamiento historico individual."""
        resultado = await self.db.execute(
            select(ComportamientoHistorico).where(ComportamientoHistorico.id == ch_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("ComportamientoHistorico", str(ch_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("comportamiento_historico_eliminado", id=ch_id)

    # ── EdtTareo (read-only) ──────────────────────────────────────────

    async def listar_edt_tareo(
        self, tareo_id: int | None = None
    ) -> list[EdtTareoDto]:
        """Listar EdtTareo, opcionalmente filtrado por tareo_id."""
        consulta = select(EdtTareo)
        if tareo_id is not None:
            consulta = consulta.where(EdtTareo.tareo_id == tareo_id)
        consulta = consulta.order_by(EdtTareo.id)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("edt_tareo_listados", total=len(entidades))
        return [_a_edt_tareo_dto(e) for e in entidades]
