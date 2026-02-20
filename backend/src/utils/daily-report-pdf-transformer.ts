/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { DailyReport } from '../models/daily-report-typeorm.model';
import { DailyReportProduction } from '../models/daily-report-production.model';
import { DailyReportProductionActivity } from '../models/daily-report-activity.model';
import { DailyReportOperationalDelay } from '../models/daily-report-operational-delay.model';
import { DailyReportOtherEvent } from '../models/daily-report-other-event.model';
import { DailyReportMechanicalDelay } from '../models/daily-report-mechanical-delay.model';
import {
  DailyReportPdfDto,
  ProductionRowDto,
  ActivityCheckbox,
  OtherEventCheckbox,
  MechanicalDelayCheckbox,
} from '../types/dto/daily-report-pdf.dto';

/**
 * Transform DailyReport entity with relations to PDF DTO
 * @param report - DailyReport entity with all relations loaded
 * @returns DailyReportPdfDto ready for PDF generation
 */
export function transformToDailyReportPdfDto(
  report: DailyReport & {
    equipo?: any;
    trabajador?: any;
    proyecto?: any;
    produccionRows?: DailyReportProduction[];
    actividadesProduccion?: DailyReportProductionActivity[];
    demorasOperativas?: DailyReportOperationalDelay[];
    otrosEventos?: DailyReportOtherEvent[];
    demorasMecanicas?: DailyReportMechanicalDelay[];
  }
): DailyReportPdfDto {
  // Format date to DD/MM/YYYY
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format time to HH:MM
  const formatTime = (time: string | null | undefined): string | undefined => {
    if (!time) return undefined;
    // Time might be in format "HH:MM:SS" or "HH:MM"
    return time.substring(0, 5);
  };

  // Transform production rows (ensure 16 rows for consistent layout)
  const produccionRows: ProductionRowDto[] = [];

  if (report.produccionRows && report.produccionRows.length > 0) {
    // Sort by numero
    const sortedRows = [...report.produccionRows].sort((a, b) => a.numero - b.numero);

    sortedRows.forEach((row) => {
      produccionRows.push({
        numero: row.numero,
        ubicacion_prog_ini: row.ubicacionLaboresProgIni || '',
        ubicacion_prog_fin: row.ubicacionLaboresProgFin || '',
        hora_ini: formatTime(row.horaIni),
        hora_fin: formatTime(row.horaFin),
        material_descripcion: row.materialTrabajadoDescripcion || '',
        metrado: row.metrado || '',
        edt: row.edt || '',
      });
    });
  }

  // Fill remaining rows up to 16 with empty rows for PDF layout
  while (produccionRows.length < 16) {
    produccionRows.push({
      numero: produccionRows.length + 1,
      ubicacion_prog_ini: '',
      ubicacion_prog_fin: '',
      hora_ini: undefined,
      hora_fin: undefined,
      material_descripcion: '',
      metrado: '',
      edt: '',
    });
  }

  // Transform activity checkboxes
  const actividadesProduccion: ActivityCheckbox[] =
    report.actividadesProduccion?.map((activity) => ({
      codigo: activity.codigo,
      descripcion: activity.descripcion,
    })) || [];

  // Transform operational delays (simple array of codes)
  const demorasOperativas: string[] = report.demorasOperativas?.map((delay) => delay.codigo) || [];

  // Transform other events checkboxes
  const otrosEventos: OtherEventCheckbox[] =
    report.otrosEventos?.map((event) => ({
      codigo: event.codigo,
      descripcion: event.descripcion,
    })) || [];

  // Transform mechanical delays checkboxes
  const demorasMecanicas: MechanicalDelayCheckbox[] =
    report.demorasMecanicas?.map((delay) => ({
      codigo: delay.codigo,
      descripcion: delay.descripcion,
    })) || [];

  // Calculate totals
  const horometroTotal =
    report.horometroFinal && report.horometroInicial
      ? Number(report.horometroFinal) - Number(report.horometroInicial)
      : undefined;

  const kilometrajeTotal =
    report.odometroFinal && report.odometroInicial
      ? Number(report.odometroFinal) - Number(report.odometroInicial)
      : undefined;

  // Build DTO
  const dto: DailyReportPdfDto = {
    // Header metadata
    razon_social: 'Consorcio La Unión',
    codigo_forma: 'CLUC-GEM-F-005',
    version: '01',

    // Basic information
    proyecto: report.proyecto?.nombre || 'Nombre del Proyecto',
    fecha: formatDate(report.fecha),
    turno: report.turno || 'DIA',
    numero_parte: report.numeroParte?.toString() || '1',
    codigo_equipo: report.codigo || report.equipo?.codigo_equipo || '',
    empresa: report.empresa || 'Consorcio La Unión',
    equipo: report.equipo
      ? `${report.equipo.codigo_equipo} - ${report.equipo.marca || ''} ${report.equipo.modelo || ''}`.trim()
      : '',
    operador: report.trabajador
      ? `${report.trabajador.nombres || ''} ${report.trabajador.apellidos || ''}`.trim()
      : '',
    placa: report.placa || report.equipo?.placa || undefined,
    responsable_frente: report.responsableFrente || undefined,

    // Hourmeter/Odometer section
    horometro_inicial: report.horometroInicial ? Number(report.horometroInicial) : undefined,
    horometro_final: report.horometroFinal ? Number(report.horometroFinal) : undefined,
    horometro_total: horometroTotal,
    kilometraje_inicial: report.odometroInicial ? Number(report.odometroInicial) : undefined,
    kilometraje_final: report.odometroFinal ? Number(report.odometroFinal) : undefined,
    kilometraje_total: kilometrajeTotal,

    // Fuel section
    petroleo_gln: report.petroleoGln ? Number(report.petroleoGln) : undefined,
    gasolina_gln: report.gasolinaGln ? Number(report.gasolinaGln) : undefined,
    hora_abastecimiento: formatTime(report.horaAbastecimiento),
    num_vale_combustible: report.numValeCombustible || undefined,
    horometro_kilometraje: report.horometroKilometraje || undefined,

    // Pre-warming hours (WS-19: auto-populated from precalentamiento_config)
    horas_precalentamiento: report.horasPrecalentamiento
      ? Number(report.horasPrecalentamiento)
      : undefined,

    // Location section
    lugar_salida: report.lugarSalida || undefined,
    lugar_llegada: report.lugarLlegada || undefined,

    // Production control (16 rows)
    produccion: produccionRows,

    // Activities and delays
    actividades_produccion: actividadesProduccion,
    demoras_operativas: demorasOperativas,
    otros_eventos: otrosEventos,
    demoras_mecanicas: demorasMecanicas,

    // Observations
    observaciones_correcciones: report.observacionesCorrecciones || undefined,

    // Signatures (base64 encoded images)
    firma_operador: report.firmaOperador || undefined,
    firma_supervisor: report.firmaSupervisor || undefined,
    firma_jefe_equipos: report.firmaJefeEquipos || undefined,
    firma_residente: report.firmaResidente || undefined,
    firma_planeamiento_control: report.firmaPlaneamientoControl || undefined,
  };

  return dto;
}

/**
 * Helper function to format decimal numbers for display
 */
export function formatDecimal(value: number | undefined, decimals: number = 2): string {
  if (value === undefined || value === null) return '';
  return Number(value).toFixed(decimals);
}

/**
 * Helper function to check if a code is selected in checkboxes
 */
export function isCodeSelected(codes: string[], targetCode: string): boolean {
  return codes.includes(targetCode);
}

/**
 * Helper function to get description for "Otras" activities/delays
 */
export function getOtrasDescription(
  items: (ActivityCheckbox | OtherEventCheckbox | MechanicalDelayCheckbox)[],
  codigo: string
): string | undefined {
  const item = items.find((i) => i.codigo === codigo);
  return item?.descripcion;
}
