"""Servicio para gestión de usuarios.
"""

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError, ReglaDeNegocioError
from app.core.seguridad import hash_password
from app.esquemas.usuario import (
    CambiarPassword,
    RolDto,
    UsuarioActualizar,
    UsuarioCrear,
    UsuarioDetalleDto,
    UsuarioListaDto,
)
from app.modelos.sistema import Rol, Usuario

logger = obtener_logger(__name__)


def _a_lista_dto(u: Usuario) -> UsuarioListaDto:
    return UsuarioListaDto(
        id=u.id,
        username=u.nombre_usuario,
        email=u.correo_electronico,
        full_name=u.nombre_completo,
        nombres=u.nombres,
        apellidos=u.apellidos,
        rol=u.rol_directo.codigo if u.rol_directo else None,
        rol_nombre=u.rol_directo.nombre if u.rol_directo else None,
        unidad_operativa_id=u.unidad_operativa_id,
        unidad_operativa_nombre=(
            u.unidad_operativa.nombre if u.unidad_operativa else None
        ),
        is_active=u.is_active,
        ultimo_acceso=u.ultimo_acceso.isoformat() if u.ultimo_acceso else None,
    )


def _a_detalle_dto(u: Usuario) -> UsuarioDetalleDto:
    roles_lista: list[str] = []
    if u.rol_directo and u.rol_directo.codigo:
        roles_lista.append(u.rol_directo.codigo)
    for r in u.roles:
        if r.codigo and r.codigo not in roles_lista:
            roles_lista.append(r.codigo)

    return UsuarioDetalleDto(
        id=u.id,
        username=u.nombre_usuario,
        email=u.correo_electronico,
        full_name=u.nombre_completo,
        nombres=u.nombres,
        apellidos=u.apellidos,
        dni=u.dni,
        telefono=u.telefono,
        rol=u.rol_directo.codigo if u.rol_directo else None,
        rol_nombre=u.rol_directo.nombre if u.rol_directo else None,
        unidad_operativa_id=u.unidad_operativa_id,
        unidad_operativa_nombre=(
            u.unidad_operativa.nombre if u.unidad_operativa else None
        ),
        is_active=u.is_active,
        ultimo_acceso=u.ultimo_acceso.isoformat() if u.ultimo_acceso else None,
        roles=roles_lista,
        created_at=u.created_at.isoformat(),
        updated_at=u.updated_at.isoformat(),
    )


