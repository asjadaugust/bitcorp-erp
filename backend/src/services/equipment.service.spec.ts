import { EquipmentService } from './equipment.service';
import {
  toEquipmentListDto,
  toEquipmentDetailDto,
  toEquipmentStatsDto,
} from '../types/dto/equipment.dto';

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(() => {
    service = new EquipmentService();
  });

  describe('Service Instantiation', () => {
    it('should create an instance of EquipmentService', () => {
      expect(service).toBeInstanceOf(EquipmentService);
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

    it('should have findByCode method', () => {
      expect(service.findByCode).toBeDefined();
      expect(typeof service.findByCode).toBe('function');
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

    it('should have updateStatus method', () => {
      expect(service.updateStatus).toBeDefined();
      expect(typeof service.updateStatus).toBe('function');
    });

    it('should have updateHourmeter method', () => {
      expect(service.updateHourmeter).toBeDefined();
      expect(typeof service.updateHourmeter).toBe('function');
    });

    it('should have updateOdometer method', () => {
      expect(service.updateOdometer).toBeDefined();
      expect(typeof service.updateOdometer).toBe('function');
    });

    it('should have getStatistics method', () => {
      expect(service.getStatistics).toBeDefined();
      expect(typeof service.getStatistics).toBe('function');
    });

    it('should have getEquipmentTypes method', () => {
      expect(service.getEquipmentTypes).toBeDefined();
      expect(typeof service.getEquipmentTypes).toBe('function');
    });

    it('should have assignToProject method', () => {
      expect(service.assignToProject).toBeDefined();
      expect(typeof service.assignToProject).toBe('function');
    });

    it('should have transferEquipment method', () => {
      expect(service.transferEquipment).toBeDefined();
      expect(typeof service.transferEquipment).toBe('function');
    });

    it('should have getAvailability method', () => {
      expect(service.getAvailability).toBeDefined();
      expect(typeof service.getAvailability).toBe('function');
    });

    it('should have getAvailableEquipment method', () => {
      expect(service.getAvailableEquipment).toBeDefined();
      expect(typeof service.getAvailableEquipment).toBe('function');
    });

    it('should have getAssignmentHistory method', () => {
      expect(service.getAssignmentHistory).toBeDefined();
      expect(typeof service.getAssignmentHistory).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('findAll should accept tenantId, filter, page, and limit parameters', () => {
      // tenantId is required, filter is optional (no default counts toward length)
      // findAll(tenantId: number, filter?, page = 1, limit = 10) has length 2
      expect(service.findAll.length).toBe(2);
    });

    it('findById should accept tenantId and id parameters', () => {
      expect(service.findById.length).toBe(2);
    });

    it('findByCode should accept tenantId and codigo parameters', () => {
      expect(service.findByCode.length).toBe(2);
    });

    it('create should accept tenantId and data parameters', () => {
      expect(service.create.length).toBe(2);
    });

    it('update should accept tenantId, id, and data parameters', () => {
      expect(service.update.length).toBe(3);
    });

    it('delete should accept tenantId and id parameters', () => {
      expect(service.delete.length).toBe(2);
    });

    it('updateStatus should accept tenantId, id, and estado parameters', () => {
      expect(service.updateStatus.length).toBe(3);
    });

    it('updateHourmeter should accept tenantId, id, and reading parameters', () => {
      expect(service.updateHourmeter.length).toBe(3);
    });

    it('updateOdometer should accept tenantId, id, and reading parameters', () => {
      expect(service.updateOdometer.length).toBe(3);
    });

    it('getStatistics should accept tenantId parameter', () => {
      expect(service.getStatistics.length).toBe(1);
    });

    it('getEquipmentTypes should accept tenantId parameter', () => {
      expect(service.getEquipmentTypes.length).toBe(1);
    });

    it('assignToProject should accept id and data parameters', () => {
      expect(service.assignToProject.length).toBe(2);
    });

    it('transferEquipment should accept id and data parameters', () => {
      expect(service.transferEquipment.length).toBe(2);
    });

    it('getAvailability should accept idOrFilters, startDate, and endDate parameters', () => {
      expect(service.getAvailability.length).toBe(3);
    });

    it('getAvailableEquipment should accept tenantId parameter', () => {
      expect(service.getAvailableEquipment.length).toBe(1);
    });

    it('getAssignmentHistory should accept equipmentId parameter', () => {
      expect(service.getAssignmentHistory.length).toBe(1);
    });
  });

  describe('Method Names Validation', () => {
    it('should have all expected method names', () => {
      const expectedMethods = [
        'findAll',
        'findById',
        'findByCode',
        'create',
        'update',
        'delete',
        'updateStatus',
        'updateHourmeter',
        'updateOdometer',
        'getStatistics',
        'getEquipmentTypes',
        'assignToProject',
        'transferEquipment',
        'getAvailability',
        'getAvailableEquipment',
        'getAssignmentHistory',
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
      const service1 = new EquipmentService();
      const service2 = new EquipmentService();
      expect(service1).not.toBe(service2);
    });

    it('should have toEquipmentListDto function available in module', () => {
      expect(toEquipmentListDto).toBeDefined();
      expect(typeof toEquipmentListDto).toBe('function');
    });

    it('should have toEquipmentDetailDto function available in module', () => {
      expect(toEquipmentDetailDto).toBeDefined();
      expect(typeof toEquipmentDetailDto).toBe('function');
    });

    it('should have toEquipmentStatsDto function available in module', () => {
      expect(toEquipmentStatsDto).toBeDefined();
      expect(typeof toEquipmentStatsDto).toBe('function');
    });
  });
});
