import { AccountsPayableService } from './accounts-payable.service';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { AccountsPayableStatus } from '../models/accounts-payable.model';
import { NotFoundError } from '../errors';

// Mock the repository
jest.mock('../repositories/accounts-payable.repository', () => ({
  AccountsPayableRepository: {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
    findPending: jest.fn(),
    createQueryBuilder: jest.fn(),
  },
}));

describe('AccountsPayableService', () => {
  let service: AccountsPayableService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRepository: any;

  // Helper to create mock entity
  const createMockEntity = (id: number, overrides = {}) => ({
    id,
    legacy_id: null,
    provider_id: 1,
    document_number: `INV-${id.toString().padStart(3, '0')}`,
    issue_date: new Date('2024-01-01'),
    due_date: new Date('2024-02-01'),
    amount: 1000,
    amount_paid: 0,
    balance: 1000,
    currency: 'PEN',
    status: AccountsPayableStatus.PENDING,
    description: 'Test invoice',
    created_at: new Date(),
    updated_at: new Date(),
    provider: {
      id: 1,
      ruc: '20123456789',
      razon_social: 'Test Provider',
      nombre_comercial: 'Test',
    },
    ...overrides,
  });

  beforeEach(() => {
    service = new AccountsPayableService();
    mockRepository = AccountsPayableRepository;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new accounts payable record', async () => {
      const mockData = {
        proveedor_id: 1,
        numero_factura: 'INV-001',
        fecha_emision: '2024-01-01',
        fecha_vencimiento: '2024-02-01',
        monto_total: 1000,
        moneda: 'PEN',
        observaciones: 'Test invoice',
      };

      const mockEntity = createMockEntity(1);
      mockRepository.create.mockReturnValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockEntity);
      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await service.create(mockData);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.numero_factura).toBe('INV-001');
    });
  });

  describe('findAll', () => {
    it('should return paginated accounts payable records with total', async () => {
      const mockEntities = [createMockEntity(1), createMockEntity(2)];

      // Mock the query builder chain
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockEntities),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('ap');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('ap.provider', 'provider');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0].numero_factura).toBe('INV-001');
    });
  });

  describe('findOne', () => {
    it('should return a specific accounts payable record', async () => {
      const mockEntity = createMockEntity(1);
      mockRepository.findOne.mockResolvedValue(mockEntity);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
      expect(result!.numero_factura).toBe('INV-001');
    });

    it('should throw NotFoundError if record not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundError);
      await expect(service.findOne(999)).rejects.toThrow(
        "AccountsPayable with identifier '999' not found"
      );
    });
  });

  describe('updateStatus', () => {
    it('should update the status of an accounts payable record', async () => {
      const mockEntity = createMockEntity(1, { status: AccountsPayableStatus.PENDING });
      const updatedEntity = createMockEntity(1, { status: AccountsPayableStatus.PAID });

      mockRepository.findOne.mockResolvedValue(mockEntity);
      mockRepository.save.mockResolvedValue(updatedEntity);

      const result = await service.updateStatus(1, AccountsPayableStatus.PAID);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result!.estado).toBe(AccountsPayableStatus.PAID);
    });
  });

  describe('delete', () => {
    it('should delete an accounts payable record', async () => {
      mockRepository.delete = jest.fn().mockResolvedValue({ affected: 1 });

      const result = await service.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('findPending', () => {
    it('should return pending accounts payable records', async () => {
      const mockEntities = [
        createMockEntity(1, { status: AccountsPayableStatus.PENDING }),
        createMockEntity(2, { status: AccountsPayableStatus.PENDING }),
      ];
      mockRepository.findPending.mockResolvedValue(mockEntities);

      const result = await service.findPending();

      expect(mockRepository.findPending).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].estado).toBe(AccountsPayableStatus.PENDING);
    });
  });
});
