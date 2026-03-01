"""Servicio de generacion de PDFs con Playwright y Jinja2.

Usa Playwright para renderizar HTML→PDF y pypdf para merge multi-pagina.
"""

from __future__ import annotations

import math
from datetime import datetime
from pathlib import Path
from typing import Any

import jinja2
from pypdf import PdfReader, PdfWriter

try:
    from playwright.async_api import Browser, async_playwright

    PLAYWRIGHT_DISPONIBLE = True
except ImportError:
    PLAYWRIGHT_DISPONIBLE = False
    Browser = Any  # type: ignore[assignment,misc]

RUTA_PLANTILLAS = Path(__file__).resolve().parent.parent / "plantillas"


# ---------------------------------------------------------------------------
# Filtros Jinja2 personalizados (equivalen a registerHandlebarsHelpers)
# ---------------------------------------------------------------------------


def formato_fecha(valor: str | datetime | None) -> str:
    """DD/MM/YYYY."""
    if not valor:
        return ""
    if isinstance(valor, str):
        try:
            valor = datetime.fromisoformat(valor)
        except ValueError:
            return str(valor)
    return f"{valor.day:02d}/{valor.month:02d}/{valor.year}"


def formato_fecha_hora(valor: str | datetime | None) -> str:
    """DD/MM/YYYY HH:MM:SS."""
    if not valor:
        return ""
    if isinstance(valor, str):
        try:
            valor = datetime.fromisoformat(valor)
        except ValueError:
            return str(valor)
    return (
        f"{valor.day:02d}/{valor.month:02d}/{valor.year} "
        f"{valor.hour:02d}:{valor.minute:02d}:{valor.second:02d}"
    )


def formato_moneda(valor: float | str | int | None) -> str:
    """Formato espanol: 1.234,56."""
    if valor is None:
        return "0,00"
    try:
        num = float(valor)
    except (ValueError, TypeError):
        return "0,00"
    if math.isnan(num):
        return "0,00"
    negativo = num < 0
    num = abs(num)
    entero = int(num)
    decimales = f"{num:.2f}".split(".")[1]
    # Separador de miles
    parte_entera = ""
    s = str(entero)
    for i, c in enumerate(reversed(s)):
        if i > 0 and i % 3 == 0:
            parte_entera = "." + parte_entera
        parte_entera = c + parte_entera
    resultado = f"{parte_entera},{decimales}"
    return f"-{resultado}" if negativo else resultado


def formato_decimal(valor: float | str | int | None, decimales: int = 2) -> str:
    """Formato espanol con precision variable."""
    if valor is None:
        return "0"
    try:
        num = float(valor)
    except (ValueError, TypeError):
        return "0"
    if math.isnan(num):
        return "0"
    fixed = f"{num:.{decimales}f}"
    partes = fixed.split(".")
    entero = int(partes[0]) if partes[0].lstrip("-").isdigit() else 0
    negativo = num < 0
    entero = abs(entero)
    # Separador de miles
    s = str(entero)
    parte_entera = ""
    for i, c in enumerate(reversed(s)):
        if i > 0 and i % 3 == 0:
            parte_entera = "." + parte_entera
        parte_entera = c + parte_entera
    resultado = f"{parte_entera},{partes[1]}" if len(partes) > 1 else parte_entera
    return f"-{resultado}" if negativo else resultado


def formato_numero(valor: float | str | int | None, decimales: int = 0) -> str:
    """Formato numero con separador de miles."""
    return formato_decimal(valor, decimales)


def has_code(items: list[dict[str, Any]] | None, code: str) -> bool:
    """Verifica si una lista de dicts tiene un item con codigo=code."""
    if not items or not isinstance(items, list):
        return False
    return any(item.get("codigo") == code for item in items)


def get_description(items: list[dict[str, Any]] | None, code: str) -> str:
    """Obtiene descripcion del item con codigo=code."""
    if not items or not isinstance(items, list):
        return ""
    for item in items:
        if item.get("codigo") == code:
            return item.get("descripcion", "")
    return ""


def filtro_includes(array: list[str] | None, value: str) -> bool:
    """Verifica si un array contiene un valor."""
    if not array:
        return False
    return value in array


def filtro_lowercase(valor: str | None) -> str:
    """Convierte a minusculas."""
    return (valor or "").lower()


# ---------------------------------------------------------------------------
# Servicio PDF
# ---------------------------------------------------------------------------


