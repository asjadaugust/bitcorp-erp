"""Transformadores de entidades a DTOs para generacion de PDFs.

Equivale a daily-report-pdf-transformer.ts y acta-entrega-pdf-transformer.ts del BFF.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any


def _formato_fecha(fecha: str | datetime | None) -> str:
    """DD/MM/YYYY."""
    if not fecha:
        return ""
    if isinstance(fecha, str):
        try:
            fecha = datetime.fromisoformat(fecha)
        except ValueError:
            return str(fecha)
    return f"{fecha.day:02d}/{fecha.month:02d}/{fecha.year}"


def _formato_hora(hora: str | None) -> str | None:
    """HH:MM."""
    if not hora:
        return None
    return hora[:5]


# ---------------------------------------------------------------------------
# Parte Diario (Daily Report)
# ---------------------------------------------------------------------------

def transformar_parte_diario(reporte: dict[str, Any]) -> dict[str, Any]:
    """Transforma entidad de parte diario a DTO para plantilla PDF.

    Recibe un dict con los campos del reporte (ya en snake_case).
    Retorna un dict listo para pasar a la plantilla Jinja2.
    """
    # Produccion: asegurar 16 filas para layout consistente
    produccion_raw = reporte.get("produccion", []) or []
    produccion = []
    for row in sorted(produccion_raw, key=lambda r: r.get("numero", 0)):
        produccion.append({
            "numero": row.get("numero", 0),
            "ubicacion_prog_ini": row.get("ubicacion_prog_ini", ""),
            "ubicacion_prog_fin": row.get("ubicacion_prog_fin", ""),
            "hora_ini": _formato_hora(row.get("hora_ini")),
            "hora_fin": _formato_hora(row.get("hora_fin")),
            "material_descripcion": row.get("material_descripcion", ""),
            "metrado": row.get("metrado", ""),
            "edt": row.get("edt", ""),
        })
    while len(produccion) < 16:
        produccion.append({
            "numero": len(produccion) + 1,
            "ubicacion_prog_ini": "",
            "ubicacion_prog_fin": "",
            "hora_ini": None,
            "hora_fin": None,
            "material_descripcion": "",
            "metrado": "",
            "edt": "",
        })

    # Actividades de produccion (lista de {codigo, descripcion})
    actividades = reporte.get("actividades_produccion", []) or []

    # Demoras operativas (lista de codigos)
    demoras_op = reporte.get("demoras_operativas", []) or []

    # Otros eventos (lista de {codigo, descripcion})
    otros = reporte.get("otros_eventos", []) or []

    # Demoras mecanicas (lista de {codigo, descripcion})
    demoras_mec = reporte.get("demoras_mecanicas", []) or []

    # Calcular totales
    horo_ini = _to_float(reporte.get("horometro_inicial"))
    horo_fin = _to_float(reporte.get("horometro_final"))
    km_ini = _to_float(reporte.get("kilometraje_inicial"))
    km_fin = _to_float(reporte.get("kilometraje_final"))

    return {
        # Metadata
        "razon_social": reporte.get("razon_social", "Consorcio La Union"),
        "codigo_forma": reporte.get("codigo_forma", "CLUC-GEM-F-005"),
        "version": reporte.get("version", "01"),
        # Info basica
        "proyecto": reporte.get("proyecto", ""),
        "fecha": _formato_fecha(reporte.get("fecha")),
        "turno": reporte.get("turno", "DIA"),
        "numero_parte": str(reporte.get("numero_parte", "")),
        "codigo_equipo": reporte.get("codigo_equipo", ""),
        "empresa": reporte.get("empresa", "Consorcio La Union"),
        "equipo": reporte.get("equipo", ""),
        "operador": reporte.get("operador", ""),
        "placa": reporte.get("placa", ""),
        "responsable_frente": reporte.get("responsable_frente", ""),
        # Horometro / Kilometraje
        "horometro_inicial": horo_ini,
        "horometro_final": horo_fin,
        "horometro_total": (
            (horo_fin - horo_ini) if horo_ini is not None and horo_fin is not None else None
        ),
        "kilometraje_inicial": km_ini,
        "kilometraje_final": km_fin,
        "kilometraje_total": (
            (km_fin - km_ini) if km_ini is not None and km_fin is not None else None
        ),
        # Combustible
        "petroleo_gln": _to_float(reporte.get("petroleo_gln")),
        "gasolina_gln": _to_float(reporte.get("gasolina_gln")),
        "hora_abastecimiento": _formato_hora(reporte.get("hora_abastecimiento")),
        "num_vale_combustible": reporte.get("num_vale_combustible", ""),
        "horometro_kilometraje": reporte.get("horometro_kilometraje", ""),
        "horas_precalentamiento": _to_float(reporte.get("horas_precalentamiento")),
        # Ubicacion
        "lugar_salida": reporte.get("lugar_salida", ""),
        "lugar_llegada": reporte.get("lugar_llegada", ""),
        # Produccion
        "produccion": produccion,
        # Actividades y demoras
        "actividades_produccion": actividades,
        "demoras_operativas": demoras_op,
        "otros_eventos": otros,
        "demoras_mecanicas": demoras_mec,
        # Observaciones
        "observaciones_correcciones": reporte.get("observaciones_correcciones", ""),
        # Firmas
        "firma_operador": reporte.get("firma_operador"),
        "firma_supervisor": reporte.get("firma_supervisor"),
        "firma_jefe_equipos": reporte.get("firma_jefe_equipos"),
        "firma_residente": reporte.get("firma_residente"),
        "firma_planeamiento_control": reporte.get("firma_planeamiento_control"),
    }


# ---------------------------------------------------------------------------
# Acta de Entrega
# ---------------------------------------------------------------------------

CONDICION_LABELS = {
    "BUENO": "Bueno",
    "REGULAR": "Regular",
    "MALO": "Malo",
    "CON_OBSERVACIONES": "Con Observaciones",
}

TIPO_LABELS = {
    "ENTREGA": "Entrega",
    "MOBILIZACION": "Movilizacion",
    "TRANSFERENCIA": "Transferencia",
}


def transformar_acta_entrega(acta: dict[str, Any]) -> dict[str, Any]:
    """Transforma datos de acta de entrega a DTO para plantilla PDF."""
    condicion = acta.get("condicion_equipo", "")
    return {
        "razon_social": acta.get("razon_social", "Consorcio La Union"),
        "codigo_forma": acta.get("codigo_forma", "CLUC-GEM-F-010"),
        "version": acta.get("version", "01"),
        "codigo": acta.get("codigo", ""),
        "fecha_entrega": _formato_fecha(acta.get("fecha_entrega")),
        "tipo": TIPO_LABELS.get(acta.get("tipo", ""), acta.get("tipo", "")),
        "estado": acta.get("estado", ""),
        "equipo_id": acta.get("equipo_id", ""),
        "condicion_equipo": CONDICION_LABELS.get(condicion, condicion),
        "horometro_entrega": str(acta.get("horometro_entrega", "-")),
        "kilometraje_entrega": str(acta.get("kilometraje_entrega", "-")),
        "contrato_id": str(acta.get("contrato_id", "-")),
        "proyecto_id": str(acta.get("proyecto_id", "-")),
        "observaciones": acta.get("observaciones", "-"),
        "observaciones_fisicas": acta.get("observaciones_fisicas", "-"),
        "tiene_firma_entregado": acta.get("tiene_firma_entregado", False),
        "tiene_firma_recibido": acta.get("tiene_firma_recibido", False),
        "fecha_firma": _formato_fecha(acta.get("fecha_firma")) or "-",
    }


# ---------------------------------------------------------------------------
# Utilidades internas
# ---------------------------------------------------------------------------

def _to_float(valor: Any) -> float | None:
    """Convierte a float, retorna None si no es posible."""
    if valor is None:
        return None
    try:
        return float(valor)
    except (ValueError, TypeError):
        return None
