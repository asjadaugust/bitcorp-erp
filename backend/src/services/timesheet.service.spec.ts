import { TimesheetService } from './timesheet.service';

describe('TimesheetService', () => {
  let service: TimesheetService;

  beforeEach(() => {
    service = new TimesheetService();
  });

  describe('Service Instantiation', () => {
    it('should instantiate service successfully', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(TimesheetService);
    });
  });

  describe('Method Existence', () => {
    it('should have generateTimesheet method', () => {
      expect(service.generateTimesheet).toBeDefined();
      expect(typeof service.generateTimesheet).toBe('function');
    });

    it('should have getTimesheetWithDetails method', () => {
      expect(service.getTimesheetWithDetails).toBeDefined();
      expect(typeof service.getTimesheetWithDetails).toBe('function');
    });

    it('should have submitTimesheet method', () => {
      expect(service.submitTimesheet).toBeDefined();
      expect(typeof service.submitTimesheet).toBe('function');
    });

    it('should have approveTimesheet method', () => {
      expect(service.approveTimesheet).toBeDefined();
      expect(typeof service.approveTimesheet).toBe('function');
    });

    it('should have rejectTimesheet method', () => {
      expect(service.rejectTimesheet).toBeDefined();
      expect(typeof service.rejectTimesheet).toBe('function');
    });

    it('should have listTimesheets method', () => {
      expect(service.listTimesheets).toBeDefined();
      expect(typeof service.listTimesheets).toBe('function');
    });

    it('should have getByTrabajadorAndPeriodo method', () => {
      expect(service.getByTrabajadorAndPeriodo).toBeDefined();
      expect(typeof service.getByTrabajadorAndPeriodo).toBe('function');
    });

    it('should have deleteTimesheet method', () => {
      expect(service.deleteTimesheet).toBeDefined();
      expect(typeof service.deleteTimesheet).toBe('function');
    });

    it('should have updateTimesheet method', () => {
      expect(service.updateTimesheet).toBeDefined();
      expect(typeof service.updateTimesheet).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('generateTimesheet should accept 1 parameter', () => {
      expect(service.generateTimesheet.length).toBe(1);
    });

    it('getTimesheetWithDetails should accept 1 parameter', () => {
      expect(service.getTimesheetWithDetails.length).toBe(1);
    });

    it('submitTimesheet should accept 2 parameters', () => {
      expect(service.submitTimesheet.length).toBe(2);
    });

    it('approveTimesheet should accept 2 parameters', () => {
      expect(service.approveTimesheet.length).toBe(2);
    });

    it('rejectTimesheet should accept 3 parameters', () => {
      expect(service.rejectTimesheet.length).toBe(3);
    });

    it('listTimesheets should accept 1 parameter', () => {
      expect(service.listTimesheets.length).toBe(1);
    });

    it('getByTrabajadorAndPeriodo should accept 2 parameters', () => {
      expect(service.getByTrabajadorAndPeriodo.length).toBe(2);
    });

    it('deleteTimesheet should accept 1 parameter', () => {
      expect(service.deleteTimesheet.length).toBe(1);
    });

    it('updateTimesheet should accept 2 parameters', () => {
      expect(service.updateTimesheet.length).toBe(2);
    });
  });

  describe('Method Names', () => {
    it('should have correct method names', () => {
      const methodNames = [
        'generateTimesheet',
        'getTimesheetWithDetails',
        'submitTimesheet',
        'approveTimesheet',
        'rejectTimesheet',
        'listTimesheets',
        'getByTrabajadorAndPeriodo',
        'deleteTimesheet',
        'updateTimesheet',
      ];

      methodNames.forEach((methodName) => {
        expect(service).toHaveProperty(methodName);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(typeof (service as any)[methodName]).toBe('function');
      });
    });
  });

  describe('Service Structure', () => {
    it('should have timesheetRepository getter', () => {
      expect('timesheetRepository' in service).toBe(true);
    });

    it('should have timesheetDetailRepository getter', () => {
      expect('timesheetDetailRepository' in service).toBe(true);
    });

    it('should have trabajadorRepository getter', () => {
      expect('trabajadorRepository' in service).toBe(true);
    });
  });
});
