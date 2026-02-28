"""Servicio de autenticación.

Replica la lógica de bff/src/api/auth/auth.simple.ts.
"""

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoAutorizadoError
from app.core.seguridad import (
    PayloadJwt,
    generar_token_acceso,
    generar_token_refresco,
    verificar_password,
)
from app.esquemas.auth import LoginRespuesta, MeRespuesta, UsuarioAuth

logger = obtener_logger(__name__)


class ServicioAuth:
    """Servicio de autenticación."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def login(self, username: str, password: str) -> LoginRespuesta:
        """Autenticar usuario y generar tokens JWT."""
        logger.debug("intento_login", username=username)

        # Query raw SQL igual que el BFF Node.js
        resultado = await self.db.execute(
            text("""
                SELECT
                    u.id, u.nombre_usuario as username, u.correo_electronico as email,
                    u.nombres, u.apellidos, u.contrasena as password,
                    u.unidad_operativa_id,
                    uo.codigo as unidad_operativa_codigo,
                    uo.nombre as unidad_operativa_nombre,
                    array_agg(
                        DISTINCT COALESCE(r_direct.codigo, r_many.codigo,
                                          r_direct.nombre, r_many.nombre)
                    ) FILTER (
                        WHERE r_direct.nombre IS NOT NULL OR r_many.nombre IS NOT NULL
                    ) as roles
                FROM sistema.usuario u
                LEFT JOIN sistema.rol r_direct ON u.rol_id = r_direct.id
                LEFT JOIN sistema.usuario_rol ur ON u.id = ur.usuario_id
                LEFT JOIN sistema.rol r_many ON ur.rol_id = r_many.id
                LEFT JOIN sistema.unidad_operativa uo ON u.unidad_operativa_id = uo.id
                WHERE u.nombre_usuario = :username AND u.is_active = true
                GROUP BY u.id, u.nombre_usuario, u.correo_electronico, u.nombres, u.apellidos,
                         u.contrasena, u.unidad_operativa_id, uo.codigo, uo.nombre
            """),
            {"username": username},
        )
        fila = resultado.mappings().fetchone()

        if not fila:
            logger.warn("login_fallido_usuario_no_encontrado", username=username)
            raise NoAutorizadoError("Credenciales inválidas")

        # Verificar contraseña
        hash_almacenado: str = fila["password"]
        if not hash_almacenado or not verificar_password(password, hash_almacenado):
            raise NoAutorizadoError("Credenciales inválidas")

        # Construir payload JWT
        roles_lista: list[str] = fila["roles"] or []
        rol_principal = roles_lista[0] if roles_lista else "OPERADOR"
        nombre_completo = f"{fila['nombres'] or ''} {fila['apellidos'] or ''}".strip()

        payload = PayloadJwt(
            id_usuario=fila["id"],
            id_empresa=fila["unidad_operativa_id"] or 0,
            codigo_empresa=fila["unidad_operativa_codigo"] or "SISTEMA",
            username=fila["username"],
            email=fila["email"],
            rol=rol_principal,
            nombre_completo=nombre_completo,
        )

        access_token = generar_token_acceso(payload)
        refresh_token = generar_token_refresco(payload)

        # Actualizar último acceso (usar NOW() para evitar problemas de timezone con asyncpg)
        await self.db.execute(
            text("UPDATE sistema.usuario SET ultimo_acceso = NOW() WHERE id = :id"),
            {"id": fila["id"]},
        )
        await self.db.commit()

        logger.info(
            "login_exitoso",
            usuario_id=fila["id"],
            username=fila["username"],
            rol=rol_principal,
        )

        return LoginRespuesta(
            user=UsuarioAuth(
                id=fila["id"],
                username=fila["username"],
                email=fila["email"],
                full_name=nombre_completo,
                nombres=fila["nombres"],
                apellidos=fila["apellidos"],
                roles=roles_lista,
                unidad_operativa_id=fila["unidad_operativa_id"],
                unidad_operativa_nombre=fila["unidad_operativa_nombre"],
            ),
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def obtener_usuario_actual(self, usuario_id: int) -> MeRespuesta:
        """Obtener datos frescos del usuario autenticado."""
        resultado = await self.db.execute(
            text("""
                SELECT
                    u.id, u.nombre_usuario as username, u.correo_electronico as email,
                    u.nombres, u.apellidos,
                    u.unidad_operativa_id,
                    uo.codigo as unidad_operativa_codigo,
                    uo.nombre as unidad_operativa_nombre,
                    array_agg(
                        DISTINCT COALESCE(r_direct.codigo, r_many.codigo,
                                          r_direct.nombre, r_many.nombre)
                    ) FILTER (
                        WHERE r_direct.nombre IS NOT NULL OR r_many.nombre IS NOT NULL
                    ) as roles
                FROM sistema.usuario u
                LEFT JOIN sistema.rol r_direct ON u.rol_id = r_direct.id
                LEFT JOIN sistema.usuario_rol ur ON u.id = ur.usuario_id
                LEFT JOIN sistema.rol r_many ON ur.rol_id = r_many.id
                LEFT JOIN sistema.unidad_operativa uo ON u.unidad_operativa_id = uo.id
                WHERE u.id = :id AND u.is_active = true
                GROUP BY u.id, u.nombre_usuario, u.correo_electronico, u.nombres, u.apellidos,
                         u.unidad_operativa_id, uo.codigo, uo.nombre
            """),
            {"id": usuario_id},
        )
        fila = resultado.mappings().fetchone()

        if not fila:
            raise NoAutorizadoError("Usuario no encontrado o inactivo")

        roles_lista: list[Any] = fila["roles"] or []
        nombre_completo = f"{fila['nombres'] or ''} {fila['apellidos'] or ''}".strip()

        return MeRespuesta(
            user=UsuarioAuth(
                id=fila["id"],
                username=fila["username"],
                email=fila["email"],
                full_name=nombre_completo,
                nombres=fila["nombres"],
                apellidos=fila["apellidos"],
                roles=roles_lista,
                unidad_operativa_id=fila["unidad_operativa_id"],
                unidad_operativa_nombre=fila["unidad_operativa_nombre"],
            ),
        )
