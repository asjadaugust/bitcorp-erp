"""Servicio para proveedores."""

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.proveedor import (
    ContactoCrear,
    ContactoProveedorDto,
    InfoFinancieraCrear,
    InfoFinancieraDto,
    ProveedorActualizar,
    ProveedorCrear,
    ProveedorDetalleDto,
    ProveedorListaDto,
)
from app.modelos.proveedores import ContactoProveedor, InfoFinancieraProveedor, Proveedor

logger = obtener_logger(__name__)


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
        id=c.id, provider_id=c.provider_id, contact_name=c.contact_name,
        position=c.position, primary_phone=c.primary_phone,
        secondary_phone=c.secondary_phone, email=c.email,
        secondary_email=c.secondary_email, contact_type=c.contact_type,
        is_primary=c.is_primary, status=c.status,
    )


def _a_financiera_dto(f: InfoFinancieraProveedor) -> InfoFinancieraDto:
    return InfoFinancieraDto(
        id=f.id, provider_id=f.provider_id, bank_name=f.bank_name,
        account_number=f.account_number, cci=f.cci,
        account_holder_name=f.account_holder_name, account_type=f.account_type,
        currency=f.currency, is_primary=f.is_primary, status=f.status,
    )


class ServicioProveedor:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

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

    async def crear(self, tenant_id: int, datos: ProveedorCrear) -> ProveedorDetalleDto:
        existente = await self.db.execute(
            select(Proveedor).where(Proveedor.ruc == datos.ruc, Proveedor.tenant_id == tenant_id)
        )
        if existente.scalars().first():
            raise ConflictoError(f"El RUC '{datos.ruc}' ya existe")
        p = Proveedor(**datos.model_dump(), is_active=True, tenant_id=tenant_id)
        self.db.add(p)
        await self.db.commit()
        await self.db.refresh(p)
        return _a_detalle_dto(p)

    async def actualizar(
        self, tenant_id: int, prov_id: int, datos: ProveedorActualizar
    ) -> ProveedorDetalleDto:
        result = await self.db.execute(
            select(Proveedor).where(Proveedor.id == prov_id, Proveedor.tenant_id == tenant_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Proveedor", prov_id)
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(p, campo, valor)
        await self.db.commit()
        await self.db.refresh(p)
        return _a_detalle_dto(p)

    async def eliminar(self, tenant_id: int, prov_id: int) -> None:
        result = await self.db.execute(
            select(Proveedor).where(Proveedor.id == prov_id, Proveedor.tenant_id == tenant_id)
        )
        p = result.scalars().first()
        if not p:
            raise NoEncontradoError("Proveedor", prov_id)
        p.is_active = False
        await self.db.commit()

    # ─── Contacts ────────────────────────────────────────────────────────

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
        c = ContactoProveedor(
            provider_id=prov_id, **datos.model_dump(),
            tenant_id=tenant_id, created_by=user_id,
        )
        self.db.add(c)
        await self.db.commit()
        await self.db.refresh(c)
        return _a_contacto_dto(c)

    # ─── Financial Info ──────────────────────────────────────────────────

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
        f = InfoFinancieraProveedor(
            provider_id=prov_id, **datos.model_dump(),
            tenant_id=tenant_id, created_by=user_id,
        )
        self.db.add(f)
        await self.db.commit()
        await self.db.refresh(f)
        return _a_financiera_dto(f)
