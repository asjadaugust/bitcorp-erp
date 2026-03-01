"""Servicio para operadores (trabajadores/RRHH).
"""

from datetime import date

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import ConflictoError, NoEncontradoError
from app.esquemas.operador import (
    CertificacionCrear,
    CertificacionDto,
    DisponibilidadDto,
    DisponibilidadEstablecer,
    HabilidadCrear,
    HabilidadDto,
    OperadorActualizar,
    OperadorCrear,
    OperadorDetalleDto,
    OperadorListaDto,
    RendimientoDto,
)
from app.modelos.equipo import ParteDiario
from app.modelos.rrhh import (
    CertificacionOperador,
    DisponibilidadOperador,
    HabilidadOperador,
    Trabajador,
)

logger = obtener_logger(__name__)


def _a_lista_dto(t: Trabajador) -> OperadorListaDto:
    return OperadorListaDto(
        id=t.id,
        dni=t.dni,
        nombres=t.nombres,
        apellido_paterno=t.apellido_paterno,
        apellido_materno=t.apellido_materno,
        cargo=t.cargo,
        especialidad=t.especialidad,
        telefono=t.telefono,
        correo_electronico=t.correo_electronico,
        tipo_contrato=t.tipo_contrato,
        licencia_conducir=t.licencia_conducir,
        is_active=t.is_active,
    )


