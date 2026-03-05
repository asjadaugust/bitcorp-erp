"""Router de logística / inventario."""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.logistica import MovimientoCrear
from app.servicios.logistica import ServicioLogistica
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado

router = APIRouter()


@router.get("/products")
async def listar_productos(
    usuario: UsuarioActual,
    db: SesionDb,
    categoria: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar productos con filtros y paginación."""
    servicio = ServicioLogistica(db)
    datos, total = await servicio.listar_productos(
        categoria=categoria, busqueda=search, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/products/{producto_id}")
async def obtener_producto(
    producto_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener producto por ID."""
    servicio = ServicioLogistica(db)
    datos = await servicio.obtener_producto(producto_id)
    return enviar_exito(datos.model_dump())


@router.get("/movements")
async def listar_movimientos(
    usuario: UsuarioActual,
    db: SesionDb,
    tipo: str | None = Query(None),
    fecha_inicio: str | None = Query(None),
    fecha_fin: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
) -> ORJSONResponse:
    """Listar movimientos con filtros y paginación."""
    servicio = ServicioLogistica(db)
    datos, total = await servicio.listar_movimientos(
        tipo=tipo,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        pagina=page,
        limite=limit,
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/movements/{movimiento_id}")
async def obtener_movimiento(
    movimiento_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener movimiento por ID."""
    servicio = ServicioLogistica(db)
    datos = await servicio.obtener_movimiento(movimiento_id)
    return enviar_exito(datos.model_dump())


@router.post("/movements")
async def crear_movimiento(
    datos: MovimientoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo movimiento de inventario."""
    servicio = ServicioLogistica(db)
    creado = await servicio.crear_movimiento(datos, usuario.id_usuario)
    return enviar_creado({"id": creado.id, "message": "Movimiento creado"})


@router.get("/stock")
async def obtener_stock(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Resumen de stock de todos los productos activos."""
    servicio = ServicioLogistica(db)
    datos = await servicio.obtener_stock()
    return enviar_exito([d.model_dump() for d in datos])
