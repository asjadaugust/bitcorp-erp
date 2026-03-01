"""Servicio para partes diarios (daily reports).

Replica ReportService del BFF Node.js (CRUD + workflow + analytics).
"""

from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import (
    ConflictoError,
    NoEncontradoError,
    ValidacionError,
)
from app.esquemas.parte_diario import (
    ActividadProduccionDto,
    DemoraMecanicaDto,
    DemoraOperativaDto,
    EstadoRecepcionDto,
    FotoDto,
    ObservacionInspeccionDto,
    OtroEventoDto,
    ParteDiarioActualizar,
    ParteDiarioCrear,
    ParteDiarioDetalleDto,
    ParteDiarioListaDto,
    ProduccionDto,
    SeguimientoInspeccionDto,
)
from app.modelos.equipo import (
    Equipo,
    ParteDiario,
    ParteDiarioActividadProduccion,
    ParteDiarioDemoraMecanica,
    ParteDiarioDemoraOperativa,
    ParteDiarioFoto,
    ParteDiarioOtroEvento,
    ParteDiarioProduccion,
)

logger = obtener_logger(__name__)


# ─── Sort fields ──────────────────────────────────────────────────────────

_CAMPOS_ORDENAMIENTO: dict[str, str] = {
    "fecha": "fecha",
    "estado": "estado",
    "created_at": "created_at",
    "updated_at": "updated_at",
    "horas_trabajadas": "horas_trabajadas",
}


# ─── DTO Converters ──────────────────────────────────────────────────────

def _a_lista_dto(r: ParteDiario) -> ParteDiarioListaDto:
    return ParteDiarioListaDto(
        id=r.id,
        equipo_id=r.equipo_id,
        trabajador_id=r.trabajador_id,
        proyecto_id=r.proyecto_id,
        fecha=r.fecha,
        horas_trabajadas=float(r.horas_trabajadas) if r.horas_trabajadas is not None else None,
        horometro_inicial=(
            float(r.horometro_inicial) if r.horometro_inicial is not None else None
        ),
        horometro_final=float(r.horometro_final) if r.horometro_final is not None else None,
        estado=r.estado,
        codigo=r.codigo,
        turno=r.turno,
        numero_parte=r.numero_parte,
        horas_precalentamiento=(
            float(r.horas_precalentamiento) if r.horas_precalentamiento is not None else None
        ),
        tenant_id=r.tenant_id,
        created_at=r.created_at,
        updated_at=r.updated_at,
        equipo_codigo=r.equipo.codigo_equipo if r.equipo else None,
        equipo_marca=r.equipo.marca if r.equipo else None,
        equipo_modelo=r.equipo.modelo if r.equipo else None,
        trabajador_nombre=(
            f"{r.trabajador.nombres} {r.trabajador.apellido_paterno}"
            if r.trabajador
            else None
        ),
        proyecto_nombre=r.proyecto.nombre if r.proyecto else None,
    )


