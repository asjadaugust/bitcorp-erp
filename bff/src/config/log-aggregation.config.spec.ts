import { getLogAggregationConfig, logAggregationConfig } from './log-aggregation.config';

describe('Log Aggregation Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Default Configuration', () => {
    it('should have all log categories configured', () => {
      const config = getLogAggregationConfig();

      expect(config.categories.error).toBeDefined();
      expect(config.categories.security).toBeDefined();
      expect(config.categories.performance).toBeDefined();
      expect(config.categories.audit).toBeDefined();
      expect(config.categories.http).toBeDefined();
      expect(config.categories.combined).toBeDefined();
    });

    it('should have proper retention policies', () => {
      const config = getLogAggregationConfig();

      // Error logs: 30 days
      expect(config.categories.error.maxFiles).toBe('30d');

      // Security logs: 90 days (compliance)
      expect(config.categories.security.maxFiles).toBe('90d');

      // Performance logs: 14 days
      expect(config.categories.performance.maxFiles).toBe('14d');

      // Audit logs: 180 days (6 months)
      expect(config.categories.audit.maxFiles).toBe('180d');

      // HTTP logs: 7 days
      expect(config.categories.http.maxFiles).toBe('7d');

      // Combined logs: 14 days
      expect(config.categories.combined.maxFiles).toBe('14d');
    });

    it('should have proper file size limits', () => {
      const config = getLogAggregationConfig();

      // All categories should have maxSize defined
      Object.values(config.categories).forEach((category) => {
        expect(category.maxSize).toBeDefined();
        expect(category.maxSize).toMatch(/^\d+[kmg]$/i);
      });
    });

    it('should enable compression for all categories', () => {
      const config = getLogAggregationConfig();

      Object.values(config.categories).forEach((category) => {
        expect(category.zippedArchive).toBe(true);
      });
    });

    it('should have correct date patterns', () => {
      const config = getLogAggregationConfig();

      Object.values(config.categories).forEach((category) => {
        expect(category.datePattern).toBe('YYYY-MM-DD');
      });
    });
  });

  describe('Environment-Based Configuration', () => {
    it('should enable file logging in production', () => {
      process.env.NODE_ENV = 'production';

      const config = getLogAggregationConfig();

      expect(config.enabled).toBe(true);
    });

    it('should disable file logging in development by default', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.ENABLE_FILE_LOGGING;

      const config = getLogAggregationConfig();

      expect(config.enabled).toBe(false);
    });

    it('should enable file logging when explicitly enabled', () => {
      process.env.NODE_ENV = 'development';
      process.env.ENABLE_FILE_LOGGING = 'true';

      const config = getLogAggregationConfig();

      expect(config.enabled).toBe(true);
    });
  });

  describe('Environment Variable Overrides', () => {
    it('should override logs directory', () => {
      process.env.LOGS_DIR = 'custom-logs';

      const config = getLogAggregationConfig();

      expect(config.logsDir).toBe('custom-logs');
    });

    it('should override error log retention', () => {
      process.env.ERROR_LOG_RETENTION = '60d';

      const config = getLogAggregationConfig();

      expect(config.categories.error.maxFiles).toBe('60d');
    });

    it('should override security log retention', () => {
      process.env.SECURITY_LOG_RETENTION = '365d';

      const config = getLogAggregationConfig();

      expect(config.categories.security.maxFiles).toBe('365d');
    });

    it('should override performance log max size', () => {
      process.env.PERFORMANCE_LOG_MAX_SIZE = '100m';

      const config = getLogAggregationConfig();

      expect(config.categories.performance.maxSize).toBe('100m');
    });

    it('should override audit log retention', () => {
      process.env.AUDIT_LOG_RETENTION = '730d';

      const config = getLogAggregationConfig();

      expect(config.categories.audit.maxFiles).toBe('730d');
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton logAggregationConfig', () => {
      expect(logAggregationConfig).toBeDefined();
      expect(logAggregationConfig.categories).toBeDefined();
    });

    it('should have consistent structure', () => {
      expect(logAggregationConfig).toHaveProperty('enabled');
      expect(logAggregationConfig).toHaveProperty('logsDir');
      expect(logAggregationConfig).toHaveProperty('categories.error');
      expect(logAggregationConfig).toHaveProperty('categories.security');
      expect(logAggregationConfig).toHaveProperty('categories.performance');
      expect(logAggregationConfig).toHaveProperty('categories.audit');
      expect(logAggregationConfig).toHaveProperty('categories.http');
      expect(logAggregationConfig).toHaveProperty('categories.combined');
    });
  });

  describe('Log Category Descriptions', () => {
    it('should have descriptions for all categories', () => {
      const config = getLogAggregationConfig();

      Object.entries(config.categories).forEach(([_name, category]) => {
        expect(category.description).toBeDefined();
        expect(category.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('File Naming Patterns', () => {
    it('should have proper filename patterns', () => {
      const config = getLogAggregationConfig();

      expect(config.categories.error.filename).toBe('error-%DATE%.log');
      expect(config.categories.security.filename).toBe('security-%DATE%.log');
      expect(config.categories.performance.filename).toBe('performance-%DATE%.log');
      expect(config.categories.audit.filename).toBe('audit-%DATE%.log');
      expect(config.categories.http.filename).toBe('http-%DATE%.log');
      expect(config.categories.combined.filename).toBe('combined-%DATE%.log');
    });
  });

  describe('Log Levels', () => {
    it('should have appropriate log levels per category', () => {
      const config = getLogAggregationConfig();

      expect(config.categories.error.level).toBe('error');
      expect(config.categories.security.level).toBe('info');
      expect(config.categories.performance.level).toBe('info');
      expect(config.categories.audit.level).toBe('info');
      expect(config.categories.http.level).toBe('http');
      expect(config.categories.combined.level).toBe('debug');
    });
  });

  describe('Compliance Requirements', () => {
    it('should meet minimum retention for audit logs', () => {
      const config = getLogAggregationConfig();

      // Audit logs should be kept for at least 180 days (6 months) for compliance
      const auditRetention = parseInt(config.categories.audit.maxFiles);
      expect(auditRetention).toBeGreaterThanOrEqual(180);
    });

    it('should meet minimum retention for security logs', () => {
      const config = getLogAggregationConfig();

      // Security logs should be kept for at least 90 days for compliance
      const securityRetention = parseInt(config.categories.security.maxFiles);
      expect(securityRetention).toBeGreaterThanOrEqual(90);
    });
  });
});
