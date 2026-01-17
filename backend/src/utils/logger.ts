import logger from '../config/logger.config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Logger utility wrapper with correlation ID support
 *
 * Usage:
 *   Logger.info('User logged in', { userId: user.id });
 *   Logger.error('Database error', { error: err.message, stack: err.stack });
 */
export class Logger {
  private static correlationId: string | null = null;

  /**
   * Set correlation ID for the current request context
   */
  static setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Get current correlation ID
   */
  static getCorrelationId(): string {
    return this.correlationId || 'no-correlation-id';
  }

  /**
   * Generate a new correlation ID
   */
  static generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Clear correlation ID (useful for testing)
   */
  static clearCorrelationId(): void {
    this.correlationId = null;
  }

  /**
   * Log error level message
   */
  static error(message: string, metadata?: Record<string, unknown>): void {
    logger.error(message, { correlationId: this.getCorrelationId(), ...metadata });
  }

  /**
   * Log warning level message
   */
  static warn(message: string, metadata?: Record<string, unknown>): void {
    logger.warn(message, { correlationId: this.getCorrelationId(), ...metadata });
  }

  /**
   * Log info level message
   */
  static info(message: string, metadata?: Record<string, unknown>): void {
    logger.info(message, { correlationId: this.getCorrelationId(), ...metadata });
  }

  /**
   * Log HTTP level message (for request/response logging)
   */
  static http(message: string, metadata?: Record<string, unknown>): void {
    logger.http(message, { correlationId: this.getCorrelationId(), ...metadata });
  }

  /**
   * Log debug level message
   */
  static debug(message: string, metadata?: Record<string, unknown>): void {
    logger.debug(message, { correlationId: this.getCorrelationId(), ...metadata });
  }
}

export default Logger;
