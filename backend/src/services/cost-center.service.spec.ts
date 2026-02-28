import { CostCenterService } from './cost-center.service';

/**
 * Cost Center Service Tests
 *
 * Note: These are lightweight tests focusing on service instantiation and method signatures.
 * We do NOT call actual methods (which would attempt database access) in unit tests.
 *
 * Full integration tests with database should be added when:
 * 1. Multi-tenancy schema migration is complete (Phase 21)
 * 2. Test database fixtures are established
 * 3. Repository mocking pattern is standardized
 *
 * Current coverage:
 * - Service instantiation
 * - Method existence and signatures
 * - Parameter counts validation
 *
 * @see dashboard.service.spec.ts for reference pattern
 */
describe('CostCenterService', () => {
  let service: CostCenterService;

  beforeEach(() => {
    service = new CostCenterService();
  });

  describe('Instantiation', () => {
    it('should create service instance', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(CostCenterService);
    });
  });

  describe('Method Signatures', () => {
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

    it('should have findByProject method', () => {
      expect(service.findByProject).toBeDefined();
      expect(typeof service.findByProject).toBe('function');
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

    it('should have getTotalBudgetByProject method', () => {
      expect(service.getTotalBudgetByProject).toBeDefined();
      expect(typeof service.getTotalBudgetByProject).toBe('function');
    });

    it('should have getActiveCount method', () => {
      expect(service.getActiveCount).toBeDefined();
      expect(typeof service.getActiveCount).toBe('function');
    });
  });

  describe('Method Parameters', () => {
    it('findById should accept tenantId and id parameters', () => {
      expect(service.findById.length).toBe(2);
    });

    it('findByCode should accept tenantId and codigo parameters', () => {
      expect(service.findByCode.length).toBe(2);
    });

    it('findByProject should accept tenantId and projectId parameters', () => {
      expect(service.findByProject.length).toBe(2);
    });

    it('findAll should accept tenantId and optional filters parameter', () => {
      // tenantId (required) + filters (optional but no default = still counted by Function.length)
      expect(service.findAll.length).toBe(2);
    });

    it('create should accept tenantId and data parameters', () => {
      expect(service.create.length).toBe(2);
    });

    it('update should accept tenantId, id and data parameters', () => {
      expect(service.update.length).toBe(3);
    });

    it('delete should accept tenantId and id parameters', () => {
      expect(service.delete.length).toBe(2);
    });

    it('getTotalBudgetByProject should accept tenantId and projectId parameters', () => {
      expect(service.getTotalBudgetByProject.length).toBe(2);
    });

    it('getActiveCount should accept tenantId parameter', () => {
      expect(service.getActiveCount.length).toBe(1);
    });
  });
});
