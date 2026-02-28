"""Excepciones personalizadas del sistema BitCorp ERP.

Replica la jerarquía de errores de backend/src/errors/ del BFF Node.js.
"""

from typing import Any


class ErrorAplicacion(Exception):
    """Error base de la aplicación."""

    def __init__(
        self,
        mensaje: str = "Error interno del servidor",
        codigo: str = "INTERNAL_ERROR",
        estado_http: int = 500,
        detalles: dict[str, Any] | list[dict[str, Any]] | None = None,
        es_operacional: bool = True,
    ):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.codigo = codigo
        self.estado_http = estado_http
        self.detalles = detalles
        self.es_operacional = es_operacional


# --- Errores HTTP ---


class SolicitudInvalidaError(ErrorAplicacion):
    def __init__(
        self, mensaje: str = "Solicitud inválida", detalles: dict[str, Any] | None = None
    ) -> None:
        super().__init__(mensaje, "BAD_REQUEST", 400, detalles)


class NoAutorizadoError(ErrorAplicacion):
    def __init__(
        self, mensaje: str = "No autorizado", detalles: dict[str, Any] | None = None
    ) -> None:
        super().__init__(mensaje, "UNAUTHORIZED", 401, detalles)


class ProhibidoError(ErrorAplicacion):
    def __init__(
        self, mensaje: str = "Permisos insuficientes", detalles: dict[str, Any] | None = None
    ) -> None:
        super().__init__(mensaje, "FORBIDDEN", 403, detalles)


class NoEncontradoError(ErrorAplicacion):
    def __init__(
        self,
        recurso: str = "Recurso",
        id_recurso: int | str | None = None,
        detalles: dict[str, Any] | None = None,
    ) -> None:
        id_str = f" con id {id_recurso}" if id_recurso is not None else ""
        mensaje = f"{recurso}{id_str} no encontrado"
        super().__init__(mensaje, "NOT_FOUND", 404, detalles)


class ConflictoError(ErrorAplicacion):
    def __init__(
        self, mensaje: str = "Conflicto", detalles: dict[str, Any] | None = None
    ) -> None:
        super().__init__(mensaje, "CONFLICT", 409, detalles)


class EntidadNoProcesableError(ErrorAplicacion):
    def __init__(
        self, mensaje: str = "Entidad no procesable", detalles: dict[str, Any] | None = None
    ) -> None:
        super().__init__(mensaje, "UNPROCESSABLE_ENTITY", 422, detalles)


class DemasiadasSolicitudesError(ErrorAplicacion):
    def __init__(
        self,
        mensaje: str = "Demasiadas solicitudes",
        reintentar_despues: int | None = None,
    ) -> None:
        detalles: dict[str, Any] | None = (
            {"retry_after": reintentar_despues} if reintentar_despues else None
        )
        super().__init__(mensaje, "TOO_MANY_REQUESTS", 429, detalles)


class ServicioNoDisponibleError(ErrorAplicacion):
    def __init__(
        self, servicio: str = "Servicio", detalles: dict[str, Any] | None = None
    ) -> None:
        super().__init__(f"{servicio} no disponible", "SERVICE_UNAVAILABLE", 503, detalles)


# --- Errores de validación ---


class ValidacionError(ErrorAplicacion):
    def __init__(
        self,
        mensaje: str = "Error de validación",
        errores: list[dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(mensaje, "VALIDATION_ERROR", 400, errores)

    @classmethod
    def campo_requerido(cls, campo: str) -> "ValidacionError":
        return cls(f"El campo '{campo}' es requerido", [{"field": campo, "rule": "required"}])

    @classmethod
    def campo_invalido(cls, campo: str, mensaje: str | None = None) -> "ValidacionError":
        msg = mensaje or f"El campo '{campo}' es inválido"
        return cls(msg, [{"field": campo, "rule": "invalid"}])


# --- Errores de base de datos ---


class BaseDatosError(ErrorAplicacion):
    def __init__(
        self,
        mensaje: str = "Error de base de datos",
        detalles: dict[str, Any] | None = None,
        error_original: Exception | None = None,
    ) -> None:
        super().__init__(mensaje, "DATABASE_ERROR", 500, detalles, es_operacional=False)
        self.error_original = error_original


# --- Errores de reglas de negocio ---


class ReglaDeNegocioError(ErrorAplicacion):
    def __init__(
        self,
        mensaje: str,
        codigo: str = "BUSINESS_RULE_ERROR",
        detalles: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(mensaje, codigo, 422, detalles)

    @classmethod
    def no_se_puede_eliminar(
        cls, entidad: str, razon: str, dependencias: dict[str, Any] | None = None
    ) -> "ReglaDeNegocioError":
        return cls(
            f"No se puede eliminar {entidad}: {razon}",
            "CANNOT_DELETE",
            dependencias,
        )

    @classmethod
    def estado_invalido(
        cls,
        entidad: str,
        estado_actual: str,
        operacion: str,
        estados_permitidos: list[str],
    ) -> "ReglaDeNegocioError":
        return cls(
            f"No se puede {operacion} {entidad} en estado '{estado_actual}'. "
            f"Estados permitidos: {', '.join(estados_permitidos)}",
            "INVALID_STATE",
            {
                "current_state": estado_actual,
                "operation": operacion,
                "allowed_states": estados_permitidos,
            },
        )

    @classmethod
    def recurso_en_uso(
        cls, recurso: str, id_recurso: int | str, usado_por: str | None = None
    ) -> "ReglaDeNegocioError":
        msg = f"{recurso} {id_recurso} está en uso"
        if usado_por:
            msg += f" por {usado_por}"
        return cls(msg, "RESOURCE_IN_USE")
