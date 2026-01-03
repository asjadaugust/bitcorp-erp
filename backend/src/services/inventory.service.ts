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
          where: { id: detailData.productId as any },
        });
        if (!product) {
          throw new Error(`Product not found: ${detailData.productId}`);
        }

        // Create Detail
        const detail = this.movementDetailRepository.create({
          ...detailData,
          movementId: savedMovement.id as any,
        });
        await queryRunner.manager.save(detail);

        // Update Stock
        if (movement.tipoMovimiento === 'entrada') {
          // Update Weighted Average Cost (Costo Promedio Ponderado)
          const totalValue =
            Number(product.stockActual) * Number(product.precioUnitario || 0) +
            Number(detail.cantidad) * Number(detail.precioUnitario);
          const totalStock = Number(product.stockActual) + Number(detail.cantidad);

          if (totalStock > 0) {
            product.precioUnitario = totalValue / totalStock;
          }
          product.stockActual = totalStock;
        } else if (movement.tipoMovimiento === 'salida') {
          if (Number(product.stockActual) < Number(detail.cantidad)) {
            throw new Error(`Insufficient stock for product: ${product.nombre}`);
          }
          product.stockActual = Number(product.stockActual) - Number(detail.cantidad);
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
    return product ? Number(product.stockActual) : 0;
  }
}
