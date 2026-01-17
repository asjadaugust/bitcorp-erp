/**
 * Validation Middleware
 * Validates request body against class-validator DTOs
 * Returns standardized error format on validation failure
 */

import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, ClassConstructor } from 'class-transformer';
import { sendError } from '../utils/api-response';

/**
 * Validation middleware factory
 * @param dtoClass - DTO class with validation decorators
 * @returns Express middleware function
 */
export const validateDto = <T extends object>(dtoClass: ClassConstructor<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Transform plain object to DTO class instance
    const dtoInstance = plainToClass(dtoClass, req.body);

    // Validate
    const errors: ValidationError[] = await validate(dtoInstance, {
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error on unknown properties
      skipMissingProperties: false, // Validate all required properties
    });

    if (errors.length > 0) {
      // Format validation errors
      const formattedErrors = errors.map((error: ValidationError) => {
        const constraints = error.constraints || {};
        return {
          field: error.property,
          errors: Object.values(constraints),
        };
      });

      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Errores de validación en los datos enviados',
        formattedErrors
      );
    }

    // Replace req.body with validated DTO instance
    req.body = dtoInstance;
    next();
  };
};

/**
 * Example usage in controller:
 *
 * import { validateDto } from '../../middleware/validation.middleware';
 * import { ProductCreateDto } from '../../types/dto/product.dto';
 *
 * router.post('/products', validateDto(ProductCreateDto), ProductController.create);
 */
