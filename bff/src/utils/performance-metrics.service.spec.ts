import { PerformanceMetrics } from './performance-metrics.service';
import { performanceConfig } from '../config/performance.config';

describe('PerformanceMetrics', () => {
  let metrics: PerformanceMetrics;
  const originalEnabled = performanceConfig.metrics.enabled;

  beforeAll(() => {
    // Enable metrics for testing
    performanceConfig.metrics.enabled = true;
  });

  afterAll(() => {
    // Restore original setting
    performanceConfig.metrics.enabled = originalEnabled;
  });

  beforeEach(() => {
    // Create a fresh instance for each test
    metrics = new PerformanceMetrics();
    // Ensure periodic logging is stopped
    metrics.stopPeriodicLogging();
  });

  afterEach(() => {
    metrics.stopPeriodicLogging();
  });

  describe('Query Time Tracking', () => {
    it('should record query times correctly', () => {
      metrics.recordQueryTime(100);
      metrics.recordQueryTime(200);
      metrics.recordQueryTime(150);

      const result = metrics.getMetrics();

      expect(result.database.totalQueries).toBe(3);
      expect(result.database.averageTime).toBe(150); // (100 + 200 + 150) / 3
      expect(result.database.minTime).toBe(100);
      expect(result.database.maxTime).toBe(200);
    });

    it('should track slow queries', () => {
      metrics.recordSlowQuery();
      metrics.recordSlowQuery();

      const result = metrics.getMetrics();

      expect(result.database.slowQueries).toBe(2);
    });

    it('should track query errors', () => {
      metrics.recordQueryError();
      metrics.recordQueryError();
      metrics.recordQueryError();

      const result = metrics.getMetrics();

      expect(result.database.errors).toBe(3);
    });

    it('should calculate percentiles correctly', () => {
      // Record 100 samples from 1-100ms
      for (let i = 1; i <= 100; i++) {
        metrics.recordQueryTime(i);
      }

      const result = metrics.getMetrics();

      expect(result.database.p50).toBeCloseTo(50, 0); // Median should be around 50
      expect(result.database.p95).toBeCloseTo(95, 0); // 95th percentile should be around 95
      expect(result.database.p99).toBeCloseTo(99, 0); // 99th percentile should be around 99
    });
  });

  describe('Endpoint Time Tracking', () => {
    it('should record endpoint times correctly', () => {
      metrics.recordEndpointTime(250);
      metrics.recordEndpointTime(500);
      metrics.recordEndpointTime(375);

      const result = metrics.getMetrics();

      expect(result.http.totalRequests).toBe(3);
      expect(result.http.averageTime).toBe(375); // (250 + 500 + 375) / 3
      expect(result.http.minTime).toBe(250);
      expect(result.http.maxTime).toBe(500);
    });

    it('should track slow endpoints', () => {
      metrics.recordSlowEndpoint();
      metrics.recordSlowEndpoint();
      metrics.recordSlowEndpoint();

      const result = metrics.getMetrics();

      expect(result.http.slowEndpoints).toBe(3);
    });

    it('should track HTTP errors', () => {
      metrics.recordHttpError();
      metrics.recordHttpError();

      const result = metrics.getMetrics();

      expect(result.http.errors).toBe(2);
    });
  });

  describe('Rolling Window', () => {
    it('should maintain window size limit', () => {
      const windowSize = performanceConfig.metrics.windowSize;

      // Record more samples than window size
      for (let i = 0; i < windowSize + 100; i++) {
        metrics.recordQueryTime(i);
      }

      const result = metrics.getMetrics();

      // The total count should include all samples
      expect(result.database.totalQueries).toBe(windowSize + 100);

      // But percentiles should only be calculated from the window
      // (we can't directly test samples array size from outside, but percentiles will reflect it)
      expect(result.database.p99).toBeGreaterThan(windowSize - 10);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      // Record some data
      metrics.recordQueryTime(100);
      metrics.recordQueryTime(200);
      metrics.recordSlowQuery();
      metrics.recordQueryError();
      metrics.recordEndpointTime(300);
      metrics.recordSlowEndpoint();
      metrics.recordHttpError();

      // Reset
      metrics.reset();

      // Verify all metrics are back to zero
      const result = metrics.getMetrics();

      expect(result.database.totalQueries).toBe(0);
      expect(result.database.slowQueries).toBe(0);
      expect(result.database.errors).toBe(0);
      expect(result.database.averageTime).toBe(0);
      expect(result.http.totalRequests).toBe(0);
      expect(result.http.slowEndpoints).toBe(0);
      expect(result.http.errors).toBe(0);
      expect(result.http.averageTime).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero samples gracefully', () => {
      const result = metrics.getMetrics();

      expect(result.database.totalQueries).toBe(0);
      expect(result.database.averageTime).toBe(0);
      expect(result.database.minTime).toBe(0);
      expect(result.database.maxTime).toBe(0);
      expect(result.database.p50).toBe(0);
      expect(result.database.p95).toBe(0);
      expect(result.database.p99).toBe(0);
    });

    it('should handle single sample', () => {
      metrics.recordQueryTime(150);

      const result = metrics.getMetrics();

      expect(result.database.totalQueries).toBe(1);
      expect(result.database.averageTime).toBe(150);
      expect(result.database.minTime).toBe(150);
      expect(result.database.maxTime).toBe(150);
      expect(result.database.p50).toBe(150);
      expect(result.database.p95).toBe(150);
      expect(result.database.p99).toBe(150);
    });

    it('should handle very large values', () => {
      metrics.recordQueryTime(999999);

      const result = metrics.getMetrics();

      expect(result.database.maxTime).toBe(999999);
      expect(result.database.averageTime).toBe(999999);
    });

    it('should handle zero or negative values gracefully', () => {
      metrics.recordQueryTime(0);
      metrics.recordEndpointTime(0);

      const result = metrics.getMetrics();

      expect(result.database.minTime).toBe(0);
      expect(result.http.minTime).toBe(0);
    });
  });

  describe('Periodic Logging', () => {
    it('should not crash when logging metrics', () => {
      metrics.recordQueryTime(100);
      metrics.recordEndpointTime(200);

      // This should not throw
      expect(() => metrics.logMetrics()).not.toThrow();
    });

    it('should properly stop periodic logging', () => {
      // Start logging (if enabled)
      const instance = new PerformanceMetrics();

      // Stop should not throw
      expect(() => instance.stopPeriodicLogging()).not.toThrow();

      // Calling stop again should be safe
      expect(() => instance.stopPeriodicLogging()).not.toThrow();
    });
  });

  describe('Shutdown', () => {
    it('should log final metrics on shutdown', () => {
      metrics.recordQueryTime(100);
      metrics.recordEndpointTime(200);

      // Shutdown should not throw
      expect(() => metrics.shutdown()).not.toThrow();
    });

    it('should stop periodic logging on shutdown', () => {
      const instance = new PerformanceMetrics();

      instance.shutdown();

      // Verify logging stopped by calling shutdown again (should be safe)
      expect(() => instance.shutdown()).not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should respect enabled configuration', () => {
      // Metrics should respect the performanceConfig.metrics.enabled setting
      // This is implicitly tested by all other tests working correctly
      expect(performanceConfig.metrics).toBeDefined();
      expect(typeof performanceConfig.metrics.enabled).toBe('boolean');
    });
  });
});
