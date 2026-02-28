import {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  DatabaseError,
  DatabaseErrorType,
  BusinessRuleError,
  InternalServerError,
  Errors,
  isAppError,
  isOperationalError,
} from './index';

describe('Error Classes', () => {
  describe('AppError (Base)', () => {
    class TestError extends AppError {
      constructor(message: string, statusCode: number) {
        super(message, statusCode, true);
      }
    }

    it('should create error with correct properties', () => {
      const error = new TestError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('TestError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should capture stack trace', () => {
      const error = new TestError('Test error', 400);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestError');
    });

    it('should serialize to JSON', () => {
      const error = new TestError('Test error', 400);
      const json = error.toJSON();

      expect(json.name).toBe('TestError');
      expect(json.message).toBe('Test error');
      expect(json.statusCode).toBe(400);
      expect(json.timestamp).toBeDefined();
    });

    it('should include metadata in JSON', () => {
      class TestErrorWithMetadata extends AppError {
        constructor(message: string, statusCode: number, metadata: Record<string, unknown>) {
          super(message, statusCode, true, metadata);
        }
      }
      const error = new TestErrorWithMetadata('Test error', 400, { userId: 123 });
      const json = error.toJSON();

      expect(json.metadata).toEqual({ userId: 123 });
    });

    it('should return correct log level', () => {
      const operationalError = new TestError('Operational', 400);
      expect(operationalError.getLogLevel()).toBe('warn');

      class ProgrammingError extends AppError {
        constructor(message: string) {
          super(message, 500, false); // isOperational = false
        }
      }
      const programmingError = new ProgrammingError('Programming');
      expect(programmingError.getLogLevel()).toBe('error');
    });
  });

  describe('NotFoundError', () => {
    it('should create error with resource name only', () => {
      const error = new NotFoundError('Project');

      expect(error.message).toBe('Project not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with resource name and ID', () => {
      const error = new NotFoundError('Project', 123);

      expect(error.message).toBe("Project with identifier '123' not found");
      expect(error.metadata?.resource).toBe('Project');
      expect(error.metadata?.identifier).toBe(123);
    });

    it('should create error with string ID', () => {
      const error = new NotFoundError('Project', 'abc-123');

      expect(error.message).toBe("Project with identifier 'abc-123' not found");
      expect(error.metadata?.identifier).toBe('abc-123');
    });
  });

  describe('BadRequestError', () => {
    it('should create error with default message', () => {
      const error = new BadRequestError();

      expect(error.message).toBe('Bad Request');
      expect(error.statusCode).toBe(400);
    });

    it('should create error with custom message', () => {
      const error = new BadRequestError('Invalid data format');

      expect(error.message).toBe('Invalid data format');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should return user-friendly message', () => {
      const error = new UnauthorizedError();

      expect(error.getUserMessage()).toBe('You must be logged in to access this resource');
    });
  });

  describe('ForbiddenError', () => {
    it('should create error with correct status', () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.getUserMessage()).toBe('You do not have permission to access this resource');
    });
  });

  describe('ConflictError', () => {
    it('should create error with message', () => {
      const error = new ConflictError('Email already exists');

      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('ValidationError', () => {
    it('should create error with field errors', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email', rule: 'email' },
        { field: 'password', message: 'Too short', rule: 'minLength' },
      ]);

      expect(error.statusCode).toBe(422);
      expect(error.errors).toHaveLength(2);
      expect(error.errors[0].field).toBe('email');
    });

    it('should add field error dynamically', () => {
      const error = new ValidationError();
      error.addError({ field: 'username', message: 'Required', rule: 'required' });

      expect(error.errors).toHaveLength(1);
      expect(error.hasFieldError('username')).toBe(true);
      expect(error.hasFieldError('email')).toBe(false);
    });

    it('should get errors for specific field', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid format', rule: 'email' },
        { field: 'email', message: 'Already exists', rule: 'unique' },
        { field: 'password', message: 'Too short', rule: 'minLength' },
      ]);

      const emailErrors = error.getFieldErrors('email');
      expect(emailErrors).toHaveLength(2);
      expect(emailErrors[0].message).toBe('Invalid format');
    });

    describe('Factory methods', () => {
      it('should create required field error', () => {
        const error = ValidationError.required('email');

        expect(error.errors[0].field).toBe('email');
        expect(error.errors[0].rule).toBe('required');
        expect(error.message).toBe('Validation failed');
      });

      it('should create min length error', () => {
        const error = ValidationError.minLength('password', 8, 5);

        expect(error.errors[0].field).toBe('password');
        expect(error.errors[0].rule).toBe('minLength');
        expect(error.errors[0].constraints?.minLength).toBe(8);
      });

      it('should create email error', () => {
        const error = ValidationError.email('email');

        expect(error.errors[0].rule).toBe('email');
        expect(error.errors[0].message).toContain('valid email');
      });
    });

    it('should return user-friendly message', () => {
      const singleError = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email', rule: 'email' },
      ]);
      expect(singleError.getUserMessage()).toBe('Invalid email');

      const multipleErrors = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email', rule: 'email' },
        { field: 'password', message: 'Too short', rule: 'minLength' },
      ]);
      expect(multipleErrors.getUserMessage()).toBe('Validation failed for 2 fields');
    });
  });

  describe('DatabaseError', () => {
    it('should create generic database error', () => {
      const error = new DatabaseError('Query failed', DatabaseErrorType.QUERY);

      expect(error.message).toBe('Query failed');
      expect(error.statusCode).toBe(500);
      expect(error.errorType).toBe(DatabaseErrorType.QUERY);
    });

    it('should wrap original error', () => {
      const originalError = new Error('Connection refused');
      const error = new DatabaseError(
        'Database connection failed',
        DatabaseErrorType.CONNECTION,
        originalError
      );

      expect(error.originalError).toBe(originalError);
      expect(error.metadata?.originalMessage).toBe('Connection refused');
    });

    describe('Factory methods', () => {
      it('should create connection error', () => {
        const error = DatabaseError.connection();

        expect(error.errorType).toBe(DatabaseErrorType.CONNECTION);
        expect(error.message).toBe('Database connection failed');
      });

      it('should create timeout error', () => {
        const error = DatabaseError.timeout();

        expect(error.errorType).toBe(DatabaseErrorType.TIMEOUT);
        expect(error.getUserMessage()).toContain('timed out');
      });

      it('should create constraint error', () => {
        const error = DatabaseError.constraint('Unique violation', 'email_unique', 'users');

        expect(error.errorType).toBe(DatabaseErrorType.CONSTRAINT);
        expect(error.metadata?.constraint).toBe('email_unique');
        expect(error.metadata?.table).toBe('users');
      });
    });

    describe('fromTypeORMError', () => {
      it('should handle unique constraint violation (23505)', () => {
        const pgError = {
          code: '23505',
          constraint: 'email_unique',
          table: 'users',
          detail: 'Key (email)=(test@example.com) already exists.',
          message: 'duplicate key value violates unique constraint',
        } as Error & { code?: string; constraint?: string; table?: string; detail?: string };

        const error = DatabaseError.fromTypeORMError(pgError);

        expect(error).toBeInstanceOf(ConflictError);
        expect(error.statusCode).toBe(409);
        expect(error.metadata?.constraint).toBe('email_unique');
      });

      it('should handle foreign key violation (23503)', () => {
        const pgError = {
          code: '23503',
          constraint: 'fk_project_id',
          table: 'equipment',
          detail: 'Key (project_id)=(999) is not present in table "projects".',
          message: 'foreign key constraint violation',
        } as Error & { code?: string; constraint?: string; table?: string; detail?: string };

        const error = DatabaseError.fromTypeORMError(pgError);

        expect(error).toBeInstanceOf(DatabaseError);
        if (error instanceof DatabaseError) {
          expect(error.errorType).toBe(DatabaseErrorType.CONSTRAINT);
        }
      });

      it('should handle connection error (08xxx)', () => {
        const pgError = {
          code: '08006',
          message: 'connection failure',
        } as Error & { code?: string };

        const error = DatabaseError.fromTypeORMError(pgError);

        expect(error).toBeInstanceOf(DatabaseError);
        if (error instanceof DatabaseError) {
          expect(error.errorType).toBe(DatabaseErrorType.CONNECTION);
        }
      });

      it('should handle timeout (57014)', () => {
        const pgError = {
          code: '57014',
          message: 'query canceled due to statement timeout',
        } as Error & { code?: string };

        const error = DatabaseError.fromTypeORMError(pgError);

        expect(error).toBeInstanceOf(DatabaseError);
        if (error instanceof DatabaseError) {
          expect(error.errorType).toBe(DatabaseErrorType.TIMEOUT);
        }
      });

      it('should handle deadlock (40P01)', () => {
        const pgError = {
          code: '40P01',
          message: 'deadlock detected',
        } as Error & { code?: string };

        const error = DatabaseError.fromTypeORMError(pgError);

        expect(error).toBeInstanceOf(DatabaseError);
        if (error instanceof DatabaseError) {
          expect(error.errorType).toBe(DatabaseErrorType.DEADLOCK);
        }
      });
    });
  });

  describe('BusinessRuleError', () => {
    it('should create error with code', () => {
      const error = new BusinessRuleError(
        'Cannot delete project with active equipment',
        'PROJECT_HAS_ACTIVE_EQUIPMENT'
      );

      expect(error.message).toBe('Cannot delete project with active equipment');
      expect(error.code).toBe('PROJECT_HAS_ACTIVE_EQUIPMENT');
      expect(error.statusCode).toBe(422);
    });

    it('should include suggested action', () => {
      const error = new BusinessRuleError(
        'Budget exceeded',
        'BUDGET_EXCEEDED',
        { budget: 10000, requested: 15000 },
        'Reduce requested amount or increase budget'
      );

      expect(error.suggestedAction).toBe('Reduce requested amount or increase budget');
      expect(error.getUserMessage()).toContain('Reduce requested amount');
    });

    describe('Factory methods', () => {
      it('should create cannotDelete error', () => {
        const error = BusinessRuleError.cannotDelete('Project', 'has active equipment', {
          equipmentCount: 5,
        });

        expect(error.code).toBe('CANNOT_DELETE_WITH_DEPENDENCIES');
        expect(error.message).toContain('Cannot delete Project');
        expect(error.metadata?.equipmentCount).toBe(5);
      });

      it('should create invalidState error', () => {
        const error = BusinessRuleError.invalidState('Project', 'ARCHIVED', 'edit', [
          'ACTIVE',
          'PENDING',
        ]);

        expect(error.code).toBe('INVALID_STATE');
        expect(error.message).toContain('ARCHIVED state');
        expect(error.suggestedAction).toContain('ACTIVE, PENDING');
      });

      it('should create budgetExceeded error', () => {
        const error = BusinessRuleError.budgetExceeded(10000, 8000, 3000);

        expect(error.code).toBe('BUDGET_EXCEEDED');
        expect(error.metadata?.remaining).toBe(2000);
      });

      it('should create dateConflict error', () => {
        const start = new Date('2026-01-01');
        const end = new Date('2026-01-31');
        const error = BusinessRuleError.dateConflict('Maintenance', start, end, 'Another task');

        expect(error.code).toBe('DATE_CONFLICT');
        expect(error.message).toContain('conflict with Another task');
      });

      it('should create resourceInUse error', () => {
        const error = BusinessRuleError.resourceInUse('Equipment', 123, 'Project A');

        expect(error.code).toBe('RESOURCE_IN_USE');
        expect(error.metadata?.usedBy).toBe('Project A');
      });
    });
  });

  describe('Error Factory (Errors)', () => {
    it('should create HTTP errors', () => {
      expect(Errors.badRequest('Bad data')).toBeInstanceOf(BadRequestError);
      expect(Errors.unauthorized()).toBeInstanceOf(UnauthorizedError);
      expect(Errors.forbidden()).toBeInstanceOf(ForbiddenError);
      expect(Errors.notFound('Project', 123)).toBeInstanceOf(NotFoundError);
      expect(Errors.conflict('Duplicate')).toBeInstanceOf(ConflictError);
      expect(Errors.internal()).toBeInstanceOf(InternalServerError);
    });

    it('should create validation errors', () => {
      expect(Errors.validation.required('email')).toBeInstanceOf(ValidationError);
      expect(Errors.validation.email('email')).toBeInstanceOf(ValidationError);
      expect(Errors.validation.minLength('password', 8)).toBeInstanceOf(ValidationError);
    });

    it('should create database errors', () => {
      expect(Errors.database.connection()).toBeInstanceOf(DatabaseError);
      expect(Errors.database.timeout()).toBeInstanceOf(DatabaseError);
      expect(Errors.database.query('Bad query')).toBeInstanceOf(DatabaseError);
    });

    it('should create business errors', () => {
      expect(Errors.business.cannotDelete('Project', 'has dependencies')).toBeInstanceOf(
        BusinessRuleError
      );
      expect(Errors.business.budgetExceeded(1000, 800, 300)).toBeInstanceOf(BusinessRuleError);
    });
  });

  describe('Type guards', () => {
    it('should identify AppError instances', () => {
      const appError = new NotFoundError('Project', 123);
      const regularError = new Error('Regular error');

      expect(isAppError(appError)).toBe(true);
      expect(isAppError(regularError)).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });

    it('should identify operational errors', () => {
      const operationalError = new NotFoundError('Project', 123);
      const programmingError = new InternalServerError('Bug', false);
      const regularError = new Error('Regular');

      expect(isOperationalError(operationalError)).toBe(true);
      expect(isOperationalError(programmingError)).toBe(false);
      expect(isOperationalError(regularError)).toBe(false);
    });
  });
});
