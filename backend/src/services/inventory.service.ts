import { AppDataSource } from '../config/database.config';
import { Product } from '../models/product.model';
import { Movement, MovementDetail, TipoMovimiento } from '../models/movement.model';

export class InventoryService {
  private productRepository = AppDataSource.getRepository(Product);
  private movementRepository = AppDataSource.getRepository(Movement);
  private movementDetailRepository = AppDataSource.getRepository(MovementDetail);

  async createMovement(
    data: Partial<Movement>,
    details: Partial<MovementDetail>[]
  ): Promise<Movement> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create Movement
      const movement = this.movementRepository.create(data);
      const savedMovement = await queryRunner.manager.save(movement);

      // Process Details
      for (const detailData of details) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: detailData.product_id as any },
        });
        if (!product) {
          throw new Error(`Product not found: ${detailData.product_id}`);
        }

        // Create Detail
        const detail = this.movementDetailRepository.create({
          ...detailData,
          movement_id: savedMovement.id as any,
        });
        await queryRunner.manager.save(detail);

        // Update Stock
        if (movement.tipo_movimiento === 'entrada') {
          // Update Weighted Average Cost (Costo Promedio Ponderado)
          const totalValue =
            Number(product.stock_actual) * Number(product.costo_unitario) +
            Number(detail.cantidad) * Number(detail.costo_unitario);
          const totalStock = Number(product.stock_actual) + Number(detail.cantidad);

          if (totalStock > 0) {
            product.costo_unitario = totalValue / totalStock;
          }
          product.stock_actual = totalStock;
        } else if (movement.tipo_movimiento === 'salida') {
          if (Number(product.stock_actual) < Number(detail.cantidad)) {
            throw new Error(`Insufficient stock for product: ${product.nombre}`);
          }
          product.stock_actual = Number(product.stock_actual) - Number(detail.cantidad);
        }

        await queryRunner.manager.save(product);
      }

      await queryRunner.commitTransaction();
      return savedMovement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getStock(productId: number): Promise<number> {
    const product = await this.productRepository.findOne({ where: { id: productId as any } });
    return product ? Number(product.stock_actual) : 0;
  }
}
