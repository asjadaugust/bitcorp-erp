/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database.config';
import { Movement, MovementDetail } from '../../models/movement.model';
import { Product } from '../../models/product.model';
import Logger from '../../utils/logger';
import {
  MovementListDto,
  toMovementListDto,
  toMovementDetailDto,
  fromMovementCreateDto,
  fromMovementItemCreateDto,
} from '../../types/dto/movement.dto';

/**
 * MovementController - Inventory movement management
 *
 * All endpoints return Spanish snake_case DTOs
 */
export class MovementController {
  /**
   * GET /api/movements
   * List all movements with computed totals
   */
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

      // Calculate total_amount for each movement and transform to DTO
      const movementDtos: MovementListDto[] = await Promise.all(
        movements.map(async (movement) => {
          const detailRepo = AppDataSource.getRepository(MovementDetail);
          const details = await detailRepo
            .createQueryBuilder('md')
            .where('md.movementId = :id', { id: movement.id })
            .getMany();

          const montoTotal = details.reduce((sum, detail) => {
            return sum + detail.cantidad * detail.precioUnitario;
          }, 0);

          const itemsCount = (movement as any).items_count || 0;

          return toMovementListDto(
            movement as unknown as Record<string, unknown>,
            itemsCount,
            montoTotal
          );
        })
      );

      res.json({
        success: true,
        data: movementDtos,
      });
    } catch (error) {
      Logger.error('Error fetching movements', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'MovementController.getAll',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch movements',
        details: (error as Error).message,
      });
    }
  }

  /**
   * GET /api/movements/:id
   * Get single movement with details
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const movementRepo = AppDataSource.getRepository(Movement);

      const movement = await movementRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.project', 'p')
        .leftJoinAndSelect('m.creator', 'u')
        .leftJoinAndSelect('m.approver', 'approver')
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

      // Transform to DTO
      const movementDto = toMovementDetailDto(movement as unknown as Record<string, unknown>);

      res.json({
        success: true,
        data: movementDto,
      });
    } catch (error) {
      Logger.error('Error fetching movement', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        movementId: req.params.id,
        context: 'MovementController.getById',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch movement',
        details: (error as Error).message,
      });
    }
  }

  /**
   * POST /api/movements
   * Create new movement with details and update stock
   * Body expects Spanish snake_case fields (MovementCreateDto)
   */
  async create(req: Request, res: Response) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const createdBy = (req as any).user?.id;

      // Transform DTO to entity fields
      const movementData = fromMovementCreateDto(req.body, createdBy);

      // Create movement
      const movementRepo = queryRunner.manager.getRepository(Movement);
      const movement = movementRepo.create(movementData);
      const savedMovement = await movementRepo.save(movement);

      // Create movement details
      const detailRepo = queryRunner.manager.getRepository(MovementDetail);
      const details = req.body.items.map((item: any) => {
        const detailData = fromMovementItemCreateDto(item, savedMovement.id);
        return detailRepo.create(detailData);
      });

      await detailRepo.save(details);

      // Update stock if needed
      const tipoMovimiento = req.body.tipo_movimiento;
      if (tipoMovimiento === 'entrada' || tipoMovimiento === 'salida') {
        const productRepo = queryRunner.manager.getRepository(Product);
        for (const item of req.body.items) {
          const product = await productRepo.findOne({
            where: { id: parseInt(item.producto_id) },
          });

          if (product) {
            const quantity = parseFloat(item.cantidad);
            if (tipoMovimiento === 'entrada') {
              product.stockActual += quantity;
            } else if (tipoMovimiento === 'salida') {
              product.stockActual -= quantity;
            }
            await productRepo.save(product);
          }
        }
      }

      await queryRunner.commitTransaction();

      // Return created movement as DTO
      const createdMovement = await movementRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.project', 'p')
        .leftJoinAndSelect('m.creator', 'u')
        .leftJoinAndSelect('m.details', 'md')
        .leftJoinAndSelect('md.product', 'prod')
        .where('m.id = :id', { id: savedMovement.id })
        .getOne();

      const movementDto = createdMovement
        ? toMovementDetailDto(createdMovement as unknown as Record<string, unknown>)
        : null;

      res.status(201).json({
        success: true,
        data: movementDto,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      Logger.error('Error creating movement', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'MovementController.create',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to create movement',
        details: (error as Error).message,
      });
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * PUT /api/movements/:id/approve
   * Approve a movement
   */
  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const movementRepo = AppDataSource.getRepository(Movement);

      const movement = await movementRepo.findOne({
        where: { id: parseInt(id) },
        relations: ['project', 'creator', 'approver'],
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

      // Return updated movement as DTO
      const movementDto = toMovementDetailDto(movement as unknown as Record<string, unknown>);

      res.json({
        success: true,
        data: movementDto,
      });
    } catch (error) {
      Logger.error('Error approving movement', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        movementId: req.params.id,
        context: 'MovementController.approve',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to approve movement',
        details: (error as Error).message,
      });
    }
  }
}
