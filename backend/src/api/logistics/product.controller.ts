/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { Product } from '../../models/product.model';
import { AppDataSource } from '../../config/database.config';
import Logger from '../../utils/logger';
import {
  toProductListDto,
  toProductDetailDto,
  fromProductCreateDto,
  fromProductUpdateDto,
} from '../../types/dto/product.dto';

export class ProductController {
  /**
   * GET /api/products
   * List all active products
   * @returns ProductListDto[] with Spanish snake_case fields
   */
  async getAll(req: Request, res: Response) {
    try {
      const productRepo = AppDataSource.getRepository(Product);
      const products = await productRepo.find({
        where: { isActive: true },
        order: { nombre: 'ASC' },
      });

      // Transform to DTOs (Spanish snake_case)
      const dtos = products.map((p) => toProductListDto(p as unknown as Record<string, unknown>));

      res.json({
        success: true,
        data: dtos,
      });
    } catch (error) {
      Logger.error('Error fetching products', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProductController.getAll',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
        details: (error as Error).message,
      });
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
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Transform to DTO (Spanish snake_case)
      const dto = toProductDetailDto(product as unknown as Record<string, unknown>);

      res.json({
        success: true,
        data: dto,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
        details: (error as Error).message,
      });
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

      res.status(201).json({
        success: true,
        data: dto,
      });
    } catch (error) {
      Logger.error('Error creating product', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProductController.create',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
        details: (error as Error).message,
      });
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
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Transform DTO (snake_case) to entity fields (camelCase)
      const updates = fromProductUpdateDto(req.body);
      Object.assign(product, updates);

      const updated = await productRepo.save(product);

      // Transform entity back to DTO for response
      const dto = toProductDetailDto(updated as unknown as Record<string, unknown>);

      res.json({
        success: true,
        data: dto,
      });
    } catch (error) {
      Logger.error('Error updating product', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        productId: req.params.id,
        context: 'ProductController.update',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
        details: (error as Error).message,
      });
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
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      // Soft delete
      product.isActive = false;
      await productRepo.save(product);

      res.status(204).send();
    } catch (error) {
      Logger.error('Error deleting product', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        productId: req.params.id,
        context: 'ProductController.delete',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
        details: (error as Error).message,
      });
    }
  }
}
