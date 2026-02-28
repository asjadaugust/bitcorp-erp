"""Definiciones de roles del sistema BitCorp ERP.

Replica exactamente backend/src/types/roles.ts del BFF Node.js.
"""

ROLES = {
    "ADMIN": "ADMIN",
    "DIRECTOR": "DIRECTOR",
    "RESIDENTE": "RESIDENTE",
    "ADMINISTRADOR_PROYECTO": "ADMINISTRADOR_PROYECTO",
    "JEFE_EQUIPO": "JEFE_EQUIPO",
    "SSOMA": "SSOMA",
    "OPERADOR": "OPERADOR",
}

TODOS_LOS_ROLES: list[str] = list(ROLES.values())

NOMBRES_ROL: dict[str, str] = {
    ROLES["ADMIN"]: "Administrador del Sistema",
    ROLES["DIRECTOR"]: "Director de Proyecto",
    ROLES["RESIDENTE"]: "Residente de Proyecto",
    ROLES["ADMINISTRADOR_PROYECTO"]: "Administrador de Proyecto",
    ROLES["JEFE_EQUIPO"]: "Jefe de Equipo",
    ROLES["SSOMA"]: "Responsable SSOMA",
    ROLES["OPERADOR"]: "Operador de Equipos",
}

JERARQUIA_ROL: dict[str, int] = {
    ROLES["OPERADOR"]: 1,
    ROLES["SSOMA"]: 2,
    ROLES["JEFE_EQUIPO"]: 2,
    ROLES["ADMINISTRADOR_PROYECTO"]: 2,
    ROLES["RESIDENTE"]: 2,
    ROLES["DIRECTOR"]: 3,
    ROLES["ADMIN"]: 4,
}


def es_rol_valido(valor: str) -> bool:
    """Verificar si un string es un rol válido."""
    return valor in TODOS_LOS_ROLES


def obtener_nombre_rol(rol: str) -> str:
    """Obtener nombre de visualización para un rol."""
    return NOMBRES_ROL.get(rol, rol)


def tiene_nivel_rol(rol_usuario: str, rol_requerido: str) -> bool:
    """Verificar si un rol tiene al menos el nivel de otro rol."""
    nivel_usuario = JERARQUIA_ROL.get(rol_usuario, 0)
    nivel_requerido = JERARQUIA_ROL.get(rol_requerido, 0)
    return nivel_usuario >= nivel_requerido
