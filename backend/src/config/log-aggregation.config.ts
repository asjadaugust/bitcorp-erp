/**
 * Log Aggregation Configuration
 *
 * This file contains configuration for log rotation, retention, and categorization.
 * Different log categories have different retention policies based on their importance.
 *
 * Log Categories:
 * - error: Critical errors (30 days retention)
 * - security: Authentication, authorization, access control (90 days)
 * - performance: Slow queries, slow endpoints (14 days)
 * - audit: Business operations, data changes (180 days)
 * - http: HTTP access logs (7 days)
 * - combined: All logs (14 days)
 */

export interface LogCategoryConfig {
  /** File name pattern (without date suffix) */
  filename: string;
  /** Maximum retention period */
  maxFiles: string;
  /** Maximum file size before rotation */
  maxSize: string;
  /** Minimum log level for this category */
  level: string;
  /** Date pattern for rotation */
  datePattern: string;
  /** Enable gzip compression for old files */
  zippedArchive: boolean;
  /** Description of what this log contains */
  description: string;
}

export interface LogAggregationConfig {
  /** Enable file-based logging */
  enabled: boolean;
  /** Base directory for all logs */
  logsDir: string;
  /** Log categories configuration */
  categories: {
    error: LogCategoryConfig;
    security: LogCategoryConfig;
    performance: LogCategoryConfig;
    audit: LogCategoryConfig;
    http: LogCategoryConfig;
    combined: LogCategoryConfig;
  };
}

/**
 * Get log aggregation configuration based on environment
 */
export const getLogAggregationConfig = (): LogAggregationConfig => {
  const env = process.env.NODE_ENV || 'development';
  const isProduction = env === 'production';

  // File logging is enabled in production or explicitly enabled
  const enabled = isProduction || process.env.ENABLE_FILE_LOGGING === 'true';

  return {
    enabled,
    logsDir: process.env.LOGS_DIR || 'logs',

    categories: {
      // Critical errors - 30 days retention
      error: {
        filename: 'error-%DATE%.log',
        maxFiles: process.env.ERROR_LOG_RETENTION || '30d',
        maxSize: process.env.ERROR_LOG_MAX_SIZE || '20m',
        level: 'error',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        description: 'Application errors, exceptions, and critical issues',
      },

      // Security events - 90 days retention (compliance requirement)
      security: {
        filename: 'security-%DATE%.log',
        maxFiles: process.env.SECURITY_LOG_RETENTION || '90d',
        maxSize: process.env.SECURITY_LOG_MAX_SIZE || '20m',
        level: 'info',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        description: 'Authentication, authorization, and security events',
      },

      // Performance monitoring - 14 days retention
      performance: {
        filename: 'performance-%DATE%.log',
        maxFiles: process.env.PERFORMANCE_LOG_RETENTION || '14d',
        maxSize: process.env.PERFORMANCE_LOG_MAX_SIZE || '50m',
        level: 'info',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        description: 'Slow queries, slow endpoints, performance metrics',
      },

      // Audit trail - 180 days retention (6 months for compliance)
      audit: {
        filename: 'audit-%DATE%.log',
        maxFiles: process.env.AUDIT_LOG_RETENTION || '180d',
        maxSize: process.env.AUDIT_LOG_MAX_SIZE || '50m',
        level: 'info',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        description: 'Business operations, data modifications, important actions',
      },

      // HTTP access logs - 7 days retention
      http: {
        filename: 'http-%DATE%.log',
        maxFiles: process.env.HTTP_LOG_RETENTION || '7d',
        maxSize: process.env.HTTP_LOG_MAX_SIZE || '100m',
        level: 'http',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        description: 'HTTP requests and responses',
      },

      // Combined logs - 14 days retention
      combined: {
        filename: 'combined-%DATE%.log',
        maxFiles: process.env.COMBINED_LOG_RETENTION || '14d',
        maxSize: process.env.COMBINED_LOG_MAX_SIZE || '50m',
        level: 'debug',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        description: 'All application logs combined',
      },
    },
  };
};

/**
 * Singleton instance
 */
export const logAggregationConfig = getLogAggregationConfig();

/**
 * Environment variables reference:
 *
 * ENABLE_FILE_LOGGING=true          # Enable file logging in non-production
 * LOGS_DIR=logs                     # Base directory for logs
 *
 * # Retention periods (days)
 * ERROR_LOG_RETENTION=30d           # Error logs retention
 * SECURITY_LOG_RETENTION=90d        # Security logs retention
 * PERFORMANCE_LOG_RETENTION=14d     # Performance logs retention
 * AUDIT_LOG_RETENTION=180d          # Audit logs retention
 * HTTP_LOG_RETENTION=7d             # HTTP logs retention
 * COMBINED_LOG_RETENTION=14d        # Combined logs retention
 *
 * # Max file sizes (before rotation)
 * ERROR_LOG_MAX_SIZE=20m
 * SECURITY_LOG_MAX_SIZE=20m
 * PERFORMANCE_LOG_MAX_SIZE=50m
 * AUDIT_LOG_MAX_SIZE=50m
 * HTTP_LOG_MAX_SIZE=100m
 * COMBINED_LOG_MAX_SIZE=50m
 */
