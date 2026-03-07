"""Router de contratos.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import ORJSONResponse, Response

from app.core.dependencias import SesionDb, UsuarioActual, requerir_roles
from app.esquemas.contrato import (
    ActualizarDocumentoRequerido,
    ActualizarObligacion,
    AdendaCrear,
    AnexoItem,
    CompletarPasoLegalizacion,
    ContratoActualizar,
    ContratoCrear,
    LiquidarContrato,
    ResolverContrato,
)
from app.servicios.contrato import ServicioContrato
from app.servicios.contrato_legalizacion import ServicioLegalizacion
from app.servicios.contrato_obligaciones import ServicioObligaciones
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


# ─── Static routes (before /{id}) ─────────────────────────────────────────


@router.get("/stats/count")
async def contar_activos(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Contar contratos activos."""
    servicio = ServicioContrato(db)
    count = await servicio.contar_activos(usuario.id_empresa)
    return enviar_exito({"count": count})


@router.get("/numero/{numero}")
async def obtener_por_numero(
    numero: str, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener contrato por número."""
    servicio = ServicioContrato(db)
    contrato = await servicio.obtener_por_numero(usuario.id_empresa, numero)
    return enviar_exito(contrato.model_dump())


# ─── List (paginated) ────────────────────────────────────────────────────


@router.get("")
async def listar_contratos(
    usuario: UsuarioActual,
    db: SesionDb,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    estado: str | None = None,
    equipment_id: int | None = None,
    provider_id: int | None = None,
    search: str | None = None,
    sort_by: str = "fecha_inicio",
    sort_order: str = "DESC",
) -> ORJSONResponse:
    """Listar contratos con filtros y paginación."""
    servicio = ServicioContrato(db)
    contratos, total = await servicio.listar(
        usuario.id_empresa,
        estado=estado,
        equipment_id=equipment_id,
        provider_id=provider_id,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    return enviar_paginado(
        [c.model_dump() for c in contratos],
        pagina=page,
        limite=limit,
        total=total,
    )


# ─── CRUD by ID ──────────────────────────────────────────────────────────


@router.get("/{contrato_id}")
async def obtener_contrato(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener un contrato por ID."""
    servicio = ServicioContrato(db)
    contrato = await servicio.obtener_por_id(usuario.id_empresa, contrato_id)
    return enviar_exito(contrato.model_dump())


@router.post(
    "/",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR", "JEFE_EQUIPO"))],
)
async def crear_contrato(
    datos: ContratoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo contrato."""
    servicio = ServicioContrato(db)
    contrato = await servicio.crear(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": contrato.id, "message": "Contrato creado exitosamente"})


@router.put("/{contrato_id}")
async def actualizar_contrato(
    contrato_id: int,
    datos: ContratoActualizar,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un contrato existente."""
    servicio = ServicioContrato(db)
    contrato = await servicio.actualizar(
        usuario.id_empresa, contrato_id, datos, usuario.id_usuario
    )
    return enviar_exito(contrato.model_dump())


@router.delete(
    "/{contrato_id}",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))],
)
async def eliminar_contrato(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Soft delete de contrato."""
    servicio = ServicioContrato(db)
    await servicio.eliminar(usuario.id_empresa, contrato_id)
    return enviar_sin_contenido()


# ─── Adendas ─────────────────────────────────────────────────────────────


@router.get("/{contrato_id}/addendums")
async def listar_adendas(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar adendas de un contrato."""
    servicio = ServicioContrato(db)
    adendas = await servicio.listar_adendas(usuario.id_empresa, contrato_id)
    return enviar_exito([a.model_dump() for a in adendas])


@router.post("/addendums")
async def crear_adenda(
    datos: AdendaCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear adenda (extensión de contrato)."""
    servicio = ServicioContrato(db)
    adenda = await servicio.crear_adenda(usuario.id_empresa, datos, usuario.id_usuario)
    return enviar_creado({"id": adenda.id, "message": "Adenda creada exitosamente"})


# ─── Annexes ─────────────────────────────────────────────────────────────


@router.get("/{contrato_id}/annexes")
async def listar_anexos(
    contrato_id: int,
    usuario: UsuarioActual,
    db: SesionDb,
    tipo_anexo: str | None = None,
) -> ORJSONResponse:
    """Listar anexos de un contrato."""
    servicio = ServicioObligaciones(db)
    anexos = await servicio.listar_anexos(usuario.id_empresa, contrato_id, tipo_anexo)
    return enviar_exito([a.model_dump() for a in anexos])


@router.put("/{contrato_id}/annexes/{tipo_anexo}")
async def guardar_anexos(
    contrato_id: int,
    tipo_anexo: str,
    items: list[AnexoItem],
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Guardar/reemplazar anexos de un tipo."""
    servicio = ServicioObligaciones(db)
    anexos = await servicio.guardar_anexos(
        usuario.id_empresa,
        contrato_id,
        tipo_anexo,
        [i.model_dump() for i in items],
    )
    return enviar_exito([a.model_dump() for a in anexos])


# ─── Required Documents ──────────────────────────────────────────────────


@router.get("/{contrato_id}/required-documents")
async def listar_documentos_requeridos(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar documentos requeridos del contrato."""
    servicio = ServicioObligaciones(db)
    docs = await servicio.listar_documentos_requeridos(usuario.id_empresa, contrato_id)
    return enviar_exito([d.model_dump() for d in docs])


@router.post("/{contrato_id}/required-documents/initialize")
async def inicializar_documentos(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Inicializar documentos requeridos por defecto."""
    servicio = ServicioObligaciones(db)
    docs = await servicio.inicializar_documentos_requeridos(usuario.id_empresa, contrato_id)
    return enviar_exito([d.model_dump() for d in docs])


@router.put("/required-documents/{doc_id}")
async def actualizar_documento(
    doc_id: int,
    datos: ActualizarDocumentoRequerido,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar un documento requerido."""
    servicio = ServicioObligaciones(db)
    doc = await servicio.actualizar_documento_requerido(
        usuario.id_empresa,
        doc_id,
        provider_document_id=datos.provider_document_id,
        estado=datos.estado,
        fecha_vencimiento=datos.fecha_vencimiento,
        observaciones=datos.observaciones,
    )
    return enviar_exito(doc.model_dump())


# ─── Obligaciones del Arrendador ─────────────────────────────────────────


@router.get("/{contrato_id}/obligaciones")
async def listar_obligaciones(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar obligaciones del arrendador."""
    servicio = ServicioObligaciones(db)
    items = await servicio.listar_obligaciones(usuario.id_empresa, contrato_id)
    return enviar_exito([i.model_dump() for i in items])


@router.post("/{contrato_id}/obligaciones/initialize")
async def inicializar_obligaciones(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Inicializar obligaciones del arrendador."""
    servicio = ServicioObligaciones(db)
    items = await servicio.inicializar_obligaciones(usuario.id_empresa, contrato_id)
    return enviar_exito([i.model_dump() for i in items])


@router.put("/obligaciones/{obligacion_id}")
async def actualizar_obligacion(
    obligacion_id: int,
    datos: ActualizarObligacion,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una obligación del arrendador."""
    servicio = ServicioObligaciones(db)
    item = await servicio.actualizar_obligacion(
        usuario.id_empresa,
        obligacion_id,
        estado=datos.estado,
        fecha_compromiso=datos.fecha_compromiso,
        observaciones=datos.observaciones,
    )
    return enviar_exito(item.model_dump())


# ─── Obligaciones del Arrendatario ───────────────────────────────────────


@router.get("/{contrato_id}/obligaciones-arrendatario")
async def listar_obligaciones_arrendatario(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Listar obligaciones del arrendatario."""
    servicio = ServicioObligaciones(db)
    items = await servicio.listar_obligaciones_arrendatario(usuario.id_empresa, contrato_id)
    return enviar_exito([i.model_dump() for i in items])


@router.post("/{contrato_id}/obligaciones-arrendatario/initialize")
async def inicializar_obligaciones_arrendatario(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Inicializar obligaciones del arrendatario."""
    servicio = ServicioObligaciones(db)
    items = await servicio.inicializar_obligaciones_arrendatario(usuario.id_empresa, contrato_id)
    return enviar_exito([i.model_dump() for i in items])


@router.put("/obligaciones-arrendatario/{obligacion_id}")
async def actualizar_obligacion_arrendatario(
    obligacion_id: int,
    datos: ActualizarObligacion,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Actualizar una obligación del arrendatario."""
    servicio = ServicioObligaciones(db)
    item = await servicio.actualizar_obligacion_arrendatario(
        usuario.id_empresa,
        obligacion_id,
        estado=datos.estado,
        fecha_compromiso=datos.fecha_compromiso,
        observaciones=datos.observaciones,
    )
    return enviar_exito(item.model_dump())


# ─── Lifecycle: Resolver / Liquidar ──────────────────────────────────────


@router.post(
    "/{contrato_id}/resolver",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))],
)
async def resolver_contrato(
    contrato_id: int,
    datos: ResolverContrato,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Resolver contrato (ACTIVO/VENCIDO → RESUELTO)."""
    servicio = ServicioContrato(db)
    contrato = await servicio.resolver(
        usuario.id_empresa,
        contrato_id,
        causal_resolucion=datos.causal_resolucion,
        motivo_resolucion=datos.motivo_resolucion,
        fecha_resolucion=datos.fecha_resolucion,
        monto_liquidacion=datos.monto_liquidacion,
        usuario_id=usuario.id_usuario,
    )
    return enviar_exito(contrato.model_dump())


@router.get("/{contrato_id}/liquidation-check")
async def verificar_liquidacion(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Verificar requisitos para liquidación."""
    servicio = ServicioContrato(db)
    check = await servicio.verificar_liquidacion(usuario.id_empresa, contrato_id)
    return enviar_exito(check)


@router.post(
    "/{contrato_id}/liquidar",
    dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))],
)
async def liquidar_contrato(
    contrato_id: int,
    datos: LiquidarContrato,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Liquidar contrato (RESUELTO → LIQUIDADO)."""
    servicio = ServicioContrato(db)
    contrato = await servicio.liquidar(
        usuario.id_empresa,
        contrato_id,
        fecha_liquidacion=datos.fecha_liquidacion,
        monto_liquidacion=datos.monto_liquidacion,
        observaciones_liquidacion=datos.observaciones_liquidacion,
        usuario_id=usuario.id_usuario,
    )
    return enviar_exito(contrato.model_dump())


# ─── Legalization ────────────────────────────────────────────────────────


@router.get("/{contrato_id}/legalizacion")
async def obtener_legalizacion(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener pasos de legalización."""
    servicio = ServicioLegalizacion(db)
    pasos = await servicio.obtener_legalizacion(usuario.id_empresa, contrato_id)
    return enviar_exito([p.model_dump() for p in pasos])


@router.post("/{contrato_id}/legalizacion/iniciar")
async def iniciar_legalizacion(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Iniciar legalización notarial."""
    servicio = ServicioLegalizacion(db)
    pasos = await servicio.iniciar_legalizacion(
        usuario.id_empresa, contrato_id, usuario.id_usuario
    )
    return enviar_exito([p.model_dump() for p in pasos])


@router.post("/{contrato_id}/legalizacion/paso/{numero_paso}")
async def completar_paso_legalizacion(
    contrato_id: int,
    numero_paso: int,
    datos: CompletarPasoLegalizacion,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Completar un paso de legalización."""
    servicio = ServicioLegalizacion(db)
    pasos = await servicio.completar_paso(
        usuario.id_empresa,
        contrato_id,
        numero_paso,
        usuario_id=usuario.id_usuario,
        observaciones=datos.observaciones,
    )
    return enviar_exito([p.model_dump() for p in pasos])


@router.post("/{contrato_id}/legalizacion/paso/{numero_paso}/revertir")
async def revertir_paso_legalizacion(
    contrato_id: int,
    numero_paso: int,
    usuario: UsuarioActual,
    db: SesionDb,
) -> ORJSONResponse:
    """Revertir un paso de legalización."""
    servicio = ServicioLegalizacion(db)
    pasos = await servicio.revertir_paso(
        usuario.id_empresa, contrato_id, numero_paso, usuario.id_usuario
    )
    return enviar_exito([p.model_dump() for p in pasos])


# --- PDF generation ---------------------------------------------------------


@router.get("/{contrato_id}/pdf")
async def generar_pdf_contrato(
    contrato_id: int, usuario: UsuarioActual, db: SesionDb
) -> Response:
    """Generar PDF del contrato."""
    from app.servicios.pdf import servicio_pdf

    servicio = ServicioContrato(db)
    contrato = await servicio.obtener_por_id(usuario.id_empresa, contrato_id)
    datos = contrato.model_dump()
    datos_pdf = {
        "contrato": datos,
        "proveedor": datos.get("proveedor", {}),
        "equipo": datos.get("equipo", {}),
        "arrendatario": {
            "razon_social": "Consorcio La Union",
            "ruc": "",
            "representante": "",
            "domicilio": "",
        },
        "fecha_generacion": __import__("datetime").datetime.now().strftime("%d/%m/%Y"),
    }
    pdf_bytes = await servicio_pdf.generar_pdf_contrato(datos_pdf)
    filename = f"contrato-{contrato_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
