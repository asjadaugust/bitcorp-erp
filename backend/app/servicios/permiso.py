"""Servicio para gestión de permisos, asignaciones rol-permiso,
usuario-rol-UO y componentes-UO.
"""

from sqlalchemy import delete, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.permiso import (
    ComponenteUoDto,
    PermisoActualizar,
    PermisoCrear,
    PermisoDto,
    RolPermisoDto,
    UsuarioRolUoCrear,
    UsuarioRolUoDto,
)
from app.modelos.sistema import (
    ComponenteUnidadOperativa,
    Permiso,
    UsuarioRolUnidadOperativa,
    tabla_rol_permiso,
)

logger = obtener_logger(__name__)


# ─── helpers ────────────────────────────────────────────────────────────────


def _permiso_a_dto(e: Permiso) -> PermisoDto:
    return PermisoDto(
        id=e.id,
        proceso=e.proceso,
        modulo=e.modulo,
        permiso=e.permiso,
        is_active=e.is_active,
    )


def _rol_permiso_a_dto(row) -> RolPermisoDto:  # noqa: ANN001
    return RolPermisoDto(
        id=row.id,
        rol_id=row.rol_id,
        permiso_id=row.permiso_id,
    )


def _usuario_rol_uo_a_dto(e: UsuarioRolUnidadOperativa) -> UsuarioRolUoDto:
    return UsuarioRolUoDto(
        id=e.id,
        usuario_id=e.usuario_id,
        rol_id=e.rol_id,
        unidad_operativa_id=e.unidad_operativa_id,
    )


def _componente_uo_a_dto(e: ComponenteUnidadOperativa) -> ComponenteUoDto:
    return ComponenteUoDto(
        id=e.id,
        codigo=e.codigo,
        componente=e.componente,
        unidad_operativa_id=e.unidad_operativa_id,
    )


# ─── servicio ───────────────────────────────────────────────────────────────


class ServicioPermiso:
    """Servicio para gestión de permisos y asignaciones."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ── Permisos CRUD ───────────────────────────────────────────────────────

    async def listar_permisos(self) -> list[PermisoDto]:
        resultado = await self.db.execute(select(Permiso).order_by(Permiso.id))
        return [_permiso_a_dto(e) for e in resultado.scalars().all()]

    async def obtener_permiso(self, permiso_id: int) -> PermisoDto:
        resultado = await self.db.execute(
            select(Permiso).where(Permiso.id == permiso_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Permiso", permiso_id)
        return _permiso_a_dto(entidad)

    async def crear_permiso(self, datos: PermisoCrear) -> PermisoDto:
        entidad = Permiso(
            proceso=datos.proceso,
            modulo=datos.modulo,
            permiso=datos.permiso,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("permiso_creado", id=entidad.id)
        return _permiso_a_dto(entidad)

    async def actualizar_permiso(
        self, permiso_id: int, datos: PermisoActualizar
    ) -> PermisoDto:
        resultado = await self.db.execute(
            select(Permiso).where(Permiso.id == permiso_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Permiso", permiso_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("permiso_actualizado", id=permiso_id)
        return _permiso_a_dto(entidad)

    async def eliminar_permiso(self, permiso_id: int) -> None:
        resultado = await self.db.execute(
            select(Permiso).where(Permiso.id == permiso_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Permiso", permiso_id)

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("permiso_eliminado", id=permiso_id)

    # ── Rol-Permiso ─────────────────────────────────────────────────────────

    async def listar_permisos_rol(self, rol_id: int) -> list[RolPermisoDto]:
        resultado = await self.db.execute(
            select(tabla_rol_permiso).where(tabla_rol_permiso.c.rol_id == rol_id)
        )
        return [_rol_permiso_a_dto(row) for row in resultado.fetchall()]

    async def asignar_permiso_rol(self, rol_id: int, permiso_id: int) -> RolPermisoDto:
        # Check duplicate
        existente = await self.db.execute(
            select(tabla_rol_permiso).where(
                tabla_rol_permiso.c.rol_id == rol_id,
                tabla_rol_permiso.c.permiso_id == permiso_id,
            )
        )
        if existente.fetchone():
            raise ConflictoError("Permiso ya asignado a este rol")

        resultado = await self.db.execute(
            insert(tabla_rol_permiso)
            .values(rol_id=rol_id, permiso_id=permiso_id)
            .returning(
                tabla_rol_permiso.c.id,
                tabla_rol_permiso.c.rol_id,
                tabla_rol_permiso.c.permiso_id,
            )
        )
        await self.db.commit()
        row = resultado.fetchone()
        logger.info("permiso_asignado_rol", rol_id=rol_id, permiso_id=permiso_id)
        return _rol_permiso_a_dto(row)

    async def revocar_permiso_rol(self, rol_id: int, permiso_id: int) -> None:
        existente = await self.db.execute(
            select(tabla_rol_permiso).where(
                tabla_rol_permiso.c.rol_id == rol_id,
                tabla_rol_permiso.c.permiso_id == permiso_id,
            )
        )
        if not existente.fetchone():
            raise NoEncontradoError("RolPermiso", f"rol={rol_id},permiso={permiso_id}")

        await self.db.execute(
            delete(tabla_rol_permiso).where(
                tabla_rol_permiso.c.rol_id == rol_id,
                tabla_rol_permiso.c.permiso_id == permiso_id,
            )
        )
        await self.db.commit()
        logger.info("permiso_revocado_rol", rol_id=rol_id, permiso_id=permiso_id)

    # ── Usuario-Rol-UO ──────────────────────────────────────────────────────

    async def listar_usuario_rol_uo(self) -> list[UsuarioRolUoDto]:
        resultado = await self.db.execute(
            select(UsuarioRolUnidadOperativa).order_by(UsuarioRolUnidadOperativa.id)
        )
        return [_usuario_rol_uo_a_dto(e) for e in resultado.scalars().all()]

    async def crear_usuario_rol_uo(self, datos: UsuarioRolUoCrear) -> UsuarioRolUoDto:
        entidad = UsuarioRolUnidadOperativa(
            usuario_id=datos.usuario_id,
            rol_id=datos.rol_id,
            unidad_operativa_id=datos.unidad_operativa_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("usuario_rol_uo_creado", id=entidad.id)
        return _usuario_rol_uo_a_dto(entidad)

    async def eliminar_usuario_rol_uo(self, asignacion_id: int) -> None:
        resultado = await self.db.execute(
            select(UsuarioRolUnidadOperativa).where(
                UsuarioRolUnidadOperativa.id == asignacion_id
            )
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("UsuarioRolUnidadOperativa", asignacion_id)

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("usuario_rol_uo_eliminado", id=asignacion_id)

    # ── Componentes-UO (read-only) ──────────────────────────────────────────

    async def listar_componentes_uo(self) -> list[ComponenteUoDto]:
        resultado = await self.db.execute(
            select(ComponenteUnidadOperativa).order_by(ComponenteUnidadOperativa.id)
        )
        return [_componente_uo_a_dto(e) for e in resultado.scalars().all()]
