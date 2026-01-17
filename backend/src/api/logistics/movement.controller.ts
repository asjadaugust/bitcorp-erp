/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database.config';
import { Movement, MovementDetail } from '../../models/movement.model';
import { Product } from '../../models/product.model';
import Logger from '../../utils/logger';
import {
  sendSuccess,
  sendCreated,
  sendPaginatedSuccess,
  sendError,
} from '../../utils/api-response';
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
   * List all movements with computed totals and pagination
   * @query page - Page number (default: 1)
   * @query limit - Items per page (default: 10, max: 100)
   * @query tipo_movimiento - Filter by movement type (entrada/salida/transferencia/ajuste)
   * @query proyecto_id - Filter by project ID
   * @query estado - Filter by status (pendiente/aprobado/rechazado)
   * @returns MovementListDto[] with Spanish snake_case fields and pagination
   */
  async getAll(req: Request, res: Response) {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100
      const offset = (page - 1) * limit;

      // Parse filters
      const tipoMovimiento = req.query.tipo_movimiento as string;
      const proyectoId = req.query.proyecto_id
        ? parseInt(req.query.proyecto_id as string)
        : undefined;
      const estado = req.query.estado as string;

      const movementRepo = AppDataSource.getRepository(Movement);

      // Build query
      const queryBuilder = movementRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.project', 'p')
        .leftJoinAndSelect('m.creator', 'u')
        .loadRelationCountAndMap('m.items_count', 'm.details')
        .orderBy('m.createdAt', 'DESC');

      // Apply filters
      if (tipoMovimiento) {
        queryBuilder.andWhere('m.tipoMovimiento = :tipoMovimiento', { tipoMovimiento });
      }
      if (proyectoId) {
        queryBuilder.andWhere('m.projectId = :proyectoId', { proyectoId });
      }
      if (estado) {
        queryBuilder.andWhere('m.estado = :estado', { estado });
      }

      // Count total matching movements
      const total = await queryBuilder.getCount();

      // Get paginated movements
      const movements = await queryBuilder.take(limit).skip(offset).getMany();

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

      return sendPaginatedSuccess(res, movementDtos, { page, limit, total });
    } catch (error) {
      Logger.error('Error fetching movements', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'MovementController.getAll',
      });
      return sendError(
        res,
        500,
        'FETCH_ERROR',
        'Failed to fetch movements',
        (error as Error).message
      );
    }
  }

  /**
   * GET /api/movements/:id
   * Get single movement with details
   * @returns MovementDetailDto with Spanish snake_case fields
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
        return sendError(res, 404, 'NOT_FOUND', 'Movement not found');
      }

      // Transform to DTO
      const movementDto = toMovementDetailDto(movement as unknown as Record<string, unknown>);

      return sendSuccess(res, movementDto);
    } catch (error) {
      Logger.error('Error fetching movement', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        movementId: req.params.id,
        context: 'MovementController.getById',
      });
      return sendError(
        res,
        500,
        'FETCH_ERROR',
        'Failed to fetch movement',
        (error as Error).message
      );
    }
  }

  /**
   * POST /api/movements
   * Create new movement with details and update stock
   * @body MovementCreateDto (Spanish snake_case fields)
   * @returns MovementDetailDto with created movement
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

      return sendCreated(res, movementDto);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      Logger.error('Error creating movement', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'MovementController.create',
      });
      return sendError(
        res,
        500,
        'CREATE_ERROR',
        'Failed to create movement',
        (error as Error).message
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * PUT /api/movements/:id/approve
   * Approve a movement
   * @returns MovementDetailDto with updated movement
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
        return sendError(res, 404, 'NOT_FOUND', 'Movement not found');
      }

      movement.estado = 'aprobado';
      movement.approvedBy = (req as any).user?.id;
      movement.approvedAt = new Date();

      await movementRepo.save(movement);

      // Return updated movement as DTO
      const movementDto = toMovementDetailDto(movement as unknown as Record<string, unknown>);

      return sendSuccess(res, movementDto);
    } catch (error) {
      Logger.error('Error approving movement', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        movementId: req.params.id,
        context: 'MovementController.approve',
      });
      return sendError(
        res,
        500,
        'UPDATE_ERROR',
        'Failed to approve movement',
        (error as Error).message
      );
    }
  }
}
