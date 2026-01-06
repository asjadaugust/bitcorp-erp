import { PaymentScheduleService } from './payment-schedule.service';
import {
  PaymentScheduleRepository,
  PaymentScheduleDetailRepository,
} from '../repositories/payment-schedule.repository';
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

describe('PaymentScheduleService', () => {
  let service: PaymentScheduleService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockScheduleRepo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockDetailRepo: any;

  beforeEach(() => {
    service = new PaymentScheduleService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockScheduleRepo = PaymentScheduleRepository as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockDetailRepo = PaymentScheduleDetailRepository as any;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new payment schedule', async () => {
      const mockData = {
        schedule_date: new Date(),
        payment_date: new Date(),
        description: 'Test schedule',
      };

      const mockCreated = {
        id: 1,
        ...mockData,
        status: PaymentScheduleStatus.DRAFT,
        total_amount: 0,
      };
      mockScheduleRepo.create.mockReturnValue(mockCreated);
      mockScheduleRepo.save.mockResolvedValue(mockCreated);

      const result = await service.create(mockData, 1, 1);

      expect(mockScheduleRepo.create).toHaveBeenCalled();
      expect(mockScheduleRepo.save).toHaveBeenCalledWith(mockCreated);
      expect((result as unknown as typeof mockCreated).status).toBe(PaymentScheduleStatus.DRAFT);
    });
  });

  describe('findAll', () => {
    it('should return all payment schedules', async () => {
      const mockSchedules = [
        { id: 1, periodo: '2025-01' },
        { id: 2, periodo: '2025-02' },
      ];

      mockScheduleRepo.find.mockResolvedValue(mockSchedules);

      const result = await service.findAll(1);

      expect(mockScheduleRepo.find).toHaveBeenCalledWith({
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
        total_amount: 0,
      };
      const mockDetail = {
        id: 1,
        payment_schedule_id: 1,
        amount_to_pay: 1000,
      };

      mockScheduleRepo.findOne.mockResolvedValue(mockSchedule);
      mockDetailRepo.create.mockReturnValue(mockDetail);
      mockDetailRepo.save.mockResolvedValue(mockDetail);
      mockScheduleRepo.save.mockResolvedValue({ ...mockSchedule, total_amount: 1000 });

      await service.addDetail(1, { amount_to_pay: 1000 });

      expect(mockDetailRepo.create).toHaveBeenCalledWith({
        payment_schedule_id: 1,
        amount_to_pay: 1000,
      });
      expect(mockDetailRepo.save).toHaveBeenCalled();
      expect(mockScheduleRepo.save).toHaveBeenCalled();
    });

    it('should throw error if schedule is not draft', async () => {
      const mockSchedule = {
        id: 1,
        status: PaymentScheduleStatus.APPROVED,
      };
      mockScheduleRepo.findOne.mockResolvedValue(mockSchedule);

      await expect(service.addDetail(1, { amount_to_pay: 1000 })).rejects.toThrow(
        'Cannot add details to non-draft schedule'
      );
    });
  });

  describe('delete', () => {
    it('should delete a draft schedule', async () => {
      const mockSchedule = { id: 1, status: PaymentScheduleStatus.DRAFT };
      mockScheduleRepo.findWithDetails.mockResolvedValue(mockSchedule);
      mockScheduleRepo.remove.mockResolvedValue(mockSchedule);

      await service.delete(1);

      expect(mockScheduleRepo.remove).toHaveBeenCalledWith(mockSchedule);
    });

    it('should throw error if schedule is not draft', async () => {
      const mockSchedule = { id: 1, status: PaymentScheduleStatus.PROCESSED };
      mockScheduleRepo.findWithDetails.mockResolvedValue(mockSchedule);

      await expect(service.delete(1)).rejects.toThrow('Only draft schedules can be deleted');
    });
  });
});
