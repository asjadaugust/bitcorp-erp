"""Servicio para proveedores."""

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.proveedor import (
    ContactoActualizar,
    ContactoCrear,
    ContactoProveedorDto,
    DocumentoActualizar,
    DocumentoCrear,
    DocumentoProveedorDto,
    InfoFinancieraActualizar,
    InfoFinancieraCrear,
    InfoFinancieraDto,
    LogProveedorDto,
    ProveedorActualizar,
    ProveedorCrear,
    ProveedorDetalleDto,
    ProveedorListaDto,
)
from app.modelos.proveedores import (
    ContactoProveedor,
    DocumentoProveedor,
    InfoFinancieraProveedor,
    LogProveedor,
    Proveedor,
)

logger = obtener_logger(__name__)


# ─── Mappers: DB (English columns) → DTO (Spanish fields) ───────────────


def _a_lista_dto(p: Proveedor) -> ProveedorListaDto:
    return ProveedorListaDto(
        id=p.id, ruc=p.ruc, razon_social=p.razon_social,
        nombre_comercial=p.nombre_comercial, tipo_proveedor=p.tipo_proveedor,
        telefono=p.telefono, correo_electronico=p.correo_electronico, is_active=p.is_active,
    )


def _a_detalle_dto(p: Proveedor) -> ProveedorDetalleDto:
    return ProveedorDetalleDto(
        id=p.id, ruc=p.ruc, razon_social=p.razon_social,
        nombre_comercial=p.nombre_comercial, tipo_proveedor=p.tipo_proveedor,
        telefono=p.telefono, correo_electronico=p.correo_electronico, is_active=p.is_active,
        legacy_id=p.legacy_id, direccion=p.direccion,
        estado_contribuyente=p.estado_contribuyente,
        condicion_contribuyente=p.condicion_contribuyente,
        created_at=p.created_at, updated_at=p.updated_at,
    )


def _a_contacto_dto(c: ContactoProveedor) -> ContactoProveedorDto:
    return ContactoProveedorDto(
        id=c.id,
        proveedor_id=c.provider_id,
        nombre_contacto=c.contact_name,
        cargo=c.position,
        telefono_principal=c.primary_phone,
        telefono_secundario=c.secondary_phone,
        correo=c.email,
        correo_secundario=c.secondary_email,
        tipo_contacto=c.contact_type,
        es_principal=c.is_primary,
        estado=c.status,
    )


def _a_financiera_dto(f: InfoFinancieraProveedor) -> InfoFinancieraDto:
    return InfoFinancieraDto(
        id=f.id,
        proveedor_id=f.provider_id,
        nombre_banco=f.bank_name,
        numero_cuenta=f.account_number,
        cci=f.cci,
        nombre_titular=f.account_holder_name,
        tipo_cuenta=f.account_type,
        moneda=f.currency,
        es_principal=f.is_primary,
        estado=f.status,
    )


def _a_documento_dto(d: DocumentoProveedor) -> DocumentoProveedorDto:
    return DocumentoProveedorDto(
        id=d.id,
        proveedor_id=d.proveedor_id,
        tipo_documento=d.tipo_documento,
        numero_documento=d.numero_documento,
        fecha_emision=d.fecha_emision,
        fecha_vencimiento=d.fecha_vencimiento,
        archivo_url=d.archivo_url,
        observaciones=d.observaciones,
        created_at=d.created_at,
        updated_at=d.updated_at,
    )


def _a_log_dto(log: LogProveedor, nombre_usuario: str | None = None) -> LogProveedorDto:
    return LogProveedorDto(
        id=log.id,
        proveedor_id=log.proveedor_id,
        accion=log.accion,
        campo=log.campo,
        valor_anterior=log.valor_anterior,
        valor_nuevo=log.valor_nuevo,
        observaciones=log.observaciones,
        usuario_id=log.usuario_id,
        nombre_usuario=nombre_usuario,
        created_at=log.created_at,
    )


# ─── Spanish input → English DB column mapping ──────────────────────────

_CONTACTO_MAP = {
    "nombre_contacto": "contact_name",
    "cargo": "position",
    "telefono_principal": "primary_phone",
    "telefono_secundario": "secondary_phone",
    "correo": "email",
    "correo_secundario": "secondary_email",
    "tipo_contacto": "contact_type",
    "es_principal": "is_primary",
}

_FINANCIERA_MAP = {
    "nombre_banco": "bank_name",
    "numero_cuenta": "account_number",
    "cci": "cci",
    "nombre_titular": "account_holder_name",
    "tipo_cuenta": "account_type",
    "moneda": "currency",
    "es_principal": "is_primary",
}


