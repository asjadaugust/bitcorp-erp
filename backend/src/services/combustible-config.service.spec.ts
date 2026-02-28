/* eslint-disable @typescript-eslint/no-explicit-any */
import { CombustibleConfigService } from './combustible-config.service';

describe('CombustibleConfigService', () => {
  let service: CombustibleConfigService;

  beforeEach(() => {
    service = new CombustibleConfigService();
  });

  describe('Service Instantiation', () => {
    it('should create an instance', () => {
      expect(service).toBeInstanceOf(CombustibleConfigService);
    });
  });

  describe('Method Existence', () => {
    it('should have obtener method', () => {
      expect(typeof service.obtener).toBe('function');
    });

    it('should have obtenerPrecioManipuleo method', () => {
      expect(typeof service.obtenerPrecioManipuleo).toBe('function');
    });

    it('should have actualizar method', () => {
      expect(typeof service.actualizar).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('obtener should require no parameters', () => {
      expect(service.obtener.length).toBe(0);
    });

    it('obtenerPrecioManipuleo should require no parameters', () => {
      expect(service.obtenerPrecioManipuleo.length).toBe(0);
    });

    it('actualizar should accept precio and userId', () => {
      expect(service.actualizar.length).toBe(2);
    });
  });

  describe('DTO transformation (toDto)', () => {
    it('should correctly map entity properties to DTO', () => {
      const mockEntity = {
        id: 1,
        precioManipuleo: 0.8 as unknown as number,
        activo: true,
        updatedBy: 5,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      };

      const dto = (service as any).toDto(mockEntity);

      expect(dto.id).toBe(1);
      expect(dto.precio_manipuleo).toBe(0.8);
      expect(dto.activo).toBe(true);
      expect(dto.updated_by).toBe(5);
      expect(dto.updated_at).toBe('2026-01-01T00:00:00.000Z');
    });

    it('should handle string decimal values from DB', () => {
      const mockEntity = {
        id: 2,
        precioManipuleo: '0.80' as unknown as number,
        activo: true,
        updatedBy: null,
        updatedAt: new Date(),
      };

      const dto = (service as any).toDto(mockEntity);
      expect(dto.precio_manipuleo).toBe(0.8);
    });

    it('should return 0 for null/undefined precioManipuleo', () => {
      const mockEntity = {
        id: 3,
        precioManipuleo: null as unknown as number,
        activo: true,
        updatedBy: null,
        updatedAt: new Date(),
      };

      const dto = (service as any).toDto(mockEntity);
      expect(dto.precio_manipuleo).toBe(0);
    });
  });

  describe('DEFAULT_RATE constant', () => {
    it('should have DEFAULT_MANIPULEO_RATE of 0.80 per PRD Anexo B', () => {
      expect(CombustibleConfigService.DEFAULT_MANIPULEO_RATE).toBe(0.8);
    });
  });
});
