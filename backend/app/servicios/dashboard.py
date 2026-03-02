"""Servicio para dashboard.
"""

from datetime import date, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.esquemas.dashboard import AlertaDocumentoDto, DashboardEstadisticasDto, ModuloUsuarioDto
from app.modelos.equipo import ContratoAdenda, Equipo, ParteDiario, ValorizacionEquipo

logger = obtener_logger(__name__)

# Módulos disponibles por rol
_MODULOS = [
    ModuloUsuarioDto(
        nombre="Equipos",
        ruta="/equipment",
        icono="truck",
        descripcion="Gestión de equipos y maquinaria",
    ),
    ModuloUsuarioDto(
        nombre="Contratos",
        ruta="/contracts",
        icono="file-text",
        descripcion="Contratos de alquiler",
    ),
    ModuloUsuarioDto(
        nombre="Valorizaciones",
        ruta="/valuations",
        icono="calculator",
        descripcion="Valorizaciones de equipos",
    ),
    ModuloUsuarioDto(
        nombre="Operadores",
        ruta="/operators",
        icono="users",
        descripcion="Gestión de operadores",
    ),
    ModuloUsuarioDto(
        nombre="Reportes",
        ruta="/reports",
        icono="clipboard",
        descripcion="Partes diarios",
    ),
]

_MODULOS_ADMIN = [
    *_MODULOS,
    ModuloUsuarioDto(
        nombre="Analítica",
        ruta="/analytics",
        icono="bar-chart",
        descripcion="Dashboard analítico",
    ),
    ModuloUsuarioDto(
        nombre="Proveedores",
        ruta="/providers",
        icono="briefcase",
        descripcion="Gestión de proveedores",
    ),
]

_ROLES_ADMIN = {"ADMIN", "ADMIN_SISTEMA", "DIRECTOR"}


class ServicioDashboard:
    """Servicio para datos del dashboard."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def obtener_estadisticas(self, tenant_id: int) -> DashboardEstadisticasDto:
        """Obtener estadísticas principales del dashboard."""
        # Total equipos activos
        r1 = await self.db.execute(
            select(func.count(Equipo.id)).where(
                Equipo.tenant_id == tenant_id, Equipo.is_active.is_(True)
            )
        )
        total_equipos: int = r1.scalar_one()

        # Contratos activos
        r2 = await self.db.execute(
            select(func.count(ContratoAdenda.id)).where(
                ContratoAdenda.tenant_id == tenant_id, ContratoAdenda.estado == "VIGENTE"
            )
        )
        contratos_activos: int = r2.scalar_one()

        # Valorizaciones pendientes
        r3 = await self.db.execute(
            select(func.count(ValorizacionEquipo.id)).where(
                ValorizacionEquipo.tenant_id == tenant_id,
                ValorizacionEquipo.estado.in_(["BORRADOR", "PENDIENTE", "EN_REVISION"]),
            )
        )
        valorizaciones_pendientes: int = r3.scalar_one()

        # Pagos pendientes (total aprobado menos pagado)
        r4 = await self.db.execute(
            select(func.coalesce(func.sum(ValorizacionEquipo.total_con_igv), 0)).where(
                ValorizacionEquipo.tenant_id == tenant_id,
                ValorizacionEquipo.estado == "APROBADO",
            )
        )
        pagos_pendientes_raw: Any = r4.scalar_one()
        pagos_pendientes = float(pagos_pendientes_raw) if pagos_pendientes_raw else 0.0

        # Reportes de hoy
        hoy = date.today()
        r5 = await self.db.execute(
            select(func.count(ParteDiario.id)).where(
                ParteDiario.tenant_id == tenant_id, ParteDiario.fecha == hoy
            )
        )
        reportes_hoy: int = r5.scalar_one()

        logger.info("dashboard_stats", tenant_id=tenant_id)
        return DashboardEstadisticasDto(
            total_equipos=total_equipos,
            contratos_activos=contratos_activos,
            valorizaciones_pendientes=valorizaciones_pendientes,
            pagos_pendientes=pagos_pendientes,
            reportes_hoy=reportes_hoy,
        )

    async def obtener_alertas_documentos(
        self, tenant_id: int, dias_anticipacion: int = 30
    ) -> list[AlertaDocumentoDto]:
        """Obtener alertas de documentos por vencer."""
        hoy = date.today()
        limite = hoy + timedelta(days=dias_anticipacion)

        resultado = await self.db.execute(
            select(
                Equipo.id,
                Equipo.codigo_equipo,
                Equipo.fecha_venc_poliza,
                Equipo.fecha_venc_soat,
                Equipo.fecha_venc_citv,
            ).where(Equipo.tenant_id == tenant_id, Equipo.is_active.is_(True))
        )

        alertas: list[AlertaDocumentoDto] = []
        for row in resultado.all():
            eq_id, codigo_equipo, poliza, soat, citv = row
            docs = [
                ("Póliza TREC", poliza),
                ("SOAT", soat),
                ("CITV", citv),
            ]
            for tipo_doc, fecha_venc in docs:
                if fecha_venc and fecha_venc <= limite:
                    dias = (fecha_venc - hoy).days
                    alertas.append(
                        AlertaDocumentoDto(
                            equipo_id=eq_id,
                            codigo=codigo_equipo,
                            tipo_documento=tipo_doc,
                            fecha_vencimiento=fecha_venc.isoformat(),
                            dias_restantes=dias,
                        )
                    )

        alertas.sort(key=lambda a: a.dias_restantes)
        logger.info("alertas_documentos", tenant_id=tenant_id, total=len(alertas))
        return alertas

    def obtener_modulos_usuario(self, rol: str) -> list[ModuloUsuarioDto]:
        """Obtener módulos accesibles según el rol del usuario."""
        if rol.upper() in _ROLES_ADMIN:
            return _MODULOS_ADMIN
        return _MODULOS