def _a_detalle_dto(t: Trabajador) -> OperadorDetalleDto:
    return OperadorDetalleDto(
        id=t.id,
        dni=t.dni,
        nombres=t.nombres,
        apellido_paterno=t.apellido_paterno,
        apellido_materno=t.apellido_materno,
        cargo=t.cargo,
        especialidad=t.especialidad,
        telefono=t.telefono,
        correo_electronico=t.correo_electronico,
        tipo_contrato=t.tipo_contrato,
        licencia_conducir=t.licencia_conducir,
        is_active=t.is_active,
        legacy_id=t.legacy_id,
        fecha_nacimiento=t.fecha_nacimiento,
        direccion=t.direccion,
        fecha_ingreso=t.fecha_ingreso,
        fecha_cese=t.fecha_cese,
        unidad_operativa_id=t.unidad_operativa_id,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


def _a_cert_dto(c: CertificacionOperador) -> CertificacionDto:
    return CertificacionDto(
        id=c.id,
        trabajador_id=c.trabajador_id,
        nombre_certificacion=c.nombre_certificacion,
        numero_certificacion=c.numero_certificacion,
        fecha_emision=c.fecha_emision,
        fecha_vencimiento=c.fecha_vencimiento,
        entidad_emisora=c.entidad_emisora,
        estado=c.estado,
        created_at=c.created_at,
    )


def _a_hab_dto(h: HabilidadOperador) -> HabilidadDto:
    return HabilidadDto(
        id=h.id,
        trabajador_id=h.trabajador_id,
        tipo_equipo=h.tipo_equipo,
        nivel_habilidad=h.nivel_habilidad,
        anios_experiencia=float(h.anios_experiencia),
        ultima_verificacion=h.ultima_verificacion,
        created_at=h.created_at,
    )


def _a_disp_dto(d: DisponibilidadOperador) -> DisponibilidadDto:
    return DisponibilidadDto(
        id=d.id,
        trabajador_id=d.trabajador_id,
        fecha=d.fecha,
        disponible=d.disponible,
        observacion=d.observacion,
    )


class ServicioOperador:
    """Servicio para gestión de operadores."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Listar ──────────────────────────────────────────────────────────

    async def listar(
        self,
        tenant_id: int,
        *,
        search: str | None = None,
        is_active: bool = True,
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[OperadorListaDto], int]:
        stmt = select(Trabajador).where(
            Trabajador.tenant_id == tenant_id,
            Trabajador.is_active == is_active,
        )
        if search:
            patron = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Trabajador.nombres.ilike(patron),
                    Trabajador.apellido_paterno.ilike(patron),
                    Trabajador.dni.ilike(patron),
                    Trabajador.cargo.ilike(patron),
                )
            )

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        stmt = stmt.order_by(Trabajador.apellido_paterno.asc())
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        trabajadores = list(result.scalars().all())
        return [_a_lista_dto(t) for t in trabajadores], total

    # ─── Obtener por ID ──────────────────────────────────────────────────

    async def obtener_por_id(self, tenant_id: int, operador_id: int) -> OperadorDetalleDto:
        result = await self.db.execute(
            select(Trabajador).where(
                Trabajador.id == operador_id, Trabajador.tenant_id == tenant_id
            )
        )
        t = result.scalars().first()
        if not t:
            raise NoEncontradoError("Operador", operador_id)
        return _a_detalle_dto(t)

    # ─── Crear ───────────────────────────────────────────────────────────

    async def crear(self, tenant_id: int, datos: OperadorCrear) -> OperadorDetalleDto:
        existente = await self.db.execute(
            select(Trabajador).where(
                Trabajador.dni == datos.dni, Trabajador.tenant_id == tenant_id
            )
        )
        if existente.scalars().first():
            raise ConflictoError(f"El DNI '{datos.dni}' ya existe")

        t = Trabajador(
            **datos.model_dump(),
            is_active=True,
            tenant_id=tenant_id,
        )
        self.db.add(t)
        await self.db.commit()
        await self.db.refresh(t)
        logger.info("operador_creado", id=t.id, dni=t.dni)
        return _a_detalle_dto(t)

    # ─── Actualizar ──────────────────────────────────────────────────────

    async def actualizar(
        self, tenant_id: int, operador_id: int, datos: OperadorActualizar
    ) -> OperadorDetalleDto:
        result = await self.db.execute(
            select(Trabajador).where(
                Trabajador.id == operador_id, Trabajador.tenant_id == tenant_id
            )
        )
        t = result.scalars().first()
        if not t:
            raise NoEncontradoError("Operador", operador_id)

        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(t, campo, valor)

        await self.db.commit()
        await self.db.refresh(t)
        logger.info("operador_actualizado", id=operador_id)
        return _a_detalle_dto(t)

    # ─── Eliminar (soft) ─────────────────────────────────────────────────

    async def eliminar(self, tenant_id: int, operador_id: int) -> None:
        result = await self.db.execute(
            select(Trabajador).where(
                Trabajador.id == operador_id, Trabajador.tenant_id == tenant_id
            )
        )
        t = result.scalars().first()
        if not t:
            raise NoEncontradoError("Operador", operador_id)
        t.is_active = False
        await self.db.commit()
        logger.info("operador_eliminado", id=operador_id)

    # ─── Certificaciones ─────────────────────────────────────────────────

    async def obtener_certificaciones(
        self, tenant_id: int, operador_id: int
    ) -> list[CertificacionDto]:
        result = await self.db.execute(
            select(CertificacionOperador).where(
                CertificacionOperador.trabajador_id == operador_id,
                CertificacionOperador.tenant_id == tenant_id,
            )
        )
        return [_a_cert_dto(c) for c in result.scalars().all()]

    async def agregar_certificacion(
        self, tenant_id: int, operador_id: int, datos: CertificacionCrear
    ) -> CertificacionDto:
        # Verify operator exists
        await self.obtener_por_id(tenant_id, operador_id)
        cert = CertificacionOperador(
            trabajador_id=operador_id,
            **datos.model_dump(),
            tenant_id=tenant_id,
        )
        self.db.add(cert)
        await self.db.commit()
        await self.db.refresh(cert)
        return _a_cert_dto(cert)

    async def eliminar_certificacion(
        self, tenant_id: int, operador_id: int, cert_id: int
    ) -> None:
        result = await self.db.execute(
            select(CertificacionOperador).where(
                CertificacionOperador.id == cert_id,
                CertificacionOperador.trabajador_id == operador_id,
                CertificacionOperador.tenant_id == tenant_id,
            )
        )
        cert = result.scalars().first()
        if not cert:
            raise NoEncontradoError("Certificación", cert_id)
        await self.db.delete(cert)
        await self.db.commit()

    # ─── Habilidades ─────────────────────────────────────────────────────

    async def obtener_habilidades(
        self, tenant_id: int, operador_id: int
    ) -> list[HabilidadDto]:
        result = await self.db.execute(
            select(HabilidadOperador).where(
                HabilidadOperador.trabajador_id == operador_id,
                HabilidadOperador.tenant_id == tenant_id,
            )
        )
        return [_a_hab_dto(h) for h in result.scalars().all()]

    async def agregar_habilidad(
        self, tenant_id: int, operador_id: int, datos: HabilidadCrear
    ) -> HabilidadDto:
        await self.obtener_por_id(tenant_id, operador_id)
        hab = HabilidadOperador(
            trabajador_id=operador_id,
            **datos.model_dump(),
            tenant_id=tenant_id,
        )
        self.db.add(hab)
        await self.db.commit()
        await self.db.refresh(hab)
        return _a_hab_dto(hab)

    # ─── Disponibilidad ──────────────────────────────────────────────────

    async def obtener_disponibilidad(
        self, tenant_id: int, operador_id: int
    ) -> list[DisponibilidadDto]:
        result = await self.db.execute(
            select(DisponibilidadOperador).where(
                DisponibilidadOperador.trabajador_id == operador_id,
                DisponibilidadOperador.tenant_id == tenant_id,
            ).order_by(DisponibilidadOperador.fecha.asc())
        )
        return [_a_disp_dto(d) for d in result.scalars().all()]

    async def establecer_disponibilidad(
        self, tenant_id: int, operador_id: int, datos: DisponibilidadEstablecer
    ) -> DisponibilidadDto:
        await self.obtener_por_id(tenant_id, operador_id)
        # Upsert: check if exists
        result = await self.db.execute(
            select(DisponibilidadOperador).where(
                DisponibilidadOperador.trabajador_id == operador_id,
                DisponibilidadOperador.fecha == datos.fecha,
                DisponibilidadOperador.tenant_id == tenant_id,
            )
        )
        existing = result.scalars().first()
        if existing:
            existing.disponible = datos.disponible
            existing.observacion = datos.observacion
            await self.db.commit()
            await self.db.refresh(existing)
            return _a_disp_dto(existing)

        disp = DisponibilidadOperador(
            trabajador_id=operador_id,
            fecha=datos.fecha,
            disponible=datos.disponible,
            observacion=datos.observacion,
            tenant_id=tenant_id,
        )
        self.db.add(disp)
        await self.db.commit()
        await self.db.refresh(disp)
        return _a_disp_dto(disp)

    # ─── Programación mensual ────────────────────────────────────────────

    async def obtener_programacion(
        self, tenant_id: int, mes: str
    ) -> list[DisponibilidadDto]:
        """Obtener programación de todos los operadores para un mes (YYYY-MM)."""
        fecha_inicio = date.fromisoformat(f"{mes}-01")
        if fecha_inicio.month == 12:
            fecha_fin = date(fecha_inicio.year + 1, 1, 1)
        else:
            fecha_fin = date(fecha_inicio.year, fecha_inicio.month + 1, 1)

        result = await self.db.execute(
            select(DisponibilidadOperador).where(
                DisponibilidadOperador.tenant_id == tenant_id,
                DisponibilidadOperador.fecha >= fecha_inicio,
                DisponibilidadOperador.fecha < fecha_fin,
            ).order_by(DisponibilidadOperador.fecha.asc())
        )
        return [_a_disp_dto(d) for d in result.scalars().all()]

    # ─── Rendimiento ─────────────────────────────────────────────────────

    async def obtener_rendimiento(
        self, tenant_id: int, operador_id: int, dias: int = 30
    ) -> RendimientoDto:
        await self.obtener_por_id(tenant_id, operador_id)
        # Count daily reports for this operator
        total_result = await self.db.execute(
            select(func.count()).where(
                ParteDiario.trabajador_id == operador_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        total = total_result.scalar_one()

        aprobados_result = await self.db.execute(
            select(func.count()).where(
                ParteDiario.trabajador_id == operador_id,
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.estado == "APROBADO",
            )
        )
        aprobados = aprobados_result.scalar_one()

        rechazados_result = await self.db.execute(
            select(func.count()).where(
                ParteDiario.trabajador_id == operador_id,
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.estado == "RECHAZADO",
            )
        )
        rechazados = rechazados_result.scalar_one()

        eficiencia = round(aprobados / total * 100, 2) if total > 0 else 0.0

        return RendimientoDto(
            total_partes=total,
            aprobados=aprobados,
            rechazados=rechazados,
            eficiencia=eficiencia,
        )
