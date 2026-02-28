"""Utilidades de seguridad: JWT y hashing de contraseñas.

Replica SecurityUtil de backend/src/utils/security.util.ts del BFF Node.js.
Usa el mismo JWT_SECRET para que tokens sean interoperables entre backends.
"""

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.config.settings import configuracion

contexto_password: CryptContext = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PayloadJwt(BaseModel):
    """Estructura del payload JWT — idéntica al BFF Node.js."""

    id_usuario: int
    id_empresa: int
    codigo_empresa: str
    username: str
    email: str
    rol: str
    nombre_completo: str
    iat: int | None = None
    exp: int | None = None


def hash_password(password: str) -> str:
    """Hashear contraseña con bcrypt."""
    resultado: str = contexto_password.hash(password)
    return resultado


def verificar_password(password: str, hash_almacenado: str) -> bool:
    """Verificar contraseña contra hash bcrypt."""
    resultado: bool = contexto_password.verify(password, hash_almacenado)
    return resultado


def generar_token_acceso(payload: PayloadJwt) -> str:
    """Generar JWT de acceso compatible con el BFF Node.js."""
    datos: dict[str, Any] = payload.model_dump(exclude={"iat", "exp"})
    ahora = datetime.now(UTC)
    datos["iat"] = int(ahora.timestamp())
    datos["exp"] = int((ahora + timedelta(minutes=configuracion.jwt_expires_minutes)).timestamp())
    resultado: str = jwt.encode(
        datos, configuracion.jwt_secret, algorithm=configuracion.jwt_algorithm
    )
    return resultado


def generar_token_refresco(payload: PayloadJwt) -> str:
    """Generar JWT de refresco compatible con el BFF Node.js."""
    datos: dict[str, Any] = payload.model_dump(exclude={"iat", "exp"})
    ahora = datetime.now(UTC)
    datos["iat"] = int(ahora.timestamp())
    datos["exp"] = int(
        (ahora + timedelta(days=configuracion.jwt_refresh_expires_days)).timestamp()
    )
    resultado: str = jwt.encode(
        datos, configuracion.jwt_refresh_secret, algorithm=configuracion.jwt_algorithm
    )
    return resultado


def verificar_token_acceso(token: str) -> PayloadJwt:
    """Verificar y decodificar token de acceso JWT.

    Lanza JWTError si el token es inválido o expirado.
    """
    try:
        datos: dict[str, Any] = jwt.decode(
            token,
            configuracion.jwt_secret,
            algorithms=[configuracion.jwt_algorithm],
        )
        return PayloadJwt(**datos)
    except JWTError:
        raise


def verificar_token_refresco(token: str) -> PayloadJwt:
    """Verificar y decodificar token de refresco JWT."""
    try:
        datos: dict[str, Any] = jwt.decode(
            token,
            configuracion.jwt_refresh_secret,
            algorithms=[configuracion.jwt_algorithm],
        )
        return PayloadJwt(**datos)
    except JWTError:
        raise
