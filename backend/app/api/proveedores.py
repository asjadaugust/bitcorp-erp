"""Router de proveedores."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.proveedor import (
    ContactoCrear,
    InfoFinancieraCrear,
    ProveedorActualizar,
    ProveedorCrear,
)
from app.servicios.proveedor import ServicioProveedor
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


@router.get("/")
async def listar_proveedores(
    usuario: UsuarioActual, db: SesionDb,
    page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=100),
    search: str | None = None, is_active: bool = True,
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    proveedores, total = await servicio.listar(
        usuario.id_empresa, search=search, is_active=is_active, page=page, limit=limit,
    )
    return enviar_paginado(
        [p.model_dump() for p in proveedores], pagina=page, limite=limit, total=total,
    )


@router.post("/", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
async def crear_proveedor(
    datos: ProveedorCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    p = await servicio.crear(usuario.id_empresa, datos)
    return enviar_creado({"id": p.id, "message": "Proveedor creado exitosamente"})


@router.get("/{prov_id}")
async def obtener_proveedor(
    prov_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    p = await servicio.obtener_por_id(usuario.id_empresa, prov_id)
    return enviar_exito(p.model_dump())


@router.put("/{prov_id}")
async def actualizar_proveedor(
    prov_id: int, datos: ProveedorActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    p = await servicio.actualizar(usuario.id_empresa, prov_id, datos)
    return enviar_exito(p.model_dump())


@router.delete("/{prov_id}", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
async def eliminar_proveedor(
    prov_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    await servicio.eliminar(usuario.id_empresa, prov_id)
    return enviar_sin_contenido()


# ─── Contacts sub-resource ───────────────────────────────────────────────


@router.get("/{prov_id}/contacts")
async def obtener_contactos(
    prov_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    contactos = await servicio.obtener_contactos(usuario.id_empresa, prov_id)
    return enviar_exito([c.model_dump() for c in contactos])


@router.post("/{prov_id}/contacts")
async def agregar_contacto(
    prov_id: int, datos: ContactoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    c = await servicio.agregar_contacto(usuario.id_empresa, prov_id, datos, usuario.id_usuario)
    return enviar_creado({"id": c.id, "message": "Contacto agregado"})


# ─── Financial info sub-resource ─────────────────────────────────────────


@router.get("/{prov_id}/financial-info")
async def obtener_info_financiera(
    prov_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    infos = await servicio.obtener_info_financiera(usuario.id_empresa, prov_id)
    return enviar_exito([f.model_dump() for f in infos])


@router.post("/{prov_id}/financial-info")
async def agregar_info_financiera(
    prov_id: int, datos: InfoFinancieraCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    f = await servicio.agregar_info_financiera(
        usuario.id_empresa, prov_id, datos, usuario.id_usuario,
    )
    return enviar_creado({"id": f.id, "message": "Info financiera agregada"})
