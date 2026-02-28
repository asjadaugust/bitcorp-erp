// Mock cacheService BEFORE import
jest.mock('../services/cache.service', () => ({
  cacheService: {
    getStatus: jest.fn(),
  },
}));

// Mock Logger BEFORE import
jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import request from 'supertest';
import express from 'express';
import cacheRouter from './cache.route';
import { cacheService } from '../services/cache.service';
import Logger from '../utils/logger';

describe('Cache Route', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/cache', cacheRouter);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/cache/status', () => {
    it('should return cache status when connected', async () => {
      const mockStatus = {
        connected: true,
        total_keys: 42,
        dashboard_keys: 5,
        memory_used: '1.5M',
        memory_peak: '2.0M',
        uptime_seconds: 3600,
        redis_version: '7.2.0',
      };

      (cacheService.getStatus as jest.Mock).mockResolvedValue(mockStatus);

      const response = await request(app).get('/api/cache/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);

      // Verify logger was called
      expect(Logger.info).toHaveBeenCalledWith(
        'Cache status retrieved',
        expect.objectContaining({
          connected: true,
          total_keys: 42,
          dashboard_keys: 5,
          context: 'CacheRoute.status',
        })
      );
    });

    it('should return disconnected status when Redis is not connected', async () => {
      const mockStatus = {
        connected: false,
        total_keys: 0,
        dashboard_keys: 0,
        memory_used: 'N/A',
        memory_peak: 'N/A',
        uptime_seconds: 0,
        redis_version: 'N/A',
      };

      (cacheService.getStatus as jest.Mock).mockResolvedValue(mockStatus);

      const response = await request(app).get('/api/cache/status');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockStatus);
      expect(response.body.connected).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Redis connection failed');
      (cacheService.getStatus as jest.Mock).mockRejectedValue(error);

      const response = await request(app).get('/api/cache/status');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to get cache status',
        message: 'Redis connection failed',
      });

      // Verify error was logged
      expect(Logger.error).toHaveBeenCalledWith(
        'Error getting cache status',
        expect.objectContaining({
          error: 'Redis connection failed',
          context: 'CacheRoute.status',
        })
      );
    });

    it('should handle non-Error exceptions', async () => {
      (cacheService.getStatus as jest.Mock).mockRejectedValue('Unknown error');

      const response = await request(app).get('/api/cache/status');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Failed to get cache status',
        message: 'Unknown error',
      });
    });

    it('should return JSON content-type', async () => {
      const mockStatus = {
        connected: true,
        total_keys: 0,
        dashboard_keys: 0,
        memory_used: '1.0M',
        memory_peak: '1.0M',
        uptime_seconds: 0,
        redis_version: '7.2.0',
      };

      (cacheService.getStatus as jest.Mock).mockResolvedValue(mockStatus);

      const response = await request(app).get('/api/cache/status');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
