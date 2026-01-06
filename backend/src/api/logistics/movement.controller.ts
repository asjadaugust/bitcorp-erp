/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database.config';
import { Movement, MovementDetail } from '../../models/movement.model';
import { Product } from '../../models/product.model';

export class MovementController {
  async getAll(req: Request, res: Response) {
    try {
      const movementRepo = AppDataSource.getRepository(Movement);
      const movements = await movementRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.project', 'p')
        .leftJoinAndSelect('m.creator', 'u')
        .loadRelationCountAndMap('m.items_count', 'm.details')
        .orderBy('m.createdAt', 'DESC')
        .getMany();

      // Calculate total_amount for each movement and transform to snake_case
      const movementsWithTotal = await Promise.all(
        movements.map(async (movement) => {
          const detailRepo = AppDataSource.getRepository(MovementDetail);
          const details = await detailRepo
            .createQueryBuilder('md')
            .where('md.movementId = :id', { id: movement.id })
            .getMany();

          const total_amount = details.reduce((sum, detail) => {
            return sum + detail.cantidad * detail.precioUnitario;
          }, 0);

          // Transform to frontend-expected format
          // Map tipo_movimiento to frontend format: entrada->IN, salida->OUT
          const tipoMap: Record<string, string> = {
            entrada: 'IN',
            salida: 'OUT',
            transferencia: 'TRANSFER',
            ajuste: 'ADJUST',
          };

          return {
            id: movement.id,
            proyecto_id: movement.projectId,
            project_id: movement.projectId, // alias
            provider_id: null, // No provider relation on movement
            fecha: movement.fecha,
            tipo_movimiento: tipoMap[movement.tipoMovimiento] || 'IN',
            tipo_documento: null, // No document type field
            numero_documento: movement.numeroDocumento || '',
            observaciones: movement.observaciones,
            estado: movement.estado,
            created_at: movement.createdAt,
            updated_at: movement.updatedAt,
            // Relations/computed
            project_name: movement.project?.nombre || 'N/A',
            proyecto: movement.project?.nombre || 'N/A', // alias for display
            proveedor: 'N/A', // No provider relation on movement
            details: [], // Empty array, will be populated by items_count
            items: (movement as any).items_count || 0,
            total_amount,
            created_by: movement.createdBy,
            created_by_name: movement.creator?.username || null,
          };
        })
      );

      res.json({
        success: true,
        data: movementsWithTotal,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch movements',
        details: (error as Error).message,
      });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const movementRepo = AppDataSource.getRepository(Movement);

      const movement = await movementRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.project', 'p')
        .leftJoinAndSelect('m.creator', 'u')
        .leftJoinAndSelect('m.details', 'md')
        .leftJoinAndSelect('md.product', 'prod')
        .where('m.id = :id', { id: parseInt(id) })
        .getOne();

      if (!movement) {
        return res.status(404).json({
          success: false,
          error: 'Movement not found',
        });
      }

      // Format response with snake_case transformation
      const response = {
        id: movement.id,
        proyecto_id: movement.projectId,
        project_id: movement.projectId, // alias
        fecha: movement.fecha,
        movement_date: movement.fecha, // alias
        tipo_movimiento: movement.tipoMovimiento?.toUpperCase() || 'ENTRADA',
        movement_type: movement.tipoMovimiento, // alias (original case)
        numero_documento: movement.numeroDocumento || 'N/A',
        observaciones: movement.observaciones,
        notes: movement.observaciones, // alias
        estado: movement.estado,
        created_at: movement.createdAt,
        updated_at: movement.updatedAt,
        created_by: movement.createdBy,
        approved_by: movement.approvedBy,
        approved_at: movement.approvedAt,
        // Relations
        project_name: movement.project?.nombre || 'N/A',
        proyecto: movement.project?.nombre || 'N/A', // alias
        created_by_name: movement.creator?.username || null,
        // Details
        details: movement.details?.map((detail) => ({
          id: detail.id,
          movement_id: detail.movementId,
          product_id: detail.productId,
          quantity: detail.cantidad,
          cantidad: detail.cantidad, // alias
          unit_cost: detail.precioUnitario,
          precio_unitario: detail.precioUnitario, // alias
          total_cost: detail.cantidad * detail.precioUnitario,
          monto_total: detail.cantidad * detail.precioUnitario, // alias
          product_name: (detail.product as any)?.nombre || null,
          product_code: (detail.product as any)?.codigo || null,
          unit: (detail.product as any)?.unidadMedida || null,
          observaciones: detail.observaciones,
        })),
      };

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch movement',
        details: (error as Error).message,
      });
    }
  }

  async create(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { project_id, movement_date, movement_type, notes, items } = req.body;

      // Create movement
      const movementRepo = queryRunner.manager.getRepository(Movement);
      const movement = movementRepo.create({
        projectId: project_id ? parseInt(project_id) : undefined,
        fecha: new Date(movement_date),
        tipoMovimiento: movement_type,
        observaciones: notes,
        estado: 'pendiente',
        createdBy: (req as any).user?.id,
      });

      const savedMovement = await movementRepo.save(movement);

      // Create movement details
      const detailRepo = queryRunner.manager.getRepository(MovementDetail);
      const details = items.map((item: any) =>
        detailRepo.create({
          movementId: savedMovement.id,
          productId: parseInt(item.product_id),
          cantidad: parseFloat(item.quantity),
          precioUnitario: parseFloat(item.unit_cost),
          montoTotal: parseFloat(item.quantity) * parseFloat(item.unit_cost),
          observaciones: item.observaciones,
        })
      );

      await detailRepo.save(details);

      // Update stock if needed
      if (movement_type === 'entrada' || movement_type === 'salida') {
        const productRepo = queryRunner.manager.getRepository(Product);
        for (const item of items) {
          const product = await productRepo.findOne({
            where: { id: parseInt(item.product_id) },
          });

          if (product) {
            const quantity = parseFloat(item.quantity);
            if (movement_type === 'entrada') {
              product.stockActual += quantity;
            } else if (movement_type === 'salida') {
              product.stockActual -= quantity;
            }
            await productRepo.save(product);
          }
        }
      }

      await queryRunner.commitTransaction();

      res.status(201).json({
        success: true,
        data: {
          ...savedMovement,
          details,
        },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to create movement',
        details: (error as Error).message,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const movementRepo = AppDataSource.getRepository(Movement);

      const movement = await movementRepo.findOne({
        where: { id: parseInt(id) },
      });

      if (!movement) {
        return res.status(404).json({
          success: false,
          error: 'Movement not found',
        });
      }

      movement.estado = 'aprobado';
      movement.approvedBy = (req as any).user?.id;
      movement.approvedAt = new Date();

      await movementRepo.save(movement);

      res.json({
        success: true,
        data: movement,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve movement',
        details: (error as Error).message,
      });
    }
  }
}
