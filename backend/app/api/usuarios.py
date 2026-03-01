"""Router de gestión de usuarios.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.usuario import CambiarPassword, UsuarioActualizar, UsuarioCrear
from app.servicios.usuario import ServicioUsuario
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("/search")
async def buscar_usuarios(
    usuario: UsuarioActual,
    db: SesionDb,
    q: str = Query("", min_length=0),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Buscar usuarios (abierto a todos los autenticados)."""
    servicio = ServicioUsuario(db)
    datos, total = await servicio.listar(
        tenant_id=usuario.id_empresa,
        busqueda=q if q else None,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get(
    "/roles",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def listar_roles(db: SesionDb) -> ORJSONResponse:
    """Listar roles disponibles."""
    servicio = ServicioUsuario(db)
    roles = await servicio.listar_roles()
    return enviar_exito([r.model_dump() for r in roles])


@router.get(
    "/",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def listar_usuarios(
    usuario: UsuarioActual,
    db: SesionDb,
    search: str | None = Query(None),
    role: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar usuarios con filtros y paginación."""
    servicio = ServicioUsuario(db)
    datos, total = await servicio.listar(
        tenant_id=usuario.id_empresa,
        busqueda=search,
        rol=role,
        estado=status,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get(
    "/{usuario_id}",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def obtener_usuario(
    usuario_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener un usuario por ID."""
    servicio = ServicioUsuario(db)
    datos = await servicio.obtener_por_id(usuario.id_empresa, usuario_id)
    return enviar_exito(datos.model_dump())


@router.post(
    "/",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def crear_usuario(
    datos: UsuarioCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo usuario."""
    servicio = ServicioUsuario(db)
    creado = await servicio.crear(usuario.id_empresa, datos)
    return enviar_creado({"id": creado.id, "message": "Usuario creado exitosamente"})


@router.put(
    "/{usuario_id}",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def actualizar_usuario(
    usuario_id: int,
    datos: UsuarioActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un usuario existente."""
    servicio = ServicioUsuario(db)
    actualizado = await servicio.actualizar(usuario.id_empresa, usuario_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.patch(
    "/{usuario_id}/password",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def cambiar_password(
    usuario_id: int,
    datos: CambiarPassword,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Cambiar contraseña de un usuario (reset por admin)."""
    servicio = ServicioUsuario(db)
    await servicio.cambiar_password(usuario.id_empresa, usuario_id, datos)
    return enviar_exito({"message": "Contraseña actualizada exitosamente"})


@router.patch(
    "/{usuario_id}/toggle-active",
    dependencies=[Depends(requerir_roles("ADMIN", "ADMIN_SISTEMA"))],
)
async def toggle_activo(
    usuario_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Alternar estado activo/inactivo de un usuario."""
    servicio = ServicioUsuario(db)
    actualizado = await servicio.toggle_activo(
        usuario.id_empresa, usuario_id, usuario.id_usuario
    )
    return enviar_exito(actualizado.model_dump())
