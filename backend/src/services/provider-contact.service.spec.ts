import { ProviderContactService } from './provider-contact.service';

describe('ProviderContactService', () => {
  let service: ProviderContactService;

  beforeEach(() => {
    service = new ProviderContactService();
  });

  describe('Service Instantiation', () => {
    it('should instantiate service successfully', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ProviderContactService);
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

  describe('Method Signatures', () => {
    it('findByProviderId should accept 1 parameter', () => {
      expect(service.findByProviderId.length).toBe(1);
    });

    it('findById should accept 1 parameter', () => {
      expect(service.findById.length).toBe(1);
    });

    it('create should accept 1 parameter', () => {
      expect(service.create.length).toBe(1);
    });

    it('update should accept 2 parameters', () => {
      expect(service.update.length).toBe(2);
    });

    it('delete should accept 1 parameter', () => {
      expect(service.delete.length).toBe(1);
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
