"""Servicio de correo electrónico.

Internal service — no router, used by cron and other services.
"""

import os
from dataclasses import dataclass, field
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config.logging import obtener_logger

logger = obtener_logger(__name__)


@dataclass
class ConfigCorreo:
    """Configuración SMTP."""

    host: str = field(default_factory=lambda: os.getenv("SMTP_HOST", "localhost"))
    port: int = field(default_factory=lambda: int(os.getenv("SMTP_PORT", "587")))
    user: str = field(default_factory=lambda: os.getenv("SMTP_USER", ""))
    password: str = field(default_factory=lambda: os.getenv("SMTP_PASSWORD", ""))
    from_email: str = field(
        default_factory=lambda: os.getenv("SMTP_FROM", "noreply@bitcorp.pe")
    )
    from_name: str = field(
        default_factory=lambda: os.getenv("SMTP_FROM_NAME", "BitCorp ERP")
    )


class ServicioCorreo:
    """Servicio para envío de correos electrónicos."""

    def __init__(self, config: ConfigCorreo | None = None) -> None:
        self.config = config or ConfigCorreo()

    def _construir_mensaje(
        self,
        destinatario: str,
        asunto: str,
        cuerpo_html: str,
    ) -> MIMEMultipart:
        """Construir un mensaje MIME."""
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{self.config.from_name} <{self.config.from_email}>"
        msg["To"] = destinatario
        msg["Subject"] = asunto
        msg.attach(MIMEText(cuerpo_html, "html"))
        return msg

    async def enviar_correo(
        self,
        destinatario: str,
        asunto: str,
        cuerpo_html: str,
    ) -> bool:
        """Enviar un correo electrónico."""
        try:
            import aiosmtplib

            msg = self._construir_mensaje(destinatario, asunto, cuerpo_html)
            await aiosmtplib.send(
                msg,
                hostname=self.config.host,
                port=self.config.port,
                username=self.config.user or None,
                password=self.config.password or None,
                use_tls=self.config.port == 465,
                start_tls=self.config.port == 587,
            )
            logger.info("correo_enviado", destinatario=destinatario, asunto=asunto)
            return True
        except Exception as e:
            logger.error("correo_error", destinatario=destinatario, error=str(e))
            return False

    async def enviar_alerta_documento_vencido(
        self,
        destinatario: str,
        nombre_documento: str,
        fecha_vencimiento: str,
        equipo_nombre: str,
    ) -> bool:
        """Enviar alerta de documento por vencer."""
        asunto = f"[BitCorp] Alerta: Documento por vencer - {nombre_documento}"
        cuerpo = f"""
        <h2>Alerta de Documento por Vencer</h2>
        <p>El documento <strong>{nombre_documento}</strong> del equipo
        <strong>{equipo_nombre}</strong> vence el <strong>{fecha_vencimiento}</strong>.</p>
        <p>Por favor tome las acciones necesarias para renovar el documento.</p>
        """
        return await self.enviar_correo(destinatario, asunto, cuerpo)

    async def enviar_alerta_valorizacion(
        self,
        destinatario: str,
        codigo_valorizacion: str,
        estado: str,
    ) -> bool:
        """Enviar alerta de cambio de estado en valorización."""
        asunto = f"[BitCorp] Valorización {codigo_valorizacion} - Estado: {estado}"
        cuerpo = f"""
        <h2>Actualización de Valorización</h2>
        <p>La valorización <strong>{codigo_valorizacion}</strong> ha cambiado
        al estado <strong>{estado}</strong>.</p>
        """
        return await self.enviar_correo(destinatario, asunto, cuerpo)

    async def enviar_alerta_pago_vencido(
        self,
        destinatario: str,
        proveedor_nombre: str,
        monto: float,
        dias_vencido: int,
    ) -> bool:
        """Enviar alerta de pago vencido."""
        asunto = f"[BitCorp] Pago vencido - {proveedor_nombre}"
        cuerpo = f"""
        <h2>Alerta de Pago Vencido</h2>
        <p>El pago al proveedor <strong>{proveedor_nombre}</strong> por
        <strong>S/. {monto:,.2f}</strong> tiene <strong>{dias_vencido}</strong>
        días de vencido.</p>
        """
        return await self.enviar_correo(destinatario, asunto, cuerpo)
