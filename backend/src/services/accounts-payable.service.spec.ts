import { AccountsPayableService } from './accounts-payable.service';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { AccountsPayableStatus } from '../models/accounts-payable.model';

// Mock the repository
jest.mock('../repositories/accounts-payable.repository', () => ({
  AccountsPayableRepository: {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  },
}));

describe('AccountsPayableService', () => {
  let service: AccountsPayableService;
  let mockRepository: any;

  beforeEach(() => {
    service = new AccountsPayableService();
    mockRepository = AccountsPayableRepository;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new accounts payable record', async () => {
      const mockData: any = {
        provider_id: 1,
        document_type: 'invoice',
        document_number: 'INV-001',
        issue_date: new Date(),
        due_date: new Date(),
        amount: 1000,
        currency: 'PEN',
        description: 'Test invoice',
        tenant_id: 1,
      };

      const mockCreated = { id: 1, ...mockData, status: AccountsPayableStatus.PENDING };
      mockRepository.create.mockReturnValue(mockCreated);
      mockRepository.save.mockResolvedValue(mockCreated);

      const result = await service.create(mockData);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalledWith(mockCreated);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('findAll', () => {
    it('should return all accounts payable records', async () => {
      const mockRecords = [
        { id: 1, tenant_id: 1, document_number: 'INV-001' },
        { id: 2, tenant_id: 1, document_number: 'INV-002' },
      ];

      mockRepository.find.mockResolvedValue(mockRecords);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockRecords);
    });
  });

  describe('findOne', () => {
    it('should return a specific accounts payable record', async () => {
      const mockRecord = { id: 1, document_number: 'INV-001' };
      mockRepository.findOne.mockResolvedValue(mockRecord);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRecord);
    });

    it('should return null if record not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update the status of an accounts payable record', async () => {
      const mockRecord = { id: 1, status: AccountsPayableStatus.PENDING };
      mockRepository.findOne.mockResolvedValue(mockRecord);
      const updatedRecord = { ...mockRecord, status: AccountsPayableStatus.PAID };
      mockRepository.save.mockResolvedValue(updatedRecord);

      const result = await service.updateStatus(1, AccountsPayableStatus.PAID);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result!.status).toBe(AccountsPayableStatus.PAID);
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
});
