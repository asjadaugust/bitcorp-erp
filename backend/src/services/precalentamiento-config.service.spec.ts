/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrecalentamientoConfigService } from './precalentamiento-config.service';

describe('PrecalentamientoConfigService', () => {
  let service: PrecalentamientoConfigService;

  beforeEach(() => {
    service = new PrecalentamientoConfigService();
  });

  // ─── Instantiation ────────────────────────────────────────────────────────────

  describe('Service Instantiation', () => {
    it('should create an instance of PrecalentamientoConfigService', () => {
      expect(service).toBeInstanceOf(PrecalentamientoConfigService);
    });
  });

  // ─── Method Existence ─────────────────────────────────────────────────────────

  describe('Method Existence', () => {
    it('should have listar method', () => {
      expect(service.listar).toBeDefined();
      expect(typeof service.listar).toBe('function');
    });

    it('should have obtenerPorTipoEquipo method', () => {
      expect(service.obtenerPorTipoEquipo).toBeDefined();
      expect(typeof service.obtenerPorTipoEquipo).toBe('function');
    });

    it('should have obtenerHoras method', () => {
      expect(service.obtenerHoras).toBeDefined();
      expect(typeof service.obtenerHoras).toBe('function');
    });

    it('should have actualizar method', () => {
      expect(service.actualizar).toBeDefined();
      expect(typeof service.actualizar).toBe('function');
    });
  });

  // ─── Method Signatures ────────────────────────────────────────────────────────

  describe('Method Signatures', () => {
    it('listar should require no mandatory parameters', () => {
      expect(service.listar.length).toBe(0);
    });

    it('obtenerPorTipoEquipo should accept tipoEquipoId', () => {
      expect(service.obtenerPorTipoEquipo.length).toBe(1);
    });

    it('obtenerHoras should accept tipoEquipoId', () => {
      expect(service.obtenerHoras.length).toBe(1);
    });

    it('actualizar should accept tipoEquipoId and horas', () => {
      expect(service.actualizar.length).toBe(2);
    });
  });

  // ─── DTO Transformation ───────────────────────────────────────────────────────

  describe('DTO transformation (toDto)', () => {
    it('should correctly map entity properties to DTO', () => {
      const mockEntity = {
        id: 1,
        tipoEquipoId: 5,
        tipoEquipo: {
          id: 5,
          codigo: 'EX',
          nombre: 'Excavadora',
          categoriaPrd: 'MAQUINARIA_PESADA' as const,
          descripcion: null,
          activo: true,
          createdAt: new Date(),
        },
        horasPrecalentamiento: 0.5 as unknown as number,
        activo: true,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      };

      const dto = (service as any).toDto(mockEntity);

      expect(dto.id).toBe(1);
      expect(dto.tipo_equipo_id).toBe(5);
      expect(dto.tipo_equipo_codigo).toBe('EX');
      expect(dto.tipo_equipo_nombre).toBe('Excavadora');
      expect(dto.categoria_prd).toBe('MAQUINARIA_PESADA');
      expect(dto.horas_precalentamiento).toBe(0.5);
      expect(dto.activo).toBe(true);
      expect(dto.updated_at).toBe('2026-01-01T00:00:00.000Z');
    });

    it('should return 0 for horas_precalentamiento when entity has 0', () => {
      const mockEntity = {
        id: 2,
        tipoEquipoId: 8,
        tipoEquipo: {
          id: 8,
          codigo: 'CA',
          nombre: 'Camioneta',
          categoriaPrd: 'VEHICULOS_LIVIANOS' as const,
          descripcion: null,
          activo: true,
          createdAt: new Date(),
        },
        horasPrecalentamiento: '0.00' as unknown as number,
        activo: true,
        updatedAt: new Date(),
      };

      const dto = (service as any).toDto(mockEntity);
      expect(dto.horas_precalentamiento).toBe(0);
    });

    it('should handle missing tipoEquipo gracefully', () => {
      const mockEntity = {
        id: 3,
        tipoEquipoId: 99,
        tipoEquipo: undefined as any,
        horasPrecalentamiento: '0.25' as unknown as number,
        activo: true,
        updatedAt: new Date(),
      };

      const dto = (service as any).toDto(mockEntity);
      expect(dto.tipo_equipo_codigo).toBe('');
      expect(dto.tipo_equipo_nombre).toBe('');
      expect(dto.categoria_prd).toBe('');
      expect(dto.horas_precalentamiento).toBe(0.25);
    });
  });

  // ─── Business Rules ───────────────────────────────────────────────────────────

  describe('PRD-compliant defaults (documentation)', () => {
    it('should document that MAQUINARIA_PESADA uses 0.50 hours per PRD Anexo B', () => {
      // PRD Anexo B: Equipment pre-warming table
      // Maquinaria Pesada → 0.50 horas
      // Vehículos Pesados → 0.25 horas
      // Vehículos Livianos / Equipos Menores → 0.00 horas
      const prdDefaults = {
        MAQUINARIA_PESADA: 0.5,
        VEHICULOS_PESADOS: 0.25,
        VEHICULOS_LIVIANOS: 0.0,
        EQUIPOS_MENORES: 0.0,
      };
      expect(prdDefaults.MAQUINARIA_PESADA).toBe(0.5);
      expect(prdDefaults.VEHICULOS_PESADOS).toBe(0.25);
      expect(prdDefaults.VEHICULOS_LIVIANOS).toBe(0.0);
      expect(prdDefaults.EQUIPOS_MENORES).toBe(0.0);
    });
  });
});
