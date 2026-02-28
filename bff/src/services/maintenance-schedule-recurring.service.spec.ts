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
    it('findAll should accept tenantId and filters parameters', () => {
      expect(service.findAll.length).toBe(2);
    });

    it('findById should accept tenantId and id parameters', () => {
      expect(service.findById.length).toBe(2);
    });

    it('create should accept tenantId and dto parameters', () => {
      expect(service.create.length).toBe(2);
    });

    it('update should accept tenantId, id and dto parameters', () => {
      expect(service.update.length).toBe(3);
    });

    it('delete should accept tenantId and id parameters', () => {
      expect(service.delete.length).toBe(2);
    });

    it('findDueSoon should accept tenantId and optional daysAhead parameter', () => {
      expect(service.findDueSoon.length).toBe(1);
    });

    it('complete should accept tenantId, id and optional completionHours parameters', () => {
      expect(service.complete.length).toBe(3);
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
