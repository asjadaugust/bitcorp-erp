/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { Product } from '../../models/product.model';
import { AppDataSource } from '../../config/database.config';
import Logger from '../../utils/logger';
import {
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
  sendError,
} from '../../utils/api-response';
import {
  toProductListDto,
  toProductDetailDto,
  fromProductCreateDto,
  fromProductUpdateDto,
} from '../../types/dto/product.dto';

export class ProductController {
  /**
   * GET /api/products
   * List all active products with pagination
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 10, max: 100)
   * @query categoria - Filter by category
   * @returns ProductListDto[] with Spanish snake_case fields and pagination
   */
  async getAll(req: Request, res: Response) {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100
      const offset = (page - 1) * limit;

      // Parse filters
      const categoria = req.query.categoria as string;

      const productRepo = AppDataSource.getRepository(Product);

      // Build where clause
      const where: any = { isActive: true };
      if (categoria) {
        where.categoria = categoria;
      }

      // Count total matching products
      const total = await productRepo.count({ where });

      // Get paginated products
      const products = await productRepo.find({
        where,
        order: { nombre: 'ASC' },
        take: limit,
        skip: offset,
      });

      // Transform to DTOs (Spanish snake_case)
      const dtos = products.map((p) => toProductListDto(p as unknown as Record<string, unknown>));

      return sendPaginatedSuccess(res, dtos, { page, limit, total });
    } catch (error) {
      Logger.error('Error fetching products', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProductController.getAll',
      });
      return sendError(
        res,
        500,
        'FETCH_ERROR',
        'Failed to fetch products',
        (error as Error).message
      );
    }
  }

  /**
   * GET /api/products/:id
   * Get single product by ID
   * @returns ProductDetailDto with Spanish snake_case fields
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const productRepo = AppDataSource.getRepository(Product);
      const product = await productRepo.findOne({
        where: { id: parseInt(id), isActive: true },
      });

      if (!product) {
        return sendError(res, 404, 'NOT_FOUND', 'Product not found');
      }

      // Transform to DTO (Spanish snake_case)
      const dto = toProductDetailDto(product as unknown as Record<string, unknown>);

      return sendSuccess(res, dto);
    } catch (error) {
      return sendError(
        res,
        500,
        'FETCH_ERROR',
        'Failed to fetch product',
        (error as Error).message
      );
    }
  }

  /**
   * POST /api/products
   * Create new product
   * @body ProductCreateDto (Spanish snake_case)
   * @returns ProductDetailDto with created product
   */
  async create(req: Request, res: Response) {
    try {
      const productRepo = AppDataSource.getRepository(Product);

      // Transform DTO (snake_case) to entity (camelCase)
      const entityData = fromProductCreateDto(req.body);
      const product = productRepo.create(entityData);

      const saved = await productRepo.save(product);

      // Transform entity back to DTO for response
      const dto = toProductDetailDto(saved as unknown as Record<string, unknown>);

      return sendCreated(res, dto);
    } catch (error) {
      Logger.error('Error creating product', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProductController.create',
      });
      return sendError(
        res,
        500,
        'CREATE_ERROR',
        'Failed to create product',
        (error as Error).message
      );
    }
  }

  /**
   * PUT /api/products/:id
   * Update product
   * @body ProductUpdateDto (Spanish snake_case, partial)
   * @returns ProductDetailDto with updated product
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const productRepo = AppDataSource.getRepository(Product);
      const product = await productRepo.findOne({
        where: { id: parseInt(id), isActive: true },
      });

      if (!product) {
        return sendError(res, 404, 'NOT_FOUND', 'Product not found');
      }

      // Transform DTO (snake_case) to entity fields (camelCase)
      const updates = fromProductUpdateDto(req.body);
      Object.assign(product, updates);

      const updated = await productRepo.save(product);

      // Transform entity back to DTO for response
      const dto = toProductDetailDto(updated as unknown as Record<string, unknown>);

      return sendSuccess(res, dto);
    } catch (error) {
      Logger.error('Error updating product', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        productId: req.params.id,
        context: 'ProductController.update',
      });
      return sendError(
        res,
        500,
        'UPDATE_ERROR',
        'Failed to update product',
        (error as Error).message
      );
    }
  }

  /**
   * DELETE /api/products/:id
   * Soft delete product (sets isActive = false)
   * @returns 204 No Content on success
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const productRepo = AppDataSource.getRepository(Product);

      const product = await productRepo.findOne({
        where: { id: parseInt(id) },
      });

      if (!product) {
        return sendError(res, 404, 'NOT_FOUND', 'Product not found');
      }

      // Soft delete
      product.isActive = false;
      await productRepo.save(product);

      return res.status(204).send(); // 204 No Content is correct for DELETE
    } catch (error) {
      Logger.error('Error deleting product', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        productId: req.params.id,
        context: 'ProductController.delete',
      });
      return sendError(
        res,
        500,
        'DELETE_ERROR',
        'Failed to delete product',
        (error as Error).message
      );
    }
  }
}
