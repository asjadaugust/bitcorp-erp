import { getPerformanceConfig, performanceConfig } from './performance.config';

describe('Performance Configuration', () => {
  // Store original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env vars before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Default Configuration', () => {
    it('should have default database thresholds', () => {
      const config = getPerformanceConfig();

      expect(config.database.slowQueryWarning).toBeDefined();
      expect(config.database.slowQueryError).toBeDefined();
      expect(typeof config.database.logAllQueries).toBe('boolean');
      expect(config.database.slowQueryWarning).toBeLessThan(config.database.slowQueryError);
    });

    it('should have default HTTP thresholds', () => {
      const config = getPerformanceConfig();

      expect(config.http.slowEndpointWarning).toBeDefined();
      expect(config.http.slowEndpointError).toBeDefined();
      expect(config.http.slowEndpointWarning).toBeLessThan(config.http.slowEndpointError);
    });

    it('should have default metrics configuration', () => {
      const config = getPerformanceConfig();

      expect(typeof config.metrics.enabled).toBe('boolean');
      expect(config.metrics.windowSize).toBeGreaterThan(0);
      expect(config.metrics.logInterval).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Environment-Based Configuration', () => {
    it('should use development defaults when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';

      const config = getPerformanceConfig();

      expect(config.database.logAllQueries).toBe(true);
      // Development should have higher (more lenient) thresholds
      expect(config.database.slowQueryWarning).toBeGreaterThanOrEqual(500);
    });

    it('should use production defaults when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';

      const config = getPerformanceConfig();

      // Production should have lower (stricter) thresholds
      expect(config.database.slowQueryWarning).toBeLessThanOrEqual(1000);
      expect(config.http.slowEndpointWarning).toBeLessThanOrEqual(2000);
    });
  });

  describe('Environment Variable Overrides', () => {
    it('should override slow query warning threshold', () => {
      process.env.SLOW_QUERY_WARNING_MS = '750';

      const config = getPerformanceConfig();

      expect(config.database.slowQueryWarning).toBe(750);
    });

    it('should override slow query error threshold', () => {
      process.env.SLOW_QUERY_ERROR_MS = '2500';

      const config = getPerformanceConfig();

      expect(config.database.slowQueryError).toBe(2500);
    });

    it('should override log all queries setting', () => {
      process.env.LOG_ALL_QUERIES = 'true';

      const config = getPerformanceConfig();

      expect(config.database.logAllQueries).toBe(true);
    });

    it('should override slow endpoint warning threshold', () => {
      process.env.SLOW_ENDPOINT_WARNING_MS = '1500';

      const config = getPerformanceConfig();

      expect(config.http.slowEndpointWarning).toBe(1500);
    });

    it('should override slow endpoint error threshold', () => {
      process.env.SLOW_ENDPOINT_ERROR_MS = '4000';

      const config = getPerformanceConfig();

      expect(config.http.slowEndpointError).toBe(4000);
    });

    it('should override metrics enabled setting', () => {
      process.env.ENABLE_METRICS = 'true';

      const config = getPerformanceConfig();

      expect(config.metrics.enabled).toBe(true);
    });

    it('should override metrics window size', () => {
      process.env.METRICS_WINDOW_SIZE = '500';

      const config = getPerformanceConfig();

      expect(config.metrics.windowSize).toBe(500);
    });

    it('should override metrics log interval', () => {
      process.env.METRICS_LOG_INTERVAL_MS = '30000';

      const config = getPerformanceConfig();

      expect(config.metrics.logInterval).toBe(30000);
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton performanceConfig', () => {
      expect(performanceConfig).toBeDefined();
      expect(performanceConfig.database).toBeDefined();
      expect(performanceConfig.http).toBeDefined();
      expect(performanceConfig.metrics).toBeDefined();
    });

    it('should have consistent structure', () => {
      expect(performanceConfig).toHaveProperty('database.slowQueryWarning');
      expect(performanceConfig).toHaveProperty('database.slowQueryError');
      expect(performanceConfig).toHaveProperty('database.logAllQueries');
      expect(performanceConfig).toHaveProperty('http.slowEndpointWarning');
      expect(performanceConfig).toHaveProperty('http.slowEndpointError');
      expect(performanceConfig).toHaveProperty('metrics.enabled');
      expect(performanceConfig).toHaveProperty('metrics.windowSize');
      expect(performanceConfig).toHaveProperty('metrics.logInterval');
    });
  });

  describe('Type Safety', () => {
    it('should return numbers for threshold values', () => {
      const config = getPerformanceConfig();

      expect(typeof config.database.slowQueryWarning).toBe('number');
      expect(typeof config.database.slowQueryError).toBe('number');
      expect(typeof config.http.slowEndpointWarning).toBe('number');
      expect(typeof config.http.slowEndpointError).toBe('number');
      expect(typeof config.metrics.windowSize).toBe('number');
      expect(typeof config.metrics.logInterval).toBe('number');
    });

    it('should return booleans for flag values', () => {
      const config = getPerformanceConfig();

      expect(typeof config.database.logAllQueries).toBe('boolean');
      expect(typeof config.metrics.enabled).toBe('boolean');
    });
  });

  describe('Reasonable Defaults', () => {
    it('should have sensible query thresholds', () => {
      const config = getPerformanceConfig();

      // Query thresholds should be reasonable (between 100ms and 10s)
      expect(config.database.slowQueryWarning).toBeGreaterThanOrEqual(100);
      expect(config.database.slowQueryWarning).toBeLessThanOrEqual(10000);
      expect(config.database.slowQueryError).toBeGreaterThanOrEqual(100);
      expect(config.database.slowQueryError).toBeLessThanOrEqual(10000);
    });

    it('should have sensible endpoint thresholds', () => {
      const config = getPerformanceConfig();

      // Endpoint thresholds should be reasonable (between 500ms and 30s)
      expect(config.http.slowEndpointWarning).toBeGreaterThanOrEqual(500);
      expect(config.http.slowEndpointWarning).toBeLessThanOrEqual(30000);
      expect(config.http.slowEndpointError).toBeGreaterThanOrEqual(500);
      expect(config.http.slowEndpointError).toBeLessThanOrEqual(30000);
    });

    it('should have sensible metrics window size', () => {
      const config = getPerformanceConfig();

      // Window size should be reasonable (between 100 and 10000 samples)
      expect(config.metrics.windowSize).toBeGreaterThanOrEqual(100);
      expect(config.metrics.windowSize).toBeLessThanOrEqual(10000);
    });
  });
});
