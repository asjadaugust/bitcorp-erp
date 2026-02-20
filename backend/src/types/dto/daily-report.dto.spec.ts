import { toDailyReportDto, fromDailyReportDto, DailyReportDto } from './daily-report.dto';
import { DailyReportRawRow } from '../daily-report-raw.interface';

describe('DailyReportDto Transformations', () => {
  describe('toDailyReportDto', () => {
    it('should transform a complete raw row to DTO', () => {
      const rawRow: DailyReportRawRow = {
        id: 1,
        fecha: '2024-01-15',
        trabajador_id: 10,
        trabajador_nombre: 'Juan Pérez',
        equipo_id: 5,
        equipo_codigo: 'EXC-001',
        equipo_nombre: 'Caterpillar 320D',
        proyecto_id: 3,
        proyecto_nombre: 'Proyecto Alpha',
        valorizacion_id: null,
        hora_inicio: '08:00',
        hora_fin: '17:00',
        horometro_inicial: 1000,
        horometro_final: 1009,
        horas_trabajadas: 9,
        odometro_inicial: 5000,
        odometro_final: 5120,
        km_recorridos: 120,
        combustible_inicial: 100,
        combustible_final: 75,
        combustible_consumido: 25,
        lugar_salida: 'Base Central',
        lugar_llegada: 'Zona A',
        observaciones: 'Trabajo de excavación en zona A',
        observaciones_correcciones: 'Revisar filtro de aceite',
        estado: 'PENDIENTE',
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T17:00:00Z',
        creado_por: 10,
        aprobado_por: null,
        aprobado_en: null,
      };

      const dto = toDailyReportDto(rawRow);

      expect(dto).toEqual({
        id: 1,
        fecha: '2024-01-15',
        trabajador_id: 10,
        trabajador_nombre: 'Juan Pérez',
        equipo_id: 5,
        equipo_codigo: 'EXC-001',
        equipo_nombre: 'Caterpillar 320D',
        proyecto_id: 3,
        proyecto_nombre: 'Proyecto Alpha',
        hora_inicio: '08:00',
        hora_fin: '17:00',
        horometro_inicial: 1000,
        horometro_final: 1009,
        horas_trabajadas: 9,
        odometro_inicial: 5000,
        odometro_final: 5120,
        km_recorridos: 120,
        combustible_inicial: 100,
        combustible_consumido: 25,
        lugar_salida: 'Base Central',
        observaciones: 'Trabajo de excavación en zona A',
        observaciones_correcciones: 'Revisar filtro de aceite',
        estado: 'PENDIENTE',
        created_at: '2024-01-15T08:00:00Z',
        updated_at: '2024-01-15T17:00:00Z',
        creado_por: 10,
        aprobado_por: null,
        aprobado_en: null,
        horas_precalentamiento: 0,
        firma_operador: undefined,
        firma_supervisor: undefined,
        firma_jefe_equipos: undefined,
        firma_residente: undefined,
        firma_planeamiento_control: undefined,
        numero_vale_combustible: undefined,
      });
    });

    it('should handle null values correctly', () => {
      const rawRow: DailyReportRawRow = {
        id: 2,
        fecha: '2024-01-16',
        trabajador_id: null,
        trabajador_nombre: undefined,
        equipo_id: 5,
        equipo_codigo: 'EXC-001',
        equipo_nombre: 'Caterpillar 320D',
        proyecto_id: null,
        proyecto_nombre: undefined,
        valorizacion_id: null,
        hora_inicio: null,
        hora_fin: null,
        horometro_inicial: null,
        horometro_final: null,
        horas_trabajadas: null,
        odometro_inicial: null,
        odometro_final: null,
        km_recorridos: null,
        combustible_inicial: null,
        combustible_final: null,
        combustible_consumido: null,
        lugar_salida: null,
        lugar_llegada: null,
        observaciones: null,
        observaciones_correcciones: null,
        estado: 'BORRADOR',
        created_at: '2024-01-16T08:00:00Z',
        updated_at: '2024-01-16T08:00:00Z',
        creado_por: null,
        aprobado_por: null,
        aprobado_en: null,
      };

      const dto = toDailyReportDto(rawRow);

      expect(dto.trabajador_id).toBe(0); // null → 0 for required field
      expect(dto.trabajador_nombre).toBeUndefined();
      expect(dto.proyecto_id).toBeNull();
      expect(dto.hora_inicio).toBe('');
      expect(dto.hora_fin).toBe('');
      expect(dto.horometro_inicial).toBe(0);
      expect(dto.horometro_final).toBe(0);
      expect(dto.horas_trabajadas).toBeUndefined();
      expect(dto.odometro_inicial).toBeUndefined();
      expect(dto.combustible_inicial).toBeUndefined();
      expect(dto.combustible_consumido).toBeUndefined();
      expect(dto.lugar_salida).toBe('');
      expect(dto.observaciones).toBe('');
      expect(dto.estado).toBe('BORRADOR');
    });

    it('should handle minimal valid data', () => {
      const rawRow: DailyReportRawRow = {
        id: 3,
        fecha: '2024-01-17',
        trabajador_id: 15,
        equipo_id: 8,
        proyecto_id: null,
        valorizacion_id: null,
        hora_inicio: '09:00',
        hora_fin: '15:00',
        horometro_inicial: 2000,
        horometro_final: 2006,
        horas_trabajadas: null,
        odometro_inicial: null,
        odometro_final: null,
        km_recorridos: null,
        combustible_inicial: null,
        combustible_final: null,
        combustible_consumido: null,
        lugar_salida: 'Almacén',
        lugar_llegada: null,
        observaciones: 'Mantenimiento preventivo',
        observaciones_correcciones: null,
        estado: 'BORRADOR',
        created_at: '2024-01-17T09:00:00Z',
        updated_at: '2024-01-17T15:00:00Z',
        creado_por: null,
        aprobado_por: null,
        aprobado_en: null,
      };

      const dto = toDailyReportDto(rawRow);

      expect(dto.id).toBe(3);
      expect(dto.fecha).toBe('2024-01-17');
      expect(dto.trabajador_id).toBe(15);
      expect(dto.equipo_id).toBe(8);
      expect(dto.estado).toBe('BORRADOR');
    });
  });

  describe('fromDailyReportDto', () => {
    it('should transform a complete DTO to entity', () => {
      const dto: Partial<DailyReportDto> = {
        fecha: '2024-01-20',
        trabajador_id: 12,
        equipo_id: 7,
        proyecto_id: 5,
        hora_inicio: '07:30',
        hora_fin: '16:30',
        horometro_inicial: 3000,
        horometro_final: 3009,
        odometro_inicial: 10000,
        odometro_final: 10150,
        combustible_inicial: 80,
        combustible_consumido: 30,
        lugar_salida: 'Planta Norte',
        observaciones: 'Transporte de materiales',
        observaciones_correcciones: 'Pendiente revisión técnica',
        estado: 'PENDIENTE',
      };

      const entity = fromDailyReportDto(dto);

      expect(entity).toEqual({
        fecha: '2024-01-20',
        trabajador_id: 12,
        equipo_id: 7,
        proyecto_id: 5,
        hora_inicio: '07:30',
        hora_fin: '16:30',
        horometro_inicial: 3000,
        horometro_final: 3009,
        odometro_inicial: 10000,
        odometro_final: 10150,
        combustible_inicial: 80,
        combustible_consumido: 30,
        lugar_salida: 'Planta Norte',
        observaciones: 'Transporte de materiales',
        observaciones_correcciones: 'Pendiente revisión técnica',
        estado: 'PENDIENTE',
      });
    });

    it('should include combustible_consumido field', () => {
      const dto: Partial<DailyReportDto> = {
        fecha: '2024-01-21',
        combustible_inicial: 100,
        combustible_consumido: 45,
      };

      const entity = fromDailyReportDto(dto);

      expect(entity.combustible_inicial).toBe(100);
      expect(entity.combustible_consumido).toBe(45);
      expect(entity).toHaveProperty('combustible_consumido');
    });

    it('should handle partial updates with only some fields', () => {
      const dto: Partial<DailyReportDto> = {
        observaciones: 'Updated observations',
        estado: 'APROBADO',
      };

      const entity = fromDailyReportDto(dto);

      expect(entity).toEqual({
        observaciones: 'Updated observations',
        estado: 'APROBADO',
      });
      expect(Object.keys(entity)).toHaveLength(2);
    });

    it('should convert falsy numeric values to null', () => {
      const dto: Partial<DailyReportDto> = {
        trabajador_id: 0,
        equipo_id: 0,
        proyecto_id: 0,
        odometro_inicial: 0,
        combustible_inicial: 0,
        combustible_consumido: 0,
      };

      const entity = fromDailyReportDto(dto);

      expect(entity.trabajador_id).toBeNull();
      expect(entity.equipo_id).toBeNull();
      expect(entity.proyecto_id).toBeNull();
      expect(entity.odometro_inicial).toBeNull();
      expect(entity.combustible_inicial).toBeNull();
      expect(entity.combustible_consumido).toBeNull();
    });

    it('should preserve valid numeric zero values where appropriate', () => {
      const dto: Partial<DailyReportDto> = {
        horometro_inicial: 0,
        horometro_final: 0,
      };

      const entity = fromDailyReportDto(dto);

      // Hourmeter values should be preserved even if zero (not nullable in business logic)
      expect(entity.horometro_inicial).toBe(0);
      expect(entity.horometro_final).toBe(0);
    });

    it('should not include undefined fields', () => {
      const dto: Partial<DailyReportDto> = {
        fecha: '2024-01-22',
        observaciones: 'Test',
        // Other fields explicitly not provided
      };

      const entity = fromDailyReportDto(dto);

      expect(entity).toEqual({
        fecha: '2024-01-22',
        observaciones: 'Test',
      });
      expect(entity).not.toHaveProperty('trabajador_id');
      expect(entity).not.toHaveProperty('equipo_id');
      expect(entity).not.toHaveProperty('combustible_inicial');
    });

    it('should map all 15 writable fields when provided', () => {
      const dto: Partial<DailyReportDto> = {
        fecha: '2024-01-23',
        trabajador_id: 20,
        equipo_id: 10,
        proyecto_id: 8,
        hora_inicio: '08:00',
        hora_fin: '17:00',
        horometro_inicial: 5000,
        horometro_final: 5009,
        odometro_inicial: 20000,
        odometro_final: 20100,
        combustible_inicial: 120,
        combustible_consumido: 40,
        lugar_salida: 'Base Sur',
        observaciones: 'Trabajo completo',
        observaciones_correcciones: 'Sin observaciones',
        estado: 'APROBADO',
      };

      const entity = fromDailyReportDto(dto);

      // Verify all 15 writable fields are present
      const expectedFields = [
        'fecha',
        'trabajador_id',
        'equipo_id',
        'proyecto_id',
        'hora_inicio',
        'hora_fin',
        'horometro_inicial',
        'horometro_final',
        'odometro_inicial',
        'odometro_final',
        'combustible_inicial',
        'combustible_consumido',
        'lugar_salida',
        'observaciones',
        'observaciones_correcciones',
        'estado',
      ];

      expectedFields.forEach((field) => {
        expect(entity).toHaveProperty(field);
      });

      expect(Object.keys(entity)).toHaveLength(16); // All 16 fields
    });

    it('should handle null values in optional fields', () => {
      const dto: Partial<DailyReportDto> = {
        fecha: '2024-01-24',
        proyecto_id: null,
        odometro_inicial: null,
        odometro_final: null,
        combustible_inicial: null,
        combustible_consumido: null,
        observaciones_correcciones: null,
      };

      const entity = fromDailyReportDto(dto);

      expect(entity.proyecto_id).toBeNull();
      expect(entity.odometro_inicial).toBeNull();
      expect(entity.combustible_inicial).toBeNull();
      expect(entity.combustible_consumido).toBeNull();
      expect(entity.observaciones_correcciones).toBeNull();
    });
  });

  describe('Round-trip transformation', () => {
    it('should preserve data through toDailyReportDto → fromDailyReportDto', () => {
      const originalRawRow: DailyReportRawRow = {
        id: 100,
        fecha: '2024-01-25',
        trabajador_id: 25,
        equipo_id: 15,
        proyecto_id: 10,
        valorizacion_id: null,
        hora_inicio: '06:00',
        hora_fin: '14:00',
        horometro_inicial: 8000,
        horometro_final: 8008,
        horas_trabajadas: 8,
        odometro_inicial: 30000,
        odometro_final: 30080,
        km_recorridos: 80,
        combustible_inicial: 150,
        combustible_final: 100,
        combustible_consumido: 50,
        lugar_salida: 'Depósito Central',
        lugar_llegada: 'Obra',
        observaciones: 'Operación estándar',
        observaciones_correcciones: null,
        estado: 'PENDIENTE',
        created_at: '2024-01-25T06:00:00Z',
        updated_at: '2024-01-25T14:00:00Z',
        creado_por: 25,
        aprobado_por: null,
        aprobado_en: null,
      };

      const dto = toDailyReportDto(originalRawRow);
      const entity = fromDailyReportDto(dto);

      // Verify core writable fields are preserved
      expect(entity.fecha).toBe(originalRawRow.fecha);
      expect(entity.trabajador_id).toBe(originalRawRow.trabajador_id);
      expect(entity.equipo_id).toBe(originalRawRow.equipo_id);
      expect(entity.proyecto_id).toBe(originalRawRow.proyecto_id);
      expect(entity.combustible_inicial).toBe(originalRawRow.combustible_inicial);
      expect(entity.combustible_consumido).toBe(originalRawRow.combustible_consumido);
      expect(entity.observaciones).toBe(originalRawRow.observaciones);
      expect(entity.estado).toBe(originalRawRow.estado);
    });
  });

  describe('Regression tests for bug fixes', () => {
    it('should NOT drop combustible_consumido during transformation', () => {
      // This test verifies the fix for the missing combustible_consumido mapping
      const dto: Partial<DailyReportDto> = {
        combustible_consumido: 42,
      };

      const entity = fromDailyReportDto(dto);

      expect(entity).toHaveProperty('combustible_consumido');
      expect(entity.combustible_consumido).toBe(42);
    });

    it('should handle combustible_consumido with zero value', () => {
      const dto: Partial<DailyReportDto> = {
        combustible_consumido: 0,
      };

      const entity = fromDailyReportDto(dto);

      // Zero should be converted to null (equipment not used)
      expect(entity.combustible_consumido).toBeNull();
    });

    it('should handle combustible_consumido with valid non-zero value', () => {
      const dto: Partial<DailyReportDto> = {
        combustible_consumido: 35,
      };

      const entity = fromDailyReportDto(dto);

      expect(entity.combustible_consumido).toBe(35);
    });
  });
});
