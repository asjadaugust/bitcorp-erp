"""Tests para servicio de generacion de PDFs."""

from __future__ import annotations

import io
from datetime import datetime

import pytest

from app.servicios.pdf import (
    ServicioPdf,
    filtro_includes,
    filtro_lowercase,
    formato_decimal,
    formato_fecha,
    formato_fecha_hora,
    formato_moneda,
    formato_numero,
    get_description,
    has_code,
)
from app.utils.transformar_pdf import (
    transformar_acta_entrega,
    transformar_parte_diario,
)

# --- Filtros Jinja2 ---


def test_filtro_formato_fecha() -> None:
    """formato_fecha debe retornar DD/MM/YYYY."""
    assert formato_fecha(datetime(2024, 3, 15)) == "15/03/2024"
    assert formato_fecha("2024-12-01") == "01/12/2024"
    assert formato_fecha(None) == ""
    assert formato_fecha("") == ""
    assert formato_fecha(datetime(2025, 1, 5, 14, 30)) == "05/01/2025"


def test_filtro_formato_fecha_hora() -> None:
    """formato_fecha_hora debe retornar DD/MM/YYYY HH:MM:SS."""
    assert formato_fecha_hora(datetime(2024, 3, 15, 9, 30, 45)) == "15/03/2024 09:30:45"
    assert formato_fecha_hora(None) == ""


def test_filtro_formato_moneda() -> None:
    """formato_moneda debe usar formato espanol 1.234,56."""
    assert formato_moneda(1234.56) == "1.234,56"
    assert formato_moneda(0) == "0,00"
    assert formato_moneda(None) == "0,00"
    assert formato_moneda("1500.75") == "1.500,75"
    assert formato_moneda(1000000) == "1.000.000,00"
    assert formato_moneda(99.9) == "99,90"
    assert formato_moneda(-500.25) == "-500,25"


def test_filtro_formato_decimal() -> None:
    """formato_decimal debe formatear con precision variable."""
    assert formato_decimal(1234.5678, 2) == "1.234,57"
    assert formato_decimal(0.5, 2) == "0,50"
    assert formato_decimal(None, 2) == "0"
    assert formato_decimal("3.14159", 4) == "3,1416"
    assert formato_decimal(1000, 0) == "1.000"


def test_filtro_formato_numero() -> None:
    """formato_numero debe usar separador de miles."""
    assert formato_numero(12345, 0) == "12.345"
    assert formato_numero(12345.678, 2) == "12.345,68"


def test_has_code() -> None:
    """has_code verifica si una lista tiene un item con codigo dado."""
    items = [{"codigo": "01", "descripcion": "Corte"}, {"codigo": "05"}]
    assert has_code(items, "01") is True
    assert has_code(items, "99") is False
    assert has_code(None, "01") is False
    assert has_code([], "01") is False


def test_get_description() -> None:
    """get_description retorna la descripcion del item con codigo."""
    items = [{"codigo": "01", "descripcion": "Corte en Banco"}, {"codigo": "05"}]
    assert get_description(items, "01") == "Corte en Banco"
    assert get_description(items, "05") == ""
    assert get_description(items, "99") == ""
    assert get_description(None, "01") == ""


def test_filtro_includes() -> None:
    """filtro_includes verifica pertenencia en lista."""
    assert filtro_includes(["D01", "D02"], "D01") is True
    assert filtro_includes(["D01", "D02"], "D03") is False
    assert filtro_includes(None, "D01") is False


def test_filtro_lowercase() -> None:
    """filtro_lowercase convierte a minusculas."""
    assert filtro_lowercase("BORRADOR") == "borrador"
    assert filtro_lowercase(None) == ""


# --- Renderizacion de plantillas ---


