import { ValuationService } from './valuation.service';
import pool from '../config/database.config';

// Mock the database pool
jest.mock('../config/database.config', () => ({
  query: jest.fn(),
}));

describe('ValuationService', () => {
  let service: ValuationService;
  const mockPoolQuery = pool.query as jest.Mock;

  beforeEach(() => {
    service = new ValuationService();
    jest.clearAllMocks();
  });

  describe('generateValuationForContract', () => {
    const mockContractId = 'contract-123';
    const mockUserId = 'user-123';
    const mockMonth = 11;
    const mockYear = 2025;

    const mockContract = {
      C08003_Id: mockContractId,
      C08001_Id: 'equip-123',
      rate_type: 'hourly',
      rate_amount: '100',
      currency: 'PEN',
    };

    const mockReports = [
      {
        C08005_Fecha: '2025-11-01T00:00:00Z',
        hours_worked: '8',
        fuel_consumed: '10',
      },
      {
        C08005_Fecha: '2025-11-02T00:00:00Z',
        hours_worked: '8',
        fuel_consumed: '12',
      },
    ];

    it('should generate a new valuation if none exists', async () => {
      // 1. Mock calculateValuation dependencies
      // Contract query
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockContract] });
      // Reports query
      mockPoolQuery.mockResolvedValueOnce({ rows: mockReports });

      // 2. Mock check existing valuation (empty)
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      // 3. Mock createValuation dependencies
      // Contract query (inside createValuation)
      mockPoolQuery.mockResolvedValueOnce({ 
        rows: [{ 
          C08001_Id: 'equip-123', 
          G00007_Id: 'proj-123', 
          C07001_Id: 'prov-123' 
        }] 
      });
      // Insert query
      mockPoolQuery.mockResolvedValueOnce({ 
        rows: [{ 
          C08004_Id: 1, 
          total_valuation: 1600, 
          C08004_Estado: 'draft' 
        }] 
      });

      const result = await service.generateValuationForContract(mockContractId, mockMonth, mockYear, mockUserId);

      expect(result).toBeDefined();
      expect(result!.amount).toBe(1600); // 16 hours * 100 rate
      
      // Verify calls
      expect(mockPoolQuery).toHaveBeenCalledTimes(5);
      // Check insert call
      const insertCall = mockPoolQuery.mock.calls[4];
      expect(insertCall[0]).toContain('INSERT INTO tbl_c08004_valorizacionequipo');
      expect(insertCall[1]).toContain(1600); // Amount
    });

    it('should update existing valuation if it exists', async () => {
      // 1. Mock calculateValuation dependencies
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockContract] });
      mockPoolQuery.mockResolvedValueOnce({ rows: mockReports });

      // 2. Mock check existing valuation (found)
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ C08004_Id: 99 }] });

      // 3. Mock updateValuation dependencies
      // Update query
      mockPoolQuery.mockResolvedValueOnce({ 
        rows: [{ 
          C08004_Id: 99, 
          total_valuation: 1600, 
          C08004_Estado: 'draft' 
        }] 
      });

      const result = await service.generateValuationForContract(mockContractId, mockMonth, mockYear, mockUserId);

      expect(result).toBeDefined();
      expect(result!.id).toBe(99);
      
      // Verify calls
      expect(mockPoolQuery).toHaveBeenCalledTimes(4);
      // Check update call
      const updateCall = mockPoolQuery.mock.calls[3];
      expect(updateCall[0]).toContain('UPDATE tbl_c08004_valorizacionequipo');
    });
  });
});
