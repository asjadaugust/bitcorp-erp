/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Response } from 'express';

/**
 * Generic entity-to-DTO transformer function type
 */
export type TransformFn<TEntity, TDto> = (entity: TEntity) => TDto;

/**
 * Apply transformation and send paginated response
 */
export function sendPaginatedDto<TEntity, TDto>(
  res: Response,
  entities: TEntity[],
  transform: TransformFn<TEntity, TDto>,
  pagination: { page: number; limit: number; total: number }
): Response {
  return res.json({
    success: true,
    data: entities.map(transform),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

/**
 * Apply transformation and send single entity response
 */
export function sendDto<TEntity, TDto>(
  res: Response,
  entity: TEntity,
  transform: TransformFn<TEntity, TDto>,
  status = 200
): Response {
  return res.status(status).json({
    success: true,
    data: transform(entity),
  });
}

/**
 * Send list without pagination (for small datasets <100 rows)
 */
export function sendListDto<TEntity, TDto>(
  res: Response,
  entities: TEntity[],
  transform: TransformFn<TEntity, TDto>
): Response {
  return res.json({
    success: true,
    data: entities.map(transform),
  });
}

/**
 * Create transformer from field mapping
 */
export function createTransformer<TEntity extends Record<string, any>, TDto>(
  fieldMap: Record<keyof TDto, keyof TEntity | ((entity: TEntity) => any)>
): TransformFn<TEntity, TDto> {
  return (entity: TEntity) => {
    const dto = {} as TDto;
    for (const [dtoField, entityFieldOrFn] of Object.entries(fieldMap)) {
      if (typeof entityFieldOrFn === 'function') {
        (dto as any)[dtoField] = entityFieldOrFn(entity);
      } else {
        (dto as any)[dtoField] = entity[entityFieldOrFn as string];
      }
    }
    return dto;
  };
}
