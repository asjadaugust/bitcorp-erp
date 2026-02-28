/**
 * Legacy error middleware
 *
 * @deprecated Use error-handler.middleware.ts instead
 * This file is kept for backwards compatibility and will be removed in the future.
 *
 * Migration guide:
 * - Replace `errorHandler` with the new `errorHandler` from error-handler.middleware.ts
 * - Replace `notFound` with `notFoundHandler` from error-handler.middleware.ts
 * - Use `asyncHandler` wrapper for async route handlers
 * - Use custom error classes from `src/errors`
 */

// Re-export new error handlers for backwards compatibility
export { errorHandler, notFoundHandler as notFound } from './error-handler.middleware';
export { asyncHandler, catchAsync } from './async-handler.middleware';
