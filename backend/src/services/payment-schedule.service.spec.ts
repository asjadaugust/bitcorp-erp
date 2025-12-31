import { PaymentScheduleService } from './payment-schedule.service';
import { PaymentScheduleRepository, PaymentScheduleDetailRepository } from '../repositories/payment-schedule.repository';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import { PaymentScheduleStatus } from '../models/payment-schedule.model';

// Mock the repositories
jest.mock('../repositories/payment-schedule.repository', () => ({
  PaymentScheduleRepository: {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findWithDetails: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
  },
  PaymentScheduleDetailRepository: {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('../repositories/accounts-payable.repository', () => ({
  AccountsPayableRepository: {
    findOne: jest.fn(),
  },
}));

describe('PaymentScheduleService', () => {
  let service: PaymentScheduleService;
  let mockScheduleRepo: any;
  let mockDetailRepo: any;
  let mockAPRepo: any;

  beforeEach(() => {
    service = new PaymentScheduleService();
    mockScheduleRepo = PaymentScheduleRepository as any;
    mockDetailRepo = PaymentScheduleDetailRepository as any;
    mockAPRepo = AccountsPayableRepository as any;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new payment schedule', async () => {
      const mockData = {
        schedule_date: new Date(),
        payment_date: new Date(),
        description: 'Test schedule',
      };

      const mockCreated = { id: 1, ...mockData, status: PaymentScheduleStatus.DRAFT, total_amount: 0 };
      mockScheduleRepo.create.mockReturnValue(mockCreated);
      mockScheduleRepo.save.mockResolvedValue(mockCreated);

      const result = await service.create(mockData, 1, 1);

      expect(mockScheduleRepo.create).toHaveBeenCalled();
      expect(mockScheduleRepo.save).toHaveBeenCalledWith(mockCreated);
      expect(result.status).toBe(PaymentScheduleStatus.DRAFT);
    });
  });

  describe('findAll', () => {
    it('should return all payment schedules for a tenant', async () => {
      const mockSchedules = [
        { id: 1, tenant_id: 1 },
        { id: 2, tenant_id: 1 },
      ];

      mockScheduleRepo.find.mockResolvedValue(mockSchedules);

      const result = await service.findAll(1);

      expect(mockScheduleRepo.find).toHaveBeenCalledWith({
        where: { tenant_id: 1 },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(mockSchedules);
    });
  });

  describe('addDetail', () => {
    it('should add a detail to a draft schedule', async () => {
      const mockSchedule = { 
        id: 1, 
        status: PaymentScheduleStatus.DRAFT,
        total_amount: 0
      };
      const mockAP = { id: 10, amount: 1000 };
      const mockDetail = { id: 1, payment_schedule_id: 1, accounts_payable_id: 10, amount_to_pay: 1000 };

      mockScheduleRepo.findOne.mockResolvedValue(mockSchedule);
      mockAPRepo.findOne.mockResolvedValue(mockAP);
      mockDetailRepo.create.mockReturnValue(mockDetail);
      mockDetailRepo.save.mockResolvedValue(mockDetail);
      mockScheduleRepo.save.mockResolvedValue({ ...mockSchedule, total_amount: 1000 });

      const result = await service.addDetail(1, { accounts_payable_id: 10, amount_to_pay: 1000 });

      expect(mockDetailRepo.create).toHaveBeenCalledWith({
        payment_schedule_id: 1,
        accounts_payable_id: 10,
        amount_to_pay: 1000,
      });
      expect(mockDetailRepo.save).toHaveBeenCalled();
      expect(mockScheduleRepo.save).toHaveBeenCalled();
    });

    it('should throw error if schedule is not draft', async () => {
      const mockSchedule = { 
        id: 1, 
        status: PaymentScheduleStatus.APPROVED
      };
      mockScheduleRepo.findOne.mockResolvedValue(mockSchedule);

      await expect(service.addDetail(1, { accounts_payable_id: 10, amount_to_pay: 1000 }))
        .rejects.toThrow('Cannot add details to non-draft schedule');
    });

    it('should throw error if AP item not found', async () => {
      const mockSchedule = { 
        id: 1, 
        status: PaymentScheduleStatus.DRAFT
      };
      mockScheduleRepo.findOne.mockResolvedValue(mockSchedule);
      mockAPRepo.findOne.mockResolvedValue(null);

      await expect(service.addDetail(1, { accounts_payable_id: 999, amount_to_pay: 1000 }))
        .rejects.toThrow('Accounts payable item not found');
    });
  });

  describe('delete', () => {
    it('should delete a draft schedule', async () => {
      const mockSchedule = { id: 1, status: PaymentScheduleStatus.DRAFT };
      // The delete method calls findOne(), which internally calls findWithDetails()
      mockScheduleRepo.findWithDetails.mockResolvedValue(mockSchedule);
      mockScheduleRepo.remove.mockResolvedValue(mockSchedule);

      const result = await service.delete(1);

      expect(mockScheduleRepo.remove).toHaveBeenCalledWith(mockSchedule);
    });

    it('should throw error if schedule is not draft', async () => {
      const mockSchedule = { id: 1, status: PaymentScheduleStatus.PROCESSED };
      mockScheduleRepo.findWithDetails.mockResolvedValue(mockSchedule);

      await expect(service.delete(1)).rejects.toThrow('Only draft schedules can be deleted');
    });
  });
});
