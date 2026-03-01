"""Servicio para legalización notarial de contratos.

4 pasos secuenciales: PENDIENTE_FIRMA_PROVEEDOR → EN_ENVIO_LIMA →
PENDIENTE_FIRMA_LEGAL → LEGALIZADO.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import (
    ConflictoError,
    NoEncontradoError,
    ReglaDeNegocioError,
)
from app.esquemas.contrato import (
    LEGALIZACION_PASOS,
    ContratoLegalizacionPasoDto,
)
from app.modelos.equipo import ContratoAdenda, ContratoLegalizacionPaso

logger = obtener_logger(__name__)


def _paso_a_dto(p: ContratoLegalizacionPaso) -> ContratoLegalizacionPasoDto:
    return ContratoLegalizacionPasoDto(
        id=p.id,
        contrato_id=p.contrato_id,
        numero_paso=p.numero_paso,
        tipo_paso=p.tipo_paso,
        completado=p.completado,
        fecha_completado=p.fecha_completado,
        completado_por=p.completado_por,
        observaciones=p.observaciones,
    )


class ServicioLegalizacion:
    """Servicio para flujo de legalización notarial."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _verificar_contrato(self, tenant_id: int, contrato_id: int) -> ContratoAdenda:
        result = await self.db.execute(
            select(ContratoAdenda).where(
                ContratoAdenda.id == contrato_id,
                ContratoAdenda.tenant_id == tenant_id,
            )
        )
        contrato = result.scalars().first()
        if not contrato:
            raise NoEncontradoError("Contrato", contrato_id)
        return contrato

    async def obtener_legalizacion(
        self, tenant_id: int, contrato_id: int
    ) -> list[ContratoLegalizacionPasoDto]:
        """Obtener pasos de legalización de un contrato."""
        await self._verificar_contrato(tenant_id, contrato_id)
        result = await self.db.execute(
            select(ContratoLegalizacionPaso)
            .where(ContratoLegalizacionPaso.contrato_id == contrato_id)
            .order_by(ContratoLegalizacionPaso.numero_paso.asc())
        )
        return [_paso_a_dto(p) for p in result.scalars().all()]

    async def iniciar_legalizacion(
        self, tenant_id: int, contrato_id: int, usuario_id: int
    ) -> list[ContratoLegalizacionPasoDto]:
        """Iniciar legalización (idempotente)."""
        contrato = await self._verificar_contrato(tenant_id, contrato_id)

        if contrato.estado not in ("ACTIVO", "BORRADOR"):
            raise ReglaDeNegocioError(
                f"No se puede iniciar legalización en estado {contrato.estado}. "
                "Solo contratos ACTIVO o BORRADOR."
            )

        # Check if already initialized
        existing = await self.db.execute(
            select(ContratoLegalizacionPaso)
            .where(ContratoLegalizacionPaso.contrato_id == contrato_id)
        )
        items = list(existing.scalars().all())
        if items:
            items.sort(key=lambda p: p.numero_paso)
            return [_paso_a_dto(p) for p in items]

        # Create 4 steps
        _ = usuario_id  # Reserved for audit
        for paso_def in LEGALIZACION_PASOS:
            self.db.add(ContratoLegalizacionPaso(
                contrato_id=contrato_id,
                numero_paso=paso_def["numero"],
                tipo_paso=paso_def["tipo"],
                completado=False,
                tenant_id=tenant_id,
            ))
        await self.db.commit()

        result = await self.db.execute(
            select(ContratoLegalizacionPaso)
            .where(ContratoLegalizacionPaso.contrato_id == contrato_id)
            .order_by(ContratoLegalizacionPaso.numero_paso.asc())
        )
        pasos = list(result.scalars().all())
        logger.info("legalizacion_iniciada", contrato_id=contrato_id, pasos=len(pasos))
        return [_paso_a_dto(p) for p in pasos]

    async def completar_paso(
        self,
        tenant_id: int,
        contrato_id: int,
        numero_paso: int,
        *,
        usuario_id: int,
        observaciones: str | None = None,
    ) -> list[ContratoLegalizacionPasoDto]:
        """Completar un paso de legalización (debe ser en orden)."""
        await self._verificar_contrato(tenant_id, contrato_id)

        result = await self.db.execute(
            select(ContratoLegalizacionPaso)
            .where(ContratoLegalizacionPaso.contrato_id == contrato_id)
            .order_by(ContratoLegalizacionPaso.numero_paso.asc())
        )
        pasos = list(result.scalars().all())

        if not pasos:
            raise ReglaDeNegocioError(
                "La legalización no ha sido iniciada. "
                "Use el botón 'Iniciar Legalización' primero."
            )

        paso = next((p for p in pasos if p.numero_paso == numero_paso), None)
        if not paso:
            raise NoEncontradoError("PasoLegalizacion", numero_paso)

        if paso.completado:
            raise ConflictoError(f"El paso {numero_paso} ya fue completado.")

        # Must be in order
        previous_incomplete = next(
            (p for p in pasos if p.numero_paso < numero_paso and not p.completado),
            None,
        )
        if previous_incomplete:
            raise ReglaDeNegocioError(
                f"Debe completar el paso {previous_incomplete.numero_paso} antes de continuar."
            )

        from datetime import UTC, datetime

        paso.completado = True
        paso.fecha_completado = datetime.now(tz=UTC).replace(tzinfo=None)
        paso.completado_por = usuario_id
        if observaciones:
            paso.observaciones = observaciones

        await self.db.commit()

        # Return all steps refreshed
        result = await self.db.execute(
            select(ContratoLegalizacionPaso)
            .where(ContratoLegalizacionPaso.contrato_id == contrato_id)
            .order_by(ContratoLegalizacionPaso.numero_paso.asc())
        )
        pasos = list(result.scalars().all())
        logger.info("paso_legalizacion_completado", contrato_id=contrato_id, paso=numero_paso)
        return [_paso_a_dto(p) for p in pasos]

    async def revertir_paso(
        self,
        tenant_id: int,
        contrato_id: int,
        numero_paso: int,
        usuario_id: int,
    ) -> list[ContratoLegalizacionPasoDto]:
        """Revertir un paso (solo el último completado)."""
        await self._verificar_contrato(tenant_id, contrato_id)
        _ = usuario_id  # For audit logging

        result = await self.db.execute(
            select(ContratoLegalizacionPaso)
            .where(ContratoLegalizacionPaso.contrato_id == contrato_id)
            .order_by(ContratoLegalizacionPaso.numero_paso.asc())
        )
        pasos = list(result.scalars().all())

        paso = next((p for p in pasos if p.numero_paso == numero_paso), None)
        if not paso:
            raise NoEncontradoError("PasoLegalizacion", numero_paso)

        if not paso.completado:
            raise ConflictoError(f"El paso {numero_paso} aún no ha sido completado.")

        # Can only undo the last completed step
        later_completed = next(
            (p for p in pasos if p.numero_paso > numero_paso and p.completado),
            None,
        )
        if later_completed:
            raise ReglaDeNegocioError(
                f"No se puede revertir el paso {numero_paso}. "
                f"Debe revertir primero el paso {later_completed.numero_paso}."
            )

        paso.completado = False
        paso.fecha_completado = None
        paso.completado_por = None
        paso.observaciones = None

        await self.db.commit()

        result = await self.db.execute(
            select(ContratoLegalizacionPaso)
            .where(ContratoLegalizacionPaso.contrato_id == contrato_id)
            .order_by(ContratoLegalizacionPaso.numero_paso.asc())
        )
        pasos = list(result.scalars().all())
        logger.info("paso_legalizacion_revertido", contrato_id=contrato_id, paso=numero_paso)
        return [_paso_a_dto(p) for p in pasos]
