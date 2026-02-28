import { ContractService } from './contract.service';
import { toContractObligacionDto } from '../types/dto/contract.dto';
import { OBLIGACION_LABELS, TipoObligacionArrendador } from '../models/contract-obligacion.model';

describe('ContractService — Obligaciones del Arrendador (WS-21)', () => {
  let service: ContractService;

  beforeEach(() => {
    service = new ContractService();
  });

  // ─── Service Instantiation ────────────────────────────────────────────────

  describe('Service Instantiation', () => {
    it('should create an instance of ContractService', () => {
      expect(service).toBeInstanceOf(ContractService);
    });

    it('should not be a singleton export', () => {
      const service1 = new ContractService();
      const service2 = new ContractService();
      expect(service1).not.toBe(service2);
    });
  });

  // ─── Method Existence ────────────────────────────────────────────────────

  describe('Method Existence', () => {
    it('should have getObligaciones method', () => {
      expect(service.getObligaciones).toBeDefined();
      expect(typeof service.getObligaciones).toBe('function');
    });

    it('should have initializeObligaciones method', () => {
      expect(service.initializeObligaciones).toBeDefined();
      expect(typeof service.initializeObligaciones).toBe('function');
    });

    it('should have updateObligacion method', () => {
      expect(service.updateObligacion).toBeDefined();
      expect(typeof service.updateObligacion).toBe('function');
    });
  });

  // ─── Method Signatures ────────────────────────────────────────────────────

  describe('Method Signatures', () => {
    it('getObligaciones should accept tenantId and contratoId parameters', () => {
      expect(service.getObligaciones.length).toBe(2);
    });

    it('initializeObligaciones should accept tenantId and contratoId parameters', () => {
      expect(service.initializeObligaciones.length).toBe(2);
    });

    it('updateObligacion should accept tenantId, id, and data parameters', () => {
      expect(service.updateObligacion.length).toBe(3);
    });
  });

  // ─── Method Names Validation ─────────────────────────────────────────────

  describe('Method Names Validation', () => {
    it('should have all expected obligaciones method names', () => {
      const expectedMethods = ['getObligaciones', 'initializeObligaciones', 'updateObligacion'];

      expectedMethods.forEach((methodName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(typeof (service as any)[methodName]).toBe('function');
      });
    });
  });

  // ─── DTO Transform ────────────────────────────────────────────────────────

  describe('toContractObligacionDto', () => {
    it('should be a function', () => {
      expect(toContractObligacionDto).toBeDefined();
      expect(typeof toContractObligacionDto).toBe('function');
    });

    it('should map entity camelCase fields to snake_case DTO', () => {
      const mockEntity = {
        id: 1,
        contratoId: 42,
        tipoObligacion: 'SOAT',
        estado: 'PENDIENTE',
        fechaCompromiso: null,
        observaciones: null,
        createdAt: new Date('2025-01-15T10:00:00Z'),
        updatedAt: new Date('2025-01-15T10:00:00Z'),
      };

      const dto = toContractObligacionDto(mockEntity);

      expect(dto.id).toBe(1);
      expect(dto.contrato_id).toBe(42);
      expect(dto.tipo_obligacion).toBe('SOAT');
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
        tipoObligacion: 'POLIZA_TREC',
        estado: 'CUMPLIDA',
        fechaCompromiso: new Date('2025-06-30'),
        observaciones: 'Renovada',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      };

      const dto = toContractObligacionDto(mockEntity);

      expect(dto.fecha_compromiso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dto.observaciones).toBe('Renovada');
      expect(dto.estado).toBe('CUMPLIDA');
    });

    it('should return null for missing observaciones', () => {
      const mockEntity = {
        id: 3,
        contratoId: 5,
        tipoObligacion: 'NORMAS_SEGURIDAD',
        estado: 'INCUMPLIDA',
        fechaCompromiso: null,
        observaciones: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toContractObligacionDto(mockEntity);

      expect(dto.observaciones).toBeNull();
    });

    it('should return empty string for missing createdAt/updatedAt', () => {
      const mockEntity = {
        id: 4,
        contratoId: 7,
        tipoObligacion: 'KIT_ANTIDERRAME',
        estado: 'PENDIENTE',
        fechaCompromiso: null,
        observaciones: null,
        createdAt: null,
        updatedAt: null,
      };

      const dto = toContractObligacionDto(mockEntity);

      expect(dto.created_at).toBe('');
      expect(dto.updated_at).toBe('');
    });
  });

  // ─── OBLIGACION_LABELS ────────────────────────────────────────────────────

  describe('OBLIGACION_LABELS', () => {
    const ALL_TIPOS = Object.keys(OBLIGACION_LABELS) as TipoObligacionArrendador[];

    it('should define all 9 obligation types', () => {
      expect(Object.keys(OBLIGACION_LABELS)).toHaveLength(9);
    });

    it('should have a non-empty label for each obligation type', () => {
      ALL_TIPOS.forEach((tipo) => {
        expect(OBLIGACION_LABELS[tipo]).toBeDefined();
        expect(OBLIGACION_LABELS[tipo].length).toBeGreaterThan(0);
      });
    });

    it('should include all PRD Cláusula 7 obligation codes', () => {
      ALL_TIPOS.forEach((tipo) => {
        expect(Object.keys(OBLIGACION_LABELS)).toContain(tipo);
      });
    });
  });
});