class ServicioPdf:
    """Genera PDFs a partir de plantillas Jinja2 + Playwright."""

    def __init__(self) -> None:
        self._browser: Browser | None = None
        self._playwright: Any = None
        self._jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(RUTA_PLANTILLAS)),
            autoescape=jinja2.select_autoescape(["html"]),
        )
        # Registrar filtros
        self._jinja_env.filters["formato_fecha"] = formato_fecha
        self._jinja_env.filters["formato_fecha_hora"] = formato_fecha_hora
        self._jinja_env.filters["formato_moneda"] = formato_moneda
        self._jinja_env.filters["formato_decimal"] = formato_decimal
        self._jinja_env.filters["formato_numero"] = formato_numero
        self._jinja_env.filters["lowercase"] = filtro_lowercase
        # Funciones globales disponibles en templates
        self._jinja_env.globals["has_code"] = has_code
        self._jinja_env.globals["get_description"] = get_description
        self._jinja_env.globals["includes"] = filtro_includes

    async def inicializar_navegador(self) -> Browser:
        """Inicializar instancia de browser (reutilizable)."""
        if not PLAYWRIGHT_DISPONIBLE:
            msg = "playwright no esta instalado"
            raise RuntimeError(msg)
        if self._browser is None:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu",
                ],
            )
        return self._browser

    def renderizar_plantilla(self, nombre_plantilla: str, datos: dict[str, Any]) -> str:
        """Renderizar una plantilla Jinja2 a HTML."""
        template = self._jinja_env.get_template(nombre_plantilla)
        return template.render(**datos)

    async def generar_pdf_desde_plantilla(
        self,
        nombre_plantilla: str,
        datos: dict[str, Any],
        *,
        margen_superior: str = "10mm",
        margen_inferior: str = "10mm",
        margen_izquierdo: str = "10mm",
        margen_derecho: str = "10mm",
    ) -> bytes:
        """Genera PDF desde una plantilla Jinja2."""
        html = self.renderizar_plantilla(nombre_plantilla, datos)
        browser = await self.inicializar_navegador()
        page = await browser.new_page()
        try:
            await page.set_content(html, wait_until="networkidle")
            pdf_bytes = await page.pdf(
                format="A4",
                print_background=True,
                margin={
                    "top": margen_superior,
                    "bottom": margen_inferior,
                    "left": margen_izquierdo,
                    "right": margen_derecho,
                },
            )
            return pdf_bytes
        finally:
            await page.close()

    async def generar_pdf_parte_diario(self, datos: dict[str, Any]) -> bytes:
        """Genera PDF de parte diario (daily report)."""
        # Cargar CSS inline
        css_path = RUTA_PLANTILLAS / "estilos" / "parte-diario.css"
        estilos = css_path.read_text(encoding="utf-8") if css_path.exists() else ""
        datos["estilos_css"] = estilos
        return await self.generar_pdf_desde_plantilla("parte-diario.html", datos)

    async def generar_pdf_contrato(self, datos: dict[str, Any]) -> bytes:
        """Genera PDF de contrato."""
        css_path = RUTA_PLANTILLAS / "estilos" / "contrato.css"
        estilos = css_path.read_text(encoding="utf-8") if css_path.exists() else ""
        datos["styles"] = estilos
        return await self.generar_pdf_desde_plantilla(
            "contrato.html",
            datos,
            margen_superior="15mm",
            margen_inferior="15mm",
            margen_izquierdo="20mm",
            margen_derecho="20mm",
        )

    async def generar_pdf_acta_entrega(self, datos: dict[str, Any]) -> bytes:
        """Genera PDF de acta de entrega."""
        return await self.generar_pdf_desde_plantilla("acta-entrega.html", datos)

    async def generar_pdf_valorizacion_completa(
        self, paginas_pdf: list[bytes]
    ) -> bytes:
        """Merge de multiples PDFs en uno (para valorizaciones de 7 paginas)."""
        import io

        writer = PdfWriter()
        for pdf_bytes in paginas_pdf:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                writer.add_page(page)
        buffer = io.BytesIO()
        writer.write(buffer)
        return buffer.getvalue()

    async def cerrar(self) -> None:
        """Cerrar browser y liberar recursos."""
        if self._browser:
            await self._browser.close()
            self._browser = None
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None


# Instancia singleton
servicio_pdf = ServicioPdf()
