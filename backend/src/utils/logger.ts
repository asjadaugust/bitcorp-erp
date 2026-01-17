import logger from '../config/logger.config';
import { v4 as uuidv4 } from 'uuid';
import { asyncContext } from './async-context';

/**
 * Logger utility wrapper with correlation ID support via AsyncLocalStorage
 *
 * Usage:
 *   Logger.info('User logged in', { userId: user.id });
 *   Logger.error('Database error', { error: err.message, stack: err.stack });
 *
 * Correlation IDs are automatically retrieved from AsyncLocalStorage context
 */
export class Logger {
  /**
   * Get current correlation ID from AsyncLocalStorage
   */
  static getCorrelationId(): string {
    return asyncContext.getCorrelationId();
  }

  /**
   * Generate a new correlation ID
   */
  static generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Set correlation ID (for backward compatibility - prefer AsyncLocalStorage)
   * @deprecated Use asyncContext.run() instead
   */
  static setCorrelationId(id: string): void {
    asyncContext.updateContext({ correlationId: id });
  }

  /**
   * Clear correlation ID (for backward compatibility - prefer AsyncLocalStorage)
   * @deprecated No longer needed with AsyncLocalStorage
   */
  static clearCorrelationId(): void {
    // No-op - AsyncLocalStorage handles this automatically
  }

  /**
   * Get base metadata including correlation ID and user context
   */
  private static getBaseMetadata(): Record<string, unknown> {
    const context = asyncContext.getContext();
    return {
      correlationId: context?.correlationId || 'no-correlation-id',
      userId: context?.userId,
      username: context?.username,
    };
  }

  /**
   * Log error level message
   */
  static error(message: string, metadata?: Record<string, unknown>): void {
    logger.error(message, { ...this.getBaseMetadata(), ...metadata });
  }

  /**
   * Log warning level message
   */
  static warn(message: string, metadata?: Record<string, unknown>): void {
    logger.warn(message, { ...this.getBaseMetadata(), ...metadata });
  }

  /**
   * Log info level message
   */
  static info(message: string, metadata?: Record<string, unknown>): void {
    logger.info(message, { ...this.getBaseMetadata(), ...metadata });
  }

  /**
   * Log HTTP level message (for request/response logging)
   */
  static http(message: string, metadata?: Record<string, unknown>): void {
    logger.http(message, { ...this.getBaseMetadata(), ...metadata });
  }

  /**
   * Log debug level message
   */
  static debug(message: string, metadata?: Record<string, unknown>): void {
    logger.debug(message, { ...this.getBaseMetadata(), ...metadata });
  }
}

export default Logger;
