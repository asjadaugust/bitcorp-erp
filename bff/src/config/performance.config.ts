/**
 * Performance monitoring configuration
 *
 * This file contains thresholds and settings for performance monitoring:
 * - Slow query detection
 * - Slow endpoint detection
 * - Performance metrics collection
 *
 * Thresholds can be overridden via environment variables
 */

export interface PerformanceThresholds {
  /**
   * Database query time thresholds (milliseconds)
   */
  database: {
    /** Log warning if query takes longer than this */
    slowQueryWarning: number;
    /** Log error if query takes longer than this */
    slowQueryError: number;
    /** Log all queries (debug level) */
    logAllQueries: boolean;
  };

  /**
   * HTTP endpoint time thresholds (milliseconds)
   */
  http: {
    /** Log warning if request takes longer than this */
    slowEndpointWarning: number;
    /** Log error if request takes longer than this */
    slowEndpointError: number;
  };

  /**
   * Metrics collection settings
   */
  metrics: {
    /** Enable metrics collection */
    enabled: boolean;
    /** Window size for calculating percentiles (number of samples) */
    windowSize: number;
    /** Log metrics summary interval (milliseconds, 0 to disable) */
    logInterval: number;
  };
}

/**
 * Get performance configuration based on environment
 */
export const getPerformanceConfig = (): PerformanceThresholds => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';

  return {
    database: {
      // Default: 1000ms warning, 3000ms error
      slowQueryWarning: parseInt(
        process.env.SLOW_QUERY_WARNING_MS || (isDevelopment ? '1000' : '500')
      ),
      slowQueryError: parseInt(
        process.env.SLOW_QUERY_ERROR_MS || (isDevelopment ? '3000' : '2000')
      ),
      logAllQueries: process.env.LOG_ALL_QUERIES === 'true' || isDevelopment,
    },

    http: {
      // Default: 2000ms warning, 5000ms error
      slowEndpointWarning: parseInt(
        process.env.SLOW_ENDPOINT_WARNING_MS || (isDevelopment ? '2000' : '1000')
      ),
      slowEndpointError: parseInt(
        process.env.SLOW_ENDPOINT_ERROR_MS || (isDevelopment ? '5000' : '3000')
      ),
    },

    metrics: {
      enabled: process.env.ENABLE_METRICS === 'true' || isDevelopment,
      windowSize: parseInt(process.env.METRICS_WINDOW_SIZE || '1000'),
      // Log metrics every 5 minutes in production, 1 minute in dev
      logInterval: parseInt(
        process.env.METRICS_LOG_INTERVAL_MS || (isDevelopment ? '60000' : '300000')
      ),
    },
  };
};

/**
 * Singleton instance of performance config
 */
export const performanceConfig = getPerformanceConfig();

/**
 * Environment variables reference:
 *
 * SLOW_QUERY_WARNING_MS=1000        # Warn on queries slower than 1s
 * SLOW_QUERY_ERROR_MS=3000          # Error on queries slower than 3s
 * LOG_ALL_QUERIES=true              # Log every query (debug level)
 *
 * SLOW_ENDPOINT_WARNING_MS=2000     # Warn on requests slower than 2s
 * SLOW_ENDPOINT_ERROR_MS=5000       # Error on requests slower than 5s
 *
 * ENABLE_METRICS=true               # Enable metrics collection
 * METRICS_WINDOW_SIZE=1000          # Keep last 1000 samples per metric
 * METRICS_LOG_INTERVAL_MS=60000     # Log metrics summary every minute
 */
