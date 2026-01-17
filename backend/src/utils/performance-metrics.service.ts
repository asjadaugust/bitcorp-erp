import Logger from '../utils/logger';
import { performanceConfig } from '../config/performance.config';

/**
 * Performance metrics data structure
 */
interface MetricData {
  count: number;
  sum: number;
  min: number;
  max: number;
  samples: number[]; // Rolling window of samples for percentile calculation
}

/**
 * Performance Metrics Service
 *
 * Collects and tracks performance metrics:
 * - Database query times
 * - HTTP endpoint response times
 * - Error rates
 * - Slow query/endpoint counts
 *
 * Features:
 * - Rolling window for percentile calculations
 * - Periodic metrics logging
 * - Thread-safe operation
 */
export class PerformanceMetrics {
  private queryTimes: MetricData;
  private endpointTimes: MetricData;
  private slowQueryCount: number;
  private slowEndpointCount: number;
  private queryErrorCount: number;
  private httpErrorCount: number;
  private logIntervalId?: NodeJS.Timeout;
  private enabled: boolean;

  constructor() {
    this.queryTimes = this.createMetricData();
    this.endpointTimes = this.createMetricData();
    this.slowQueryCount = 0;
    this.slowEndpointCount = 0;
    this.queryErrorCount = 0;
    this.httpErrorCount = 0;
    this.enabled = performanceConfig.metrics.enabled;

    // Start periodic logging if enabled and interval is set
    if (this.enabled && performanceConfig.metrics.logInterval > 0) {
      this.startPeriodicLogging();
    }
  }

  /**
   * Create empty metric data structure
   */
  private createMetricData(): MetricData {
    return {
      count: 0,
      sum: 0,
      min: Infinity,
      max: 0,
      samples: [],
    };
  }

  /**
   * Record a database query execution time
   */
  recordQueryTime(durationMs: number): void {
    if (!this.enabled) return;
    this.recordMetric(this.queryTimes, durationMs);
  }

  /**
   * Record a slow database query
   */
  recordSlowQuery(): void {
    if (!this.enabled) return;
    this.slowQueryCount++;
  }

  /**
   * Record a database query error
   */
  recordQueryError(): void {
    if (!this.enabled) return;
    this.queryErrorCount++;
  }

  /**
   * Record an HTTP endpoint response time
   */
  recordEndpointTime(durationMs: number): void {
    if (!this.enabled) return;
    this.recordMetric(this.endpointTimes, durationMs);
  }

  /**
   * Record a slow HTTP endpoint
   */
  recordSlowEndpoint(): void {
    if (!this.enabled) return;
    this.slowEndpointCount++;
  }

  /**
   * Record an HTTP error
   */
  recordHttpError(): void {
    if (!this.enabled) return;
    this.httpErrorCount++;
  }

  /**
   * Record a metric value with rolling window
   */
  private recordMetric(metric: MetricData, value: number): void {
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);

    // Add to rolling window
    metric.samples.push(value);

    // Keep window size under control
    const maxSize = performanceConfig.metrics.windowSize;
    if (metric.samples.length > maxSize) {
      metric.samples.shift(); // Remove oldest sample
    }
  }

  /**
   * Calculate percentile from samples
   */
  private calculatePercentile(samples: number[], percentile: number): number {
    if (samples.length === 0) return 0;

    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get current metrics summary
   */
  getMetrics() {
    const queryAvg = this.queryTimes.count > 0 ? this.queryTimes.sum / this.queryTimes.count : 0;
    const endpointAvg =
      this.endpointTimes.count > 0 ? this.endpointTimes.sum / this.endpointTimes.count : 0;

    return {
      database: {
        totalQueries: this.queryTimes.count,
        averageTime: Math.round(queryAvg * 100) / 100,
        minTime: this.queryTimes.min === Infinity ? 0 : this.queryTimes.min,
        maxTime: this.queryTimes.max,
        p50: this.calculatePercentile(this.queryTimes.samples, 50),
        p95: this.calculatePercentile(this.queryTimes.samples, 95),
        p99: this.calculatePercentile(this.queryTimes.samples, 99),
        slowQueries: this.slowQueryCount,
        errors: this.queryErrorCount,
      },
      http: {
        totalRequests: this.endpointTimes.count,
        averageTime: Math.round(endpointAvg * 100) / 100,
        minTime: this.endpointTimes.min === Infinity ? 0 : this.endpointTimes.min,
        maxTime: this.endpointTimes.max,
        p50: this.calculatePercentile(this.endpointTimes.samples, 50),
        p95: this.calculatePercentile(this.endpointTimes.samples, 95),
        p99: this.calculatePercentile(this.endpointTimes.samples, 99),
        slowEndpoints: this.slowEndpointCount,
        errors: this.httpErrorCount,
      },
    };
  }

  /**
   * Log metrics summary
   */
  logMetrics(): void {
    if (!this.enabled) return;

    const metrics = this.getMetrics();

    Logger.info('Performance Metrics Summary', {
      context: 'PerformanceMetrics',
      ...metrics,
    });
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.queryTimes = this.createMetricData();
    this.endpointTimes = this.createMetricData();
    this.slowQueryCount = 0;
    this.slowEndpointCount = 0;
    this.queryErrorCount = 0;
    this.httpErrorCount = 0;
  }

  /**
   * Start periodic metrics logging
   */
  private startPeriodicLogging(): void {
    const interval = performanceConfig.metrics.logInterval;

    this.logIntervalId = setInterval(() => {
      this.logMetrics();
    }, interval);

    // Don't keep Node.js process alive just for logging
    this.logIntervalId.unref();
  }

  /**
   * Stop periodic logging (for testing or shutdown)
   */
  stopPeriodicLogging(): void {
    if (this.logIntervalId) {
      clearInterval(this.logIntervalId);
      this.logIntervalId = undefined;
    }
  }

  /**
   * Shutdown cleanup
   */
  shutdown(): void {
    this.stopPeriodicLogging();
    // Log final metrics before shutdown
    if (this.enabled && this.endpointTimes.count > 0) {
      Logger.info('Final Performance Metrics (Shutdown)', {
        context: 'PerformanceMetrics.Shutdown',
        ...this.getMetrics(),
      });
    }
  }
}

/**
 * Singleton instance
 */
export const performanceMetrics = new PerformanceMetrics();

/**
 * Export for shutdown hooks
 */
export default performanceMetrics;
