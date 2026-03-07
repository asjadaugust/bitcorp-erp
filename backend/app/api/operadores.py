"""Router de operadores.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.operador import (
    CertificacionCrear,
    DisponibilidadEstablecer,
    HabilidadCrear,
    OperadorActualizar,
    OperadorCrear,
)
from app.servicios.operador import ServicioOperador
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


# ─── Fixed routes before /{id} ───────────────────────────────────────────


@router.get("/programacion")
async def obtener_programacion(
    usuario: UsuarioActual,
    db: SesionDb,
    mes: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    datos = await servicio.obtener_programacion(usuario.id_empresa, mes)
    return enviar_exito([d.model_dump() for d in datos])


# ─── List / CRUD ─────────────────────────────────────────────────────────


@router.get("")
async def listar_operadores(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    is_active: bool = True,
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    operadores, total = await servicio.listar(
        usuario.id_empresa,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )
    return enviar_paginado(
        [o.model_dump() for o in operadores], pagina=page, limite=limit, total=total,
    )


@router.post(
    "/",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR", "JEFE_EQUIPO"))],
)
async def crear_operador(
    datos: OperadorCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    operador = await servicio.crear(usuario.id_empresa, datos)
    return enviar_creado({"id": operador.id, "message": "Operador creado exitosamente"})


@router.get("/{operador_id}")
async def obtener_operador(
    operador_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    operador = await servicio.obtener_por_id(usuario.id_empresa, operador_id)
    return enviar_exito(operador.model_dump())


@router.put("/{operador_id}")
async def actualizar_operador(
    operador_id: int, datos: OperadorActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    operador = await servicio.actualizar(usuario.id_empresa, operador_id, datos)
    return enviar_exito(operador.model_dump())


@router.delete(
    "/{operador_id}",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))],
)
async def eliminar_operador(
    operador_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    await servicio.eliminar(usuario.id_empresa, operador_id)
    return enviar_sin_contenido()


# ─── Certifications sub-resource ─────────────────────────────────────────


@router.get("/{operador_id}/certifications")
async def obtener_certificaciones(
    operador_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    certs = await servicio.obtener_certificaciones(usuario.id_empresa, operador_id)
    return enviar_exito([c.model_dump() for c in certs])


@router.post("/{operador_id}/certifications")
async def agregar_certificacion(
    operador_id: int, datos: CertificacionCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    cert = await servicio.agregar_certificacion(usuario.id_empresa, operador_id, datos)
    return enviar_creado({"id": cert.id, "message": "Certificación agregada"})


@router.delete("/{operador_id}/certifications/{cert_id}")
async def eliminar_certificacion(
    operador_id: int, cert_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    await servicio.eliminar_certificacion(usuario.id_empresa, operador_id, cert_id)
    return enviar_sin_contenido()


# ─── Skills sub-resource ─────────────────────────────────────────────────


@router.get("/{operador_id}/skills")
async def obtener_habilidades(
    operador_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    habs = await servicio.obtener_habilidades(usuario.id_empresa, operador_id)
    return enviar_exito([h.model_dump() for h in habs])


@router.post("/{operador_id}/skills")
async def agregar_habilidad(
    operador_id: int, datos: HabilidadCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    hab = await servicio.agregar_habilidad(usuario.id_empresa, operador_id, datos)
    return enviar_creado({"id": hab.id, "message": "Habilidad agregada"})


# ─── Availability & Performance ──────────────────────────────────────────


@router.get("/{operador_id}/availability")
async def obtener_disponibilidad(
    operador_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    disps = await servicio.obtener_disponibilidad(usuario.id_empresa, operador_id)
    return enviar_exito([d.model_dump() for d in disps])


@router.post("/{operador_id}/disponibilidad")
async def establecer_disponibilidad(
    operador_id: int, datos: DisponibilidadEstablecer, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    disp = await servicio.establecer_disponibilidad(usuario.id_empresa, operador_id, datos)
    return enviar_exito(disp.model_dump())


@router.get("/{operador_id}/performance")
async def obtener_rendimiento(
    operador_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    servicio = ServicioOperador(db)
    perf = await servicio.obtener_rendimiento(usuario.id_empresa, operador_id)
    return enviar_exito(perf.model_dump())