def test_renderizar_plantilla_parte_diario() -> None:
    """La plantilla parte-diario.html debe renderizar HTML valido."""
    servicio = ServicioPdf()
    datos = {
        "estilos_css": "body { font-size: 10px; }",
        "razon_social": "Test Corp",
        "codigo_forma": "TEST-001",
        "version": "01",
        "proyecto": "Proyecto Test",
        "fecha": "15/03/2024",
        "turno": "DIA",
        "numero_parte": "42",
        "codigo_equipo": "EQ-001",
        "empresa": "Test Corp",
        "equipo": "Excavadora CAT 320",
        "operador": "Juan Perez",
        "placa": "ABC-123",
        "responsable_frente": "Pedro Garcia",
        "horometro_inicial": 1000.0,
        "horometro_final": 1008.5,
        "horometro_total": 8.5,
        "kilometraje_inicial": None,
        "kilometraje_final": None,
        "kilometraje_total": None,
        "petroleo_gln": 25.0,
        "gasolina_gln": None,
        "hora_abastecimiento": "06:30",
        "num_vale_combustible": "VCB-0001",
        "horometro_kilometraje": "1004.25",
        "horas_precalentamiento": 0.5,
        "lugar_salida": "Campamento Base",
        "lugar_llegada": "Frente 3",
        "produccion": [
            {
                "numero": 1,
                "ubicacion_prog_ini": "0+000",
                "ubicacion_prog_fin": "0+500",
                "hora_ini": "07:00",
                "hora_fin": "12:00",
                "material_descripcion": "Excavacion en roca",
                "metrado": "150 m3",
                "edt": "EDT-01",
            }
        ],
        "actividades_produccion": [{"codigo": "01", "descripcion": "Corte en Banco"}],
        "demoras_operativas": ["D01"],
        "otros_eventos": [],
        "demoras_mecanicas": [],
        "observaciones_correcciones": "Sin observaciones",
        "firma_operador": None,
        "firma_supervisor": None,
        "firma_jefe_equipos": None,
        "firma_residente": None,
        "firma_planeamiento_control": None,
    }
    html = servicio.renderizar_plantilla("parte-diario.html", datos)
    assert "PARTE DIARIO DE EQUIPOS" in html
    assert "Test Corp" in html
    assert "Excavadora CAT 320" in html
    assert "Juan Perez" in html
    assert "VCB-0001" in html


def test_renderizar_plantilla_contrato() -> None:
    """La plantilla contrato.html debe renderizar HTML valido."""
    servicio = ServicioPdf()
    datos = {
        "styles": "body { font-size: 9pt; }",
        "logo": "",
        "contrato": {
            "numero_contrato": "CTR-001",
            "tipo": "CONTRATO",
            "estado": "ACTIVO",
            "fecha_contrato": "2024-01-15",
            "modalidad": "MAQUINA SECA",
            "moneda": "PEN",
            "tipo_tarifa": "HORA",
            "tarifa": 150.0,
            "horas_incluidas": 200,
            "penalidad_exceso": 25.0,
            "minimo_por": "MES",
            "cantidad_minima": 200,
            "incluye_operador": True,
            "incluye_motor": False,
            "costo_adicional_motor": None,
            "fecha_inicio": "2024-01-15",
            "fecha_fin": "2024-12-31",
            "plazo_texto": None,
            "jurisdiccion": None,
            "documento_acredita": "Tarjeta de Propiedad",
            "motivo_resolucion": None,
            "condiciones_especiales": None,
        },
        "proveedor": {
            "razon_social": "Proveedor SAC",
            "ruc": "20123456789",
            "representante": "Maria Lopez",
            "direccion": "Av. Principal 123",
            "telefono": "987654321",
        },
        "equipo": {
            "codigo": "EQ-001",
            "marca": "CAT",
            "modelo": "320D",
            "placa": "ABC-123",
            "numero_serie": "SN12345",
            "numero_chasis": "CH12345",
            "numero_motor": "MT12345",
            "anio_fabricacion": 2020,
        },
        "arrendatario": {
            "razon_social": "Consorcio La Union",
            "ruc": "20987654321",
            "representante": "Carlos Ruiz",
            "domicilio": "Calle Proyecto 456",
        },
        "fecha_generacion": "15/03/2024",
    }
    html = servicio.renderizar_plantilla("contrato.html", datos)
    assert "Contrato de Alquiler de Equipo" in html
    assert "CTR-001" in html
    assert "Proveedor SAC" in html
    assert "CAT" in html


