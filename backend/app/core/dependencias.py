"""Dependencias de FastAPI para inyección.

Provee: sesión de BD, usuario actual, validación de roles, contexto de tenant.
"""

from collections.abc import Callable, Coroutine
from typing import Annotated, Any

from fastapi import Depends, Header
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import obtener_sesion_db
from app.core.excepciones import NoAutorizadoError, ProhibidoError
from app.core.seguridad import PayloadJwt, verificar_token_acceso

SesionDb = Annotated[AsyncSession, Depends(obtener_sesion_db)]


async def obtener_usuario_actual(
    authorization: Annotated[str | None, Header()] = None,
) -> PayloadJwt:
    """Extraer y verificar usuario del token JWT en el header Authorization."""
    if not authorization or not authorization.startswith("Bearer "):
        raise NoAutorizadoError("No se proporcionó token")

    token = authorization[7:]
    try:
        return verificar_token_acceso(token)
    except JWTError:
        raise NoAutorizadoError("Token inválido o expirado")


UsuarioActual = Annotated[PayloadJwt, Depends(obtener_usuario_actual)]


def requerir_roles(
    *roles_permitidos: str,
) -> Callable[..., Coroutine[Any, Any, PayloadJwt]]:
    """Dependencia de autorización por roles.

    Uso:
        @router.get("/admin", dependencies=[Depends(requerir_roles("ADMIN"))])
        async def endpoint_admin(): ...

        @router.get("/gestion", dependencies=[Depends(requerir_roles("ADMIN", "DIRECTOR"))])
        async def endpoint_gestion(): ...
    """

    async def verificar_rol(usuario: UsuarioActual) -> PayloadJwt:
        if not usuario.rol:
            raise ProhibidoError("Rol de usuario no encontrado en el token")

        rol_usuario = usuario.rol.upper()
        roles_permitidos_upper = [r.upper() for r in roles_permitidos]

        if rol_usuario not in roles_permitidos_upper:
            raise ProhibidoError(
                f"Permisos insuficientes. Se requiere: {', '.join(roles_permitidos)}"
            )

        return usuario

    return verificar_rol
