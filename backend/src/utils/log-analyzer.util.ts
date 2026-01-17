import { LogQuery, LogEntry, LogQueryOptions } from './log-query.util';

/**
 * Performance statistics extracted from logs
 */
export interface PerformanceStats {
  totalRequests: number;
  slowQueries: number;
  slowEndpoints: number;
  errors: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

/**
 * Error statistics by type
 */
export interface ErrorStats {
  total: number;
  byLevel: Record<string, number>;
  byContext: Record<string, number>;
  recentErrors: LogEntry[];
}

/**
 * User activity statistics
 */
export interface UserActivityStats {
  uniqueUsers: number;
  totalActions: number;
  topUsers: Array<{ userId: number; username?: string; actions: number }>;
  actionsByHour: Record<string, number>;
}

/**
 * Security event statistics
 */
export interface SecurityStats {
  totalEvents: number;
  failedLogins: number;
  successfulLogins: number;
  accessDenied: number;
  suspiciousActivity: number;
}

/**
 * Log Analysis Utility
 *
 * Provides methods to analyze logs and extract insights:
 * - Performance metrics
 * - Error patterns
 * - User activity
 * - Security events
 *
 * Usage:
 *   const analyzer = new LogAnalyzer('combined');
 *   const perf = await analyzer.analyzePerformance({ date: '2026-01-17' });
 *   const errors = await analyzer.analyzeErrors({ dateFrom: '2026-01-01' });
 */
export class LogAnalyzer {
  private query: LogQuery;

  constructor(logType: 'error' | 'security' | 'performance' | 'audit' | 'http' | 'combined') {
    this.query = new LogQuery(logType);
  }

  /**
   * Analyze performance metrics from logs
   */
  async analyzePerformance(options: LogQueryOptions = {}): Promise<PerformanceStats> {
    const logs = await this.query.find(options);

    let totalRequests = 0;
    let slowQueries = 0;
    let slowEndpoints = 0;
    let errors = 0;
    const responseTimes: number[] = [];

    for (const log of logs) {
      // Count HTTP requests
      if (log.level === 'http' || log.context?.includes('RequestLogger')) {
        totalRequests++;

        // Extract response time
        if (typeof log.durationMs === 'number') {
          responseTimes.push(log.durationMs);
        }
      }

      // Count slow queries
      if (log.context === 'TypeORM.SlowQuery') {
        slowQueries++;
      }

      // Count slow endpoints
      if (log.performance && typeof log.performance === 'string') {
        if (log.performance.includes('Slow endpoint') || log.performance.includes('Very slow')) {
          slowEndpoints++;
        }
      }

      // Count errors
      if (log.level === 'error') {
        errors++;
      }
    }

    // Calculate percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const avg =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    return {
      totalRequests,
      slowQueries,
      slowEndpoints,
      errors,
      averageResponseTime: Math.round(avg * 100) / 100,
      p50ResponseTime: this.percentile(sortedTimes, 50),
      p95ResponseTime: this.percentile(sortedTimes, 95),
      p99ResponseTime: this.percentile(sortedTimes, 99),
    };
  }

  /**
   * Analyze error patterns
   */
  async analyzeErrors(options: LogQueryOptions = {}): Promise<ErrorStats> {
    const logs = await this.query.findErrors(options);

    const byLevel: Record<string, number> = {};
    const byContext: Record<string, number> = {};

    for (const log of logs) {
      // Count by level
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;

      // Count by context
      if (log.context) {
        byContext[log.context] = (byContext[log.context] || 0) + 1;
      }
    }

    // Get most recent errors
    const recentErrors = logs.slice(0, 10);

    return {
      total: logs.length,
      byLevel,
      byContext,
      recentErrors,
    };
  }

  /**
   * Analyze user activity
   */
  async analyzeUserActivity(options: LogQueryOptions = {}): Promise<UserActivityStats> {
    const logs = await this.query.find(options);

    const userActions = new Map<number, { username?: string; count: number }>();
    const actionsByHour: Record<string, number> = {};

    for (const log of logs) {
      // Count actions by user
      if (log.userId) {
        const existing = userActions.get(log.userId) || { count: 0 };
        userActions.set(log.userId, {
          username: log.username as string | undefined,
          count: existing.count + 1,
        });
      }

      // Count actions by hour
      if (log.timestamp) {
        const hour = log.timestamp.substring(0, 13); // YYYY-MM-DD HH
        actionsByHour[hour] = (actionsByHour[hour] || 0) + 1;
      }
    }

    // Get top users
    const topUsers = Array.from(userActions.entries())
      .map(([userId, data]) => ({
        userId,
        username: data.username,
        actions: data.count,
      }))
      .sort((a, b) => b.actions - a.actions)
      .slice(0, 10);

    return {
      uniqueUsers: userActions.size,
      totalActions: logs.length,
      topUsers,
      actionsByHour,
    };
  }

