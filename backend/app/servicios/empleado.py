"""Servicio para empleados (trabajadores).
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.empleado import (
    EmpleadoActualizar,
    EmpleadoCrear,
    EmpleadoDetalleDto,
    EmpleadoListaDto,
)
from app.modelos.rrhh import Trabajador

logger = obtener_logger(__name__)


def _fecha_str(val: date | None) -> str | None:
    return val.isoformat() if val else None


def _a_lista_dto(e: Trabajador) -> EmpleadoListaDto:
    return EmpleadoListaDto(
        id=e.id,
        dni=e.dni,
        nombres=e.nombres,
        apellido_paterno=e.apellido_paterno,
        apellido_materno=e.apellido_materno,
        cargo=e.cargo,
        especialidad=e.especialidad,
        is_active=e.is_active,
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: Trabajador) -> EmpleadoDetalleDto:
    return EmpleadoDetalleDto(
        id=e.id,
        dni=e.dni,
        nombres=e.nombres,
        apellido_paterno=e.apellido_paterno,
        apellido_materno=e.apellido_materno,
        fecha_nacimiento=_fecha_str(e.fecha_nacimiento),
        telefono=e.telefono,
        correo_electronico=e.correo_electronico,
        direccion=e.direccion,
        tipo_contrato=e.tipo_contrato,
        fecha_ingreso=_fecha_str(e.fecha_ingreso),
        fecha_cese=_fecha_str(e.fecha_cese),
        cargo=e.cargo,
        especialidad=e.especialidad,
        licencia_conducir=e.licencia_conducir,
        is_active=e.is_active,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


def _parse_date(val: str | None) -> date | None:
    if not val:
        return None
    return date.fromisoformat(val)


class ServicioEmpleado:
    """Servicio para gestión de empleados (trabajadores)."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        *,
        busqueda: str | None = None,
        is_active: bool | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[EmpleadoListaDto], int]:
        """Listar empleados con filtros y paginación."""
        consulta = select(Trabajador)

        if is_active is not None:
            consulta = consulta.where(Trabajador.is_active == is_active)
        else:
            consulta = consulta.where(Trabajador.is_active.is_(True))

        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                Trabajador.nombres.ilike(patron)
                | Trabajador.dni.ilike(patron)
                | Trabajador.apellido_paterno.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(Trabajador.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("empleados_listados", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, empleado_id: int) -> EmpleadoDetalleDto:
        """Obtener empleado por ID."""
        resultado = await self.db.execute(
            select(Trabajador).where(
                Trabajador.id == empleado_id, Trabajador.is_active.is_(True)
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Empleado", empleado_id)
        return _a_detalle_dto(entidad)

    async def crear(self, datos: EmpleadoCrear) -> EmpleadoDetalleDto:
        """Crear un nuevo empleado."""
        # Verificar DNI único
        existente = await self.db.execute(
            select(Trabajador).where(Trabajador.dni == datos.dni)
        )
        if existente.scalars().first():
            raise ConflictoError(f"Ya existe un empleado con DNI '{datos.dni}'")

        entidad = Trabajador(
            dni=datos.dni,
            nombres=datos.nombres,
            apellido_paterno=datos.apellido_paterno,
            apellido_materno=datos.apellido_materno,
            fecha_nacimiento=_parse_date(datos.fecha_nacimiento),
            telefono=datos.telefono,
            correo_electronico=datos.correo_electronico,
            direccion=datos.direccion,
            tipo_contrato=datos.tipo_contrato,
            fecha_ingreso=_parse_date(datos.fecha_ingreso),
            cargo=datos.cargo,
            especialidad=datos.especialidad,
            licencia_conducir=datos.licencia_conducir,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("empleado_creado", id=entidad.id, dni=entidad.dni)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, empleado_id: int, datos: EmpleadoActualizar
    ) -> EmpleadoDetalleDto:
        """Actualizar un empleado existente."""
        resultado = await self.db.execute(
            select(Trabajador).where(
                Trabajador.id == empleado_id, Trabajador.is_active.is_(True)
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Empleado", empleado_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo in ("fecha_ingreso", "fecha_cese"):
                setattr(entidad, campo, _parse_date(valor))
            else:
                setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("empleado_actualizado", id=empleado_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, empleado_id: int) -> None:
        """Eliminar (soft delete) un empleado."""
        resultado = await self.db.execute(
            select(Trabajador).where(
                Trabajador.id == empleado_id, Trabajador.is_active.is_(True)
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Empleado", empleado_id)

        entidad.is_active = False
        await self.db.commit()
        logger.info("empleado_eliminado", id=empleado_id)
