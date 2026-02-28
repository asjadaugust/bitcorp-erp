/**
 * Reglas de descuento PRD Anexo B — CORP-GEM-P-002
 *
 * Calcula si aplica descuento y cuántas horas/días corresponden según el tipo,
 * subtipo y parámetros del evento.
 *
 * Conversión estándar: 1 día = 8 horas (jornada ordinaria).
 */

import { TipoEventoDescuento, SubtipoEventoDescuento } from '../models/discount-event.model';

export interface DescuentoInput {
  tipo: TipoEventoDescuento;
  subtipo?: SubtipoEventoDescuento;
  /** Horas de paralización reportadas (para AVERIA/ARRENDADOR y CLIMATICO/PARCIAL) */
  horasDescuento?: number;
  /** Horas de horómetro para averías mecánicas (AVERIA/MECANICA) */
  horasHorometroMecanica?: number;
  /** Tipo de tarifa del contrato: 'HORA' | 'DIA' | 'MES' */
  tipoTarifa: 'HORA' | 'DIA' | 'MES';
}

export interface DescuentoResult {
  aplicaDescuento: boolean;
  descuentoCalculadoHoras: number;
  descuentoCalculadoDias: number;
  /** Explanation for the operator */
  razon: string;
}

const HORAS_JORNADA = 8;

/**
 * Rounds a decimal to 2 decimal places.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Converts hours to days (fractional, capped at 1 for full-day cases).
 */
function horasADias(horas: number): number {
  return round2(horas / HORAS_JORNADA);
}

export function calcularDescuento(input: DescuentoInput): DescuentoResult {
  const { tipo, subtipo, horasDescuento = 0, horasHorometroMecanica = 0, tipoTarifa } = input;

  const esPorHora = tipoTarifa === 'HORA';

  // Helper: build result for "no aplica descuento"
  const noAplica = (razon: string): DescuentoResult => ({
    aplicaDescuento: false,
    descuentoCalculadoHoras: 0,
    descuentoCalculadoDias: 0,
    razon,
  });

  // Helper: build result for full-day discount
  const diaCompleto = (razon: string): DescuentoResult => ({
    aplicaDescuento: true,
    descuentoCalculadoHoras: esPorHora ? HORAS_JORNADA : 0,
    descuentoCalculadoDias: esPorHora ? 0 : 1,
    razon,
  });

  // Helper: build result for proportional (hour-based) discount
  const proporcional = (horas: number, razon: string): DescuentoResult => {
    const h = round2(horas);
    return {
      aplicaDescuento: h > 0,
      descuentoCalculadoHoras: esPorHora ? h : 0,
      descuentoCalculadoDias: esPorHora ? 0 : horasADias(h),
      razon,
    };
  };

  // ─── STAND_BY ─────────────────────────────────────────────────────────────
  if (tipo === 'STAND_BY') {
    switch (subtipo as string) {
      case 'DOMINGO':
        return noAplica('Stand-by en domingo: sin descuento (jornada no computable)');
      case 'FERIADO':
        return diaCompleto('Stand-by en feriado: descuento de 1 día completo');
      case 'FALTA_DE_FRENTE':
        return noAplica('Falta de frente: sin descuento (responsabilidad del arrendatario)');
      default:
        // No subtipo — use raw values supplied by operator
        return {
          aplicaDescuento: horasDescuento > 0,
          descuentoCalculadoHoras: esPorHora ? round2(horasDescuento) : 0,
          descuentoCalculadoDias: esPorHora ? 0 : horasADias(horasDescuento),
          razon: 'Stand-by sin subtipo: usando valores ingresados manualmente',
        };
    }
  }

  // ─── AVERIA ───────────────────────────────────────────────────────────────
  if (tipo === 'AVERIA') {
    switch (subtipo as string) {
      case 'ARRENDADOR': {
        // <5h → proporcional; ≥5h → día completo
        if (horasDescuento >= 5) {
          return diaCompleto('Avería por arrendador ≥ 5 h: descuento de 1 día completo');
        }
        return proporcional(
          horasDescuento,
          `Avería por arrendador < 5 h: descuento proporcional (${horasDescuento}h / ${HORAS_JORNADA}h)`
        );
      }
      case 'ARRENDATARIO':
        return noAplica('Avería por arrendatario: sin descuento (responsabilidad propia)');
      case 'MECANICA': {
        // Discount = horasHorometroMecanica / 8 days (always proportional)
        const horasMec = horasHorometroMecanica;
        return proporcional(
          horasMec,
          `Avería mecánica: descuento proporcional (${horasMec} h horómetro / ${HORAS_JORNADA}h)`
        );
      }
      default:
        return {
          aplicaDescuento: horasDescuento > 0,
          descuentoCalculadoHoras: esPorHora ? round2(horasDescuento) : 0,
          descuentoCalculadoDias: esPorHora ? 0 : horasADias(horasDescuento),
          razon: 'Avería sin subtipo: usando valores ingresados manualmente',
        };
    }
  }

  // ─── CLIMATICO ────────────────────────────────────────────────────────────
  if (tipo === 'CLIMATICO') {
    switch (subtipo as string) {
      case 'TOTAL':
        return diaCompleto('Paralización climática total: descuento de 1 día completo');
      case 'PARCIAL':
        return proporcional(
          horasDescuento,
          `Paralización climática parcial: descuento proporcional (${horasDescuento}h)`
        );
      default:
        return {
          aplicaDescuento: horasDescuento > 0,
          descuentoCalculadoHoras: esPorHora ? round2(horasDescuento) : 0,
          descuentoCalculadoDias: esPorHora ? 0 : horasADias(horasDescuento),
          razon: 'Climático sin subtipo: usando valores ingresados manualmente',
        };
    }
  }

  // ─── OTRO ─────────────────────────────────────────────────────────────────
  return {
    aplicaDescuento: horasDescuento > 0,
    descuentoCalculadoHoras: esPorHora ? round2(horasDescuento) : 0,
    descuentoCalculadoDias: esPorHora ? 0 : horasADias(horasDescuento),
    razon: 'Evento de tipo OTRO: usando valores ingresados manualmente',
  };
}