def test_renderizar_plantilla_acta_entrega() -> None:
    """La plantilla acta-entrega.html debe renderizar HTML valido."""
    servicio = ServicioPdf()
    datos = {
        "razon_social": "Consorcio La Union",
        "codigo_forma": "CLUC-GEM-F-010",
        "version": "01",
        "codigo": "ADE-0001",
        "fecha_entrega": "15/03/2024",
        "tipo": "Entrega",
        "estado": "PENDIENTE",
        "equipo_id": 1,
        "condicion_equipo": "Bueno",
        "horometro_entrega": "5000.00",
        "kilometraje_entrega": "-",
        "contrato_id": "1",
        "proyecto_id": "1",
        "observaciones": "Sin observaciones",
        "observaciones_fisicas": "Equipo en buen estado",
        "tiene_firma_entregado": True,
        "tiene_firma_recibido": False,
        "fecha_firma": "-",
    }
    html = servicio.renderizar_plantilla("acta-entrega.html", datos)
    assert "ACTA DE ENTREGA DE EQUIPO" in html
    assert "ADE-0001" in html
    assert "Consorcio La Union" in html


# --- Transformadores ---


def test_transformar_parte_diario_dto() -> None:
    """transformar_parte_diario debe producir estructura correcta."""
    reporte = {
        "razon_social": "Test Corp",
        "fecha": "2024-03-15",
        "turno": "DIA",
        "numero_parte": 42,
        "codigo_equipo": "EQ-001",
        "equipo": "Excavadora",
        "operador": "Juan",
        "horometro_inicial": "1000.00",
        "horometro_final": "1008.50",
        "kilometraje_inicial": None,
        "kilometraje_final": None,
        "produccion": [
            {"numero": 1, "ubicacion_prog_ini": "0+000", "ubicacion_prog_fin": "0+500",
             "hora_ini": "07:00:00", "hora_fin": "12:00:00",
             "material_descripcion": "Excavacion", "metrado": "150", "edt": "EDT-01"},
        ],
        "actividades_produccion": [{"codigo": "01", "descripcion": "Corte"}],
        "demoras_operativas": ["D01"],
    }
    dto = transformar_parte_diario(reporte)
    assert dto["numero_parte"] == "42"
    assert dto["fecha"] == "15/03/2024"
    assert dto["horometro_total"] == pytest.approx(8.5)
    assert len(dto["produccion"]) == 16  # Padded to 16 rows
    assert dto["produccion"][0]["hora_ini"] == "07:00"
    assert dto["demoras_operativas"] == ["D01"]


def test_transformar_acta_entrega_dto() -> None:
    """transformar_acta_entrega debe mapear condiciones correctamente."""
    acta = {
        "codigo": "ADE-0001",
        "fecha_entrega": "2024-03-15",
        "tipo": "ENTREGA",
        "estado": "PENDIENTE",
        "condicion_equipo": "BUENO",
        "horometro_entrega": 5000,
        "kilometraje_entrega": None,
        "contrato_id": 1,
        "proyecto_id": 2,
        "observaciones": "OK",
        "observaciones_fisicas": "Sin danos",
        "tiene_firma_entregado": True,
        "tiene_firma_recibido": False,
        "fecha_firma": None,
    }
    dto = transformar_acta_entrega(acta)
    assert dto["condicion_equipo"] == "Bueno"
    assert dto["tipo"] == "Entrega"
    assert dto["codigo"] == "ADE-0001"
    assert dto["tiene_firma_entregado"] is True
    assert dto["tiene_firma_recibido"] is False


# --- PDF merge (pypdf) ---


def test_merge_pdf_valorizacion() -> None:
    """generar_pdf_valorizacion_completa debe merge multiples PDFs."""
    from pypdf import PdfWriter

    # Crear 2 PDFs de prueba
    pdfs_mock: list[bytes] = []
    for i in range(2):
        writer = PdfWriter()
        writer.add_blank_page(width=595, height=842)  # A4
        buf = io.BytesIO()
        writer.write(buf)
        pdfs_mock.append(buf.getvalue())

    servicio = ServicioPdf()
    import asyncio

    merged = asyncio.get_event_loop().run_until_complete(
        servicio.generar_pdf_valorizacion_completa(pdfs_mock)
    )
    # Verificar que el resultado es un PDF valido con 2 paginas
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(merged))
    assert len(reader.pages) == 2
