import { MaintenanceScheduleRecurringService } from './maintenance-schedule-recurring.service';
import { toMaintenanceScheduleRecurringDto } from '../types/dto/maintenance-schedule-recurring.dto';

describe('MaintenanceScheduleRecurringService', () => {
  let service: MaintenanceScheduleRecurringService;

  beforeEach(() => {
    service = new MaintenanceScheduleRecurringService();
  });

  describe('Service Instantiation', () => {
    it('should create an instance of MaintenanceScheduleRecurringService', () => {
      expect(service).toBeInstanceOf(MaintenanceScheduleRecurringService);
    });
  });

  describe('Method Existence', () => {
    it('should have findAll method', () => {
      expect(service.findAll).toBeDefined();
      expect(typeof service.findAll).toBe('function');
    });

    it('should have findById method', () => {
      expect(service.findById).toBeDefined();
      expect(typeof service.findById).toBe('function');
    });

    it('should have create method', () => {
      expect(service.create).toBeDefined();
      expect(typeof service.create).toBe('function');
    });

    it('should have update method', () => {
      expect(service.update).toBeDefined();
      expect(typeof service.update).toBe('function');
    });

    it('should have delete method', () => {
      expect(service.delete).toBeDefined();
      expect(typeof service.delete).toBe('function');
    });

    it('should have findDueSoon method', () => {
      expect(service.findDueSoon).toBeDefined();
      expect(typeof service.findDueSoon).toBe('function');
    });

    it('should have complete method', () => {
      expect(service.complete).toBeDefined();
      expect(typeof service.complete).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('findAll should accept filters parameter', () => {
      expect(service.findAll.length).toBe(1);
    });

    it('findById should accept id parameter', () => {
      expect(service.findById.length).toBe(1);
    });

    it('create should accept dto parameter', () => {
      expect(service.create.length).toBe(1);
    });

    it('update should accept id and dto parameters', () => {
      expect(service.update.length).toBe(2);
    });

    it('delete should accept id parameter', () => {
      expect(service.delete.length).toBe(1);
    });

    it('findDueSoon should accept optional daysAhead parameter', () => {
      expect(service.findDueSoon.length).toBe(0);
    });

    it('complete should accept id and optional completionHours parameters', () => {
      expect(service.complete.length).toBe(2);
    });
  });

  describe('Method Names Validation', () => {
    it('should have all expected method names', () => {
      const expectedMethods = [
        'findAll',
        'findById',
        'create',
        'update',
        'delete',
        'findDueSoon',
        'complete',
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
      const service1 = new MaintenanceScheduleRecurringService();
      const service2 = new MaintenanceScheduleRecurringService();
      expect(service1).not.toBe(service2);
    });

    it('should have toMaintenanceScheduleRecurringDto function available in module', () => {
      expect(toMaintenanceScheduleRecurringDto).toBeDefined();
      expect(typeof toMaintenanceScheduleRecurringDto).toBe('function');
    });

    it('should have calculateNextDueDate private method', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(typeof (service as any).calculateNextDueDate).toBe('function');
    });
  });
});
