"""Servicio de tareas programadas (cron jobs).
"""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.modelos.equipo import ContratoAdenda, ProgramaMantenimiento
from app.modelos.publico import Notificacion
from app.modelos.rrhh import CertificacionOperador

logger = obtener_logger(__name__)

# Lookahead days
MANTENIMIENTO_LOOKAHEAD = 7
CONTRATO_LOOKAHEAD = 30
CERTIFICACION_LOOKAHEAD = 30


class ServicioCron:
    """Servicio para tareas periódicas del sistema."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _crear_notificacion(
        self,
        usuario_id: int,
        tipo: str,
        titulo: str,
        mensaje: str,
        url: str | None = None,
    ) -> None:
        """Helper: crear una notificación interna."""
        notif = Notificacion(
            usuario_id=usuario_id,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            url=url,
        )
        self.db.add(notif)

    async def verificar_mantenimiento_proximo(self) -> int:
        """Verificar mantenimientos próximos (7 días lookahead).

        Returns: number of notifications created.
        """
        hoy = date.today()
        limite = hoy + timedelta(days=MANTENIMIENTO_LOOKAHEAD)

        resultado = await self.db.execute(
            select(ProgramaMantenimiento).where(
                ProgramaMantenimiento.fecha_programada.between(hoy, limite),
                ProgramaMantenimiento.estado == "PROGRAMADO",
            )
        )
        programas = list(resultado.scalars().all())

        count = 0
        for prog in programas:
            await self._crear_notificacion(
                usuario_id=1,  # Admin notification
                tipo="MAINTENANCE_DUE",
                titulo=f"Mantenimiento próximo - {prog.tipo_mantenimiento}",
                mensaje=(
                    f"El mantenimiento '{prog.tipo_mantenimiento}' está programado "
                    f"para el {prog.fecha_programada}."
                ),
                url=f"/equipment/{prog.equipo_id}/maintenance",
            )
            count += 1

        if count > 0:
            await self.db.commit()
        logger.info("cron_mantenimiento_verificado", notificaciones=count)
        return count

    async def verificar_contratos_vencimiento(self) -> int:
        """Verificar contratos por vencer (30 días lookahead).

        Returns: number of notifications created.
        """
        hoy = date.today()
        limite = hoy + timedelta(days=CONTRATO_LOOKAHEAD)

        resultado = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.fecha_fin.between(hoy, limite),
                ContratoAdenda.estado.in_(["ACTIVO", "VENCIDO"]),
            )
        )
        contratos = list(resultado.scalars().all())

        count = 0
        for contrato in contratos:
            dias_restantes = (contrato.fecha_fin - hoy).days if contrato.fecha_fin else 0
            await self._crear_notificacion(
                usuario_id=1,
                tipo="CONTRACT_EXPIRY",
                titulo=f"Contrato por vencer - {contrato.codigo}",
                mensaje=(
                    f"El contrato '{contrato.codigo}' vence en {dias_restantes} días "
                    f"({contrato.fecha_fin})."
                ),
                url=f"/contracts/{contrato.id}",
            )
            count += 1

        if count > 0:
            await self.db.commit()
        logger.info("cron_contratos_verificados", notificaciones=count)
        return count

    async def verificar_certificaciones_vencidas(self) -> int:
        """Verificar certificaciones de operadores por vencer (30 días lookahead).

        Returns: number of notifications created.
        """
        hoy = date.today()
        limite = hoy + timedelta(days=CERTIFICACION_LOOKAHEAD)

        resultado = await self.db.execute(
            select(CertificacionOperador).where(
                CertificacionOperador.fecha_vencimiento.between(hoy, limite),
                CertificacionOperador.estado == "VIGENTE",
            )
        )
        certificaciones = list(resultado.scalars().all())

        count = 0
        for cert in certificaciones:
            dias_restantes = (cert.fecha_vencimiento - hoy).days if cert.fecha_vencimiento else 0
            await self._crear_notificacion(
                usuario_id=1,
                tipo="warning",
                titulo=f"Certificación por vencer - {cert.nombre_certificacion}",
                mensaje=(
                    f"La certificación '{cert.nombre_certificacion}' del trabajador "
                    f"ID {cert.trabajador_id} vence en {dias_restantes} días."
                ),
                url=f"/operators/{cert.trabajador_id}",
            )
            count += 1

        if count > 0:
            await self.db.commit()
        logger.info("cron_certificaciones_verificadas", notificaciones=count)
        return count
