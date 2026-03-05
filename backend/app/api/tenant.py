"""Router de tenant (proyectos del usuario).

Nota: /my-projects retorna array plano (sin wrapper {success, data}).
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse, ORJSONResponse
from sqlalchemy import text

from app.core.dependencias import SesionDb, UsuarioActual
from app.utils.respuesta import enviar_exito

router = APIRouter()


@router.get("/my-projects")
async def mis_proyectos(usuario: UsuarioActual, db: SesionDb) -> JSONResponse:
    """Obtener proyectos del tenant actual.

    IMPORTANTE: Retorna array plano (NO wrapped en {success, data}) para
    compatibilidad con el frontend TenantService.
    """
    try:
        result = await db.execute(
            text(
                """
                SELECT id, nombre AS name, codigo AS code,
                       COALESCE(descripcion, '') AS description,
                       COALESCE(estado, 'ACTIVO') AS status,
                       created_at, updated_at
                FROM proyectos.edt
                WHERE nivel = 0 AND empresa_id = :tenant_id
                ORDER BY nombre
                """
            ),
            {"tenant_id": usuario.id_empresa},
        )
        rows = result.mappings().all()
        projects = [
            {
                "id": str(r["id"]),
                "name": r["name"] or "",
                "code": r["code"] or "",
                "description": r["description"] or "",
                "status": r["status"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else "",
                "updated_at": r["updated_at"].isoformat() if r["updated_at"] else "",
            }
            for r in rows
        ]
    except Exception:
        # Return empty array to prevent login failures
        projects = []
    return JSONResponse(content=projects)


@router.post("/switch-project/{project_id}")
async def cambiar_proyecto(
    project_id: int, usuario: UsuarioActual, db: SesionDb
) -> ORJSONResponse:
    """Cambiar proyecto activo (stub — no hay columna active_project_id)."""
    return enviar_exito(
        {
            "message": "Proyecto verificado (switch no implementado - columna faltante)",
            "warning": "active_project_id column does not exist in sistema.usuario",
        }
    )
