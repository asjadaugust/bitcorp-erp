import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from './error-handler.middleware';
import {
  NotFoundError,
  ValidationError,
  DatabaseError,
  BusinessRuleError,
  InternalServerError,
  BadRequestError,
} from '../errors';
import Logger from '../utils/logger';

// Mock Logger
jest.mock('../utils/logger');
const mockLogger = Logger as jest.Mocked<typeof Logger>;

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Logger
    mockLogger.getCorrelationId = jest.fn().mockReturnValue('test-correlation-id');
    mockLogger.error = jest.fn();
    mockLogger.warn = jest.fn();

    // Mock Request
    mockReq = {
      method: 'GET',
      path: '/api/projects/123',
      originalUrl: '/api/projects/123',
    };

    // Mock Response
    jsonMock = jest.fn().mockReturnThis();
    statusMock = jest.fn().mockReturnThis();
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    // Mock NextFunction
    mockNext = jest.fn();
  });

  describe('errorHandler', () => {
    it('should handle AppError with correct status code', () => {
      const error = new NotFoundError('Project', 123);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalled();

      const response = jsonMock.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.error.name).toBe('NotFoundError');
      expect(response.error.statusCode).toBe(404);
      expect(response.error.correlationId).toBe('test-correlation-id');
    });

    it('should include field errors for ValidationError', () => {
      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email', rule: 'email' },
        { field: 'password', message: 'Too short', rule: 'minLength' },
      ]);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.errors).toHaveLength(2);
      expect(response.error.errors[0].field).toBe('email');
    });

    it('should include error code for BusinessRuleError', () => {
      const error = new BusinessRuleError('Cannot delete project', 'PROJECT_HAS_DEPENDENCIES');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.code).toBe('PROJECT_HAS_DEPENDENCIES');
    });

    it('should log operational errors as warnings', () => {
      const error = new NotFoundError('Project', 123);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log programming errors as errors', () => {
      const error = new InternalServerError('Unexpected error', false);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it('should wrap standard Error in InternalServerError', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      const response = jsonMock.mock.calls[0][0];
      expect(response.error.name).toBe('InternalServerError');
      expect(response.error.statusCode).toBe(500);
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new NotFoundError('Project', 123);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new NotFoundError('Project', 123);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should use user-friendly message in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new InternalServerError('Detailed technical error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.message).toBe('An unexpected error occurred. Please try again later.');
      expect(response.error.message).not.toContain('Detailed technical error');

      process.env.NODE_ENV = originalEnv;
    });

    it('should include metadata in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new BadRequestError('Bad data', { invalidField: 'email' });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.metadata).toBeDefined();
      expect(response.error.metadata.invalidField).toBe('email');

      process.env.NODE_ENV = originalEnv;
    });

    it('should NOT include metadata in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new BadRequestError('Bad data', { invalidField: 'email' });

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.metadata).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should include timestamp in ISO format', () => {
      const error = new NotFoundError('Project', 123);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.timestamp).toBeDefined();
      expect(new Date(response.error.timestamp)).toBeInstanceOf(Date);
    });

    it('should include correlation ID in response', () => {
      const error = new NotFoundError('Project', 123);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];
      expect(response.error.correlationId).toBe('test-correlation-id');
    });

    it('should log request details', () => {
      const error = new NotFoundError('Project', 123);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
          path: '/api/projects/123',
        })
      );
    });

    it('should handle DatabaseError correctly', () => {
      const error = DatabaseError.connection('Connection failed');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(500);
      const response = jsonMock.mock.calls[0][0];
      expect(response.error.name).toBe('DatabaseError');
    });
  });

  describe('notFoundHandler', () => {
    it('should create NotFoundError for undefined route', () => {
      const testReq = {
        ...mockReq,
        originalUrl: '/api/undefined-route',
        path: '/api/undefined-route',
        method: 'GET',
      };

      const mockNextFn = jest.fn();

      notFoundHandler(testReq as Request, mockRes as Response, mockNextFn);

      expect(mockNextFn).toHaveBeenCalled();
      const error = mockNextFn.mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.statusCode).toBe(404);
    });

    it('should include route information in error', () => {
      const testReq = {
        ...mockReq,
        originalUrl: '/api/nonexistent',
        method: 'POST',
      };

      const mockNextFn = jest.fn();

      notFoundHandler(testReq as Request, mockRes as Response, mockNextFn);

      const error = mockNextFn.mock.calls[0][0] as NotFoundError;
      expect(error.message).toContain('/api/nonexistent');
      expect(error.metadata?.method).toBe('POST');
    });
  });

  describe('Error Response Structure', () => {
    it('should have consistent response structure', () => {
      const error = new NotFoundError('Project', 123);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const response = jsonMock.mock.calls[0][0];

      // Check top-level structure
      expect(response).toHaveProperty('success', false);
      expect(response).toHaveProperty('error');

      // Check error structure
      expect(response.error).toHaveProperty('name');
      expect(response.error).toHaveProperty('message');
      expect(response.error).toHaveProperty('statusCode');
      expect(response.error).toHaveProperty('timestamp');
      expect(response.error).toHaveProperty('correlationId');
    });

    it('should return success: false for all errors', () => {
      const errors = [
        new NotFoundError('Resource', 1),
        new ValidationError('Validation failed'),
        new BadRequestError('Bad data'),
        new InternalServerError('Server error'),
      ];

      errors.forEach((error) => {
        jsonMock.mockClear();
        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        const response = jsonMock.mock.calls[0][0];
        expect(response.success).toBe(false);
      });
    });
  });
});
