"""Router de proveedores."""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.proveedor import (
    ContactoActualizar,
    ContactoCrear,
    DocumentoActualizar,
    DocumentoCrear,
    InfoFinancieraActualizar,
    InfoFinancieraCrear,
    ProveedorActualizar,
    ProveedorCrear,
)
from app.servicios.proveedor import ServicioProveedor
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


# ─── RUC Lookup (before /{prov_id} to avoid path conflict) ──────────────


@router.get("/ruc/{ruc}/lookup")
async def consultar_ruc(ruc: str, usuario: UsuarioActual) -> ORJSONResponse:
    from app.integraciones.decolecta import consultar_ruc as _consultar_ruc

    resultado = await _consultar_ruc(ruc)
    return enviar_exito(resultado)


# ─── Provider CRUD ───────────────────────────────────────────────────────


@router.get("")
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


@router.post("", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
async def crear_proveedor(
    datos: ProveedorCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    p = await servicio.crear(usuario.id_empresa, datos, user_id=usuario.id_usuario)
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
    p = await servicio.actualizar(usuario.id_empresa, prov_id, datos, user_id=usuario.id_usuario)
    return enviar_exito(p.model_dump())


@router.delete("/{prov_id}", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
async def eliminar_proveedor(
    prov_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    await servicio.eliminar(usuario.id_empresa, prov_id, user_id=usuario.id_usuario)
    return enviar_sin_contenido()


# ─── Contacts sub-resource ──────────────────────────────────────────────


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


@router.put("/contacts/{contact_id}")
async def actualizar_contacto(
    contact_id: int, datos: ContactoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    c = await servicio.actualizar_contacto(
        usuario.id_empresa, contact_id, datos, usuario.id_usuario,
    )
    return enviar_exito(c.model_dump())


@router.delete("/contacts/{contact_id}")
async def eliminar_contacto(
    contact_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    await servicio.eliminar_contacto(usuario.id_empresa, contact_id, usuario.id_usuario)
    return enviar_sin_contenido()


# ─── Financial info sub-resource ────────────────────────────────────────


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


@router.put("/financial-info/{info_id}")
async def actualizar_info_financiera(
    info_id: int, datos: InfoFinancieraActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    f = await servicio.actualizar_info_financiera(
        usuario.id_empresa, info_id, datos, usuario.id_usuario,
    )
    return enviar_exito(f.model_dump())


@router.delete("/financial-info/{info_id}")
async def eliminar_info_financiera(
    info_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    await servicio.eliminar_info_financiera(usuario.id_empresa, info_id, usuario.id_usuario)
    return enviar_sin_contenido()


# ─── Documents sub-resource ─────────────────────────────────────────────


@router.get("/{prov_id}/documents")
async def obtener_documentos(
    prov_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    docs = await servicio.obtener_documentos(usuario.id_empresa, prov_id)
    return enviar_exito([d.model_dump() for d in docs])


@router.post("/{prov_id}/documents")
async def agregar_documento(
    prov_id: int, datos: DocumentoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    d = await servicio.agregar_documento(usuario.id_empresa, prov_id, datos, usuario.id_usuario)
    return enviar_creado({"id": d.id, "message": "Documento agregado"})


@router.put("/documents/{doc_id}")
async def actualizar_documento(
    doc_id: int, datos: DocumentoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    d = await servicio.actualizar_documento(usuario.id_empresa, doc_id, datos, usuario.id_usuario)
    return enviar_exito(d.model_dump())


@router.delete("/documents/{doc_id}")
async def eliminar_documento(
    doc_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    await servicio.eliminar_documento(usuario.id_empresa, doc_id, usuario.id_usuario)
    return enviar_sin_contenido()


# ─── Audit Logs ─────────────────────────────────────────────────────────


@router.get("/{prov_id}/logs")
async def obtener_logs(
    prov_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioProveedor(db)
    logs = await servicio.obtener_logs(usuario.id_empresa, prov_id)
    return enviar_exito([log.model_dump() for log in logs])
