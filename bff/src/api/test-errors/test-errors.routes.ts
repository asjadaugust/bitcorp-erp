import { Router } from 'express';
import {
  NotFoundError,
  ValidationError,
  BadRequestError,
  BusinessRuleError,
  DatabaseError,
} from '../../errors';
import { asyncHandler } from '../../middleware/async-handler.middleware';

const router = Router();

/**
 * Test endpoint to demonstrate error handling
 * GET /api/test-errors/:type
 */
router.get(
  '/:type',
  asyncHandler(async (req, res) => {
    const { type } = req.params;

    switch (type) {
      case 'not-found':
        throw new NotFoundError('TestResource', req.query.id as string);

      case 'validation':
        throw new ValidationError('Validation failed', [
          { field: 'email', message: 'Invalid email format', rule: 'email' },
          {
            field: 'password',
            message: 'Password must be at least 8 characters',
            rule: 'minLength',
          },
        ]);

      case 'bad-request':
        throw new BadRequestError('Invalid request data', { reason: 'Missing required fields' });

      case 'business-rule':
        throw BusinessRuleError.cannotDelete('Project', 'has active equipment', { count: 5 });

      case 'database':
        throw DatabaseError.connection('Failed to connect to database');

      case 'standard-error':
        throw new Error('This is a standard JavaScript error');

      case 'async-error':
        // Simulate async error
        await Promise.reject(new Error('Async operation failed'));
        break;

      default:
        res.json({
          message: 'Error testing endpoint',
          availableTypes: [
            'not-found',
            'validation',
            'bad-request',
            'business-rule',
            'database',
            'standard-error',
            'async-error',
          ],
        });
    }
  })
);

export default router;
