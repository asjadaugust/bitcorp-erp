import { Logger as TypeORMLogger, QueryRunner } from 'typeorm';
import Logger from '../utils/logger';
import { performanceConfig } from '../config/performance.config';
import { performanceMetrics } from './performance-metrics.service';

/**
 * Custom TypeORM Logger for performance monitoring
 *
 * Features:
 * - Logs slow queries with warnings/errors based on thresholds
 * - Tracks query execution times
 * - Collects metrics for analysis
 * - Includes correlation ID and user context automatically
 *
 * Usage:
 * Set this as the logger in TypeORM DataSource configuration
 */
export class TypeORMPerformanceLogger implements TypeORMLogger {
  /**
   * Log a general log message
   */
  log(level: 'log' | 'info' | 'warn', message: string | number | boolean): void {
    const logMethod = level === 'warn' ? 'warn' : 'info';
    Logger[logMethod](`[TypeORM] ${String(message)}`, {
      context: 'TypeORM',
    });
  }

  /**
   * Log info message
   */
  logMigration(message: string): void {
    Logger.info(`[TypeORM Migration] ${message}`, {
      context: 'TypeORM.Migration',
    });
  }

  /**
   * Log query with performance tracking
   */
  logQuery(query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    // Only log individual queries if configured
    if (performanceConfig.database.logAllQueries) {
      Logger.debug('[TypeORM Query]', {
        query: this.formatQuery(query),
        parameters: this.formatParameters(parameters),
        context: 'TypeORM.Query',
      });
    }
  }

  /**
   * Log schema build
   */
  logSchemaBuild(message: string): void {
    Logger.info(`[TypeORM Schema] ${message}`, {
      context: 'TypeORM.Schema',
    });
  }

  /**
   * Log query error
   */
  logQueryError(
    error: string | Error,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;

    Logger.error('[TypeORM Query Error]', {
      error: errorMessage,
      query: this.formatQuery(query),
      parameters: this.formatParameters(parameters),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'TypeORM.QueryError',
    });

    // Track error in metrics
    if (performanceConfig.metrics.enabled) {
      performanceMetrics.recordQueryError();
    }
  }

  /**
   * Log slow query - this is the key performance monitoring feature
   */
  logQuerySlow(
    time: number,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner
  ): void {
    const { slowQueryWarning, slowQueryError } = performanceConfig.database;

    // Determine log level based on query time
    let level: 'warn' | 'error' = 'warn';
    let severity: 'slow' | 'very-slow' = 'slow';

    if (time >= slowQueryError) {
      level = 'error';
      severity = 'very-slow';
    }

    Logger[level](`[TypeORM Slow Query] Query took ${time}ms`, {
      durationMs: time,
      duration: `${time}ms`,
      query: this.formatQuery(query),
      parameters: this.formatParameters(parameters),
      severity,
      threshold: time >= slowQueryError ? slowQueryError : slowQueryWarning,
      context: 'TypeORM.SlowQuery',
    });

    // Record metrics
    if (performanceConfig.metrics.enabled) {
      performanceMetrics.recordQueryTime(time);
      if (time >= slowQueryWarning) {
        performanceMetrics.recordSlowQuery();
      }
    }
  }

  /**
   * Format query for logging (truncate if too long)
   */
  private formatQuery(query: string): string {
    // Remove extra whitespace and newlines
    const formatted = query.replace(/\s+/g, ' ').trim();

    // Truncate if very long
    const maxLength = 500;
    if (formatted.length > maxLength) {
      return formatted.substring(0, maxLength) + '... (truncated)';
    }

    return formatted;
  }

  /**
   * Format parameters for logging (sanitize sensitive data)
   */
  private formatParameters(parameters?: unknown[]): unknown[] | undefined {
    if (!parameters || parameters.length === 0) {
      return undefined;
    }

    // Limit number of parameters logged
    const maxParams = 10;
    if (parameters.length > maxParams) {
      return [...parameters.slice(0, maxParams), `... (${parameters.length - maxParams} more)`];
    }

    return parameters.map((param) => {
      // Sanitize potentially sensitive data
      if (typeof param === 'string') {
        // Truncate long strings
        if (param.length > 100) {
          return param.substring(0, 100) + '... (truncated)';
        }
        // Don't log potential passwords/tokens
        if (param.includes('password') || param.includes('token')) {
          return '[REDACTED]';
        }
      }
      return param;
    });
  }
}

/**
 * Singleton instance
 */
export const typeormLogger = new TypeORMPerformanceLogger();
