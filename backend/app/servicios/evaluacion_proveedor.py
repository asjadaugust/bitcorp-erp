"""Servicio para evaluacion de proveedor."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.logging import obtener_logger
from app.core.excepciones import NoEncontradoError
from app.esquemas.evaluacion_proveedor import (
    CriterioSeleccionEvaluacionDto,
    EvaluacionProveedorActualizar,
    EvaluacionProveedorCrear,
    EvaluacionProveedorDetalleDto,
    EvaluacionProveedorListaDto,
)
from app.modelos.proveedores import (
    CriterioSeleccionEvaluacion,
    EvaluacionProveedor,
)

logger = obtener_logger(__name__)


# --- Scoring helpers ---


def _calcular_resultado(puntaje: float | None) -> tuple[str, str]:
    """Derive resultado and accion from puntaje using scoring ranges."""
    if puntaje is None:
        return ("", "")
    if puntaje <= 10:
        return ("Pesimo", "Buscar otros proveedores")
    if puntaje <= 12:
        return ("Regular", "Se requiere mejora")
    if puntaje <= 15:
        return ("Bueno", "Se continua trabajando")
    if puntaje <= 18:
        return ("Muy Bueno", "Se continua trabajando")
    return ("Excelente", "Proveedor estrategico")


# --- Mappers ---


def _criterio_a_dto(e: CriterioSeleccionEvaluacion) -> CriterioSeleccionEvaluacionDto:
    return CriterioSeleccionEvaluacionDto(
        id=e.id,
        seleccion_evaluacion=e.seleccion_evaluacion,
        proveedor_de=e.proveedor_de,
        aspecto=e.aspecto,
        aspecto_peso=float(e.aspecto_peso) if e.aspecto_peso is not None else None,
        criterio_seleccion=e.criterio_seleccion,
        criterio_seleccion_peso=(
            float(e.criterio_seleccion_peso)
            if e.criterio_seleccion_peso is not None
            else None
        ),
        parametro=e.parametro,
        punto=float(e.punto) if e.punto is not None else None,
        puntaje=float(e.puntaje) if e.puntaje is not None else None,
    )


def _evaluacion_a_lista_dto(e: EvaluacionProveedor) -> EvaluacionProveedorListaDto:
    return EvaluacionProveedorListaDto(
        id=e.id,
        ruc=e.ruc,
        razon_social=e.razon_social,
        puntaje=float(e.puntaje) if e.puntaje is not None else None,
        resultado=e.resultado,
        accion=e.accion,
        fecha_evaluacion=e.fecha_evaluacion.isoformat() if e.fecha_evaluacion else None,
    )


def _evaluacion_a_detalle_dto(e: EvaluacionProveedor) -> EvaluacionProveedorDetalleDto:
    return EvaluacionProveedorDetalleDto(
        id=e.id,
        legacy_id=e.legacy_id,
        ruc=e.ruc,
        razon_social=e.razon_social,
        precio=e.precio,
        plazo_pago=e.plazo_pago,
        calidad=e.calidad,
        plazo_cumplimiento=e.plazo_cumplimiento,
        ubicacion=e.ubicacion,
        atencion_cliente=e.atencion_cliente,
        sgc=e.sgc,
        sgsst=e.sgsst,
        sga=e.sga,
        puntaje=float(e.puntaje) if e.puntaje is not None else None,
        resultado=e.resultado,
        accion=e.accion,
        parametro_valor=e.parametro_valor,
        observacion=e.observacion,
        fecha_evaluacion=e.fecha_evaluacion.isoformat() if e.fecha_evaluacion else None,
        evaluado_por=e.evaluado_por,
        created_at=e.created_at.isoformat() if e.created_at else None,
        updated_at=e.updated_at.isoformat() if e.updated_at else None,
    )


class ServicioEvaluacionProveedor:
    """Servicio para gestion de evaluacion de proveedores."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # --- CriterioSeleccionEvaluacion (read-only) ---

    async def listar_criterios(self) -> list[CriterioSeleccionEvaluacionDto]:
        """Listar todos los criterios de seleccion/evaluacion."""
        resultado = await self.db.execute(
            select(CriterioSeleccionEvaluacion).order_by(CriterioSeleccionEvaluacion.id)
        )
        entidades = list(resultado.scalars().all())
        logger.info("criterios_evaluacion_listados", total=len(entidades))
        return [_criterio_a_dto(e) for e in entidades]

    # --- EvaluacionProveedor ---

    async def listar_evaluaciones(
        self,
        pagina: int = 1,
        limite: int = 20,
        resultado_filter: str | None = None,
    ) -> tuple[list[EvaluacionProveedorListaDto], int]:
        """Listar evaluaciones con paginacion y filtro opcional por resultado."""
        consulta = select(EvaluacionProveedor)
        consulta_count = select(func.count()).select_from(EvaluacionProveedor)

        if resultado_filter:
            consulta = consulta.where(EvaluacionProveedor.resultado == resultado_filter)
            consulta_count = consulta_count.where(
                EvaluacionProveedor.resultado == resultado_filter
            )

        # Count
        resultado_count = await self.db.execute(consulta_count)
        total = resultado_count.scalar() or 0

        # Paginate
        consulta = consulta.order_by(EvaluacionProveedor.id.desc())
        consulta = consulta.offset((pagina - 1) * limite).limit(limite)

        resultado = await self.db.execute(consulta)
        entidades = list(resultado.scalars().all())
        logger.info("evaluaciones_proveedor_listadas", total=total, pagina=pagina)
        return [_evaluacion_a_lista_dto(e) for e in entidades], total

    async def listar_por_proveedor(self, ruc: str) -> list[EvaluacionProveedorListaDto]:
        """Listar evaluaciones filtradas por RUC del proveedor."""
        resultado = await self.db.execute(
            select(EvaluacionProveedor)
            .where(EvaluacionProveedor.ruc == ruc)
            .order_by(EvaluacionProveedor.id.desc())
        )
        entidades = list(resultado.scalars().all())
        logger.info("evaluaciones_por_proveedor", ruc=ruc, total=len(entidades))
        return [_evaluacion_a_lista_dto(e) for e in entidades]

    async def obtener_evaluacion(self, eval_id: int) -> EvaluacionProveedorDetalleDto:
        """Obtener evaluacion de proveedor por ID."""
        resultado = await self.db.execute(
            select(EvaluacionProveedor).where(EvaluacionProveedor.id == eval_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EvaluacionProveedor", str(eval_id))
        return _evaluacion_a_detalle_dto(entidad)

    async def crear_evaluacion(
        self, datos: EvaluacionProveedorCrear
    ) -> EvaluacionProveedor:
        """Crear una nueva evaluacion de proveedor con auto-scoring."""
        resultado_text, accion = _calcular_resultado(datos.puntaje)

        entidad = EvaluacionProveedor(
            ruc=datos.ruc,
            razon_social=datos.razon_social,
            precio=datos.precio,
            plazo_pago=datos.plazo_pago,
            calidad=datos.calidad,
            plazo_cumplimiento=datos.plazo_cumplimiento,
            ubicacion=datos.ubicacion,
            atencion_cliente=datos.atencion_cliente,
            sgc=datos.sgc,
            sgsst=datos.sgsst,
            sga=datos.sga,
            puntaje=datos.puntaje,
            resultado=resultado_text,
            accion=accion,
            observacion=datos.observacion,
            fecha_evaluacion=(
                datetime.fromisoformat(datos.fecha_evaluacion)
                if datos.fecha_evaluacion
                else None
            ),
            evaluado_por=datos.evaluado_por,
        )
        self.db.add(entidad)
        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("evaluacion_proveedor_creada", id=entidad.id)
        return entidad

    async def actualizar_evaluacion(
        self, eval_id: int, datos: EvaluacionProveedorActualizar
    ) -> EvaluacionProveedor:
        """Actualizar una evaluacion de proveedor con auto-scoring."""
        resultado = await self.db.execute(
            select(EvaluacionProveedor).where(EvaluacionProveedor.id == eval_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EvaluacionProveedor", str(eval_id))

        campos = datos.model_dump(exclude_unset=True)
        if "fecha_evaluacion" in campos and campos["fecha_evaluacion"]:
            campos["fecha_evaluacion"] = datetime.fromisoformat(
                campos["fecha_evaluacion"]
            )
        for campo, valor in campos.items():
            setattr(entidad, campo, valor)

        # Re-derive resultado and accion from (possibly updated) puntaje
        puntaje_actual = float(entidad.puntaje) if entidad.puntaje is not None else None
        resultado_text, accion = _calcular_resultado(puntaje_actual)
        entidad.resultado = resultado_text
        entidad.accion = accion

        await self.db.commit()
        await self.db.refresh(entidad)
        logger.info("evaluacion_proveedor_actualizada", id=eval_id)
        return entidad

    async def eliminar_evaluacion(self, eval_id: int) -> None:
        """Eliminar una evaluacion de proveedor."""
        resultado = await self.db.execute(
            select(EvaluacionProveedor).where(EvaluacionProveedor.id == eval_id)
        )
        entidad = resultado.scalars().first()
        if not entidad:
            raise NoEncontradoError("EvaluacionProveedor", str(eval_id))

        await self.db.delete(entidad)
        await self.db.commit()
        logger.info("evaluacion_proveedor_eliminada", id=eval_id)
