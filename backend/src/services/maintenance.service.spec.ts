import { MaintenanceService } from './maintenance.service';
import { toMaintenanceDto } from '../types/dto/maintenance.dto';

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(() => {
    service = new MaintenanceService();
  });

  describe('Service Instantiation', () => {
    it('should create an instance of MaintenanceService', () => {
      expect(service).toBeInstanceOf(MaintenanceService);
    });
  });

  describe('Method Existence', () => {
    it('should have getAllMaintenance method', () => {
      expect(service.getAllMaintenance).toBeDefined();
      expect(typeof service.getAllMaintenance).toBe('function');
    });

    it('should have getMaintenanceById method', () => {
      expect(service.getMaintenanceById).toBeDefined();
      expect(typeof service.getMaintenanceById).toBe('function');
    });

    it('should have createMaintenance method', () => {
      expect(service.createMaintenance).toBeDefined();
      expect(typeof service.createMaintenance).toBe('function');
    });

    it('should have updateMaintenance method', () => {
      expect(service.updateMaintenance).toBeDefined();
      expect(typeof service.updateMaintenance).toBe('function');
    });

    it('should have deleteMaintenance method', () => {
      expect(service.deleteMaintenance).toBeDefined();
      expect(typeof service.deleteMaintenance).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('getAllMaintenance should accept optional filters parameter', () => {
      expect(service.getAllMaintenance.length).toBe(1);
    });

    it('getMaintenanceById should accept id parameter', () => {
      expect(service.getMaintenanceById.length).toBe(1);
    });

    it('createMaintenance should accept data and userId parameters', () => {
      expect(service.createMaintenance.length).toBe(2);
    });

    it('updateMaintenance should accept id, data, and userId parameters', () => {
      expect(service.updateMaintenance.length).toBe(3);
    });

    it('deleteMaintenance should accept id parameter', () => {
      expect(service.deleteMaintenance.length).toBe(1);
    });
  });

  describe('Method Names Validation', () => {
    it('should have all expected method names', () => {
      const expectedMethods = [
        'getAllMaintenance',
        'getMaintenanceById',
        'createMaintenance',
        'updateMaintenance',
        'deleteMaintenance',
      ];

      expectedMethods.forEach((methodName) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(typeof (service as any)[methodName]).toBe('function');
      });
    });
  });

  describe('Service Structure', () => {
    it('should have repository property', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).repository).toBeDefined();
    });

    it('should not be a singleton export', () => {
      const service1 = new MaintenanceService();
      const service2 = new MaintenanceService();
      expect(service1).not.toBe(service2);
    });

    it('should have toMaintenanceDto function available in module', () => {
      expect(toMaintenanceDto).toBeDefined();
      expect(typeof toMaintenanceDto).toBe('function');
    });
  });
});
