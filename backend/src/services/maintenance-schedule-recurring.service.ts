/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { MaintenanceScheduleRecurring } from '../models/maintenance-schedule-recurring.model';
import { Repository } from 'typeorm';
import {
  MaintenanceScheduleRecurringDto,
  CreateMaintenanceScheduleRecurringDto,
  UpdateMaintenanceScheduleRecurringDto,
  MaintenanceScheduleRecurringFilterDto,
  toMaintenanceScheduleRecurringDto,
  fromMaintenanceScheduleRecurringDto,
  mapCreateMaintenanceScheduleRecurringDto,
  mapUpdateMaintenanceScheduleRecurringDto,
  mapMaintenanceScheduleRecurringFilterDto,
} from '../types/dto/maintenance-schedule-recurring.dto';
import { NotFoundError, DatabaseError, DatabaseErrorType } from '../errors';
import { Logger } from '../utils/logger';

/**
 * MaintenanceScheduleRecurringService
 *
 * Manages recurring maintenance schedules for equipment in BitCorp ERP.
 * Handles patterns like "change oil every 250 hours" or "inspect every 6 months".
 *
 * ## Purpose
 *
 * This service handles **RECURRING** maintenance schedules that repeat on a regular interval.
 * For **one-time** maintenance work orders, use `MaintenanceService` instead.
 *
 * ## Maintenance Types
 *
 * - **preventive**: Scheduled preventive maintenance (default)
 * - **corrective**: Corrective maintenance to fix recurring issues
 * - **predictive**: Predictive maintenance based on condition monitoring
 * - **calibration**: Equipment calibration schedules
 * - **inspection**: Regular inspection schedules
 *
 * ## Interval Types
 *
 * - **hours**: Based on equipment operating hours (e.g., every 250 hours)
 * - **days**: Calendar days (e.g., every 30 days)
 * - **weeks**: Calendar weeks (e.g., every 4 weeks)
 * - **months**: Calendar months (e.g., every 6 months)
 * - **kilometers**: Based on distance traveled (e.g., every 5000 km)
 *
 * ## Status Lifecycle
 *
 * ```
 * active → suspended → active (can be reactivated)
 *       ↘ completed (schedule finished, no longer recurring)
 *       ↘ inactive (soft deleted)
 * ```
 *
 * ### Status States:
 * - `active`: Schedule is active and auto-generating maintenance tasks
 * - `inactive`: Schedule is inactive (soft deleted, not visible in lists)
 * - `suspended`: Schedule temporarily suspended (visible but not generating tasks)
 * - `completed`: Schedule completed (no longer recurring, kept for history)
 *
 * ## Auto-Generate Tasks
 *
 * When `auto_generate_tasks = true`:
 * - System automatically creates maintenance tasks when schedule is due
 * - Tasks are created based on `next_due_date` or `next_due_hours`
 *
 * When `auto_generate_tasks = false`:
 * - Manual task creation required
 * - Schedule serves as a reminder only
 *
 * ## Next Due Date Calculation
 *
 * The service automatically calculates the next due date based on interval:
 *
 * - **days**: current_date + interval_value days
 * - **weeks**: current_date + (interval_value × 7) days
 * - **months**: current_date + interval_value months
 * - **hours/kilometers**: current_date + 30 days (time-based approximation)
 *
 * ## Completion Workflow
 *
 * When marking a schedule as complete (`complete` method):
 * 1. Set `last_completed_date` to current date
 * 2. Set `last_completed_hours` to equipment hours at completion
 * 3. Calculate new `next_due_date` based on interval
 * 4. Calculate new `next_due_hours` = completion_hours + interval_value
 * 5. Schedule continues to recur automatically
 *
 * ## Business Rules
 *
 * 1. **Equipment Required**: Every schedule must be associated with equipment
 * 2. **Project Optional**: Schedule can be assigned to a specific project
 * 3. **Interval Required**: Must specify both interval type and value
 * 4. **Interval Minimum**: interval_value must be >= 1
 * 5. **Soft Delete**: Deleted schedules are marked `status = 'inactive'`
 * 6. **Active Filter**: By default, only `active` schedules are shown
 * 7. **Due Soon**: Can query schedules due within N days ahead
 *
 * ## Related Services
 *
 * - `MaintenanceService`: Handles one-time maintenance work orders
 * - `EquipmentService`: Manages equipment data
 * - `ProjectService`: Manages project data
 *
 * @example
 * ```typescript
 * // Create recurring schedule: change oil every 250 hours
 * const schedule = await service.create({
 *   equipment_id: 123,
 *   maintenance_type: 'preventive',
 *   interval_type: 'hours',
 *   interval_value: 250,
 *   description: 'Cambio de aceite',
 *   auto_generate_tasks: true
 * });
 *
 * // Find schedules due in next 30 days
 * const dueSoon = await service.findDueSoon(30);
 *
 * // Mark schedule as complete (auto-calculates next due)
 * const completed = await service.complete(schedule.id, 1250); // at 1250 hours
 * // Next due will be at 1500 hours (1250 + 250)
 * ```
 *
 * @see MaintenanceScheduleRecurringDto
 * @see MaintenanceScheduleRecurring
 * @see MaintenanceService
 */
