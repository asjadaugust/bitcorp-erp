import { AppDataSource } from '../config/database.config';
import { Product } from '../models/product.model';
import { Movement, MovementDetail, TipoMovimiento } from '../models/movement.model';
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';
import Logger from '../utils/logger';
import {
  MovementDetailDto,
  MovementCreateDto,
  MovementDetailCreateDto,
  ProductStockDto,
  toMovementDetailDto,
} from '../types/dto/inventory.dto';

export class InventoryService {
  private productRepository = AppDataSource.getRepository(Product);
  private movementRepository = AppDataSource.getRepository(Movement);
  private movementDetailRepository = AppDataSource.getRepository(MovementDetail);

  /**
   * Create inventory movement with stock updates
   * Implements weighted average cost calculation for 'entrada' movements
   * Validates sufficient stock for 'salida' movements
   * Uses database transaction to ensure atomicity
   *
   * @param tenantId - Tenant identifier (TODO: filter when tenant_id column exists)
   * @param data - Movement header data
   * @param details - Array of movement line items
   * @returns Created movement with details
   */
  async createMovement(
    tenantId: number,
    data: MovementCreateDto,
    details: MovementDetailCreateDto[]
  ): Promise<MovementDetailDto> {
    // Business validation: Validate movement type
    const validTypes: TipoMovimiento[] = ['entrada', 'salida', 'transferencia', 'ajuste'];
    if (!validTypes.includes(data.tipo_movimiento)) {
      throw new BusinessRuleError(
        'Invalid movement type',
        'INVALID_MOVEMENT_TYPE',
        { tipo: data.tipo_movimiento, validTypes },
        'Seleccione un tipo de movimiento válido'
      );
    }

    // Business validation: At least one detail required
    if (!details || details.length === 0) {
      throw new BusinessRuleError(
        'Movement must have at least one detail',
        'NO_MOVEMENT_DETAILS',
        {},
        'Agregue al menos un producto al movimiento'
      );
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Logger.info('Creating inventory movement', {
        tenantId,
        tipoMovimiento: data.tipo_movimiento,
        detailCount: details.length,
        projectId: data.project_id,
        context: 'InventoryService.createMovement',
      });

      // Create Movement
      // TODO: Add tenant_id when column exists in logistica.movimiento table
      // const movement = this.movementRepository.create({
      //   ...data,
      //   tenant_id: tenantId,
      // });
      const movement = this.movementRepository.create(data);
      const savedMovement = await queryRunner.manager.save(movement);

      // Process Details
      for (const detailData of details) {
        // Business validation: Positive quantity
        if (detailData.cantidad <= 0) {
          throw new BusinessRuleError(
            'Quantity must be positive',
            'INVALID_QUANTITY',
            { cantidad: detailData.cantidad },
            'Ingrese una cantidad positiva'
          );
        }

        // Business validation: Non-negative price
        if (detailData.precioUnitario < 0) {
          throw new BusinessRuleError(
            'Unit price cannot be negative',
            'INVALID_PRICE',
            { precio: detailData.precioUnitario },
            'Ingrese un precio no negativo'
          );
        }

        // TODO: Add tenant_id filter when column exists in logistica.producto table
        // where: { id: detailData.productId, tenant_id: tenantId }
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: detailData.productId },
        });

        if (!product) {
          throw new NotFoundError('Product', detailData.productId);
        }

        // Create Detail with calculated total
        const detail = this.movementDetailRepository.create({
          ...detailData,
          movementId: savedMovement.id,
          montoTotal: detailData.cantidad * detailData.precioUnitario,
        });
        await queryRunner.manager.save(detail);

        // Update Stock based on movement type
        if (movement.tipoMovimiento === 'entrada') {
          // Business rule: Weighted Average Cost (Costo Promedio Ponderado)
          // Formula: (currentValue + newValue) / totalStock
          // Example: 10 units @ $100 + 5 units @ $120 = (1000 + 600) / 15 = $106.67
          const currentValue = Number(product.stockActual) * Number(product.precioUnitario || 0);
          const newValue = Number(detail.cantidad) * Number(detail.precioUnitario);
          const totalValue = currentValue + newValue;
          const totalStock = Number(product.stockActual) + Number(detail.cantidad);

          if (totalStock > 0) {
            product.precioUnitario = totalValue / totalStock;
          }
          product.stockActual = totalStock;
        } else if (movement.tipoMovimiento === 'salida') {
          // Business rule: Sufficient stock check
          const currentStock = Number(product.stockActual);
          const requestedQuantity = Number(detail.cantidad);

          if (currentStock < requestedQuantity) {
            throw new BusinessRuleError(
              'Insufficient stock for product',
              'INSUFFICIENT_STOCK',
              {
                productId: product.id,
                productName: product.nombre,
                requested: requestedQuantity,
                available: currentStock,
                shortfall: requestedQuantity - currentStock,
              },
              `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${requestedQuantity}`
            );
          }

          product.stockActual = currentStock - requestedQuantity;

          // Business rule: Prevent negative stock (safety check)
          if (product.stockActual < 0) {
            throw new BusinessRuleError(
              'Stock cannot be negative',
              'NEGATIVE_STOCK',
              { productId: product.id, calculatedStock: product.stockActual },
              'Error interno: el cálculo de stock resultó en valor negativo'
            );
          }
        }

        await queryRunner.manager.save(product);
      }

      await queryRunner.commitTransaction();

      Logger.info('Inventory movement created successfully', {
        tenantId,
        movementId: savedMovement.id,
        tipoMovimiento: savedMovement.tipoMovimiento,
        detailCount: details.length,
        context: 'InventoryService.createMovement',
      });

      // Load relations for DTO transformation
      const movementWithDetails = await this.movementRepository.findOne({
        where: { id: savedMovement.id },
        relations: ['details', 'details.product', 'project'],
      });

      return toMovementDetailDto(movementWithDetails);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      Logger.error('Error creating inventory movement', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        tipoMovimiento: data.tipo_movimiento,
        detailCount: details.length,
        context: 'InventoryService.createMovement',
      });

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get current stock for a product
   *
   * @param tenantId - Tenant identifier (TODO: filter when tenant_id column exists)
   * @param productId - Product ID
   * @returns Product stock information
   * @throws NotFoundError if product not found
   */
  async getStock(tenantId: number, productId: number): Promise<ProductStockDto> {
    try {
      Logger.info('Getting product stock', {
        tenantId,
        productId,
        context: 'InventoryService.getStock',
      });

      // TODO: Add tenant_id filter when column exists in logistica.producto table
      // where: { id: productId, tenant_id: tenantId }
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundError('Product', productId);
      }

      Logger.info('Product stock retrieved', {
        tenantId,
        productId,
        stock: product.stockActual,
        context: 'InventoryService.getStock',
      });

      return {
        product_id: product.id,
        codigo: product.codigo,
        nombre: product.nombre,
        stock_actual: Number(product.stockActual),
        stock_minimo: product.stockMinimo ? Number(product.stockMinimo) : null,
        unidad_medida: product.unidadMedida || null,
        precio_unitario: product.precioUnitario ? Number(product.precioUnitario) : null,
      };
    } catch (error) {
      Logger.error('Error getting product stock', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        productId,
        context: 'InventoryService.getStock',
      });
      throw error;
    }
  }
}