class ServicioUsuario:
    """Servicio para gestión de usuarios del sistema."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        tenant_id: int,
        *,
        busqueda: str | None = None,
        rol: str | None = None,
        estado: str | None = None,
        pagina: int = 1,
        limite: int = 10,
    ) -> tuple[list[UsuarioListaDto], int]:
        """Listar usuarios con filtros y paginación."""
        consulta = (
            select(Usuario)
            .options(joinedload(Usuario.rol_directo), joinedload(Usuario.unidad_operativa))
            .where(Usuario.tenant_id == tenant_id)
        )

        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                or_(
                    Usuario.nombre_usuario.ilike(patron),
                    Usuario.correo_electronico.ilike(patron),
                    Usuario.nombres.ilike(patron),
                    Usuario.apellidos.ilike(patron),
                    Usuario.dni.ilike(patron),
                )
            )

        if rol:
            consulta = consulta.join(Usuario.rol_directo).where(Rol.codigo == rol)

        if estado == "active":
            consulta = consulta.where(Usuario.is_active.is_(True))
        elif estado == "inactive":
            consulta = consulta.where(Usuario.is_active.is_(False))

        # Contar total
        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total = resultado_conteo.scalar_one()

        # Paginar
        offset = (pagina - 1) * limite
        consulta = consulta.order_by(Usuario.created_at.desc()).offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        usuarios = list(resultado.unique().scalars().all())

        return [_a_lista_dto(u) for u in usuarios], total

    async def obtener_por_id(self, tenant_id: int, usuario_id: int) -> UsuarioDetalleDto:
        """Obtener usuario por ID con relaciones."""
        resultado = await self.db.execute(
            select(Usuario)
            .options(
                joinedload(Usuario.rol_directo),
                joinedload(Usuario.unidad_operativa),
                joinedload(Usuario.roles),
            )
            .where(Usuario.id == usuario_id, Usuario.tenant_id == tenant_id)
        )
        usuario = resultado.unique().scalars().first()
        if not usuario:
            raise NoEncontradoError("Usuario", str(usuario_id))
        return _a_detalle_dto(usuario)

    async def crear(self, tenant_id: int, datos: UsuarioCrear) -> UsuarioDetalleDto:
        """Crear un nuevo usuario."""
        # Verificar username único
        existente_username = await self.db.execute(
            select(Usuario).where(Usuario.nombre_usuario == datos.username)
        )
        if existente_username.scalars().first():
            raise ConflictoError("El nombre de usuario ya está en uso")

        # Verificar email único
        existente_email = await self.db.execute(
            select(Usuario).where(Usuario.correo_electronico == datos.email)
        )
        if existente_email.scalars().first():
            raise ConflictoError("El correo electrónico ya está en uso")

        # Verificar que el rol existe
        resultado_rol = await self.db.execute(
            select(Rol).where(Rol.id == datos.rol_id)
        )
        if not resultado_rol.scalars().first():
            raise NoEncontradoError("Rol", str(datos.rol_id))

        contrasena_hash = hash_password(datos.password)

        usuario = Usuario(
            nombre_usuario=datos.username,
            contrasena=contrasena_hash,
            correo_electronico=datos.email,
            nombres=datos.first_name,
            apellidos=datos.last_name,
            dni=datos.dni,
            telefono=datos.phone,
            rol_id=datos.rol_id,
            unidad_operativa_id=datos.unidad_operativa_id,
            is_active=datos.is_active,
            tenant_id=tenant_id,
        )
        self.db.add(usuario)
        await self.db.commit()

        logger.info("usuario_creado", usuario_id=usuario.id, username=datos.username)
        return await self.obtener_por_id(tenant_id, usuario.id)

    async def actualizar(
        self, tenant_id: int, usuario_id: int, datos: UsuarioActualizar
    ) -> UsuarioDetalleDto:
        """Actualizar un usuario existente."""
        resultado = await self.db.execute(
            select(Usuario).where(
                Usuario.id == usuario_id, Usuario.tenant_id == tenant_id
            )
        )
        usuario = resultado.scalars().first()
        if not usuario:
            raise NoEncontradoError("Usuario", str(usuario_id))

        # Verificar username único si se cambia
        if datos.username and datos.username != usuario.nombre_usuario:
            existente = await self.db.execute(
                select(Usuario).where(Usuario.nombre_usuario == datos.username)
            )
            if existente.scalars().first():
                raise ConflictoError("El nombre de usuario ya está en uso")

        # Verificar email único si se cambia
        if datos.email and datos.email != usuario.correo_electronico:
            existente = await self.db.execute(
                select(Usuario).where(Usuario.correo_electronico == datos.email)
            )
            if existente.scalars().first():
                raise ConflictoError("El correo electrónico ya está en uso")

        # Verificar rol si se cambia
        if datos.rol_id is not None:
            resultado_rol = await self.db.execute(
                select(Rol).where(Rol.id == datos.rol_id)
            )
            if not resultado_rol.scalars().first():
                raise NoEncontradoError("Rol", str(datos.rol_id))

        # Mapeo DTO → entidad
        mapa_campos: dict[str, str] = {
            "username": "nombre_usuario",
            "email": "correo_electronico",
            "first_name": "nombres",
            "last_name": "apellidos",
            "dni": "dni",
            "phone": "telefono",
            "rol_id": "rol_id",
            "unidad_operativa_id": "unidad_operativa_id",
            "is_active": "is_active",
        }

        campos_actualizar = datos.model_dump(exclude_unset=True)
        for campo_dto, valor in campos_actualizar.items():
            campo_entidad = mapa_campos.get(campo_dto, campo_dto)
            setattr(usuario, campo_entidad, valor)

        await self.db.commit()

        logger.info("usuario_actualizado", usuario_id=usuario_id)
        return await self.obtener_por_id(tenant_id, usuario_id)

    async def cambiar_password(
        self, tenant_id: int, usuario_id: int, datos: CambiarPassword
    ) -> None:
        """Cambiar contraseña de un usuario (reset por admin)."""
        resultado = await self.db.execute(
            select(Usuario).where(
                Usuario.id == usuario_id, Usuario.tenant_id == tenant_id
            )
        )
        usuario = resultado.scalars().first()
        if not usuario:
            raise NoEncontradoError("Usuario", str(usuario_id))

        usuario.contrasena = hash_password(datos.new_password)
        await self.db.commit()

        logger.info("password_cambiada", usuario_id=usuario_id)

    async def toggle_activo(
        self, tenant_id: int, usuario_id: int, usuario_actual_id: int
    ) -> UsuarioDetalleDto:
        """Alternar estado activo/inactivo de un usuario."""
        resultado = await self.db.execute(
            select(Usuario)
            .options(joinedload(Usuario.rol_directo))
            .where(Usuario.id == usuario_id, Usuario.tenant_id == tenant_id)
        )
        usuario = resultado.unique().scalars().first()
        if not usuario:
            raise NoEncontradoError("Usuario", str(usuario_id))

        if usuario_id == usuario_actual_id:
            raise ReglaDeNegocioError("No puedes desactivar tu propia cuenta")

        # No desactivar al último admin activo
        if usuario.is_active and usuario.rol_directo and usuario.rol_directo.codigo == "ADMIN":
            resultado_conteo = await self.db.execute(
                select(func.count(Usuario.id))
                .join(Usuario.rol_directo)
                .where(
                    Rol.codigo == "ADMIN",
                    Usuario.is_active.is_(True),
                    Usuario.tenant_id == tenant_id,
                )
            )
            conteo_admins = resultado_conteo.scalar_one()
            if conteo_admins <= 1:
                raise ReglaDeNegocioError(
                    "No se puede desactivar al último administrador activo"
                )

        usuario.is_active = not usuario.is_active
        await self.db.commit()

        logger.info(
            "usuario_toggle_activo",
            usuario_id=usuario_id,
            is_active=usuario.is_active,
        )
        return await self.obtener_por_id(tenant_id, usuario_id)

    async def listar_roles(self) -> list[RolDto]:
        """Listar roles disponibles."""
        resultado = await self.db.execute(
            select(Rol).where(Rol.is_active.is_(True)).order_by(Rol.id.asc())
        )
        roles = list(resultado.scalars().all())
        return [
            RolDto(
                id=r.id,
                codigo=r.codigo,
                nombre=r.nombre,
                descripcion=r.descripcion,
            )
            for r in roles
        ]
