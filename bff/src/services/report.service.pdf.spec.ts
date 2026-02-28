/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Backend tests for Daily Report PDF generation (WS-20)
 * Covers: getDailyReportPdfData method, transformToDailyReportPdfDto transformer
 */
import { ReportService } from './report.service';
import {
  transformToDailyReportPdfDto,
  formatDecimal,
  isCodeSelected,
} from '../utils/daily-report-pdf-transformer';

// ── ReportService PDF method ────────────────────────────────────────────
describe('ReportService — PDF methods', () => {
  let service: ReportService;

  beforeEach(() => {
    service = new ReportService();
  });

  it('should instantiate without error', () => {
    expect(service).toBeDefined();
  });

  it('should expose getDailyReportPdfData method', () => {
    expect(typeof service.getDailyReportPdfData).toBe('function');
  });

  it('getDailyReportPdfData should accept tenantId and numeric id', () => {
    // Validate method signature: (tenantId: number, id: number)
    const params = service.getDailyReportPdfData.length;
    expect(params).toBe(2);
  });
});

// ── transformToDailyReportPdfDto ────────────────────────────────────────
describe('transformToDailyReportPdfDto', () => {
  const mockEquipo = {
    id: 5,
    codigo_equipo: 'EXC-001',
    marca: 'Caterpillar',
    modelo: '320D',
    placa: 'ABC-123',
  };

  const mockTrabajador = {
    id: 10,
    nombres: 'Juan',
    apellidos: 'Pérez',
    dni: '12345678',
  };

  const mockProyecto = {
    id: 3,
    nombre: 'Proyecto Alpha',
    codigo: 'PA-001',
  };

  function buildMockReport(overrides: Record<string, any> = {}): any {
    return {
      id: 1,
      numeroParte: 42,
      fecha: new Date('2026-02-15'),
      turno: 'DIA',
      horaInicio: '08:00:00',
      horaFin: '17:00:00',
      horometroInicial: '1000',
      horometroFinal: '1009',
      odometroInicial: '5000',
      odometroFinal: '5120',
      petroleoGln: '25.5',
      gasolinaGln: null,
      horaAbastecimiento: '12:00:00',
      numValeCombustible: 'V-001',
      horometroKilometraje: '1005.5',
      lugarSalida: 'Base Central',
      lugarLlegada: 'Zona A',
      responsableFrente: 'Carlos López',
      observacionesCorrecciones: 'Revisión de filtro pendiente',
      firmaOperador: 'data:image/png;base64,abc123',
      firmaSupervisor: undefined,
      firmaJefeEquipos: undefined,
      firmaResidente: undefined,
      firmaPlaneamientoControl: undefined,
      horas_precalentamiento: 0.5,
      codigo: 'EXC-001',
      empresa: 'Consorcio La Unión',
      placa: 'ABC-123',
      equipo: mockEquipo,
      trabajador: mockTrabajador,
      proyecto: mockProyecto,
      produccionRows: [],
      actividadesProduccion: [{ codigo: '01', descripcion: undefined }],
      demorasOperativas: [{ codigo: 'D01' }],
      otrosEventos: [],
      demorasMecanicas: [],
      ...overrides,
    };
  }

  it('should transform basic report fields correctly', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());

    expect(dto.razon_social).toBe('Consorcio La Unión');
    expect(dto.codigo_forma).toBe('CLUC-GEM-F-005');
    expect(dto.version).toBe('01');
    expect(dto.numero_parte).toBe('42');
    expect(dto.turno).toBe('DIA');
    expect(dto.proyecto).toBe('Proyecto Alpha');
    expect(dto.responsable_frente).toBe('Carlos López');
  });

  it('should format fecha as DD/MM/YYYY', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.fecha).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('should populate operador from trabajador names', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.operador).toBe('Juan Pérez');
  });

  it('should calculate horometro_total correctly', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.horometro_total).toBe(9);
  });

  it('should calculate kilometraje_total correctly', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.kilometraje_total).toBe(120);
  });

  it('should fill produccion to exactly 16 rows', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.produccion).toHaveLength(16);
  });

  it('should include production rows when provided', () => {
    const mockWithRows = buildMockReport({
      produccionRows: [
        {
          numero: 1,
          ubicacionLaboresProgIni: 'Est. 0+000',
          ubicacionLaboresProgFin: 'Est. 0+100',
          horaIni: '08:00:00',
          horaFin: '10:00:00',
          materialTrabajadoDescripcion: 'Excavación de cuneta',
          metrado: '50 m3',
          edt: 'EDT-001',
        },
      ],
    });
    const dto = transformToDailyReportPdfDto(mockWithRows);
    expect(dto.produccion[0].ubicacion_prog_ini).toBe('Est. 0+000');
    expect(dto.produccion[0].edt).toBe('EDT-001');
    expect(dto.produccion).toHaveLength(16); // still padded to 16
  });

  it('should map actividades_produccion correctly', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.actividades_produccion).toHaveLength(1);
    expect(dto.actividades_produccion[0].codigo).toBe('01');
  });

  it('should map demoras_operativas as array of codes', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.demoras_operativas).toContain('D01');
  });

  it('should handle null petroleo_gln gracefully', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport({ petroleoGln: null }));
    expect(dto.petroleo_gln).toBeUndefined();
  });

  it('should include firma_operador when present', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.firma_operador).toBe('data:image/png;base64,abc123');
  });

  it('should set firma_supervisor to undefined when absent', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport());
    expect(dto.firma_supervisor).toBeUndefined();
  });

  it('should handle missing equipo gracefully', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport({ equipo: undefined }));
    expect(dto.codigo_equipo).toBe('EXC-001'); // falls back to report.codigo
    expect(dto.equipo).toBe('');
  });

  it('should handle empty produccionRows array', () => {
    const dto = transformToDailyReportPdfDto(buildMockReport({ produccionRows: [] }));
    expect(dto.produccion).toHaveLength(16);
    expect(dto.produccion[0].material_descripcion).toBe('');
  });
});

// ── Helper functions ────────────────────────────────────────────────────
describe('PDF transformer helpers', () => {
  describe('formatDecimal', () => {
    it('should format number with 2 decimal places by default', () => {
      expect(formatDecimal(1.5)).toBe('1.50');
    });

    it('should return empty string for undefined', () => {
      expect(formatDecimal(undefined)).toBe('');
    });

    it('should return empty string for null', () => {
      expect(formatDecimal(null as any)).toBe('');
    });

    it('should respect custom decimal places', () => {
      expect(formatDecimal(3.14159, 3)).toBe('3.142');
    });
  });

  describe('isCodeSelected', () => {
    it('should return true when code is in array', () => {
      expect(isCodeSelected(['D01', 'D02', 'D03'], 'D01')).toBe(true);
    });

    it('should return false when code is not in array', () => {
      expect(isCodeSelected(['D01', 'D02'], 'D05')).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(isCodeSelected([], 'D01')).toBe(false);
    });
  });
});