export class MaintenanceScheduleRecurringService {
  private repository: Repository<MaintenanceScheduleRecurring>;

  constructor() {
    this.repository = AppDataSource.getRepository(MaintenanceScheduleRecurring);
  }

  /**
   * Calculate next due date based on interval type and value
   *
   * For time-based intervals (days, weeks, months), calculates the exact date.
   * For usage-based intervals (hours, kilometers), estimates 30 days ahead.
   *
   * @param intervalType - Type of interval (hours, days, weeks, months, kilometers)
   * @param intervalValue - Numeric value of interval
   * @returns Calculated next due date
   *
   * @private
   */
  private calculateNextDueDate(intervalType: string, intervalValue: number): Date {
    const now = new Date();

    switch (intervalType) {
      case 'days':
        now.setDate(now.getDate() + intervalValue);
        break;
      case 'weeks':
        now.setDate(now.getDate() + intervalValue * 7);
        break;
      case 'months':
        now.setMonth(now.getMonth() + intervalValue);
        break;
      case 'hours':
      case 'kilometers':
      default:
        // For usage-based schedules, estimate 30 days ahead
        // Actual due time depends on equipment usage tracking
        now.setDate(now.getDate() + 30);
        break;
    }

    return now;
  }

  /**
   * Get all recurring maintenance schedules with filtering, sorting, and pagination
   *
   * Retrieves schedules with support for:
   * - Equipment filtering
   * - Project filtering
   * - Status filtering
   * - Maintenance type filtering
   * - Pagination with configurable page size
   * - Sorting by multiple fields
   *
   * Includes related equipment and project data in results.
   *
   * @param filters - Optional filtering, pagination, and sorting options
   * @param filters.equipment_id - Filter by equipment ID
   * @param filters.project_id - Filter by project ID
   * @param filters.status - Filter by status (active, inactive, suspended, completed)
   * @param filters.maintenance_type - Filter by maintenance type
   * @param filters.page - Page number (1-indexed, default: 1)
   * @param filters.limit - Results per page (default: 20, max: 100)
   * @param filters.sort_by - Field to sort by (default: created_at)
   * @param filters.sort_order - Sort direction (ASC or DESC, default: DESC)
   *
   * @returns Object containing:
   *   - data: Array of MaintenanceScheduleRecurringDto objects with snake_case fields
   *   - total: Total number of matching records (for pagination)
   *
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * // Get all active schedules for equipment
   * const result = await service.findAll({
   *   equipment_id: 123,
   *   status: 'active',
   *   page: 1,
   *   limit: 20
   * });
   *
   * // Get all preventive maintenance schedules
   * const preventive = await service.findAll({
   *   maintenance_type: 'preventive'
   * });
   * ```
   */
  async findAll(
    tenantId: number,
    filters: MaintenanceScheduleRecurringFilterDto
  ): Promise<{ data: MaintenanceScheduleRecurringDto[]; total: number }> {
    try {
      // Map dual format to standard format
      const mappedFilters = mapMaintenanceScheduleRecurringFilterDto(filters);

      const page = mappedFilters.page || 1;
      const limit = mappedFilters.limit || 20;
      const skip = (page - 1) * limit;

      // Define sortable fields (snake_case API → camelCase DB)
      const sortableFields: Record<string, string> = {
        equipment_id: 'ms.equipmentId',
        project_id: 'ms.projectId',
        maintenance_type: 'ms.maintenanceType',
        interval_type: 'ms.intervalType',
        interval_value: 'ms.intervalValue',
        status: 'ms.status',
        next_due_date: 'ms.nextDueDate',
        last_completed_date: 'ms.lastCompletedDate',
        created_at: 'ms.createdAt',
        updated_at: 'ms.updatedAt',
      };

      const sortBy =
        mappedFilters.sort_by && sortableFields[mappedFilters.sort_by]
          ? sortableFields[mappedFilters.sort_by]
          : 'ms.createdAt';
      const sortOrder = mappedFilters.sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const queryBuilder = this.repository
        .createQueryBuilder('ms')
        .where('ms.tenantId = :tenantId', { tenantId })
        .leftJoinAndSelect('ms.equipment', 'e')
        .leftJoinAndSelect('ms.project', 'p');

      // Apply filters
      if (mappedFilters.equipment_id) {
        queryBuilder.andWhere('ms.equipmentId = :equipmentId', {
          equipmentId: mappedFilters.equipment_id,
        });
      }

      if (mappedFilters.project_id) {
        queryBuilder.andWhere('ms.projectId = :projectId', { projectId: mappedFilters.project_id });
      }

      if (mappedFilters.status) {
        queryBuilder.andWhere('ms.status = :status', { status: mappedFilters.status });
      }

      if (mappedFilters.maintenance_type) {
        queryBuilder.andWhere('ms.maintenanceType = :maintenanceType', {
          maintenanceType: mappedFilters.maintenance_type,
        });
      }

      // Apply sorting
      queryBuilder.orderBy(sortBy, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      queryBuilder.skip(skip).take(limit);

      // Get results
      const schedules = await queryBuilder.getMany();

      Logger.info('Recurring maintenance schedules retrieved successfully', {
        total,
        returned: schedules.length,
        page,
        limit,
        filters: {
          equipment_id: mappedFilters.equipment_id,
          project_id: mappedFilters.project_id,
          status: mappedFilters.status,
          maintenance_type: mappedFilters.maintenance_type,
        },
        context: 'MaintenanceScheduleRecurringService.findAll',
      });

      return {
        data: schedules.map((s) => toMaintenanceScheduleRecurringDto(s)),
        total,
      };
    } catch (error) {
      Logger.error('Failed to retrieve recurring maintenance schedules', {
        error: error instanceof Error ? error.message : String(error),
        filters,
        context: 'MaintenanceScheduleRecurringService.findAll',
      });

      throw new DatabaseError(
        'Failed to retrieve recurring maintenance schedules',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get recurring maintenance schedule by ID
   *
   * Retrieves a single schedule with its related equipment and project data.
   * Returns null if the schedule does not exist.
   *
   * @param id - Recurring maintenance schedule ID
   *
   * @returns MaintenanceScheduleRecurringDto with snake_case fields, or null if not found
   *
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const schedule = await service.findById(123);
   * if (schedule) {
   *   console.log(`Schedule ${schedule.id} for equipment ${schedule.equipment_id}`);
   * }
   * ```
   */
  async findById(tenantId: number, id: number): Promise<MaintenanceScheduleRecurringDto | null> {
    try {
      const schedule = await this.repository.findOne({
        where: { id, tenantId },
        relations: ['equipment', 'project'],
      });

      if (!schedule) {
        Logger.info('Recurring maintenance schedule not found', {
          id,
          context: 'MaintenanceScheduleRecurringService.findById',
        });
        return null;
      }

      Logger.info('Recurring maintenance schedule retrieved successfully', {
        id: schedule.id,
        equipment_id: schedule.equipmentId,
        maintenance_type: schedule.maintenanceType,
        interval_type: schedule.intervalType,
        interval_value: schedule.intervalValue,
        status: schedule.status,
        context: 'MaintenanceScheduleRecurringService.findById',
      });

      return toMaintenanceScheduleRecurringDto(schedule);
    } catch (error) {
      Logger.error('Failed to retrieve recurring maintenance schedule', {
        error: error instanceof Error ? error.message : String(error),
        id,
        context: 'MaintenanceScheduleRecurringService.findById',
      });

      throw new DatabaseError(
        'Failed to retrieve recurring maintenance schedule',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create new recurring maintenance schedule
   *
   * Creates a schedule with automatic next due date calculation.
   * Supports Spanish snake_case.
   *
   * The schedule is created with:
   * - Default status: 'active'
   * - Default maintenance_type: 'preventive' (if not provided)
   * - Default interval_type: 'hours' (if not provided)
   * - Default auto_generate_tasks: true (if not provided)
   * - Calculated next_due_date based on interval
   *
   * @param dto - Schedule data (supports dual format)
   * @param dto.equipment_id - Equipment ID (required)
   * @param dto.interval_value - Interval numeric value (required)
   * @param dto.maintenance_type - Type of maintenance (optional, default: 'preventive')
   * @param dto.interval_type - Type of interval (optional, default: 'hours')
   * @param dto.description - Description of maintenance (optional)
   * @param dto.notes - Additional notes (optional)
   * @param dto.auto_generate_tasks - Auto-generate tasks flag (optional, default: true)
   *
   * @returns Created MaintenanceScheduleRecurringDto with snake_case fields
   *
   * @throws {DatabaseError} If database operation fails
   * @throws {NotFoundError} If created record cannot be reloaded (should never happen)
   *
   * @example
   * ```typescript
   * // Spanish snake_case (preferred)
   * const schedule = await service.create({
   *   equipment_id: 123,
   *   maintenance_type: 'preventive',
   *   interval_type: 'hours',
   *   interval_value: 250,
   *   description: 'Cambio de aceite',
   *   auto_generate_tasks: true
   * });
   *
   * // English camelCase (backward compatibility)
   * const schedule = await service.create({
   *   equipmentId: 123,
   *   maintenanceType: 'calibration',
   *   intervalType: 'months',
   *   intervalValue: 6,
   *   description: 'Equipment calibration'
   * });
   * ```
   */
  async create(
    tenantId: number,
    dto: CreateMaintenanceScheduleRecurringDto
  ): Promise<MaintenanceScheduleRecurringDto> {
    try {
      // Map dual input format to DTO
      const dtoData = mapCreateMaintenanceScheduleRecurringDto(dto);

      // Set defaults
      const maintenance_type = dtoData.maintenance_type || 'preventive';
      const interval_type = dtoData.interval_type || 'hours';
      const auto_generate_tasks = dtoData.auto_generate_tasks !== false;

      // Calculate next due date
      const nextDueDate = this.calculateNextDueDate(interval_type, dtoData.interval_value || 0);

      // Create entity
      const entityData: Partial<MaintenanceScheduleRecurringDto> = {
        ...dtoData,
        maintenance_type,
        interval_type,
        auto_generate_tasks,
        next_due_date: nextDueDate.toISOString().split('T')[0],
        status: 'active',
      };

      const schedule = this.repository.create({
        ...fromMaintenanceScheduleRecurringDto(entityData),
        tenantId,
      });
      const saved = await this.repository.save(schedule);

      // Reload with relations
      const reloaded = await this.repository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['equipment', 'project'],
      });

      if (!reloaded) {
        throw new NotFoundError('MaintenanceScheduleRecurring', saved.id);
      }

      Logger.info('Recurring maintenance schedule created successfully', {
        id: reloaded.id,
        equipment_id: reloaded.equipmentId,
        maintenance_type: reloaded.maintenanceType,
        interval_type: reloaded.intervalType,
        interval_value: reloaded.intervalValue,
        next_due_date: reloaded.nextDueDate?.toISOString().split('T')[0],
        auto_generate_tasks: reloaded.autoGenerateTasks,
        status: reloaded.status,
        context: 'MaintenanceScheduleRecurringService.create',
      });

      return toMaintenanceScheduleRecurringDto(reloaded);
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Failed to create recurring maintenance schedule', {
        error: error instanceof Error ? error.message : String(error),
        dto,
        context: 'MaintenanceScheduleRecurringService.create',
      });

      throw new DatabaseError(
        'Failed to create recurring maintenance schedule',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Update recurring maintenance schedule
   *
   * Updates an existing schedule. Supports partial updates (only provided fields).
   * Supports Spanish snake_case.
   *
   * Common update scenarios:
   * - Change interval: Update interval_type or interval_value
   * - Suspend schedule: Set status to 'suspended'
   * - Reactivate schedule: Set status to 'active'
   * - Complete schedule: Set status to 'completed'
   * - Adjust next due: Update next_due_date or next_due_hours
   *
   * @param id - Recurring maintenance schedule ID
   * @param dto - Partial schedule data (supports dual format)
   *
   * @returns Updated MaintenanceScheduleRecurringDto with snake_case fields
   *
   * @throws {NotFoundError} If schedule does not exist
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * // Suspend schedule
   * const updated = await service.update(123, {
   *   status: 'suspended'
   * });
   *
   * // Change interval
   * const updated = await service.update(123, {
   *   interval_value: 300,  // from 250 to 300 hours
   *   description: 'Updated interval'
   * });
   *
   * // Reactivate and update next due
   * const updated = await service.update(123, {
   *   status: 'active',
   *   next_due_date: '2026-03-01'
   * });
   * ```
   */
  async update(
    tenantId: number,
    id: number,
    dto: UpdateMaintenanceScheduleRecurringDto
  ): Promise<MaintenanceScheduleRecurringDto> {
    try {
      const schedule = await this.repository.findOne({ where: { id, tenantId } });

      if (!schedule) {
        throw new NotFoundError('MaintenanceScheduleRecurring', id);
      }

      // Store original values for logging
      const originalStatus = schedule.status;
      const originalIntervalValue = schedule.intervalValue;

      // Map dual input format to DTO
      const dtoData = mapUpdateMaintenanceScheduleRecurringDto(dto);

      // Apply updates
      Object.assign(schedule, fromMaintenanceScheduleRecurringDto(dtoData));

      const saved = await this.repository.save(schedule);

      // Reload with relations
      const reloaded = await this.repository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['equipment', 'project'],
      });

      if (!reloaded) {
        throw new NotFoundError('MaintenanceScheduleRecurring', saved.id);
      }

      Logger.info('Recurring maintenance schedule updated successfully', {
        id: reloaded.id,
        equipment_id: reloaded.equipmentId,
        maintenance_type: reloaded.maintenanceType,
        interval_type: reloaded.intervalType,
        interval_value: reloaded.intervalValue,
        interval_value_changed: originalIntervalValue !== reloaded.intervalValue,
        status: reloaded.status,
        status_changed: originalStatus !== reloaded.status,
        next_due_date: reloaded.nextDueDate?.toISOString().split('T')[0],
        context: 'MaintenanceScheduleRecurringService.update',
      });

      return toMaintenanceScheduleRecurringDto(reloaded);
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Failed to update recurring maintenance schedule', {
        error: error instanceof Error ? error.message : String(error),
        id,
        dto,
        context: 'MaintenanceScheduleRecurringService.update',
      });

      throw new DatabaseError(
        'Failed to update recurring maintenance schedule',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete recurring maintenance schedule (soft delete)
   *
   * Marks a schedule as deleted by setting status='inactive'.
   * This is a soft delete - the record remains in the database for audit purposes.
   *
   * Hard deletes are not allowed to maintain data integrity and audit trail.
   *
   * Note: Soft deleted schedules (status='inactive') are not shown in default queries.
   *
   * @param id - Recurring maintenance schedule ID
   *
   * @returns true if record was marked as inactive
   *
   * @throws {NotFoundError} If schedule does not exist
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * const deleted = await service.delete(123);
   * // Schedule is now status='inactive' and hidden from normal queries
   * ```
   */
  async delete(tenantId: number, id: number): Promise<boolean> {
    try {
      const schedule = await this.repository.findOne({
        where: { id, tenantId },
      });

      if (!schedule) {
        throw new NotFoundError('MaintenanceScheduleRecurring', id);
      }

      // Soft delete: mark as inactive
      schedule.status = 'inactive';
      await this.repository.save(schedule);

      Logger.info('Recurring maintenance schedule deleted (soft delete)', {
        id: schedule.id,
        equipment_id: schedule.equipmentId,
        maintenance_type: schedule.maintenanceType,
        interval_type: schedule.intervalType,
        interval_value: schedule.intervalValue,
        context: 'MaintenanceScheduleRecurringService.delete',
      });

      return true;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Failed to delete recurring maintenance schedule', {
        error: error instanceof Error ? error.message : String(error),
        id,
        context: 'MaintenanceScheduleRecurringService.delete',
      });

      throw new DatabaseError(
        'Failed to delete recurring maintenance schedule',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Find schedules that are due soon
   *
   * Retrieves active schedules with auto_generate_tasks enabled that are due
   * within the specified number of days. Useful for:
   * - Generating upcoming maintenance tasks
   * - Sending maintenance reminders
   * - Dashboard "due soon" widgets
   *
   * Only returns schedules with:
   * - status = 'active'
   * - auto_generate_tasks = true
   * - next_due_date <= (current_date + daysAhead)
   *
   * Results are sorted by next_due_date ascending (most urgent first).
   *
   * @param daysAhead - Number of days to look ahead (default: 30)
   *
   * @returns Array of MaintenanceScheduleRecurringDto objects due soon
   *
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * // Get schedules due in next 30 days
   * const dueSoon = await service.findDueSoon(30);
   *
   * // Get schedules due in next 7 days
   * const urgent = await service.findDueSoon(7);
   *
   * dueSoon.forEach(schedule => {
   *   console.log(`${schedule.equipment_code} - ${schedule.description}`);
   *   console.log(`Due: ${schedule.next_due_date}`);
   * });
   * ```
   */
  async findDueSoon(
    tenantId: number,
    daysAhead: number = 30
  ): Promise<MaintenanceScheduleRecurringDto[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const schedules = await this.repository
        .createQueryBuilder('ms')
        .leftJoinAndSelect('ms.equipment', 'e')
        .leftJoinAndSelect('ms.project', 'p')
        .where('ms.tenantId = :tenantId', { tenantId })
        .andWhere('ms.status = :status', { status: 'active' })
        .andWhere('ms.autoGenerateTasks = :autoGenerate', { autoGenerate: true })
        .andWhere('ms.nextDueDate <= :futureDate', { futureDate })
        .orderBy('ms.nextDueDate', 'ASC')
        .getMany();

      Logger.info('Recurring maintenance schedules due soon retrieved successfully', {
        total: schedules.length,
        days_ahead: daysAhead,
        future_date: futureDate.toISOString().split('T')[0],
        context: 'MaintenanceScheduleRecurringService.findDueSoon',
      });

      return schedules.map((s) => toMaintenanceScheduleRecurringDto(s));
    } catch (error) {
      Logger.error('Failed to retrieve recurring maintenance schedules due soon', {
        error: error instanceof Error ? error.message : String(error),
        days_ahead: daysAhead,
        context: 'MaintenanceScheduleRecurringService.findDueSoon',
      });

      throw new DatabaseError(
        'Failed to retrieve recurring maintenance schedules due soon',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Complete a maintenance schedule (mark as done and recalculate next due)
   *
   * Marks a schedule as completed for the current cycle and automatically
   * calculates the next due date/hours based on the schedule's interval.
   *
   * This method:
   * 1. Sets last_completed_date to current date
   * 2. Sets last_completed_hours to provided equipment hours
   * 3. Calculates next_due_date by adding interval to current date
   * 4. Calculates next_due_hours = completion_hours + interval_value (for hour-based schedules)
   * 5. Schedule continues to recur automatically
   *
   * **Important**: This does NOT change the schedule status. The schedule remains
   * active and will trigger again at the next due date.
   *
   * @param id - Recurring maintenance schedule ID
   * @param completionHours - Equipment hours at completion (optional, for hour-based schedules)
   *
   * @returns Updated MaintenanceScheduleRecurringDto with recalculated next due
   *
   * @throws {NotFoundError} If schedule does not exist
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * // Complete hour-based schedule
   * const schedule = await service.complete(123, 1250);
   * // If interval is 250 hours, next_due_hours will be 1500
   *
   * // Complete calendar-based schedule
   * const schedule = await service.complete(456);
   * // next_due_date will be current_date + interval
   *
   * console.log(`Last completed: ${schedule.last_completed_date}`);
   * console.log(`Next due: ${schedule.next_due_date}`);
   * ```
   */
  async complete(
    tenantId: number,
    id: number,
    completionHours?: number
  ): Promise<MaintenanceScheduleRecurringDto> {
    try {
      const schedule = await this.repository.findOne({ where: { id, tenantId } });

      if (!schedule) {
        throw new NotFoundError('MaintenanceScheduleRecurring', id);
      }

      // Calculate next due date based on interval
      const nextDueDate = this.calculateNextDueDate(schedule.intervalType, schedule.intervalValue);
      const nextDueHours = completionHours ? completionHours + schedule.intervalValue : undefined;

      // Update completion data
      schedule.lastCompletedDate = new Date();
      schedule.lastCompletedHours = completionHours;
      schedule.nextDueDate = nextDueDate;
      schedule.nextDueHours = nextDueHours;

      const saved = await this.repository.save(schedule);

      // Reload with relations
      const reloaded = await this.repository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['equipment', 'project'],
      });

      if (!reloaded) {
        throw new NotFoundError('MaintenanceScheduleRecurring', saved.id);
      }

      Logger.info('Recurring maintenance schedule completed successfully', {
        id: reloaded.id,
        equipment_id: reloaded.equipmentId,
        maintenance_type: reloaded.maintenanceType,
        interval_type: reloaded.intervalType,
        interval_value: reloaded.intervalValue,
        last_completed_date: reloaded.lastCompletedDate?.toISOString().split('T')[0],
        last_completed_hours: reloaded.lastCompletedHours,
        next_due_date: reloaded.nextDueDate?.toISOString().split('T')[0],
        next_due_hours: reloaded.nextDueHours,
        completion_hours: completionHours,
        context: 'MaintenanceScheduleRecurringService.complete',
      });

      return toMaintenanceScheduleRecurringDto(reloaded);
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Failed to complete recurring maintenance schedule', {
        error: error instanceof Error ? error.message : String(error),
        id,
        completion_hours: completionHours,
        context: 'MaintenanceScheduleRecurringService.complete',
      });

      throw new DatabaseError(
        'Failed to complete recurring maintenance schedule',
        DatabaseErrorType.QUERY,
        error instanceof Error ? error : undefined
      );
    }
  }
}
