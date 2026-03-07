"""Router de permisos, asignaciones rol-permiso, usuario-rol-UO y componentes-UO."""

from fastapi import APIRouter, Depends
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.permiso import (
    PermisoActualizar,
    PermisoCrear,
    RolPermisoAsignar,
    UsuarioRolUoCrear,
)
from app.servicios.permiso import ServicioPermiso
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_sin_contenido

router = APIRouter(
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)


# ─── Permisos list & create (no path param conflict) ────────────────────────


@router.get("/")
async def listar_permisos(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar todos los permisos."""
    servicio = ServicioPermiso(db)
    datos = await servicio.listar_permisos()
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/")
async def crear_permiso(
    datos: PermisoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un permiso."""
    servicio = ServicioPermiso(db)
    creado = await servicio.crear_permiso(datos)
    return enviar_creado({"id": creado.id, "message": "Permiso creado"})


# ─── Rol-Permiso (must be before /{permiso_id}) ─────────────────────────────


@router.get("/roles/{rol_id}/permisos")
async def listar_permisos_rol(
    rol_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar permisos asignados a un rol."""
    servicio = ServicioPermiso(db)
    datos = await servicio.listar_permisos_rol(rol_id)
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/roles/{rol_id}/permisos")
async def asignar_permiso_rol(
    rol_id: int,
    datos: RolPermisoAsignar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Asignar permiso a un rol."""
    servicio = ServicioPermiso(db)
    creado = await servicio.asignar_permiso_rol(rol_id, datos.permiso_id)
    return enviar_creado(creado.model_dump())


@router.delete("/roles/{rol_id}/permisos/{permiso_id}")
async def revocar_permiso_rol(
    rol_id: int,
    permiso_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Revocar permiso de un rol."""
    servicio = ServicioPermiso(db)
    await servicio.revocar_permiso_rol(rol_id, permiso_id)
    return enviar_sin_contenido()


# ─── Usuario-Rol-UO (must be before /{permiso_id}) ──────────────────────────


@router.get("/usuario-rol-uo")
async def listar_usuario_rol_uo(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar asignaciones usuario-rol-unidad operativa."""
    servicio = ServicioPermiso(db)
    datos = await servicio.listar_usuario_rol_uo()
    return enviar_exito([d.model_dump() for d in datos])


@router.post("/usuario-rol-uo")
async def crear_usuario_rol_uo(
    datos: UsuarioRolUoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear asignacion usuario-rol-UO."""
    servicio = ServicioPermiso(db)
    creado = await servicio.crear_usuario_rol_uo(datos)
    return enviar_creado(creado.model_dump())


@router.delete("/usuario-rol-uo/{asignacion_id}")
async def eliminar_usuario_rol_uo(
    asignacion_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar asignacion usuario-rol-UO."""
    servicio = ServicioPermiso(db)
    await servicio.eliminar_usuario_rol_uo(asignacion_id)
    return enviar_sin_contenido()


# ─── Componentes-UO (must be before /{permiso_id}) ──────────────────────────


@router.get("/componentes-uo")
async def listar_componentes_uo(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Listar componentes por unidad operativa."""
    servicio = ServicioPermiso(db)
    datos = await servicio.listar_componentes_uo()
    return enviar_exito([d.model_dump() for d in datos])


# ─── Permisos by ID (parametric — must be LAST) ─────────────────────────────


@router.get("/{permiso_id}")
async def obtener_permiso(
    permiso_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener permiso por ID."""
    servicio = ServicioPermiso(db)
    datos = await servicio.obtener_permiso(permiso_id)
    return enviar_exito(datos.model_dump())


@router.put("/{permiso_id}")
async def actualizar_permiso(
    permiso_id: int,
    datos: PermisoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar permiso."""
    servicio = ServicioPermiso(db)
    actualizado = await servicio.actualizar_permiso(permiso_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/{permiso_id}")
async def eliminar_permiso(
    permiso_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar permiso."""
    servicio = ServicioPermiso(db)
    await servicio.eliminar_permiso(permiso_id)
    return enviar_sin_contenido()
