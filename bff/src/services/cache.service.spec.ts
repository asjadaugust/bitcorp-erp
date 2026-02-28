// Mock redis module BEFORE any imports
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

// Mock Logger BEFORE any imports
jest.mock('../utils/logger', () => {
  return {
    __esModule: true,
    default: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      http: jest.fn(),
      security: jest.fn(),
      performance: jest.fn(),
      audit: jest.fn(),
      getCorrelationId: jest.fn(() => 'test-correlation-id'),
      generateCorrelationId: jest.fn(() => 'test-correlation-id'),
      setCorrelationId: jest.fn(),
      clearCorrelationId: jest.fn(),
    },
  };
});

// Mock asyncContext
jest.mock('../utils/async-context', () => ({
  asyncContext: {
    getCorrelationId: jest.fn(() => 'test-correlation-id'),
    getContext: jest.fn(() => ({ correlationId: 'test-correlation-id' })),
    updateContext: jest.fn(),
    run: jest.fn((callback) => callback()),
  },
}));

import { CacheService } from './cache.service';
import { createClient } from 'redis';
import Logger from '../utils/logger';

// Type for mocked Redis client
interface MockRedisClient {
  connect: jest.Mock;
  get: jest.Mock;
  setEx: jest.Mock;
  del: jest.Mock;
  scan: jest.Mock;
  flushDb: jest.Mock;
  quit: jest.Mock;
  on: jest.Mock;
  info: jest.Mock;
  dbSize: jest.Mock;
}

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedisClient: MockRedisClient;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock Redis client with all required methods
    mockRedisClient = {
      connect: jest.fn().mockImplementation(async function (this: MockRedisClient) {
        // Trigger ready event BEFORE connect resolves
        // This simulates Redis being immediately ready
        const readyHandler = this.on.mock.calls.find(
          (call: [string, (...args: unknown[]) => void]) => call[0] === 'ready'
        )?.[1];
        if (readyHandler) {
          readyHandler();
        }
        return Promise.resolve();
      }),
      get: jest.fn(),
      setEx: jest.fn().mockResolvedValue('OK'),
      del: jest.fn(),
      scan: jest.fn(),
      flushDb: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn().mockReturnThis(), // Allow chaining
      info: jest.fn().mockResolvedValue(''),
      dbSize: jest.fn().mockResolvedValue(0),
    };

    // Mock createClient to return our mock client
    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

    // Create new CacheService instance for each test
    cacheService = new CacheService();
  });

  afterEach(async () => {
    // Disconnect after each test
    await cacheService.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect to Redis on first operation', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      // Call get() to trigger connection
      await cacheService.get('test-key');

      // Verify connection was attempted
      expect(createClient).toHaveBeenCalledWith({
        socket: {
          host: 'localhost',
          port: 6379,
          connectTimeout: 5000,
          reconnectStrategy: expect.any(Function),
        },
        password: undefined,
      });
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should use environment variables for Redis connection', async () => {
      process.env.REDIS_HOST = 'redis-server';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'secret123';

      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test-key');

      expect(createClient).toHaveBeenCalledWith({
        socket: {
          host: 'redis-server',
          port: 6380,
          connectTimeout: 5000,
          reconnectStrategy: expect.any(Function),
        },
        password: 'secret123',
      });

      // Clean up env vars
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;
    });

    it('should reuse existing connection on subsequent operations', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      // First call triggers connection
      await cacheService.get('key1');

      // Subsequent calls should reuse connection
      await cacheService.get('key2');
      await cacheService.get('key3');

      // Should only connect once
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should return connection promise if already connecting', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.connect.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      // Start two operations simultaneously
      const promise1 = cacheService.get('key1');
      const promise2 = cacheService.get('key2');

      await Promise.all([promise1, promise2]);

      // Should only attempt to connect once
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
    });

    it('should handle Redis event handlers', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test-key');

      // Check that event handlers were registered
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('end', expect.any(Function));
    });

    it('should set isConnected to true on ready event', async () => {
      // Override mock to NOT auto-trigger ready event for this test
      mockRedisClient.connect.mockImplementation(async function () {
        return Promise.resolve();
      });

      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test-key');

      // Initially not ready (because we didn't trigger the event)
      expect(cacheService.isReady()).toBe(false);

      // Now manually simulate ready event
      const readyHandler = mockRedisClient.on.mock.calls.find((call) => call[0] === 'ready')?.[1];
      readyHandler?.();

      // Now should be ready
      expect(cacheService.isReady()).toBe(true);
    });

    it('should handle connection errors gracefully', async () => {
      const connectionError = new Error('Connection refused');
      mockRedisClient.connect.mockRejectedValue(connectionError);

      const result = await cacheService.get('test-key');

      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('Failed to connect to Redis', {
        error: connectionError.message,
        context: 'CacheService.connect',
      });
    });

    it('should implement exponential backoff in reconnect strategy', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test-key');

      const reconnectStrategy = (createClient as jest.Mock).mock.calls[0][0].socket
        .reconnectStrategy;

      // Test retry delays (retries * 100, capped at 3000)
      expect(reconnectStrategy(1)).toBe(100);
      expect(reconnectStrategy(2)).toBe(200);
      expect(reconnectStrategy(5)).toBe(500);
      expect(reconnectStrategy(10)).toBe(1000);
      // After 10 retries, it should return an error (tested in next test)
      // But let's test the cap happens before hitting the 10-retry limit
      // The cap is Math.min(retries * 100, 3000)
      // So retry 30 would be 3000 (30 * 100 = 3000, but we stop at 10)
      // Let's test retries within the valid range
    });

    it('should stop retrying after 10 attempts', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test-key');

      const reconnectStrategy = (createClient as jest.Mock).mock.calls[0][0].socket
        .reconnectStrategy;

      const result = reconnectStrategy(11);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Redis connection failed');
    });
  });

  describe('get()', () => {
    it('should return cached value if key exists', async () => {
      const testValue = { id: 123, name: 'Test Equipment' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testValue));

      const result = await cacheService.get('equipment:123');

      expect(mockRedisClient.get).toHaveBeenCalledWith('equipment:123');
      expect(result).toEqual(testValue);
    });

    it('should return null if key does not exist (cache miss)', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('nonexistent:key');

      expect(result).toBeNull();
    });

    it('should parse JSON correctly', async () => {
      const complexObject = {
        id: 456,
        nested: { array: [1, 2, 3], bool: true },
        date: '2026-01-20T00:00:00.000Z',
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(complexObject));

      const result = await cacheService.get('complex:object');

      expect(result).toEqual(complexObject);
    });

    it('should return null and log error if JSON parse fails', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-json{{{');

      const result = await cacheService.get('invalid:key');

      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith(
        'Cache get error',
        expect.objectContaining({
          key: 'invalid:key',
          context: 'CacheService.get',
        })
      );
    });

    it('should return null if Redis is not connected', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await cacheService.get('test:key');

      expect(result).toBeNull();
    });

    it('should handle Redis GET errors gracefully', async () => {
      const redisError = new Error('Redis timeout');
      mockRedisClient.get.mockRejectedValue(redisError);

      const result = await cacheService.get('test:key');

      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('Cache get error', {
        error: redisError.message,
        key: 'test:key',
        context: 'CacheService.get',
      });
    });
  });

  describe('set()', () => {
    it('should set value with default TTL (300 seconds)', async () => {
      const testValue = { id: 789, status: 'active' };

      const result = await cacheService.set('test:key', testValue);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:key',
        300,
        JSON.stringify(testValue)
      );
      expect(result).toBe(true);
    });

    it('should set value with custom TTL', async () => {
      const testValue = { data: 'cached' };

      const result = await cacheService.set('custom:ttl', testValue, 600);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'custom:ttl',
        600,
        JSON.stringify(testValue)
      );
      expect(result).toBe(true);
    });

    it('should serialize value to JSON', async () => {
      const complexValue = {
        id: 1,
        array: [1, 2, 3],
        nested: { key: 'value' },
        bool: true,
        nullValue: null,
      };

      await cacheService.set('complex:value', complexValue);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'complex:value',
        300,
        JSON.stringify(complexValue)
      );
    });

    it('should return false if Redis is not connected', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await cacheService.set('test:key', { data: 'test' });

      expect(result).toBe(false);
    });

    it('should handle Redis SETEX errors gracefully', async () => {
      const redisError = new Error('Redis write error');
      mockRedisClient.setEx.mockRejectedValue(redisError);

      const result = await cacheService.set('test:key', { data: 'test' });

      expect(result).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith('Cache set error', {
        error: redisError.message,
        key: 'test:key',
        ttlSeconds: 300,
        context: 'CacheService.set',
      });
    });

    it('should handle JSON serialization errors', async () => {
      const circularRef: Record<string, unknown> = { key: 'value' };
      circularRef.self = circularRef; // Create circular reference

      const result = await cacheService.set('circular:ref', circularRef);

      expect(result).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith(
        'Cache set error',
        expect.objectContaining({
          key: 'circular:ref',
          context: 'CacheService.set',
        })
      );
    });
  });

  describe('delete()', () => {
    it('should delete existing key', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await cacheService.delete('test:key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test:key');
      expect(result).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      const result = await cacheService.delete('nonexistent:key');

      expect(result).toBe(false);
    });

    it('should return false if Redis is not connected', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await cacheService.delete('test:key');

      expect(result).toBe(false);
    });

    it('should handle Redis DEL errors gracefully', async () => {
      const redisError = new Error('Redis delete error');
      mockRedisClient.del.mockRejectedValue(redisError);

      const result = await cacheService.delete('test:key');

      expect(result).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith('Cache delete error', {
        error: redisError.message,
        key: 'test:key',
        context: 'CacheService.delete',
      });
    });
  });

  describe('deletePattern()', () => {
    it('should delete all keys matching pattern using SCAN', async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce({
          cursor: 123,
          keys: ['dashboard:stats:1', 'dashboard:stats:2'],
        })
        .mockResolvedValueOnce({
          cursor: 0,
          keys: ['dashboard:stats:3'],
        });

      mockRedisClient.del.mockResolvedValue(3);

      const result = await cacheService.deletePattern('dashboard:*');

      expect(mockRedisClient.scan).toHaveBeenCalledWith(0, {
        MATCH: 'dashboard:*',
        COUNT: 100,
      });
      expect(mockRedisClient.scan).toHaveBeenCalledWith(123, {
        MATCH: 'dashboard:*',
        COUNT: 100,
      });
      expect(mockRedisClient.del).toHaveBeenCalledWith([
        'dashboard:stats:1',
        'dashboard:stats:2',
        'dashboard:stats:3',
      ]);
      expect(result).toBe(3);
    });

    it('should return 0 if no keys match pattern', async () => {
      mockRedisClient.scan.mockResolvedValue({
        cursor: 0,
        keys: [],
      });

      const result = await cacheService.deletePattern('nonexistent:*');

      expect(result).toBe(0);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it('should delete keys in batches of 100', async () => {
      const keys = Array.from({ length: 250 }, (_, i) => `key:${i}`);

      mockRedisClient.scan.mockResolvedValue({
        cursor: 0,
        keys,
      });

      mockRedisClient.del
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50);

      const result = await cacheService.deletePattern('key:*');

      expect(mockRedisClient.del).toHaveBeenCalledTimes(3);
      expect(result).toBe(250);
    });

    it('should handle wildcards in patterns', async () => {
      mockRedisClient.scan.mockResolvedValue({
        cursor: 0,
        keys: ['user:123:permissions', 'user:456:permissions'],
      });

      mockRedisClient.del.mockResolvedValue(2);

      const result = await cacheService.deletePattern('user:*:permissions');

      expect(mockRedisClient.scan).toHaveBeenCalledWith(0, {
        MATCH: 'user:*:permissions',
        COUNT: 100,
      });
      expect(result).toBe(2);
    });

    it('should return 0 if Redis is not connected', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await cacheService.deletePattern('test:*');

      expect(result).toBe(0);
    });

    it('should handle SCAN errors gracefully', async () => {
      const redisError = new Error('Redis scan error');
      mockRedisClient.scan.mockRejectedValue(redisError);

      const result = await cacheService.deletePattern('test:*');

      expect(result).toBe(0);
      expect(Logger.error).toHaveBeenCalledWith('Cache pattern delete error', {
        error: redisError.message,
        pattern: 'test:*',
        context: 'CacheService.deletePattern',
      });
    });
  });

  describe('clear()', () => {
    it('should clear all keys (FLUSHDB)', async () => {
      const result = await cacheService.clear();

      expect(mockRedisClient.flushDb).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if Redis is not connected', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await cacheService.clear();

      expect(result).toBe(false);
    });

    it('should handle FLUSHDB errors gracefully', async () => {
      const redisError = new Error('Redis flush error');
      mockRedisClient.flushDb.mockRejectedValue(redisError);

      const result = await cacheService.clear();

      expect(result).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith('Cache clear error', {
        error: redisError.message,
        context: 'CacheService.clear',
      });
    });
  });

  describe('isReady()', () => {
    it('should return true if connected', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test:key');

      // Simulate ready event
      const readyHandler = mockRedisClient.on.mock.calls.find((call) => call[0] === 'ready')?.[1];
      readyHandler?.();

      expect(cacheService.isReady()).toBe(true);
    });

    it('should return false if not connected', () => {
      expect(cacheService.isReady()).toBe(false);
    });

    it('should return false after connection error', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));

      await cacheService.get('test:key');

      expect(cacheService.isReady()).toBe(false);
    });

    it('should return false after error event', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test:key');

      // Simulate ready event first
      const readyHandler = mockRedisClient.on.mock.calls.find((call) => call[0] === 'ready')?.[1];
      readyHandler?.();

      expect(cacheService.isReady()).toBe(true);

      // Now simulate error event
      const errorHandler = mockRedisClient.on.mock.calls.find((call) => call[0] === 'error')?.[1];
      errorHandler?.(new Error('Redis error'));

      expect(cacheService.isReady()).toBe(false);
    });
  });

  describe('disconnect()', () => {
    it('should disconnect gracefully', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test:key');
      await cacheService.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(Logger.info).toHaveBeenCalledWith('Redis disconnected gracefully', {
        context: 'CacheService.disconnect',
      });
      expect(cacheService.isReady()).toBe(false);
    });

    it('should handle disconnect errors gracefully', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test:key');

      const disconnectError = new Error('Disconnect failed');
      mockRedisClient.quit.mockRejectedValue(disconnectError);

      await cacheService.disconnect();

      expect(Logger.error).toHaveBeenCalledWith('Error disconnecting from Redis', {
        error: disconnectError.message,
        context: 'CacheService.disconnect',
      });
      expect(cacheService.isReady()).toBe(false);
    });

    it('should do nothing if not connected', async () => {
      await cacheService.disconnect();

      expect(mockRedisClient.quit).not.toHaveBeenCalled();
    });

    it('should reset client and connection state', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await cacheService.get('test:key');

      // Simulate ready event
      const readyHandler = mockRedisClient.on.mock.calls.find((call) => call[0] === 'ready')?.[1];
      readyHandler?.();

      expect(cacheService.isReady()).toBe(true);

      await cacheService.disconnect();

      expect(cacheService.isReady()).toBe(false);
    });
  });

  describe('getStatus()', () => {
    it('should return cache status when connected', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.info.mockResolvedValue(
        'redis_version:7.2.0\r\nused_memory_human:1.5M\r\nused_memory_peak_human:2.0M\r\nuptime_in_seconds:3600\r\n'
      );
      mockRedisClient.dbSize.mockResolvedValue(42);
      mockRedisClient.scan.mockResolvedValue({
        cursor: 0,
        keys: ['dashboard:stats:1', 'dashboard:stats:2'],
      });

      await cacheService.get('test:key');

      const status = await cacheService.getStatus();

      expect(status).toEqual({
        connected: true,
        total_keys: 42,
        dashboard_keys: 2,
        memory_used: '1.5M',
        memory_peak: '2.0M',
        uptime_seconds: 3600,
        redis_version: '7.2.0',
      });

      expect(mockRedisClient.info).toHaveBeenCalledWith('all');
      expect(mockRedisClient.dbSize).toHaveBeenCalled();
    });

    it('should handle multiple SCAN iterations for dashboard keys', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.info.mockResolvedValue('redis_version:7.2.0\r\n');
      mockRedisClient.dbSize.mockResolvedValue(100);

      // First SCAN returns cursor != 0 (more keys)
      mockRedisClient.scan
        .mockResolvedValueOnce({
          cursor: 123,
          keys: ['dashboard:stats:1', 'dashboard:stats:2'],
        })
        .mockResolvedValueOnce({
          cursor: 0,
          keys: ['dashboard:stats:3'],
        });

      await cacheService.get('test:key');

      const status = await cacheService.getStatus();

      expect(status.dashboard_keys).toBe(3);
      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
    });

    it('should return disconnected status when not connected', async () => {
      const status = await cacheService.getStatus();

      expect(status).toEqual({
        connected: false,
        total_keys: 0,
        dashboard_keys: 0,
        memory_used: '0B',
        memory_peak: '0B',
        uptime_seconds: 0,
        redis_version: 'unknown',
      });
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.info.mockRejectedValue(new Error('INFO command failed'));

      await cacheService.get('test:key');

      const status = await cacheService.getStatus();

      expect(status.connected).toBe(false);
      expect(Logger.error).toHaveBeenCalledWith('Error getting cache status', {
        error: 'INFO command failed',
        context: 'CacheService.getStatus',
      });
    });
  });

  describe('Singleton Export', () => {
    it('should export a singleton instance', async () => {
      const { cacheService: singleton } = await import('./cache.service');

      expect(singleton).toBeInstanceOf(CacheService);
    });
  });
});