  /**
   * Analyze security events
   */
  async analyzeSecurity(options: LogQueryOptions = {}): Promise<SecurityStats> {
    const logs = await this.query.find({ ...options, category: 'security' });

    let failedLogins = 0;
    let successfulLogins = 0;
    let accessDenied = 0;
    let suspiciousActivity = 0;

    for (const log of logs) {
      const message = log.message.toLowerCase();
      const context = log.context?.toLowerCase() || '';

      // Detect failed logins
      if (
        message.includes('login failed') ||
        message.includes('authentication failed') ||
        message.includes('invalid credentials')
      ) {
        failedLogins++;
      }

      // Detect successful logins
      if (
        message.includes('login successful') ||
        message.includes('logged in') ||
        context.includes('auth.login')
      ) {
        successfulLogins++;
      }

      // Detect access denied
      if (
        message.includes('access denied') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')
      ) {
        accessDenied++;
      }

      // Detect suspicious activity
      if (
        message.includes('suspicious') ||
        message.includes('brute force') ||
        message.includes('multiple failed attempts') ||
        (failedLogins > 5 && log.userId)
      ) {
        suspiciousActivity++;
      }
    }

    return {
      totalEvents: logs.length,
      failedLogins,
      successfulLogins,
      accessDenied,
      suspiciousActivity,
    };
  }

  /**
   * Generate a summary report for a date range
   */
  async generateReport(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    period: { from: string; to: string };
    performance: PerformanceStats;
    errors: ErrorStats;
    userActivity: UserActivityStats;
    security: SecurityStats;
  }> {
    const options = { dateFrom, dateTo };

    const [performance, errors, userActivity, security] = await Promise.all([
      this.analyzePerformance(options),
      this.analyzeErrors(options),
      this.analyzeUserActivity(options),
      this.analyzeSecurity(options),
    ]);

    return {
      period: { from: dateFrom, to: dateTo },
      performance,
      errors,
      userActivity,
      security,
    };
  }

  /**
   * Find anomalies in logs (errors spikes, unusual patterns)
   */
  async findAnomalies(options: LogQueryOptions = {}): Promise<{
    errorSpikes: Array<{ hour: string; count: number }>;
    slowEndpointSpikes: Array<{ hour: string; count: number }>;
    failedLoginSpikes: Array<{ hour: string; count: number }>;
  }> {
    const logs = await this.query.find(options);

    const errorsByHour: Record<string, number> = {};
    const slowEndpointsByHour: Record<string, number> = {};
    const failedLoginsByHour: Record<string, number> = {};

    for (const log of logs) {
      if (!log.timestamp) continue;

      const hour = log.timestamp.substring(0, 13); // YYYY-MM-DD HH

      // Track errors
      if (log.level === 'error') {
        errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
      }

      // Track slow endpoints
      if (
        log.performance &&
        typeof log.performance === 'string' &&
        log.performance.includes('Slow')
      ) {
        slowEndpointsByHour[hour] = (slowEndpointsByHour[hour] || 0) + 1;
      }

      // Track failed logins
      if (log.category === 'security' && log.message.toLowerCase().includes('failed')) {
        failedLoginsByHour[hour] = (failedLoginsByHour[hour] || 0) + 1;
      }
    }

    // Identify spikes (more than 2x the average)
    const findSpikes = (data: Record<string, number>) => {
      const values = Object.values(data);
      const avg = values.reduce((a, b) => a + b, 0) / values.length || 0;
      const threshold = avg * 2;

      return Object.entries(data)
        .filter(([, count]) => count > threshold)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      errorSpikes: findSpikes(errorsByHour),
      slowEndpointSpikes: findSpikes(slowEndpointsByHour),
      failedLoginSpikes: findSpikes(failedLoginsByHour),
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return Math.round(sortedArray[Math.max(0, index)] * 100) / 100;
  }
}

/**
 * Convenience function to analyze combined logs
 */
export const analyzeCombinedLogs = (options: LogQueryOptions = {}) => {
  const analyzer = new LogAnalyzer('combined');
  return analyzer.analyzePerformance(options);
};

/**
 * Convenience function to analyze errors
 */
export const analyzeErrors = (options: LogQueryOptions = {}) => {
  const analyzer = new LogAnalyzer('error');
  return analyzer.analyzeErrors(options);
};

/**
 * Convenience function to analyze security events
 */
export const analyzeSecurity = (options: LogQueryOptions = {}) => {
  const analyzer = new LogAnalyzer('security');
  return analyzer.analyzeSecurity(options);
};
