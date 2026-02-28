import { ProviderFinancialInfoService } from './provider-financial-info.service';

describe('ProviderFinancialInfoService', () => {
  let service: ProviderFinancialInfoService;

  beforeEach(() => {
    service = new ProviderFinancialInfoService();
  });

  describe('Service Instantiation', () => {
    it('should instantiate service successfully', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ProviderFinancialInfoService);
    });
  });

  describe('Method Existence', () => {
    it('should have findByProviderId method', () => {
      expect(service.findByProviderId).toBeDefined();
      expect(typeof service.findByProviderId).toBe('function');
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
  });

  describe('Method Signatures (all methods require tenantId as first param)', () => {
    it('findByProviderId should accept tenantId and providerId (2 parameters)', () => {
      expect(service.findByProviderId.length).toBe(2);
    });

    it('findById should accept tenantId and id (2 parameters)', () => {
      expect(service.findById.length).toBe(2);
    });

    it('create should accept tenantId and data (2 parameters)', () => {
      expect(service.create.length).toBe(2);
    });

    it('update should accept tenantId, id and data (3 parameters)', () => {
      expect(service.update.length).toBe(3);
    });

    it('delete should accept tenantId and id (2 parameters)', () => {
      expect(service.delete.length).toBe(2);
    });
  });

  describe('Method Names', () => {
    it('should have correct method names', () => {
      const methodNames = ['findByProviderId', 'findById', 'create', 'update', 'delete'];

      methodNames.forEach((methodName) => {
        expect(service).toHaveProperty(methodName);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(typeof (service as any)[methodName]).toBe('function');
      });
    });
  });

  describe('Service Structure', () => {
    it('should have repository getter', () => {
      expect('repository' in service).toBe(true);
    });

    it('should have toDto method', () => {
      // toDto is private but exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(typeof (service as any).toDto).toBe('function');
    });

    it('toDto should accept 1 parameter', () => {
      // toDto is private but has 1 parameter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).toDto.length).toBe(1);
    });
  });
});
