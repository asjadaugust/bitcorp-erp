"""Tests para reglas de descuento PRD Anexo B — CORP-GEM-P-002.

Cubre todas las combinaciones tipo/subtipo y adaptación por tipo_tarifa.
"""

from decimal import Decimal

from app.utils.reglas_descuento import (
    HORAS_JORNADA,
    ResultadoDescuento,
    SubtipoEventoDescuento,
    TipoEventoDescuento,
    TipoTarifa,
    calcular_descuento,
)

D = Decimal
CERO = D(0)
UNO = D(1)
OCHO = D(8)


# ─── STAND_BY ──────────────────────────────────────────────────────────────


def test_standby_domingo_no_aplica() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.STAND_BY,
        subtipo=SubtipoEventoDescuento.DOMINGO,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is False
    assert r.descuento_calculado_horas == CERO
    assert r.descuento_calculado_dias == CERO


def test_standby_feriado_dia_completo_tarifa_dia() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.STAND_BY,
        subtipo=SubtipoEventoDescuento.FERIADO,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == UNO
    assert r.descuento_calculado_horas == CERO


def test_standby_feriado_tarifa_hora() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.STAND_BY,
        subtipo=SubtipoEventoDescuento.FERIADO,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_horas == HORAS_JORNADA
    assert r.descuento_calculado_dias == CERO


def test_standby_falta_de_frente_no_aplica() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.STAND_BY,
        subtipo=SubtipoEventoDescuento.FALTA_DE_FRENTE,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is False
    assert r.descuento_calculado_horas == CERO
    assert r.descuento_calculado_dias == CERO


def test_standby_sin_subtipo_manual() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.STAND_BY,
        subtipo=None,
        horas_descuento=3,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_horas == D(3)


def test_standby_sin_subtipo_cero_horas() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.STAND_BY,
        subtipo=None,
        horas_descuento=0,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is False


# ─── AVERIA ────────────────────────────────────────────────────────────────


def test_averia_arrendador_menos_5h_proporcional() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=SubtipoEventoDescuento.ARRENDADOR,
        horas_descuento=3,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_horas == D(3)
    assert r.descuento_calculado_dias == CERO


def test_averia_arrendador_exactamente_5h_dia_completo() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=SubtipoEventoDescuento.ARRENDADOR,
        horas_descuento=5,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == UNO


def test_averia_arrendador_mas_5h_dia_completo() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=SubtipoEventoDescuento.ARRENDADOR,
        horas_descuento=7,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == UNO


def test_averia_arrendador_menos_5h_tarifa_dia() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=SubtipoEventoDescuento.ARRENDADOR,
        horas_descuento=4,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == D("0.50")
    assert r.descuento_calculado_horas == CERO


def test_averia_arrendatario_no_aplica() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=SubtipoEventoDescuento.ARRENDATARIO,
        horas_descuento=8,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is False
    assert r.descuento_calculado_horas == CERO
    assert r.descuento_calculado_dias == CERO


def test_averia_mecanica_proporcional_hora() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=SubtipoEventoDescuento.MECANICA,
        horas_horometro_mecanica=4,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_horas == D(4)


def test_averia_mecanica_proporcional_dia() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=SubtipoEventoDescuento.MECANICA,
        horas_horometro_mecanica=6,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == D("0.75")


def test_averia_sin_subtipo_manual() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=None,
        horas_descuento=2,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_horas == D(2)


# ─── CLIMATICO ─────────────────────────────────────────────────────────────


def test_climatico_total_dia_completo() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.CLIMATICO,
        subtipo=SubtipoEventoDescuento.TOTAL,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == UNO


def test_climatico_total_tarifa_hora() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.CLIMATICO,
        subtipo=SubtipoEventoDescuento.TOTAL,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_horas == OCHO


def test_climatico_parcial_proporcional() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.CLIMATICO,
        subtipo=SubtipoEventoDescuento.PARCIAL,
        horas_descuento=3.5,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_horas == D("3.50")


def test_climatico_parcial_tarifa_dia() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.CLIMATICO,
        subtipo=SubtipoEventoDescuento.PARCIAL,
        horas_descuento=2,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == D("0.25")


def test_climatico_sin_subtipo_manual() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.CLIMATICO,
        subtipo=None,
        horas_descuento=4,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == D("0.50")


# ─── OTRO ──────────────────────────────────────────────────────────────────


def test_otro_con_horas() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.OTRO,
        horas_descuento=5,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_horas == D(5)


def test_otro_sin_horas() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.OTRO,
        horas_descuento=0,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert r.aplica_descuento is False


def test_otro_tarifa_mes() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.OTRO,
        horas_descuento=8,
        tipo_tarifa=TipoTarifa.MES,
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == UNO
    assert r.descuento_calculado_horas == CERO


# ─── String inputs (como vienen del API) ───────────────────────────────────


def test_acepta_strings_en_vez_de_enums() -> None:
    r = calcular_descuento(
        tipo="STAND_BY",
        subtipo="FERIADO",
        tipo_tarifa="DIA",
    )
    assert r.aplica_descuento is True
    assert r.descuento_calculado_dias == UNO


# ─── ResultadoDescuento es NamedTuple ──────────────────────────────────────


def test_resultado_es_namedtuple() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.STAND_BY,
        subtipo=SubtipoEventoDescuento.DOMINGO,
        tipo_tarifa=TipoTarifa.DIA,
    )
    assert isinstance(r, ResultadoDescuento)
    assert isinstance(r, tuple)
    aplica, horas, dias, razon = r
    assert aplica is False
    assert horas == CERO
    assert dias == CERO
    assert "domingo" in razon.lower()


# ─── Redondeo ──────────────────────────────────────────────────────────────


def test_redondeo_dos_decimales() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.CLIMATICO,
        subtipo=SubtipoEventoDescuento.PARCIAL,
        horas_descuento=D("3.333"),
        tipo_tarifa=TipoTarifa.DIA,
    )
    # 3.33 / 8 = 0.416... → 0.42
    assert r.descuento_calculado_dias == D("0.42")


def test_razon_contiene_info_util() -> None:
    r = calcular_descuento(
        tipo=TipoEventoDescuento.AVERIA,
        subtipo=SubtipoEventoDescuento.ARRENDADOR,
        horas_descuento=3,
        tipo_tarifa=TipoTarifa.HORA,
    )
    assert "arrendador" in r.razon.lower()
    assert "proporcional" in r.razon.lower()