def _a_detalle_dto(
    r: ParteDiario,
    *,
    actividades: list[ParteDiarioActividadProduccion] | None = None,
    produccion: list[ParteDiarioProduccion] | None = None,
    demoras_operativas: list[ParteDiarioDemoraOperativa] | None = None,
    demoras_mecanicas: list[ParteDiarioDemoraMecanica] | None = None,
    otros_eventos: list[ParteDiarioOtroEvento] | None = None,
    fotos: list[ParteDiarioFoto] | None = None,
) -> ParteDiarioDetalleDto:
    return ParteDiarioDetalleDto(
        id=r.id,
        equipo_id=r.equipo_id,
        trabajador_id=r.trabajador_id,
        proyecto_id=r.proyecto_id,
        fecha=r.fecha,
        horas_trabajadas=float(r.horas_trabajadas) if r.horas_trabajadas is not None else None,
        horometro_inicial=(
            float(r.horometro_inicial) if r.horometro_inicial is not None else None
        ),
        horometro_final=float(r.horometro_final) if r.horometro_final is not None else None,
        estado=r.estado,
        codigo=r.codigo,
        turno=r.turno,
        numero_parte=r.numero_parte,
        horas_precalentamiento=(
            float(r.horas_precalentamiento) if r.horas_precalentamiento is not None else None
        ),
        tenant_id=r.tenant_id,
        created_at=r.created_at,
        updated_at=r.updated_at,
        equipo_codigo=r.equipo.codigo_equipo if r.equipo else None,
        equipo_marca=r.equipo.marca if r.equipo else None,
        equipo_modelo=r.equipo.modelo if r.equipo else None,
        trabajador_nombre=(
            f"{r.trabajador.nombres} {r.trabajador.apellido_paterno}"
            if r.trabajador
            else None
        ),
        proyecto_nombre=r.proyecto.nombre if r.proyecto else None,
        # Detail-only fields
        legacy_id=r.legacy_id,
        valorizacion_id=r.valorizacion_id,
        hora_inicio=r.hora_inicio,
        hora_fin=r.hora_fin,
        odometro_inicial=float(r.odometro_inicial) if r.odometro_inicial is not None else None,
        odometro_final=float(r.odometro_final) if r.odometro_final is not None else None,
        km_recorridos=float(r.km_recorridos) if r.km_recorridos is not None else None,
        combustible_inicial=(
            float(r.combustible_inicial) if r.combustible_inicial is not None else None
        ),
        combustible_consumido=(
            float(r.combustible_consumido) if r.combustible_consumido is not None else None
        ),
        observaciones=r.observaciones,
        creado_por=r.creado_por,
        aprobado_por=r.aprobado_por,
        aprobado_en=r.aprobado_en,
        empresa=r.empresa,
        placa=r.placa,
        responsable_frente=r.responsable_frente,
        petroleo_gln=float(r.petroleo_gln) if r.petroleo_gln is not None else None,
        gasolina_gln=float(r.gasolina_gln) if r.gasolina_gln is not None else None,
        hora_abastecimiento=r.hora_abastecimiento,
        num_vale_combustible=r.num_vale_combustible,
        horometro_kilometraje=r.horometro_kilometraje,
        lugar_salida=r.lugar_salida,
        lugar_llegada=r.lugar_llegada,
        observaciones_correcciones=r.observaciones_correcciones,
        firma_operador=r.firma_operador,
        firma_supervisor=r.firma_supervisor,
        firma_jefe_equipos=r.firma_jefe_equipos,
        firma_residente=r.firma_residente,
        firma_planeamiento_control=r.firma_planeamiento_control,
        solicitud_aprobacion_id=r.solicitud_aprobacion_id,
        # Children
        actividades=[
            ActividadProduccionDto(
                id=a.id, parte_diario_id=a.parte_diario_id,
                codigo=a.codigo, descripcion=a.descripcion,
            )
            for a in (actividades or [])
        ],
        produccion=[
            ProduccionDto(
                id=p.id, parte_diario_id=p.parte_diario_id, numero=p.numero,
                ubicacion_labores_prog_ini=p.ubicacion_labores_prog_ini,
                ubicacion_labores_prog_fin=p.ubicacion_labores_prog_fin,
                hora_ini=p.hora_ini, hora_fin=p.hora_fin,
                material_trabajado_descripcion=p.material_trabajado_descripcion,
                metrado=p.metrado, edt=p.edt,
            )
            for p in (produccion or [])
        ],
        demoras_operativas=[
            DemoraOperativaDto(
                id=d.id, parte_diario_id=d.parte_diario_id, codigo=d.codigo,
            )
            for d in (demoras_operativas or [])
        ],
        demoras_mecanicas=[
            DemoraMecanicaDto(
                id=m.id, parte_diario_id=m.parte_diario_id, codigo=m.codigo,
                descripcion=m.descripcion, resuelta=m.resuelta,
                fecha_resolucion=m.fecha_resolucion,
                observacion_resolucion=m.observacion_resolucion,
            )
            for m in (demoras_mecanicas or [])
        ],
        otros_eventos=[
            OtroEventoDto(
                id=e.id, parte_diario_id=e.parte_diario_id,
                codigo=e.codigo, descripcion=e.descripcion,
            )
            for e in (otros_eventos or [])
        ],
        fotos=[
            FotoDto(
                id=f.id, parte_diario_id=f.parte_diario_id, filename=f.filename,
                original_name=f.original_name, mime_type=f.mime_type,
                size=f.size, orden=f.orden,
            )
            for f in (fotos or [])
        ],
    )