def _traducir_campos(datos: dict, mapa: dict) -> dict:
    """Traduce campos españoles del DTO a nombres de columnas inglesas del DB."""
    return {mapa.get(k, k): v for k, v in datos.items()}


class ServicioProveedor:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Proveedor CRUD ───────────────────────────────────────────────

    async def listar(
        self, tenant_id: int, *, search: str | None = None,
        is_active: bool = True, page: int = 1, limit: int = 10,
    ) -> tuple[list[ProveedorListaDto], int]:
        stmt = select(Proveedor).where(
            Proveedor.tenant_id == tenant_id, Proveedor.is_active == is_active,
        )
        if search:
            patron = f"%{search}%"
            stmt = stmt.where(or_(
                Proveedor.razon_social.ilike(patron),
                Proveedor.ruc.ilike(patron),
                Proveedor.nombre_comercial.ilike(patron),
            ))
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Proveedor.razon_social.asc()).offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(stmt)
        return [_a_lista_dto(p) for p in result.scalars().all()], total

    async def obtener_por_id(self, tenant_id: int, prov_id: int) -> ProveedorDetalleDto:
        result = await self.db.execute(
            select(Proveedor).where(Proveedor.id == prov_id, Proveedor.tenant_id == tenant_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Proveedor", prov_id)
        return _a_detalle_dto(p)

    async def crear(
        self, tenant_id: int, datos: ProveedorCrear, user_id: int | None = None,
    ) -> ProveedorDetalleDto:
        existente = await self.db.execute(
            select(Proveedor).where(Proveedor.ruc == datos.ruc, Proveedor.tenant_id == tenant_id)
        )
        if existente.scalars().first():
            raise ConflictoError(f"El RUC '{datos.ruc}' ya existe")
        p = Proveedor(**datos.model_dump(), is_active=True, tenant_id=tenant_id)
        self.db.add(p)
        await self.db.commit()
        await self.db.refresh(p)
        await self._registrar_log(
            tenant_id, p.id, "CREAR", observaciones="Proveedor creado", user_id=user_id,
        )
        return _a_detalle_dto(p)

    async def actualizar(
        self, tenant_id: int, prov_id: int, datos: ProveedorActualizar,
        user_id: int | None = None,
    ) -> ProveedorDetalleDto:
        result = await self.db.execute(
            select(Proveedor).where(Proveedor.id == prov_id, Proveedor.tenant_id == tenant_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Proveedor", prov_id)
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            anterior = str(getattr(p, campo, None))
            setattr(p, campo, valor)
            await self._registrar_log(
                tenant_id, prov_id, "ACTUALIZAR", campo=campo,
                anterior=anterior, nuevo=str(valor), user_id=user_id,
            )
        await self.db.commit()
        await self.db.refresh(p)
        return _a_detalle_dto(p)

    async def eliminar(self, tenant_id: int, prov_id: int, user_id: int | None = None) -> None:
        result = await self.db.execute(
            select(Proveedor).where(Proveedor.id == prov_id, Proveedor.tenant_id == tenant_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Proveedor", prov_id)
        p.is_active = False
        await self.db.commit()
        await self._registrar_log(
            tenant_id, prov_id, "ELIMINAR", observaciones="Proveedor desactivado", user_id=user_id,
        )

    # ─── Contacts ────────────────────────────────────────────────────

    async def obtener_contactos(self, tenant_id: int, prov_id: int) -> list[ContactoProveedorDto]:
        result = await self.db.execute(
            select(ContactoProveedor).where(
                ContactoProveedor.provider_id == prov_id,
                ContactoProveedor.tenant_id == tenant_id,
            )
        )
        return [_a_contacto_dto(c) for c in result.scalars().all()]

    async def agregar_contacto(
        self, tenant_id: int, prov_id: int, datos: ContactoCrear, user_id: int
    ) -> ContactoProveedorDto:
        await self.obtener_por_id(tenant_id, prov_id)
        db_fields = _traducir_campos(datos.model_dump(), _CONTACTO_MAP)
        c = ContactoProveedor(
            provider_id=prov_id, **db_fields,
            tenant_id=tenant_id, created_by=user_id,
        )
        self.db.add(c)
        await self.db.commit()
        await self.db.refresh(c)
        await self._registrar_log(
            tenant_id, prov_id, "AGREGAR_CONTACTO",
            observaciones=f"Contacto: {datos.nombre_contacto}", user_id=user_id,
        )
        return _a_contacto_dto(c)

    async def actualizar_contacto(
        self, tenant_id: int, contact_id: int, datos: ContactoActualizar, user_id: int
    ) -> ContactoProveedorDto:
        result = await self.db.execute(
            select(ContactoProveedor).where(
                ContactoProveedor.id == contact_id,
                ContactoProveedor.tenant_id == tenant_id,
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Contacto", contact_id)
        db_updates = _traducir_campos(datos.model_dump(exclude_unset=True), _CONTACTO_MAP)
        for col, valor in db_updates.items():
            setattr(c, col, valor)
        c.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(c)
        await self._registrar_log(
            tenant_id, c.provider_id, "ACTUALIZAR_CONTACTO",
            observaciones=f"Contacto #{contact_id}", user_id=user_id,
        )
        return _a_contacto_dto(c)

    async def eliminar_contacto(self, tenant_id: int, contact_id: int, user_id: int) -> None:
        result = await self.db.execute(
            select(ContactoProveedor).where(
                ContactoProveedor.id == contact_id,
                ContactoProveedor.tenant_id == tenant_id,
            )
        )
        c = result.scalars().first()
        if not c:
            raise NoEncontradoError("Contacto", contact_id)
        prov_id = c.provider_id
        await self.db.delete(c)
        await self.db.commit()
        await self._registrar_log(
            tenant_id, prov_id, "ELIMINAR_CONTACTO",
            observaciones=f"Contacto #{contact_id}", user_id=user_id,
        )

    # ─── Financial Info ──────────────────────────────────────────────

    async def obtener_info_financiera(
        self, tenant_id: int, prov_id: int
    ) -> list[InfoFinancieraDto]:
        result = await self.db.execute(
            select(InfoFinancieraProveedor).where(
                InfoFinancieraProveedor.provider_id == prov_id,
                InfoFinancieraProveedor.tenant_id == tenant_id,
            )
        )
        return [_a_financiera_dto(f) for f in result.scalars().all()]

    async def agregar_info_financiera(
        self, tenant_id: int, prov_id: int, datos: InfoFinancieraCrear, user_id: int
    ) -> InfoFinancieraDto:
        await self.obtener_por_id(tenant_id, prov_id)
        db_fields = _traducir_campos(datos.model_dump(), _FINANCIERA_MAP)
        f = InfoFinancieraProveedor(
            provider_id=prov_id, **db_fields,
            tenant_id=tenant_id, created_by=user_id,
        )
        self.db.add(f)
        await self.db.commit()
        await self.db.refresh(f)
        await self._registrar_log(
            tenant_id, prov_id, "AGREGAR_INFO_FINANCIERA",
            observaciones=f"Banco: {datos.nombre_banco}", user_id=user_id,
        )
        return _a_financiera_dto(f)

    async def actualizar_info_financiera(
        self, tenant_id: int, info_id: int, datos: InfoFinancieraActualizar, user_id: int
    ) -> InfoFinancieraDto:
        result = await self.db.execute(
            select(InfoFinancieraProveedor).where(
                InfoFinancieraProveedor.id == info_id,
                InfoFinancieraProveedor.tenant_id == tenant_id,
            )
        )
        f = result.scalars().first()
        if not f:
            raise NoEncontradoError("Info financiera", info_id)
        db_updates = _traducir_campos(datos.model_dump(exclude_unset=True), _FINANCIERA_MAP)
        for col, valor in db_updates.items():
            setattr(f, col, valor)
        f.updated_by = user_id
        await self.db.commit()
        await self.db.refresh(f)
        await self._registrar_log(
            tenant_id, f.provider_id, "ACTUALIZAR_INFO_FINANCIERA",
            observaciones=f"Info financiera #{info_id}", user_id=user_id,
        )
        return _a_financiera_dto(f)

    async def eliminar_info_financiera(
        self, tenant_id: int, info_id: int, user_id: int,
    ) -> None:
        result = await self.db.execute(
            select(InfoFinancieraProveedor).where(
                InfoFinancieraProveedor.id == info_id,
                InfoFinancieraProveedor.tenant_id == tenant_id,
            )
        )
        f = result.scalars().first()
        if not f:
            raise NoEncontradoError("Info financiera", info_id)
        prov_id = f.provider_id
        await self.db.delete(f)
        await self.db.commit()
        await self._registrar_log(
            tenant_id, prov_id, "ELIMINAR_INFO_FINANCIERA",
            observaciones=f"Info financiera #{info_id}", user_id=user_id,
        )

    # ─── Documents ───────────────────────────────────────────────────

    async def obtener_documentos(
        self, tenant_id: int, prov_id: int,
    ) -> list[DocumentoProveedorDto]:
        result = await self.db.execute(
            select(DocumentoProveedor).where(
                DocumentoProveedor.proveedor_id == prov_id,
                DocumentoProveedor.tenant_id == tenant_id,
            ).order_by(DocumentoProveedor.created_at.desc())
        )
        return [_a_documento_dto(d) for d in result.scalars().all()]

    async def agregar_documento(
        self, tenant_id: int, prov_id: int, datos: DocumentoCrear, user_id: int,
    ) -> DocumentoProveedorDto:
        await self.obtener_por_id(tenant_id, prov_id)
        d = DocumentoProveedor(
            proveedor_id=prov_id, **datos.model_dump(),
            tenant_id=tenant_id, created_by=user_id,
        )
        self.db.add(d)
        await self.db.commit()
        await self.db.refresh(d)
        await self._registrar_log(
            tenant_id, prov_id, "AGREGAR_DOCUMENTO",
            observaciones=f"Documento: {datos.tipo_documento}", user_id=user_id,
        )
        return _a_documento_dto(d)

    async def actualizar_documento(
        self, tenant_id: int, doc_id: int, datos: DocumentoActualizar, user_id: int,
    ) -> DocumentoProveedorDto:
        result = await self.db.execute(
            select(DocumentoProveedor).where(
                DocumentoProveedor.id == doc_id,
                DocumentoProveedor.tenant_id == tenant_id,
            )
        )
        d = result.scalars().first()
        if not d:
            raise NoEncontradoError("Documento", doc_id)
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(d, campo, valor)
        await self.db.commit()
        await self.db.refresh(d)
        await self._registrar_log(
            tenant_id, d.proveedor_id, "ACTUALIZAR_DOCUMENTO",
            observaciones=f"Documento #{doc_id}", user_id=user_id,
        )
        return _a_documento_dto(d)

    async def eliminar_documento(self, tenant_id: int, doc_id: int, user_id: int) -> None:
        result = await self.db.execute(
            select(DocumentoProveedor).where(
                DocumentoProveedor.id == doc_id,
                DocumentoProveedor.tenant_id == tenant_id,
            )
        )
        d = result.scalars().first()
        if not d:
            raise NoEncontradoError("Documento", doc_id)
        prov_id = d.proveedor_id
        await self.db.delete(d)
        await self.db.commit()
        await self._registrar_log(
            tenant_id, prov_id, "ELIMINAR_DOCUMENTO",
            observaciones=f"Documento #{doc_id}", user_id=user_id,
        )

    # ─── Audit Logs ──────────────────────────────────────────────────

    async def obtener_logs(self, tenant_id: int, prov_id: int) -> list[LogProveedorDto]:
        from sqlalchemy import text

        rows = (await self.db.execute(
            text("""
                SELECT l.id, l.proveedor_id, l.accion, l.campo,
                       l.valor_anterior, l.valor_nuevo, l.observaciones,
                       l.usuario_id, l.created_at,
                       CASE WHEN u.id IS NOT NULL
                            THEN u.nombres || ' ' || u.apellidos
                            ELSE NULL
                       END AS nombre_usuario
                FROM proveedores.log_proveedor l
                LEFT JOIN sistema.usuario u ON u.id = l.usuario_id
                WHERE l.proveedor_id = :prov_id AND l.tenant_id = :tid
                ORDER BY l.created_at DESC
            """),
            {"prov_id": prov_id, "tid": tenant_id},
        )).mappings().all()
        return [
            LogProveedorDto(
                id=r["id"], proveedor_id=r["proveedor_id"], accion=r["accion"],
                campo=r["campo"], valor_anterior=r["valor_anterior"],
                valor_nuevo=r["valor_nuevo"], observaciones=r["observaciones"],
                usuario_id=r["usuario_id"],
                nombre_usuario=r.get("nombre_usuario"),
                created_at=r["created_at"],
            )
            for r in rows
        ]

    async def _registrar_log(
        self, tenant_id: int, prov_id: int, accion: str, *,
        campo: str | None = None, anterior: str | None = None,
        nuevo: str | None = None, observaciones: str | None = None,
        user_id: int | None = None,
    ) -> None:
        """Registra una entrada de auditoría para el proveedor."""
        try:
            log = LogProveedor(
                proveedor_id=prov_id, accion=accion, campo=campo,
                valor_anterior=anterior, valor_nuevo=nuevo,
                observaciones=observaciones, usuario_id=user_id,
                tenant_id=tenant_id,
            )
            self.db.add(log)
            await self.db.flush()
        except Exception:
            logger.warning("log_write_failed", prov_id=prov_id, accion=accion)
