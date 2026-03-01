"""Servicio para documentos SIG.

Replica SIGService del BFF Node.js.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.documento_sig import (
    DocumentoSigActualizar,
    DocumentoSigCrear,
    DocumentoSigDetalleDto,
    DocumentoSigListaDto,
)
from app.modelos.sig import DocumentoSig

logger = obtener_logger(__name__)


def _fecha_str(val: date | None) -> str | None:
    return val.isoformat() if val else None


def _a_lista_dto(e: DocumentoSig) -> DocumentoSigListaDto:
    return DocumentoSigListaDto(
        id=e.id,
        codigo=e.codigo,
        titulo=e.titulo,
        tipo_documento=e.tipo_documento,
        iso_standard=e.iso_standard,
        version=e.version,
        estado=e.estado,
        created_at=e.created_at.isoformat(),
    )


def _a_detalle_dto(e: DocumentoSig) -> DocumentoSigDetalleDto:
    return DocumentoSigDetalleDto(
        id=e.id,
        codigo=e.codigo,
        titulo=e.titulo,
        tipo_documento=e.tipo_documento,
        iso_standard=e.iso_standard,
        version=e.version,
        fecha_emision=_fecha_str(e.fecha_emision),
        fecha_revision=_fecha_str(e.fecha_revision),
        archivo_url=e.archivo_url,
        estado=e.estado,
        creado_por=e.creado_por,
        created_at=e.created_at.isoformat(),
        updated_at=e.updated_at.isoformat(),
    )


def _parse_date(val: str | None) -> date | None:
    if not val:
        return None
    return date.fromisoformat(val)


class ServicioDocumentoSig:
    """Servicio para gestión de documentos SIG."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def listar(
        self,
        *,
        tipo_documento: str | None = None,
        estado: str | None = None,
        busqueda: str | None = None,
        pagina: int = 1,
        limite: int = 20,
    ) -> tuple[list[DocumentoSigListaDto], int]:
        """Listar documentos con filtros y paginación."""
        consulta = select(DocumentoSig)

        if tipo_documento:
            consulta = consulta.where(DocumentoSig.tipo_documento == tipo_documento)
        if estado:
            consulta = consulta.where(DocumentoSig.estado == estado)
        if busqueda:
            patron = f"%{busqueda}%"
            consulta = consulta.where(
                DocumentoSig.titulo.ilike(patron) | DocumentoSig.codigo.ilike(patron)
            )

        consulta_conteo = select(func.count()).select_from(consulta.subquery())
        resultado_conteo = await self.db.execute(consulta_conteo)
        total: int = resultado_conteo.scalar_one()

        consulta = consulta.order_by(DocumentoSig.created_at.desc())
        offset = (pagina - 1) * limite
        consulta = consulta.offset(offset).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())

        logger.info("documentos_sig_listados", total=total)
        return [_a_lista_dto(e) for e in entidades], total

    async def obtener_por_id(self, documento_id: int) -> DocumentoSigDetalleDto:
        """Obtener documento por ID."""
        resultado = await self.db.execute(
            select(DocumentoSig).where(DocumentoSig.id == documento_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Documento SIG", documento_id)
        return _a_detalle_dto(entidad)

    async def crear(
        self, datos: DocumentoSigCrear, usuario_id: int
    ) -> DocumentoSigDetalleDto:
        """Crear un nuevo documento."""
        # Verificar código único
        existente = await self.db.execute(
            select(DocumentoSig).where(DocumentoSig.codigo == datos.codigo)
        )
        if existente.scalars().first():
            raise ConflictoError(f"Ya existe un documento con código '{datos.codigo}'")

        entidad = DocumentoSig(
            codigo=datos.codigo,
            titulo=datos.titulo,
            tipo_documento=datos.tipo_documento,
            iso_standard=datos.iso_standard,
            version=datos.version,
            fecha_emision=_parse_date(datos.fecha_emision),
            fecha_revision=_parse_date(datos.fecha_revision),
            archivo_url=datos.archivo_url,
            creado_por=usuario_id,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("documento_sig_creado", id=entidad.id)
        return _a_detalle_dto(entidad)

    async def actualizar(
        self, documento_id: int, datos: DocumentoSigActualizar
    ) -> DocumentoSigDetalleDto:
        """Actualizar un documento existente."""
        resultado = await self.db.execute(
            select(DocumentoSig).where(DocumentoSig.id == documento_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Documento SIG", documento_id)

        campos = datos.model_dump(exclude_unset=True)
        for campo, valor in campos.items():
            if campo in ("fecha_emision", "fecha_revision"):
                setattr(entidad, campo, _parse_date(valor))
            else:
                setattr(entidad, campo, valor)

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("documento_sig_actualizado", id=documento_id)
        return _a_detalle_dto(entidad)

    async def eliminar(self, documento_id: int) -> None:
        """Eliminar un documento (hard delete)."""
        resultado = await self.db.execute(
            select(DocumentoSig).where(DocumentoSig.id == documento_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("Documento SIG", documento_id)

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("documento_sig_eliminado", id=documento_id)
