import { AsyncLocalStorage } from 'async_hooks';

/**
 * Request context stored in AsyncLocalStorage
 */
export interface RequestContext {
  correlationId: string;
  userId?: number;
  username?: string;
  path?: string;
  method?: string;
}

/**
 * AsyncLocalStorage for managing request-scoped context
 * This allows correlation IDs and user context to be accessible
 * throughout the entire request lifecycle without passing them explicitly
 */
class AsyncContext {
  private storage = new AsyncLocalStorage<RequestContext>();

  /**
   * Run a function with a specific context
   */
  run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Get the current request context
   */
  getContext(): RequestContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Get correlation ID from current context
   */
  getCorrelationId(): string {
    return this.getContext()?.correlationId || 'no-correlation-id';
  }

  /**
   * Get user ID from current context
   */
  getUserId(): number | undefined {
    return this.getContext()?.userId;
  }

  /**
   * Get username from current context
   */
  getUsername(): string | undefined {
    return this.getContext()?.username;
  }

  /**
   * Update current context (partial update)
   */
  updateContext(updates: Partial<RequestContext>): void {
    const current = this.getContext();
    if (current) {
      Object.assign(current, updates);
    }
  }
}

export const asyncContext = new AsyncContext();
export default asyncContext;
