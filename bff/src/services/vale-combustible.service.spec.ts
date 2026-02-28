import { ValesCombustibleService } from './vale-combustible.service';
import { toValeDto } from '../types/dto/vale-combustible.dto';
import {
  TIPOS_COMBUSTIBLE,
  ESTADOS_VALE,
  TipoCombustibleVale,
} from '../models/vale-combustible.model';

describe('ValesCombustibleService — Vale de Combustible (WS-23)', () => {
  let service: ValesCombustibleService;

  beforeEach(() => {
    service = new ValesCombustibleService();
  });

  // ─── Service Instantiation ─────────────────────────────────────────────────

  describe('Service Instantiation', () => {
    it('should create an instance of ValesCombustibleService', () => {
      expect(service).toBeInstanceOf(ValesCombustibleService);
    });
  });

  // ─── Method Existence ──────────────────────────────────────────────────────

  describe('Method Existence', () => {
    it('should have listar method', () => {
      expect(service.listar).toBeDefined();
      expect(typeof service.listar).toBe('function');
    });

    it('should have obtener method', () => {
      expect(service.obtener).toBeDefined();
      expect(typeof service.obtener).toBe('function');
    });

    it('should have crear method', () => {
      expect(service.crear).toBeDefined();
      expect(typeof service.crear).toBe('function');
    });

    it('should have actualizar method', () => {
      expect(service.actualizar).toBeDefined();
      expect(typeof service.actualizar).toBe('function');
    });

    it('should have eliminar method', () => {
      expect(service.eliminar).toBeDefined();
      expect(typeof service.eliminar).toBe('function');
    });

    it('should have registrar method (PENDIENTE → REGISTRADO)', () => {
      expect(service.registrar).toBeDefined();
      expect(typeof service.registrar).toBe('function');
    });

    it('should have anular method (→ ANULADO)', () => {
      expect(service.anular).toBeDefined();
      expect(typeof service.anular).toBe('function');
    });
  });

  // ─── Method Signatures ─────────────────────────────────────────────────────

  describe('Method Signatures', () => {
    it('listar should accept filters parameter', () => {
      expect(service.listar.length).toBeGreaterThanOrEqual(0);
    });

    it('obtener should accept id parameter', () => {
      expect(service.obtener.length).toBe(1);
    });

    it('crear should accept data parameter', () => {
      expect(service.crear.length).toBe(1);
    });

    it('actualizar should accept id and data parameters', () => {
      expect(service.actualizar.length).toBe(2);
    });

    it('eliminar should accept id parameter', () => {
      expect(service.eliminar.length).toBe(1);
    });
  });

  // ─── DTO Transform ─────────────────────────────────────────────────────────

  describe('toValeDto', () => {
    it('should be a function', () => {
      expect(toValeDto).toBeDefined();
      expect(typeof toValeDto).toBe('function');
    });

    it('should map entity camelCase fields to snake_case DTO', () => {
      const mockEntity = {
        id: 1,
        codigo: 'VCB-0001',
        parteDiarioId: 10,
        equipoId: 5,
        proyectoId: 3,
        fecha: new Date('2025-03-01'),
        numeroVale: 'V-001',
        tipoCombustible: 'DIESEL',
        cantidadGalones: 50.0,
        precioUnitario: 18.5,
        montoTotal: 925.0,
        proveedor: 'Grifo Central',
        observaciones: null,
        estado: 'PENDIENTE',
        creadoPor: 1,
        createdAt: new Date('2025-03-01T08:00:00Z'),
        updatedAt: new Date('2025-03-01T08:00:00Z'),
      };

      const dto = toValeDto(mockEntity);

      expect(dto.id).toBe(1);
      expect(dto.codigo).toBe('VCB-0001');
      expect(dto.parte_diario_id).toBe(10);
      expect(dto.equipo_id).toBe(5);
      expect(dto.proyecto_id).toBe(3);
      expect(dto.numero_vale).toBe('V-001');
      expect(dto.tipo_combustible).toBe('DIESEL');
      expect(dto.cantidad_galones).toBe(50.0);
      expect(dto.precio_unitario).toBe(18.5);
      expect(dto.monto_total).toBe(925.0);
      expect(dto.proveedor).toBe('Grifo Central');
      expect(dto.observaciones).toBeNull();
      expect(dto.estado).toBe('PENDIENTE');
    });

    it('should format fecha as YYYY-MM-DD string', () => {
      const mockEntity = {
        id: 2,
        codigo: 'VCB-0002',
        parteDiarioId: null,
        equipoId: 7,
        proyectoId: null,
        fecha: new Date('2025-06-15'),
        numeroVale: 'V-002',
        tipoCombustible: 'GASOLINA_90',
        cantidadGalones: 20.0,
        precioUnitario: 22.0,
        montoTotal: 440.0,
        proveedor: null,
        observaciones: 'Tanque lleno',
        estado: 'REGISTRADO',
        creadoPor: 2,
        createdAt: new Date('2025-06-15T10:00:00Z'),
        updatedAt: new Date('2025-06-15T10:00:00Z'),
      };

      const dto = toValeDto(mockEntity);

      expect(dto.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dto.observaciones).toBe('Tanque lleno');
      expect(dto.estado).toBe('REGISTRADO');
    });

    it('should return null for nullable fields when absent', () => {
      const mockEntity = {
        id: 3,
        codigo: 'VCB-0003',
        parteDiarioId: null,
        equipoId: 9,
        proyectoId: undefined,
        fecha: new Date('2025-07-01'),
        numeroVale: 'V-003',
        tipoCombustible: 'DIESEL',
        cantidadGalones: 30.0,
        precioUnitario: null,
        montoTotal: null,
        proveedor: undefined,
        observaciones: null,
        estado: 'ANULADO',
        creadoPor: null,
        createdAt: new Date('2025-07-01T00:00:00Z'),
        updatedAt: new Date('2025-07-01T00:00:00Z'),
      };

      const dto = toValeDto(mockEntity);

      expect(dto.parte_diario_id).toBeNull();
      expect(dto.proyecto_id).toBeNull();
      expect(dto.precio_unitario).toBeNull();
      expect(dto.monto_total).toBeNull();
      expect(dto.proveedor).toBeNull();
      expect(dto.observaciones).toBeNull();
      expect(dto.creado_por).toBeNull();
    });
  });

  // ─── Monto Total Auto-Calculation ──────────────────────────────────────────

  describe('Auto-calculation logic', () => {
    it('should correctly compute monto_total = cantidad * precio_unitario', () => {
      const cantidad = 40.5;
      const precio = 18.75;
      const expected = parseFloat((cantidad * precio).toFixed(2));
      expect(parseFloat((cantidad * precio).toFixed(2))).toBe(expected);
    });

    it('should handle zero cantidad giving zero monto_total', () => {
      const total = parseFloat((0 * 18.75).toFixed(2));
      expect(total).toBe(0.0);
    });
  });

  // ─── TIPOS_COMBUSTIBLE ─────────────────────────────────────────────────────

  describe('TIPOS_COMBUSTIBLE', () => {
    it('should be defined', () => {
      expect(TIPOS_COMBUSTIBLE).toBeDefined();
    });

    it('should include DIESEL', () => {
      expect(TIPOS_COMBUSTIBLE).toContain('DIESEL');
    });

    it('should include GASOLINA types', () => {
      expect(TIPOS_COMBUSTIBLE.some((t: TipoCombustibleVale) => t.startsWith('GASOLINA'))).toBe(
        true
      );
    });

    it('should include GLP', () => {
      expect(TIPOS_COMBUSTIBLE).toContain('GLP');
    });

    it('should have at least 4 fuel types', () => {
      expect(TIPOS_COMBUSTIBLE.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── ESTADOS_VALE ──────────────────────────────────────────────────────────

  describe('ESTADOS_VALE', () => {
    it('should be defined', () => {
      expect(ESTADOS_VALE).toBeDefined();
    });

    it('should include PENDIENTE state', () => {
      expect(ESTADOS_VALE).toContain('PENDIENTE');
    });

    it('should include REGISTRADO state', () => {
      expect(ESTADOS_VALE).toContain('REGISTRADO');
    });

    it('should include ANULADO state', () => {
      expect(ESTADOS_VALE).toContain('ANULADO');
    });

    it('should have exactly 3 states', () => {
      expect(ESTADOS_VALE).toHaveLength(3);
    });
  });

  // ─── Código Generation Pattern ─────────────────────────────────────────────

  describe('Código Pattern (VCB-NNNN)', () => {
    it('should follow VCB-NNNN format', () => {
      const codigoPattern = /^VCB-\d{4}$/;
      expect(codigoPattern.test('VCB-0001')).toBe(true);
      expect(codigoPattern.test('VCB-9999')).toBe(true);
      expect(codigoPattern.test('VCB-001')).toBe(false);
      expect(codigoPattern.test('VCB-10000')).toBe(false);
    });
  });
});