class ServicioParteDiario:
    """Servicio para gestión de partes diarios."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ─── Helpers ──────────────────────────────────────────────────────

    async def _cargar_hijos(self, parte_id: int) -> dict[str, list[Any]]:
        """Load all child entities for a report."""
        act_r = await self.db.execute(
            select(ParteDiarioActividadProduccion)
            .where(ParteDiarioActividadProduccion.parte_diario_id == parte_id)
        )
        prod_r = await self.db.execute(
            select(ParteDiarioProduccion)
            .where(ParteDiarioProduccion.parte_diario_id == parte_id)
            .order_by(ParteDiarioProduccion.numero.asc())
        )
        do_r = await self.db.execute(
            select(ParteDiarioDemoraOperativa)
            .where(ParteDiarioDemoraOperativa.parte_diario_id == parte_id)
        )
        dm_r = await self.db.execute(
            select(ParteDiarioDemoraMecanica)
            .where(ParteDiarioDemoraMecanica.parte_diario_id == parte_id)
        )
        oe_r = await self.db.execute(
            select(ParteDiarioOtroEvento)
            .where(ParteDiarioOtroEvento.parte_diario_id == parte_id)
        )
        fo_r = await self.db.execute(
            select(ParteDiarioFoto)
            .where(ParteDiarioFoto.parte_diario_id == parte_id)
            .order_by(ParteDiarioFoto.orden.asc())
        )
        return {
            "actividades": list(act_r.scalars().all()),
            "produccion": list(prod_r.scalars().all()),
            "demoras_operativas": list(do_r.scalars().all()),
            "demoras_mecanicas": list(dm_r.scalars().all()),
            "otros_eventos": list(oe_r.scalars().all()),
            "fotos": list(fo_r.scalars().all()),
        }

    async def _guardar_hijos(
        self, parte_id: int, datos: ParteDiarioCrear | ParteDiarioActualizar
    ) -> None:
        """Save child entities (delete-and-recreate)."""
        items_act = datos.actividades
        items_prod = datos.produccion
        items_do = datos.demoras_operativas
        items_dm = datos.demoras_mecanicas
        items_oe = datos.otros_eventos

        # For update, only replace children that are explicitly provided
        is_update = isinstance(datos, ParteDiarioActualizar)

        if items_act is not None:
            if is_update:
                await self.db.execute(
                    delete(ParteDiarioActividadProduccion)
                    .where(ParteDiarioActividadProduccion.parte_diario_id == parte_id)
                )
            for a in (items_act or []):
                self.db.add(ParteDiarioActividadProduccion(
                    parte_diario_id=parte_id, codigo=a.codigo, descripcion=a.descripcion,
                ))

        if items_prod is not None:
            if is_update:
                await self.db.execute(
                    delete(ParteDiarioProduccion)
                    .where(ParteDiarioProduccion.parte_diario_id == parte_id)
                )
            for p in (items_prod or []):
                self.db.add(ParteDiarioProduccion(
                    parte_diario_id=parte_id, numero=p.numero,
                    ubicacion_labores_prog_ini=p.ubicacion_labores_prog_ini,
                    ubicacion_labores_prog_fin=p.ubicacion_labores_prog_fin,
                    hora_ini=p.hora_ini, hora_fin=p.hora_fin,
                    material_trabajado_descripcion=p.material_trabajado_descripcion,
                    metrado=p.metrado, edt=p.edt,
                ))

        if items_do is not None:
            if is_update:
                await self.db.execute(
                    delete(ParteDiarioDemoraOperativa)
                    .where(ParteDiarioDemoraOperativa.parte_diario_id == parte_id)
                )
            for d in (items_do or []):
                self.db.add(ParteDiarioDemoraOperativa(
                    parte_diario_id=parte_id, codigo=d.codigo,
                ))

        if items_dm is not None:
            if is_update:
                await self.db.execute(
                    delete(ParteDiarioDemoraMecanica)
                    .where(ParteDiarioDemoraMecanica.parte_diario_id == parte_id)
                )
            for m in (items_dm or []):
                self.db.add(ParteDiarioDemoraMecanica(
                    parte_diario_id=parte_id, codigo=m.codigo, descripcion=m.descripcion,
                ))

        if items_oe is not None:
            if is_update:
                await self.db.execute(
                    delete(ParteDiarioOtroEvento)
                    .where(ParteDiarioOtroEvento.parte_diario_id == parte_id)
                )
            for e in (items_oe or []):
                self.db.add(ParteDiarioOtroEvento(
                    parte_diario_id=parte_id, codigo=e.codigo, descripcion=e.descripcion,
                ))

    async def _recargar(self, parte_id: int) -> ParteDiario:
        """Re-query report with eager relationships."""
        result = await self.db.execute(
            select(ParteDiario).where(ParteDiario.id == parte_id)
        )
        reporte = result.scalars().unique().first()
        if not reporte:
            raise NoEncontradoError("ParteDiario", parte_id)
        return reporte

    # ─── Listar (paginated, filtered, sorted) ────────────────────────

    async def listar(
        self,
        tenant_id: int,
        *,
        estado: str | None = None,
        equipo_id: int | None = None,
        trabajador_id: int | None = None,
        proyecto_id: int | None = None,
        fecha_inicio: date | None = None,
        fecha_fin: date | None = None,
        search: str | None = None,
        sort_by: str = "fecha",
        sort_order: str = "DESC",
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[ParteDiarioListaDto], int]:
        """Listar partes diarios con filtros, paginación y ordenamiento."""
        stmt = (
            select(ParteDiario)
            .where(ParteDiario.tenant_id == tenant_id)
        )

        if estado:
            stmt = stmt.where(ParteDiario.estado == estado)
        if equipo_id:
            stmt = stmt.where(ParteDiario.equipo_id == equipo_id)
        if trabajador_id:
            stmt = stmt.where(ParteDiario.trabajador_id == trabajador_id)
        if proyecto_id:
            stmt = stmt.where(ParteDiario.proyecto_id == proyecto_id)
        if fecha_inicio:
            stmt = stmt.where(ParteDiario.fecha >= fecha_inicio)
        if fecha_fin:
            stmt = stmt.where(ParteDiario.fecha <= fecha_fin)
        if search:
            patron = f"%{search}%"
            stmt = stmt.where(
                or_(
                    ParteDiario.codigo.ilike(patron),
                    ParteDiario.observaciones.ilike(patron),
                )
            )

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Sort
        col_name = _CAMPOS_ORDENAMIENTO.get(sort_by, "fecha")
        col = getattr(ParteDiario, col_name, ParteDiario.fecha)
        order = col.desc() if sort_order.upper() == "DESC" else col.asc()
        stmt = stmt.order_by(order, ParteDiario.created_at.desc())

        # Paginate
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        reportes = list(result.scalars().unique().all())

        logger.info("reportes_listados", total=total, returned=len(reportes), page=page)
        return [_a_lista_dto(r) for r in reportes], total

    # ─── Obtener por ID ──────────────────────────────────────────────

    async def obtener_por_id(
        self, tenant_id: int, reporte_id: int
    ) -> ParteDiarioDetalleDto:
        """Obtener un reporte por ID con hijos."""
        result = await self.db.execute(
            select(ParteDiario).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        reporte = result.scalars().unique().first()
        if not reporte:
            raise NoEncontradoError("ParteDiario", reporte_id)

        hijos = await self._cargar_hijos(reporte_id)
        return _a_detalle_dto(reporte, **hijos)

    # ─── Crear ────────────────────────────────────────────────────────

    async def crear(
        self,
        tenant_id: int,
        datos: ParteDiarioCrear,
        creado_por: int,
    ) -> ParteDiarioDetalleDto:
        """Crear un nuevo parte diario con validaciones."""
        # Date validation: cannot be future
        if datos.fecha > date.today():
            raise ValidacionError("La fecha no puede ser futura")

        # Hours validation
        if datos.horas_trabajadas is not None:
            if datos.horas_trabajadas <= 0 or datos.horas_trabajadas > 24:
                raise ValidacionError("Las horas trabajadas deben estar entre 0 y 24")

        # Auto-calculate horas_trabajadas from horometro if not provided
        horas = datos.horas_trabajadas
        if (
            horas is None
            and datos.horometro_inicial is not None
            and datos.horometro_final is not None
        ):
            horas = datos.horometro_final - datos.horometro_inicial

        reporte = ParteDiario(
            equipo_id=datos.equipo_id,
            trabajador_id=datos.trabajador_id,
            proyecto_id=datos.proyecto_id,
            fecha=datos.fecha,
            hora_inicio=datos.hora_inicio,
            hora_fin=datos.hora_fin,
            horas_trabajadas=horas,
            horometro_inicial=datos.horometro_inicial,
            horometro_final=datos.horometro_final,
            odometro_inicial=datos.odometro_inicial,
            odometro_final=datos.odometro_final,
            km_recorridos=datos.km_recorridos,
            combustible_inicial=datos.combustible_inicial,
            combustible_consumido=datos.combustible_consumido,
            observaciones=datos.observaciones,
            estado="BORRADOR",
            creado_por=creado_por,
            codigo=datos.codigo,
            empresa=datos.empresa,
            placa=datos.placa,
            responsable_frente=datos.responsable_frente,
            turno=datos.turno,
            numero_parte=datos.numero_parte,
            petroleo_gln=datos.petroleo_gln,
            gasolina_gln=datos.gasolina_gln,
            hora_abastecimiento=datos.hora_abastecimiento,
            num_vale_combustible=datos.num_vale_combustible,
            horometro_kilometraje=datos.horometro_kilometraje,
            lugar_salida=datos.lugar_salida,
            lugar_llegada=datos.lugar_llegada,
            firma_operador=datos.firma_operador,
            firma_supervisor=datos.firma_supervisor,
            horas_precalentamiento=datos.horas_precalentamiento,
            tenant_id=tenant_id,
        )
        self.db.add(reporte)
        await self.db.flush()

        # Save children
        await self._guardar_hijos(reporte.id, datos)
        await self.db.commit()

        reporte = await self._recargar(reporte.id)
        hijos = await self._cargar_hijos(reporte.id)
        logger.info("reporte_creado", id=reporte.id, equipo_id=datos.equipo_id)
        return _a_detalle_dto(reporte, **hijos)

    # ─── Actualizar ──────────────────────────────────────────────────

    async def actualizar(
        self,
        tenant_id: int,
        reporte_id: int,
        datos: ParteDiarioActualizar,
        _actualizado_por: int,
    ) -> ParteDiarioDetalleDto:
        """Actualizar un reporte existente."""
        result = await self.db.execute(
            select(ParteDiario).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        reporte = result.scalars().first()
        if not reporte:
            raise NoEncontradoError("ParteDiario", reporte_id)

        campos = datos.model_dump(
            exclude_unset=True,
            exclude={"actividades", "produccion", "demoras_operativas",
                     "demoras_mecanicas", "otros_eventos"},
        )

        # Auto-recalculate horas_trabajadas
        horometro_ini = campos.get("horometro_inicial", reporte.horometro_inicial)
        horometro_fin = campos.get("horometro_final", reporte.horometro_final)
        if ("horometro_inicial" in campos or "horometro_final" in campos):
            if horometro_ini is not None and horometro_fin is not None:
                campos["horas_trabajadas"] = float(horometro_fin) - float(horometro_ini)

        for campo, valor in campos.items():
            setattr(reporte, campo, valor)

        # Save children if provided
        await self._guardar_hijos(reporte_id, datos)
        await self.db.commit()

        reporte = await self._recargar(reporte_id)
        hijos = await self._cargar_hijos(reporte_id)
        logger.info("reporte_actualizado", id=reporte_id)
        return _a_detalle_dto(reporte, **hijos)

    # ─── Eliminar (hard delete) ──────────────────────────────────────

    async def eliminar(self, tenant_id: int, reporte_id: int) -> None:
        """Hard delete de reporte y sus hijos."""
        result = await self.db.execute(
            select(ParteDiario).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        reporte = result.scalars().first()
        if not reporte:
            raise NoEncontradoError("ParteDiario", reporte_id)

        # Delete children first
        for child_cls in (
            ParteDiarioActividadProduccion,
            ParteDiarioProduccion,
            ParteDiarioDemoraOperativa,
            ParteDiarioDemoraMecanica,
            ParteDiarioOtroEvento,
            ParteDiarioFoto,
        ):
            await self.db.execute(
                delete(child_cls).where(child_cls.parte_diario_id == reporte_id)
            )

        await self.db.delete(reporte)
        await self.db.commit()
        logger.info("reporte_eliminado", id=reporte_id)

    # ─── Enviar (BORRADOR → ENVIADO) ─────────────────────────────────

    async def enviar(
        self, tenant_id: int, reporte_id: int, usuario_id: int
    ) -> ParteDiarioDetalleDto:
        """Enviar reporte para aprobación."""
        result = await self.db.execute(
            select(ParteDiario).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        reporte = result.scalars().first()
        if not reporte:
            raise NoEncontradoError("ParteDiario", reporte_id)

        if reporte.estado != "BORRADOR":
            raise ConflictoError(
                f"Solo se puede enviar un reporte en estado BORRADOR "
                f"(actual: {reporte.estado})"
            )

        reporte.estado = "ENVIADO"
        await self.db.commit()

        reporte = await self._recargar(reporte_id)
        hijos = await self._cargar_hijos(reporte_id)
        _ = usuario_id  # Reserved for approval engine integration
        logger.info("reporte_enviado", id=reporte_id)
        return _a_detalle_dto(reporte, **hijos)

    # ─── Aprobar ─────────────────────────────────────────────────────

    async def aprobar(
        self, tenant_id: int, reporte_id: int, aprobado_por: int
    ) -> ParteDiarioDetalleDto:
        """Aprobar reporte."""
        result = await self.db.execute(
            select(ParteDiario).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        reporte = result.scalars().first()
        if not reporte:
            raise NoEncontradoError("ParteDiario", reporte_id)

        reporte.estado = "APROBADO"
        reporte.aprobado_por = aprobado_por
        reporte.aprobado_en = datetime.now()  # noqa: DTZ005
        await self.db.commit()

        reporte = await self._recargar(reporte_id)
        hijos = await self._cargar_hijos(reporte_id)
        logger.info("reporte_aprobado", id=reporte_id)
        return _a_detalle_dto(reporte, **hijos)

    # ─── Rechazar ────────────────────────────────────────────────────

    async def rechazar(
        self, tenant_id: int, reporte_id: int, reason: str
    ) -> ParteDiarioDetalleDto:
        """Rechazar reporte con motivo."""
        if not reason or not reason.strip():
            raise ValidacionError("El motivo de rechazo es requerido")

        result = await self.db.execute(
            select(ParteDiario).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        reporte = result.scalars().first()
        if not reporte:
            raise NoEncontradoError("ParteDiario", reporte_id)

        reporte.estado = "RECHAZADO"
        reporte.observaciones_correcciones = reason.strip()
        await self.db.commit()

        reporte = await self._recargar(reporte_id)
        hijos = await self._cargar_hijos(reporte_id)
        logger.info("reporte_rechazado", id=reporte_id)
        return _a_detalle_dto(reporte, **hijos)

    # ─── Firmar residente ────────────────────────────────────────────

    async def firmar_residente(
        self, tenant_id: int, reporte_id: int, firma: str
    ) -> ParteDiarioDetalleDto:
        """Registrar firma del residente."""
        if not firma or not firma.strip():
            raise ValidacionError("La firma del residente es requerida")

        result = await self.db.execute(
            select(ParteDiario).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        reporte = result.scalars().first()
        if not reporte:
            raise NoEncontradoError("ParteDiario", reporte_id)

        reporte.firma_residente = firma.strip()
        await self.db.commit()

        reporte = await self._recargar(reporte_id)
        hijos = await self._cargar_hijos(reporte_id)
        logger.info("firma_residente_registrada", id=reporte_id)
        return _a_detalle_dto(reporte, **hijos)

    # ─── Estado de recepción ─────────────────────────────────────────

    async def estado_recepcion(
        self,
        tenant_id: int,
        fecha_desde: date,
        fecha_hasta: date,
        proyecto_id: int | None = None,
    ) -> list[EstadoRecepcionDto]:
        """Calcular estado de recepción de reportes por equipo."""
        # Working days (Mon-Sat, exclude Sunday)
        dias_laborales: list[date] = []
        current = fecha_desde
        while current <= fecha_hasta:
            if current.isoweekday() <= 6:  # Mon=1 .. Sat=6
                dias_laborales.append(current)
            current += timedelta(days=1)

        total_dias = len(dias_laborales)
        if total_dias == 0:
            return []

        # Active equipment
        eq_stmt = (
            select(Equipo)
            .where(
                Equipo.tenant_id == tenant_id,
                Equipo.is_active.is_(True),
                Equipo.estado.in_(["DISPONIBLE", "EN_USO", "OPERATIVO"]),
            )
            .order_by(Equipo.codigo_equipo.asc())
        )
        eq_result = await self.db.execute(eq_stmt)
        equipos = list(eq_result.scalars().unique().all())

        if not equipos:
            return []

        equipo_ids = [e.id for e in equipos]

        # Reports in date range
        rpt_stmt = (
            select(ParteDiario.equipo_id, ParteDiario.fecha)
            .where(
                ParteDiario.tenant_id == tenant_id,
                ParteDiario.equipo_id.in_(equipo_ids),
                and_(
                    ParteDiario.fecha >= fecha_desde,
                    ParteDiario.fecha <= fecha_hasta,
                ),
            )
        )
        if proyecto_id:
            rpt_stmt = rpt_stmt.where(ParteDiario.proyecto_id == proyecto_id)

        rpt_result = await self.db.execute(rpt_stmt)
        rows = rpt_result.all()

        # Group reported dates by equipment
        reported: dict[int, set[date]] = {}
        for equipo_id_val, fecha_val in rows:
            reported.setdefault(equipo_id_val, set()).add(fecha_val)

        dias_set = set(dias_laborales)
        resultado: list[EstadoRecepcionDto] = []
        for eq in equipos:
            fechas_reportadas = reported.get(eq.id, set())
            recibidos = len(fechas_reportadas & dias_set)
            pendientes = total_dias - recibidos
            faltantes = sorted(dias_set - fechas_reportadas)
            pct = round((recibidos / total_dias) * 100, 1) if total_dias > 0 else 0

            resultado.append(EstadoRecepcionDto(
                equipo_id=eq.id,
                codigo_equipo=eq.codigo_equipo,
                marca=eq.marca,
                modelo=eq.modelo,
                total_dias=total_dias,
                reportes_recibidos=recibidos,
                reportes_pendientes=pendientes,
                porcentaje_recepcion=pct,
                fechas_faltantes=[f.isoformat() for f in faltantes],
            ))

        logger.info(
            "estado_recepcion_calculado",
            equipos=len(resultado), dias=total_dias,
        )
        return resultado

    # ─── Seguimiento de inspección ───────────────────────────────────

    async def seguimiento_inspeccion(
        self,
        tenant_id: int,
        fecha_desde: date | None = None,
        fecha_hasta: date | None = None,
        solo_abiertas: bool = False,
    ) -> list[SeguimientoInspeccionDto]:
        """Seguimiento de observaciones mecánicas por equipo."""
        stmt = (
            select(ParteDiarioDemoraMecanica, ParteDiario.fecha, Equipo)
            .join(ParteDiario, ParteDiarioDemoraMecanica.parte_diario_id == ParteDiario.id)
            .join(Equipo, ParteDiario.equipo_id == Equipo.id)
            .where(ParteDiario.tenant_id == tenant_id)
        )

        if fecha_desde:
            stmt = stmt.where(ParteDiario.fecha >= fecha_desde)
        if fecha_hasta:
            stmt = stmt.where(ParteDiario.fecha <= fecha_hasta)
        if solo_abiertas:
            stmt = stmt.where(ParteDiarioDemoraMecanica.resuelta.is_(False))

        stmt = stmt.order_by(ParteDiario.fecha.desc(), ParteDiarioDemoraMecanica.created_at.desc())

        result = await self.db.execute(stmt)
        rows = result.all()

        # Group by equipment
        equipos_map: dict[int, dict[str, Any]] = {}
        for dm, fecha_val, eq in rows:
            if eq.id not in equipos_map:
                equipos_map[eq.id] = {
                    "equipo": eq,
                    "observaciones": [],
                    "abiertas": 0,
                    "resueltas": 0,
                }
            entry = equipos_map[eq.id]
            entry["observaciones"].append(
                ObservacionInspeccionDto(
                    id=dm.id,
                    parte_diario_id=dm.parte_diario_id,
                    fecha=fecha_val,
                    codigo=dm.codigo,
                    descripcion=dm.descripcion,
                    resuelta=dm.resuelta,
                    fecha_resolucion=dm.fecha_resolucion,
                    observacion_resolucion=dm.observacion_resolucion,
                )
            )
            if dm.resuelta:
                entry["resueltas"] += 1
            else:
                entry["abiertas"] += 1

        # Sort by open observations descending
        sorted_equipos = sorted(
            equipos_map.values(), key=lambda x: x["abiertas"], reverse=True
        )

        resultado: list[SeguimientoInspeccionDto] = []
        for entry in sorted_equipos:
            eq = entry["equipo"]
            resultado.append(SeguimientoInspeccionDto(
                equipo_id=eq.id,
                codigo_equipo=eq.codigo_equipo,
                marca=eq.marca,
                modelo=eq.modelo,
                total_observaciones=len(entry["observaciones"]),
                observaciones_abiertas=entry["abiertas"],
                observaciones_resueltas=entry["resueltas"],
                observaciones=entry["observaciones"],
            ))

        logger.info("seguimiento_inspeccion", equipos=len(resultado))
        return resultado

    # ─── Resolver observación mecánica ───────────────────────────────

    async def resolver_observacion(
        self,
        tenant_id: int,
        observacion_id: int,
        observacion_resolucion: str | None = None,
    ) -> dict[str, Any]:
        """Marcar una observación mecánica como resuelta."""
        stmt = (
            select(ParteDiarioDemoraMecanica)
            .join(ParteDiario, ParteDiarioDemoraMecanica.parte_diario_id == ParteDiario.id)
            .where(
                ParteDiarioDemoraMecanica.id == observacion_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        result = await self.db.execute(stmt)
        obs = result.scalars().first()
        if not obs:
            raise NoEncontradoError("Observacion", observacion_id)

        if obs.resuelta:
            raise ConflictoError("La observación ya fue resuelta")

        obs.resuelta = True
        obs.fecha_resolucion = date.today()
        if observacion_resolucion:
            obs.observacion_resolucion = observacion_resolucion

        await self.db.commit()
        logger.info("observacion_resuelta", id=observacion_id)
        return {"id": observacion_id, "resuelta": True}

    # ─── Listar fotos ────────────────────────────────────────────────

    async def listar_fotos(
        self, tenant_id: int, reporte_id: int
    ) -> list[FotoDto]:
        """Listar fotos de un reporte."""
        # Verify report exists and belongs to tenant
        rpt = await self.db.execute(
            select(ParteDiario.id).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        if not rpt.scalars().first():
            raise NoEncontradoError("ParteDiario", reporte_id)

        result = await self.db.execute(
            select(ParteDiarioFoto)
            .where(ParteDiarioFoto.parte_diario_id == reporte_id)
            .order_by(ParteDiarioFoto.orden.asc())
        )
        fotos = list(result.scalars().all())
        return [
            FotoDto(
                id=f.id, parte_diario_id=f.parte_diario_id, filename=f.filename,
                original_name=f.original_name, mime_type=f.mime_type,
                size=f.size, orden=f.orden,
            )
            for f in fotos
        ]

    # ─── Eliminar foto ───────────────────────────────────────────────

    async def eliminar_foto(
        self, tenant_id: int, reporte_id: int, foto_id: int
    ) -> None:
        """Eliminar una foto de un reporte."""
        rpt = await self.db.execute(
            select(ParteDiario.id).where(
                ParteDiario.id == reporte_id,
                ParteDiario.tenant_id == tenant_id,
            )
        )
        if not rpt.scalars().first():
            raise NoEncontradoError("ParteDiario", reporte_id)

        foto_result = await self.db.execute(
            select(ParteDiarioFoto).where(
                ParteDiarioFoto.id == foto_id,
                ParteDiarioFoto.parte_diario_id == reporte_id,
            )
        )
        foto = foto_result.scalars().first()
        if not foto:
            raise NoEncontradoError("Foto", foto_id)

        await self.db.delete(foto)
        await self.db.commit()
        logger.info("foto_eliminada", foto_id=foto_id, reporte_id=reporte_id)
