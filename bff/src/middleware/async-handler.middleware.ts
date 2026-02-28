import { Request, Response, NextFunction } from 'express';

/**
 * Type for async route handler functions
 */
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Async Handler Wrapper
 *
 * Wraps async route handlers to automatically catch errors and pass them to next().
 * This eliminates the need for try-catch blocks in every route handler.
 *
 * Without asyncHandler:
 * ```typescript
 * router.get('/projects/:id', async (req, res, next) => {
 *   try {
 *     const project = await projectService.findById(req.params.id);
 *     res.json(project);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 * ```
 *
 * With asyncHandler:
 * ```typescript
 * router.get('/projects/:id', asyncHandler(async (req, res) => {
 *   const project = await projectService.findById(req.params.id);
 *   res.json(project);
 * }));
 * ```
 *
 * @param fn - Async route handler function
 * @returns Express middleware function that handles promise rejections
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Alternative name for consistency with express-async-handler
 */
export const catchAsync = asyncHandler;

/**
 * Wraps a synchronous function to be compatible with asyncHandler
 * Useful for functions that might throw synchronously
 */
export const wrapSync = (fn: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
