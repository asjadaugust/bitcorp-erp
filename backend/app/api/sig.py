"""Router de SIG / documentos.

Replica /api/sig del BFF Node.js.
"""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.documento_sig import DocumentoSigActualizar, DocumentoSigCrear
from app.servicios.documento_sig import ServicioDocumentoSig
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


@router.get("/documents")
async def listar_documentos(
    usuario: UsuarioActual,
    db: SesionDb,
    tipo_documento: str | None = Query(None),
    estado: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar documentos SIG con filtros y paginación."""
    servicio = ServicioDocumentoSig(db)
    datos, total = await servicio.listar(
        tipo_documento=tipo_documento, estado=estado, busqueda=search,
        pagina=page, limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/documents/{documento_id}")
async def obtener_documento(
    documento_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener documento por ID."""
    servicio = ServicioDocumentoSig(db)
    datos = await servicio.obtener_por_id(documento_id)
    return enviar_exito(datos.model_dump())


@router.post("/documents")
async def crear_documento(
    datos: DocumentoSigCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo documento."""
    servicio = ServicioDocumentoSig(db)
    creado = await servicio.crear(datos, usuario.id_usuario)
    return enviar_creado({"id": creado.id, "message": "Documento creado"})


@router.put("/documents/{documento_id}")
async def actualizar_documento(
    documento_id: int, datos: DocumentoSigActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un documento existente."""
    servicio = ServicioDocumentoSig(db)
    actualizado = await servicio.actualizar(documento_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/documents/{documento_id}")
async def eliminar_documento(
    documento_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar un documento."""
    servicio = ServicioDocumentoSig(db)
    await servicio.eliminar(documento_id)
    return enviar_sin_contenido()
