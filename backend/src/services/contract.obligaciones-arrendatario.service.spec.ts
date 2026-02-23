import { ContractService } from './contract.service';
import { toContractObligacionArrendatarioDto } from '../types/dto/contract.dto';
import {
  OBLIGACION_ARRENDATARIO_LABELS,
  TipoObligacionArrendatario,
} from '../models/contract-obligacion-arrendatario.model';

describe('ContractService — Obligaciones del Arrendatario (WS-22)', () => {
  let service: ContractService;

  beforeEach(() => {
    service = new ContractService();
  });

  // ─── Service Instantiation ────────────────────────────────────────────────

  describe('Service Instantiation', () => {
    it('should create an instance of ContractService', () => {
      expect(service).toBeInstanceOf(ContractService);
    });
  });

  // ─── Method Existence ────────────────────────────────────────────────────

  describe('Method Existence', () => {
    it('should have getObligacionesArrendatario method', () => {
      expect(service.getObligacionesArrendatario).toBeDefined();
      expect(typeof service.getObligacionesArrendatario).toBe('function');
    });

    it('should have initializeObligacionesArrendatario method', () => {
      expect(service.initializeObligacionesArrendatario).toBeDefined();
      expect(typeof service.initializeObligacionesArrendatario).toBe('function');
    });

    it('should have updateObligacionArrendatario method', () => {
      expect(service.updateObligacionArrendatario).toBeDefined();
      expect(typeof service.updateObligacionArrendatario).toBe('function');
    });
  });

  // ─── Method Signatures ────────────────────────────────────────────────────

  describe('Method Signatures', () => {
    it('getObligacionesArrendatario should accept contratoId parameter', () => {
      expect(service.getObligacionesArrendatario.length).toBe(1);
    });

    it('initializeObligacionesArrendatario should accept contratoId parameter', () => {
      expect(service.initializeObligacionesArrendatario.length).toBe(1);
    });

    it('updateObligacionArrendatario should accept id and data parameters', () => {
      expect(service.updateObligacionArrendatario.length).toBe(2);
    });
  });

  // ─── Method Names Validation ─────────────────────────────────────────────

  describe('Method Names Validation', () => {
    it('should have all expected obligaciones arrendatario method names', () => {
      const expectedMethods = [
        'getObligacionesArrendatario',
        'initializeObligacionesArrendatario',
        'updateObligacionArrendatario',
      ];

      expectedMethods.forEach((methodName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(typeof (service as any)[methodName]).toBe('function');
      });
    });
  });

  // ─── DTO Transform ────────────────────────────────────────────────────────

  describe('toContractObligacionArrendatarioDto', () => {
    it('should be a function', () => {
      expect(toContractObligacionArrendatarioDto).toBeDefined();
      expect(typeof toContractObligacionArrendatarioDto).toBe('function');
    });

    it('should map entity camelCase fields to snake_case DTO', () => {
      const mockEntity = {
        id: 1,
        contratoId: 42,
        tipoObligacion: 'GUARDIANIA',
        estado: 'PENDIENTE',
        fechaCompromiso: null,
        observaciones: null,
        createdAt: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date('2025-01-15T10:00:00Z'),
      };

      const dto = toContractObligacionArrendatarioDto(mockEntity);

      expect(dto.id).toBe(1);
      expect(dto.contrato_id).toBe(42);
      expect(dto.tipo_obligacion).toBe('GUARDIANIA');
      expect(dto.estado).toBe('PENDIENTE');
      expect(dto.fecha_compromiso).toBeNull();
      expect(dto.observaciones).toBeNull();
      expect(dto.created_at).toBe('2025-01-15T10:00:00.000Z');
      expect(dto.updated_at).toBe('2025-01-15T10:00:00.000Z');
    });

    it('should format fecha_compromiso as YYYY-MM-DD when present', () => {
      const mockEntity = {
        id: 2,
        contratoId: 10,
        tipoObligacion: 'PAGOS_OPORTUNOS',
        estado: 'CUMPLIDA',
        fechaCompromiso: new Date('2025-06-30'),
        observaciones: 'Pagado al día',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      };

      const dto = toContractObligacionArrendatarioDto(mockEntity);

      expect(dto.fecha_compromiso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dto.observaciones).toBe('Pagado al día');
      expect(dto.estado).toBe('CUMPLIDA');
    });

    it('should return null for missing observaciones', () => {
      const mockEntity = {
        id: 3,
        contratoId: 5,
        tipoObligacion: 'SENALIZACION_SEGURIDAD',
        estado: 'INCUMPLIDA',
        fechaCompromiso: null,
        observaciones: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toContractObligacionArrendatarioDto(mockEntity);

      expect(dto.observaciones).toBeNull();
    });

    it('should return empty string for missing createdAt/updatedAt', () => {
      const mockEntity = {
        id: 4,
        contratoId: 7,
        tipoObligacion: 'NO_TRASLADO_SIN_AUTORIZACION',
        estado: 'PENDIENTE',
        fechaCompromiso: null,
        observaciones: null,
        createdAt: null,
        updatedAt: null,
      };

      const dto = toContractObligacionArrendatarioDto(mockEntity);

      expect(dto.created_at).toBe('');
      expect(dto.updated_at).toBe('');
    });
  });

  // ─── OBLIGACION_ARRENDATARIO_LABELS ──────────────────────────────────────

  describe('OBLIGACION_ARRENDATARIO_LABELS', () => {
    const ALL_TIPOS: TipoObligacionArrendatario[] = [
      'GUARDIANIA',
      'SENALIZACION_SEGURIDAD',
      'PAGOS_OPORTUNOS',
      'NO_TRASLADO_SIN_AUTORIZACION',
    ];

    it('should define all 4 obligation types', () => {
      expect(Object.keys(OBLIGACION_ARRENDATARIO_LABELS)).toHaveLength(4);
    });

    it('should have a non-empty label for each obligation type', () => {
      ALL_TIPOS.forEach((tipo) => {
        expect(OBLIGACION_ARRENDATARIO_LABELS[tipo]).toBeDefined();
        expect(OBLIGACION_ARRENDATARIO_LABELS[tipo].length).toBeGreaterThan(0);
      });
    });

    it('should include all PRD Cláusula 8 obligation codes', () => {
      ALL_TIPOS.forEach((tipo) => {
        expect(Object.keys(OBLIGACION_ARRENDATARIO_LABELS)).toContain(tipo);
      });
    });
  });
});
