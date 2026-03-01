"""Router de empleados (trabajadores).

Replica /api/employees del BFF Node.js.
"""

from fastapi import APIRouter, Query
from fastapi.responses import ORJSONResponse

from app.core.dependencias import SesionDb, UsuarioActual
from app.esquemas.empleado import EmpleadoActualizar, EmpleadoCrear
from app.servicios.empleado import ServicioEmpleado
from app.utils.respuesta import enviar_creado, enviar_exito, enviar_paginado, enviar_sin_contenido

router = APIRouter()


@router.get("/")
async def listar_empleados(
    usuario: UsuarioActual,
    db: SesionDb,
    search: str | None = Query(None),
    is_active: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> ORJSONResponse:
    """Listar empleados con filtros y paginación."""
    servicio = ServicioEmpleado(db)
    datos, total = await servicio.listar(
        busqueda=search, is_active=is_active, pagina=page, limite=limit
    )
    return enviar_paginado([d.model_dump() for d in datos], page, limit, total)


@router.get("/{empleado_id}")
async def obtener_empleado(
    empleado_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Obtener empleado por ID."""
    servicio = ServicioEmpleado(db)
    datos = await servicio.obtener_por_id(empleado_id)
    return enviar_exito(datos.model_dump())


@router.post("/")
async def crear_empleado(
    datos: EmpleadoCrear, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Crear un nuevo empleado."""
    servicio = ServicioEmpleado(db)
    creado = await servicio.crear(datos)
    return enviar_creado({"id": creado.id, "message": "Empleado creado"})


@router.put("/{empleado_id}")
async def actualizar_empleado(
    empleado_id: int, datos: EmpleadoActualizar, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Actualizar un empleado existente."""
    servicio = ServicioEmpleado(db)
    actualizado = await servicio.actualizar(empleado_id, datos)
    return enviar_exito(actualizado.model_dump())


@router.delete("/{empleado_id}")
async def eliminar_empleado(
    empleado_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Eliminar (soft delete) un empleado."""
    servicio = ServicioEmpleado(db)
    await servicio.eliminar(empleado_id)
    return enviar_sin_contenido()
