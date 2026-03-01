"""Router de autenticación.
"""

from fastapi import APIRouter
from fastapi.responses import ORJSONResponse
from jose import JWTError

from app.core.dependencias import SesionDb, UsuarioActual
from app.core.excepciones import NoAutorizadoError
from app.core.seguridad import (
    PayloadJwt,
    generar_token_acceso,
    generar_token_refresco,
    verificar_token_refresco,
)
from app.esquemas.auth import LoginSolicitud, RefreshTokenSolicitud
from app.servicios.auth import ServicioAuth
from app.utils.respuesta import enviar_exito

router = APIRouter()


@router.post("/login")
async def login(datos: LoginSolicitud, db: SesionDb) -> ORJSONResponse:
    """Autenticar usuario con username/password y obtener tokens JWT."""
    servicio = ServicioAuth(db)
    resultado = await servicio.login(datos.username, datos.password)
    return enviar_exito(resultado.model_dump())


@router.get("/me")
async def me(usuario: UsuarioActual, db: SesionDb) -> ORJSONResponse:
    """Obtener datos del usuario autenticado."""
    servicio = ServicioAuth(db)
    resultado = await servicio.obtener_usuario_actual(usuario.id_usuario)
    return enviar_exito(resultado.model_dump())


@router.post("/refresh")
async def refresh(datos: RefreshTokenSolicitud) -> ORJSONResponse:
    """Renovar tokens usando el refresh token."""
    try:
        payload = verificar_token_refresco(datos.refresh_token)
    except JWTError:
        raise NoAutorizadoError("Refresh token inválido o expirado")

    nuevo_payload = PayloadJwt(
        id_usuario=payload.id_usuario,
        id_empresa=payload.id_empresa,
        codigo_empresa=payload.codigo_empresa,
        username=payload.username,
        email=payload.email,
        rol=payload.rol,
        nombre_completo=payload.nombre_completo,
    )
    access_token = generar_token_acceso(nuevo_payload)
    refresh_token = generar_token_refresco(nuevo_payload)

    return enviar_exito(
        {"access_token": access_token, "refresh_token": refresh_token}
    )
