"""Servicio para obligaciones de contratos.

Obligaciones del arrendador (cláusula 7) y arrendatario (cláusula 8).
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.contrato import (
    TIPOS_DOCUMENTO_REQUERIDO,
    TIPOS_OBLIGACION_ARRENDADOR,
    TIPOS_OBLIGACION_ARRENDATARIO,
    ContratoAnexoDto,
    ContratoDocumentoRequeridoDto,
    ContratoObligacionArrendatarioDto,
    ContratoObligacionDto,
)
from app.modelos.equipo import (
    ContratoAdenda,
    ContratoAnexo,
    ContratoDocumentoRequerido,
    ContratoObligacion,
    ContratoObligacionArrendatario,
)

logger = obtener_logger(__name__)


def _obligacion_a_dto(o: ContratoObligacion) -> ContratoObligacionDto:
    return ContratoObligacionDto(
        id=o.id,
        contrato_id=o.contrato_id,
        tipo_obligacion=o.tipo_obligacion,
        estado=o.estado,
        fecha_compromiso=o.fecha_compromiso,
        observaciones=o.observaciones,
    )


def _obligacion_arrendatario_a_dto(
    o: ContratoObligacionArrendatario,
) -> ContratoObligacionArrendatarioDto:
    return ContratoObligacionArrendatarioDto(
        id=o.id,
        contrato_id=o.contrato_id,
        tipo_obligacion=o.tipo_obligacion,
        estado=o.estado,
        fecha_compromiso=o.fecha_compromiso,
        observaciones=o.observaciones,
    )


def _anexo_a_dto(a: ContratoAnexo) -> ContratoAnexoDto:
    return ContratoAnexoDto(
        id=a.id,
        contrato_id=a.contrato_id,
        tipo_anexo=a.tipo_anexo,
        orden=a.orden,
        concepto=a.concepto,
        incluido=a.incluido,
        observaciones=a.observaciones,
    )


def _doc_a_dto(d: ContratoDocumentoRequerido) -> ContratoDocumentoRequeridoDto:
    return ContratoDocumentoRequeridoDto(
        id=d.id,
        contrato_id=d.contrato_id,
        tipo_documento=d.tipo_documento,
        provider_document_id=d.provider_document_id,
        estado=d.estado,
        fecha_vencimiento=d.fecha_vencimiento,
        observaciones=d.observaciones,
    )


class ServicioObligaciones:
    """Servicio para obligaciones, anexos y documentos requeridos."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def _verificar_contrato(self, tenant_id: int, contrato_id: int) -> ContratoAdenda:
        """Verify contract exists and belongs to tenant."""
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

    # ─── Obligaciones del Arrendador (cláusula 7) ───────────────────────

    async def listar_obligaciones(
        self, tenant_id: int, contrato_id: int
    ) -> list[ContratoObligacionDto]:
        await self._verificar_contrato(tenant_id, contrato_id)
        result = await self.db.execute(
            select(ContratoObligacion)
            .where(ContratoObligacion.contrato_id == contrato_id)
            .order_by(ContratoObligacion.tipo_obligacion.asc())
        )
        return [_obligacion_a_dto(o) for o in result.scalars().all()]

    async def inicializar_obligaciones(
        self, tenant_id: int, contrato_id: int
    ) -> list[ContratoObligacionDto]:
        """Inicializar obligaciones del arrendador. Idempotente."""
        await self._verificar_contrato(tenant_id, contrato_id)

        existing = await self.db.execute(
            select(ContratoObligacion).where(ContratoObligacion.contrato_id == contrato_id)
        )
        items = list(existing.scalars().all())
        if items:
            return [_obligacion_a_dto(o) for o in items]

        for tipo in TIPOS_OBLIGACION_ARRENDADOR:
            self.db.add(ContratoObligacion(
                contrato_id=contrato_id,
                tipo_obligacion=tipo,
                estado="PENDIENTE",
            ))
        await self.db.commit()

        result = await self.db.execute(
            select(ContratoObligacion)
            .where(ContratoObligacion.contrato_id == contrato_id)
            .order_by(ContratoObligacion.tipo_obligacion.asc())
        )
        items = list(result.scalars().all())
        logger.info("obligaciones_inicializadas", contrato_id=contrato_id, count=len(items))
        return [_obligacion_a_dto(o) for o in items]

    async def actualizar_obligacion(
        self,
        tenant_id: int,
        obligacion_id: int,
        *,
        estado: str | None = None,
        fecha_compromiso: object = None,
        observaciones: str | None = None,
    ) -> ContratoObligacionDto:
        result = await self.db.execute(
            select(ContratoObligacion).where(ContratoObligacion.id == obligacion_id)
        )
        item = result.scalars().first()
        if not item:
            raise NoEncontradoError("ContratoObligacion", obligacion_id)

        await self._verificar_contrato(tenant_id, item.contrato_id)

        if estado is not None:
            item.estado = estado
        if fecha_compromiso is not None:
            item.fecha_compromiso = fecha_compromiso  # type: ignore[assignment]
        if observaciones is not None:
            item.observaciones = observaciones

        await self.db.commit()
        await self.db.refresh(item)
        logger.info("obligacion_actualizada", id=obligacion_id, estado=item.estado)
        return _obligacion_a_dto(item)

    # ─── Obligaciones del Arrendatario (cláusula 8) ─────────────────────

    async def listar_obligaciones_arrendatario(
        self, tenant_id: int, contrato_id: int
    ) -> list[ContratoObligacionArrendatarioDto]:
        await self._verificar_contrato(tenant_id, contrato_id)
        result = await self.db.execute(
            select(ContratoObligacionArrendatario)
            .where(ContratoObligacionArrendatario.contrato_id == contrato_id)
            .order_by(ContratoObligacionArrendatario.tipo_obligacion.asc())
        )
        return [_obligacion_arrendatario_a_dto(o) for o in result.scalars().all()]

    async def inicializar_obligaciones_arrendatario(
        self, tenant_id: int, contrato_id: int
    ) -> list[ContratoObligacionArrendatarioDto]:
        """Inicializar obligaciones del arrendatario. Idempotente."""
        await self._verificar_contrato(tenant_id, contrato_id)

        existing = await self.db.execute(
            select(ContratoObligacionArrendatario)
            .where(ContratoObligacionArrendatario.contrato_id == contrato_id)
        )
        items = list(existing.scalars().all())
        if items:
            return [_obligacion_arrendatario_a_dto(o) for o in items]

        for tipo in TIPOS_OBLIGACION_ARRENDATARIO:
            self.db.add(ContratoObligacionArrendatario(
                contrato_id=contrato_id,
                tipo_obligacion=tipo,
                estado="PENDIENTE",
            ))
        await self.db.commit()

        result = await self.db.execute(
            select(ContratoObligacionArrendatario)
            .where(ContratoObligacionArrendatario.contrato_id == contrato_id)
            .order_by(ContratoObligacionArrendatario.tipo_obligacion.asc())
        )
        items = list(result.scalars().all())
        logger.info(
            "obligaciones_arrendatario_inicializadas", contrato_id=contrato_id, count=len(items),
        )
        return [_obligacion_arrendatario_a_dto(o) for o in items]

    async def actualizar_obligacion_arrendatario(
        self,
        tenant_id: int,
        obligacion_id: int,
        *,
        estado: str | None = None,
        fecha_compromiso: object = None,
        observaciones: str | None = None,
    ) -> ContratoObligacionArrendatarioDto:
        result = await self.db.execute(
            select(ContratoObligacionArrendatario)
            .where(ContratoObligacionArrendatario.id == obligacion_id)
        )
        item = result.scalars().first()
        if not item:
            raise NoEncontradoError("ContratoObligacionArrendatario", obligacion_id)

        await self._verificar_contrato(tenant_id, item.contrato_id)

        if estado is not None:
            item.estado = estado
        if fecha_compromiso is not None:
            item.fecha_compromiso = fecha_compromiso  # type: ignore[assignment]
        if observaciones is not None:
            item.observaciones = observaciones

        await self.db.commit()
        await self.db.refresh(item)
        logger.info("obligacion_arrendatario_actualizada", id=obligacion_id, estado=item.estado)
        return _obligacion_arrendatario_a_dto(item)

    # ─── Anexos ─────────────────────────────────────────────────────────

    async def listar_anexos(
        self, tenant_id: int, contrato_id: int, tipo_anexo: str | None = None
    ) -> list[ContratoAnexoDto]:
        await self._verificar_contrato(tenant_id, contrato_id)
        stmt = (
            select(ContratoAnexo)
            .where(ContratoAnexo.contrato_id == contrato_id)
        )
        if tipo_anexo:
            stmt = stmt.where(ContratoAnexo.tipo_anexo == tipo_anexo)
        stmt = stmt.order_by(ContratoAnexo.tipo_anexo.asc(), ContratoAnexo.orden.asc())

        result = await self.db.execute(stmt)
        return [_anexo_a_dto(a) for a in result.scalars().all()]

    async def guardar_anexos(
        self,
        tenant_id: int,
        contrato_id: int,
        tipo_anexo: str,
        items: list[dict[str, object]],
    ) -> list[ContratoAnexoDto]:
        """Replace all annexes of given type with new items."""
        await self._verificar_contrato(tenant_id, contrato_id)

        # Delete existing
        existing = await self.db.execute(
            select(ContratoAnexo).where(
                ContratoAnexo.contrato_id == contrato_id,
                ContratoAnexo.tipo_anexo == tipo_anexo,
            )
        )
        for a in existing.scalars().all():
            await self.db.delete(a)

        # Create new
        for idx, item in enumerate(items):
            self.db.add(ContratoAnexo(
                contrato_id=contrato_id,
                tipo_anexo=tipo_anexo,
                orden=idx + 1,
                concepto=str(item.get("concepto", "")),
                incluido=bool(item.get("incluido", False)),
                observaciones=str(item["observaciones"]) if item.get("observaciones") else None,
            ))

        await self.db.commit()

        result = await self.db.execute(
            select(ContratoAnexo)
            .where(
                ContratoAnexo.contrato_id == contrato_id,
                ContratoAnexo.tipo_anexo == tipo_anexo,
            )
            .order_by(ContratoAnexo.orden.asc())
        )
        saved = list(result.scalars().all())
        logger.info("anexos_guardados", contrato_id=contrato_id, tipo=tipo_anexo, count=len(saved))
        return [_anexo_a_dto(a) for a in saved]

    # ─── Documentos requeridos ──────────────────────────────────────────

    async def listar_documentos_requeridos(
        self, tenant_id: int, contrato_id: int
    ) -> list[ContratoDocumentoRequeridoDto]:
        await self._verificar_contrato(tenant_id, contrato_id)
        result = await self.db.execute(
            select(ContratoDocumentoRequerido)
            .where(ContratoDocumentoRequerido.contrato_id == contrato_id)
            .order_by(ContratoDocumentoRequerido.tipo_documento.asc())
        )
        return [_doc_a_dto(d) for d in result.scalars().all()]

    async def inicializar_documentos_requeridos(
        self, tenant_id: int, contrato_id: int
    ) -> list[ContratoDocumentoRequeridoDto]:
        """Inicializar documentos requeridos. Idempotente."""
        await self._verificar_contrato(tenant_id, contrato_id)

        existing = await self.db.execute(
            select(ContratoDocumentoRequerido)
            .where(ContratoDocumentoRequerido.contrato_id == contrato_id)
        )
        items = list(existing.scalars().all())
        if items:
            return [_doc_a_dto(d) for d in items]

        for tipo in TIPOS_DOCUMENTO_REQUERIDO:
            self.db.add(ContratoDocumentoRequerido(
                contrato_id=contrato_id,
                tipo_documento=tipo,
                estado="PENDIENTE",
            ))
        await self.db.commit()

        result = await self.db.execute(
            select(ContratoDocumentoRequerido)
            .where(ContratoDocumentoRequerido.contrato_id == contrato_id)
            .order_by(ContratoDocumentoRequerido.tipo_documento.asc())
        )
        items = list(result.scalars().all())
        logger.info(
            "documentos_requeridos_inicializados", contrato_id=contrato_id, count=len(items),
        )
        return [_doc_a_dto(d) for d in items]

    async def actualizar_documento_requerido(
        self,
        tenant_id: int,
        doc_id: int,
        *,
        provider_document_id: int | None = None,
        estado: str | None = None,
        fecha_vencimiento: object = None,
        observaciones: str | None = None,
    ) -> ContratoDocumentoRequeridoDto:
        result = await self.db.execute(
            select(ContratoDocumentoRequerido)
            .where(ContratoDocumentoRequerido.id == doc_id)
        )
        item = result.scalars().first()
        if not item:
            raise NoEncontradoError("ContratoDocumentoRequerido", doc_id)

        await self._verificar_contrato(tenant_id, item.contrato_id)

        if provider_document_id is not None:
            item.provider_document_id = provider_document_id
        if estado is not None:
            item.estado = estado
        if fecha_vencimiento is not None:
            item.fecha_vencimiento = fecha_vencimiento  # type: ignore[assignment]
        if observaciones is not None:
            item.observaciones = observaciones

        await self.db.commit()
        await self.db.refresh(item)
        logger.info("documento_requerido_actualizado", id=doc_id, estado=item.estado)
        return _doc_a_dto(item)
