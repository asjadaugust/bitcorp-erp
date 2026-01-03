import { Request, Response } from 'express';
import { Product } from '../../models/product.model';
import { AppDataSource } from '../../config/database.config';

export class ProductController {
  async getAll(req: Request, res: Response) {
    try {
      const productRepo = AppDataSource.getRepository(Product);
      const products = await productRepo.find({
        where: { isActive: true },
        order: { nombre: 'ASC' },
      });
      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
        details: (error as Error).message,
      });
    }
  }

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

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
        details: (error as Error).message,
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const {
        codigo,
        nombre,
        descripcion,
        categoria,
        unidad_medida,
        stock_actual,
        stock_minimo,
        stock_maximo,
        costo_unitario,
        ubicacion,
      } = req.body;

      const productRepo = AppDataSource.getRepository(Product);
      const product = productRepo.create({
        codigo,
        nombre,
        descripcion,
        categoria,
        unidadMedida: unidad_medida,
        stockActual: stock_actual || 0,
        stockMinimo: stock_minimo || 0,
        // stock_maximo: stock_maximo || 0,
        precioUnitario: costo_unitario || 0,
        // ubicacion,
        isActive: true,
        // created_by: (req as any).user?.id,
      });

      const saved = await productRepo.save(product);
      res.status(201).json({
        success: true,
        data: saved,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
        details: (error as Error).message,
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        nombre,
        descripcion,
        categoria,
        unidad_medida,
        ubicacion,
        stock_minimo,
        stock_maximo,
        costo_unitario,
      } = req.body;

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

      // Update fields
      if (nombre !== undefined) product.nombre = nombre;
      if (descripcion !== undefined) product.descripcion = descripcion;
      if (categoria !== undefined) product.categoria = categoria;
      if (unidad_medida !== undefined) product.unidadMedida = unidad_medida;
      // if (ubicacion !== undefined) product.ubicacion = ubicacion;
      if (stock_minimo !== undefined) product.stockMinimo = stock_minimo;
      // if (stock_maximo !== undefined) product.stock_maximo = stock_maximo;
      if (costo_unitario !== undefined) product.precioUnitario = costo_unitario;
      // product.updated_by = (req as any).user?.id;

      const updated = await productRepo.save(product);
      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
        details: (error as Error).message,
      });
    }
  }

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
      // product.updated_by = (req as any).user?.id;
      await productRepo.save(product);

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
        details: (error as Error).message,
      });
    }
  }
}
