"""Reglas de descuento PRD Anexo B — CORP-GEM-P-002.

Calcula si aplica descuento y cuántas horas/días corresponden según el tipo,
subtipo y parámetros del evento.

Conversión estándar: 1 día = 8 horas (jornada ordinaria).

Replica bff/src/utils/discount-rules.ts.
"""

from decimal import ROUND_HALF_UP, Decimal
from enum import StrEnum
from typing import NamedTuple


class TipoEventoDescuento(StrEnum):
    STAND_BY = "STAND_BY"
    AVERIA = "AVERIA"
    CLIMATICO = "CLIMATICO"
    OTRO = "OTRO"


class SubtipoEventoDescuento(StrEnum):
    # STAND_BY
    DOMINGO = "DOMINGO"
    FERIADO = "FERIADO"
    FALTA_DE_FRENTE = "FALTA_DE_FRENTE"
    # AVERIA
    ARRENDADOR = "ARRENDADOR"
    ARRENDATARIO = "ARRENDATARIO"
    MECANICA = "MECANICA"
    # CLIMATICO
    TOTAL = "TOTAL"
    PARCIAL = "PARCIAL"


class TipoTarifa(StrEnum):
    HORA = "HORA"
    DIA = "DIA"
    MES = "MES"


HORAS_JORNADA = Decimal(8)

_DOS_DECIMALES = Decimal("0.01")
_CINCO_HORAS = Decimal(5)
_CERO = Decimal(0)


class ResultadoDescuento(NamedTuple):
    """Resultado del cálculo de descuento."""

    aplica_descuento: bool
    descuento_calculado_horas: Decimal
    descuento_calculado_dias: Decimal
    razon: str


def _redondear2(n: Decimal) -> Decimal:
    return n.quantize(_DOS_DECIMALES, rounding=ROUND_HALF_UP)


def _horas_a_dias(horas: Decimal) -> Decimal:
    return _redondear2(horas / HORAS_JORNADA)


def _no_aplica(razon: str) -> ResultadoDescuento:
    return ResultadoDescuento(
        aplica_descuento=False,
        descuento_calculado_horas=_CERO,
        descuento_calculado_dias=_CERO,
        razon=razon,
    )


def _dia_completo(razon: str, *, es_por_hora: bool) -> ResultadoDescuento:
    return ResultadoDescuento(
        aplica_descuento=True,
        descuento_calculado_horas=HORAS_JORNADA if es_por_hora else _CERO,
        descuento_calculado_dias=_CERO if es_por_hora else Decimal(1),
        razon=razon,
    )


def _proporcional(horas: Decimal, razon: str, *, es_por_hora: bool) -> ResultadoDescuento:
    h = _redondear2(horas)
    return ResultadoDescuento(
        aplica_descuento=h > _CERO,
        descuento_calculado_horas=h if es_por_hora else _CERO,
        descuento_calculado_dias=_CERO if es_por_hora else _horas_a_dias(h),
        razon=razon,
    )


def _manual(
    horas_descuento: Decimal, razon: str, *, es_por_hora: bool
) -> ResultadoDescuento:
    h = _redondear2(horas_descuento)
    return ResultadoDescuento(
        aplica_descuento=h > _CERO,
        descuento_calculado_horas=h if es_por_hora else _CERO,
        descuento_calculado_dias=_CERO if es_por_hora else _horas_a_dias(h),
        razon=razon,
    )


def calcular_descuento(
    *,
    tipo: TipoEventoDescuento | str,
    subtipo: SubtipoEventoDescuento | str | None = None,
    horas_descuento: Decimal | float | int = 0,
    horas_horometro_mecanica: Decimal | float | int = 0,
    tipo_tarifa: TipoTarifa | str,
) -> ResultadoDescuento:
    """Calcula el descuento para un evento dado según las reglas PRD Anexo B.

    Args:
        tipo: Tipo de evento (STAND_BY, AVERIA, CLIMATICO, OTRO).
        subtipo: Subtipo del evento (DOMINGO, FERIADO, etc.).
        horas_descuento: Horas de paralización reportadas.
        horas_horometro_mecanica: Horas de horómetro para averías mecánicas.
        tipo_tarifa: Tipo de tarifa del contrato (HORA, DIA, MES).

    Returns:
        ResultadoDescuento con aplica_descuento, horas, días y razón.
    """
    tipo_str = str(tipo)
    subtipo_str = str(subtipo) if subtipo else None
    hd = Decimal(str(horas_descuento))
    hhm = Decimal(str(horas_horometro_mecanica))
    es_por_hora = str(tipo_tarifa) == TipoTarifa.HORA

    # ─── STAND_BY ──────────────────────────────────────────────────────────
    if tipo_str == TipoEventoDescuento.STAND_BY:
        if subtipo_str == SubtipoEventoDescuento.DOMINGO:
            return _no_aplica("Stand-by en domingo: sin descuento (jornada no computable)")
        if subtipo_str == SubtipoEventoDescuento.FERIADO:
            return _dia_completo(
                "Stand-by en feriado: descuento de 1 día completo",
                es_por_hora=es_por_hora,
            )
        if subtipo_str == SubtipoEventoDescuento.FALTA_DE_FRENTE:
            return _no_aplica(
                "Falta de frente: sin descuento (responsabilidad del arrendatario)"
            )
        return _manual(
            hd,
            "Stand-by sin subtipo: usando valores ingresados manualmente",
            es_por_hora=es_por_hora,
        )

    # ─── AVERIA ────────────────────────────────────────────────────────────
    if tipo_str == TipoEventoDescuento.AVERIA:
        if subtipo_str == SubtipoEventoDescuento.ARRENDADOR:
            if hd >= _CINCO_HORAS:
                return _dia_completo(
                    "Avería por arrendador ≥ 5 h: descuento de 1 día completo",
                    es_por_hora=es_por_hora,
                )
            return _proporcional(
                hd,
                f"Avería por arrendador < 5 h: descuento proporcional ({hd}h / {HORAS_JORNADA}h)",
                es_por_hora=es_por_hora,
            )
        if subtipo_str == SubtipoEventoDescuento.ARRENDATARIO:
            return _no_aplica(
                "Avería por arrendatario: sin descuento (responsabilidad propia)"
            )
        if subtipo_str == SubtipoEventoDescuento.MECANICA:
            return _proporcional(
                hhm,
                f"Avería mecánica: descuento proporcional ({hhm} h horómetro / {HORAS_JORNADA}h)",
                es_por_hora=es_por_hora,
            )
        return _manual(
            hd,
            "Avería sin subtipo: usando valores ingresados manualmente",
            es_por_hora=es_por_hora,
        )

    # ─── CLIMATICO ─────────────────────────────────────────────────────────
    if tipo_str == TipoEventoDescuento.CLIMATICO:
        if subtipo_str == SubtipoEventoDescuento.TOTAL:
            return _dia_completo(
                "Paralización climática total: descuento de 1 día completo",
                es_por_hora=es_por_hora,
            )
        if subtipo_str == SubtipoEventoDescuento.PARCIAL:
            return _proporcional(
                hd,
                f"Paralización climática parcial: descuento proporcional ({hd}h)",
                es_por_hora=es_por_hora,
            )
        return _manual(
            hd,
            "Climático sin subtipo: usando valores ingresados manualmente",
            es_por_hora=es_por_hora,
        )

    # ─── OTRO ──────────────────────────────────────────────────────────────
    return _manual(
        hd,
        "Evento de tipo OTRO: usando valores ingresados manualmente",
        es_por_hora=es_por_hora,
    )
