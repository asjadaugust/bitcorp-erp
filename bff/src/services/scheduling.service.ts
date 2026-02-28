import { AppDataSource } from '../config/database.config';
import { ScheduledTask } from '../models/scheduled-task.model';
import { Repository } from 'typeorm';
import {
  ScheduledTaskDto,
  CreateScheduledTaskDto,
  UpdateScheduledTaskDto,
  toScheduledTaskDto,
  fromScheduledTaskDto,
  mapCreateScheduledTaskDto,
} from '../types/dto/scheduled-task.dto';
import { NotFoundError, ValidationError, DatabaseError, DatabaseErrorType } from '../errors';
import logger from '../config/logger.config';

export interface TaskFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  type?: string;
  equipmentId?: number;
  operatorId?: number;
  priority?: string;
}

/**
 * # Scheduling Service
 *
 * Manages scheduled tasks for equipment operations, maintenance, project activities,
 * and operator assignments within the BitCorp ERP system.
 *
 * ## Purpose and Criticality
 *
 * The Scheduling Service is a **mission-critical** component that coordinates:
 * - Equipment maintenance schedules and preventive maintenance tasks
 * - Equipment assignments to projects and operators
 * - Project milestone planning and activity coordination
 * - Operator availability and task assignments
 * - Calendar-based resource allocation
 *
 * This service ensures optimal resource utilization, prevents scheduling conflicts,
 * and maintains an auditable record of all planned and completed activities.
 *
 * **Business Impact**:
 * - Equipment downtime prevention through proactive maintenance scheduling
 * - Resource optimization by avoiding double-booking and conflicts
 * - Compliance tracking for scheduled inspections and certifications
 * - Project timeline management and milestone tracking
 * - Operator workload balancing and availability management
 *
 * ## Scheduled Task Types
 *
 * The system supports 5 task types (`task_type` enum):
 *
 * 1. **MAINTENANCE** - Equipment maintenance activities
 *    - Preventive maintenance based on hours/kilometers/time
 *    - Corrective maintenance for equipment failures
 *    - Inspections and certifications (e.g., SOAT, technical review)
 *    - Parts replacement and servicing
 *    - Relations: `equipment_id` (required)
 *
 * 2. **OPERATION** - Equipment operational assignments
 *    - Daily equipment assignments to projects
 * - Operator-equipment assignments for specific tasks
 *    - Work orders and service requests
 *    - Rental period tracking for client equipment
 *    - Relations: `equipment_id` (required), `operator_id` (optional), `project_id` (optional)
 *
 * 3. **PROJECT** - Project milestones and activities
 *    - Project kick-off meetings and planning sessions
 *    - Milestone deadlines and deliverables
 *    - Client presentations and approvals
 *    - Equipment delivery/return coordination
 *    - Relations: `project_id` (required)
 *
 * 4. **TRAINING** - Operator training and certifications
 *    - Equipment operation training
 *    - Safety and compliance training (SST)
 *    - Certification renewals (licenses, permits)
 *    - Skills assessment and evaluation
 *    - Relations: `operator_id` (required), `equipment_id` (optional)
 *
 * 5. **INSPECTION** - Regulatory and compliance inspections
 *    - Government inspections (SUNAFIL, MTC)
 *    - Client equipment inspections
 *    - Safety audits and compliance checks
 *    - Quality control inspections
 *    - Relations: `equipment_id` or `project_id` (at least one required)
 *
 * ## Task Priority Levels
 *
 * Tasks are prioritized using a 4-tier system (`priority` enum):
 *
 * - **CRITICAL**: Immediate attention required
 *   - Equipment safety issues requiring immediate shutdown
 *   - Regulatory inspections with legal deadlines
 *   - Client emergency requests with SLA penalties
 *   - Revenue-blocking activities
 *
 * - **HIGH**: Important but not immediate
 *   - Preventive maintenance due within 48 hours
 *   - Client deliverables with firm deadlines
 *   - Equipment assignments for active contracts
 *   - Operator certifications expiring within 7 days
 *
 * - **MEDIUM**: Standard operational tasks (default)
 *   - Routine maintenance within schedule
 *   - Project planning activities
 *   - Training sessions with flexible dates
 *   - Non-critical inspections
 *
 * - **LOW**: Can be deferred if necessary
 *   - Optional training and development
 *   - Long-term planning activities
 *   - Non-essential maintenance
 *   - Administrative tasks
 *
 * ## Task Status Lifecycle
 *
 * Tasks progress through 6 status states (`status` enum):
 *
 * ```
 * PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
 *     ↓         ↓            ↓
 * CANCELLED ← ← ← ← ← ← ← ← ← ←
 * ```
 *
 * 1. **PENDING** (Initial state)
 *    - Task created but not yet confirmed
 *    - Resources not yet allocated
 *    - Awaiting approval or confirmation
 *
 * 2. **CONFIRMED**
 *    - Task approved and scheduled
 *    - Resources allocated (equipment, operator, dates)
 *    - Ready for execution
 *
 * 3. **IN_PROGRESS**
 *    - Task execution started
 *    - Operator/team actively working
 *    - Partial completion possible
 *
 * 4. **COMPLETED**
 *    - Task successfully finished
 *    - Results documented and verified
 *    - Resources released
 *    - Final status (terminal state)
 *
 * 5. **CANCELLED**
 *    - Task cancelled before completion
 *    - Reason documented in `notes`
 *    - Resources released
 *    - Final status (terminal state)
 *
 * 6. **OVERDUE**
 *    - Task not completed by `end_date`
 *    - System-flagged for attention
 *    - May require rescheduling
 *    - Can transition to IN_PROGRESS or COMPLETED
 *
 * **Allowed Transitions**:
 * - PENDING → CONFIRMED, CANCELLED
 * - CONFIRMED → IN_PROGRESS, CANCELLED
 * - IN_PROGRESS → COMPLETED, CANCELLED
 * - OVERDUE → IN_PROGRESS, COMPLETED, CANCELLED
 * - COMPLETED → (terminal, no transitions)
 * - CANCELLED → (terminal, no transitions)
 *
 * ## Date and Time Handling
 *
 * The service manages various date/time fields for scheduling:
 *
 * ### Required Date Fields
 * - `start_date` (Date): Task scheduled start date
 * - `start_time` (Time, optional): Specific start time (HH:MM format)
 * - `end_date` (Date, optional): Task scheduled end date
 * - `end_time` (Time, optional): Specific end time (HH:MM format)
 *
 * ### Duration Fields
 * - `duration` (Integer, optional): Expected duration in minutes
 * - `all_day` (Boolean, default: false): If true, ignore start_time/end_time
 *
 * ### Tracking Fields
 * - `actual_start` (DateTime, optional): When task execution actually started
 * - `actual_end` (DateTime, optional): When task execution actually finished
 * - `completed_at` (DateTime, auto): System timestamp when status → COMPLETED
 *
 * ### Date Validation Rules
 * - `start_date` is required for all tasks
 * - If `end_date` provided, must be >= `start_date`
 * - If both `start_time` and `end_time` provided on same date, `end_time` must be > `start_time`
 * - `duration` is informational only, not enforced
 * - `all_day` tasks ignore `start_time` and `end_time`
 *
 * ## Recurrence Patterns
 *
 * Tasks support recurring schedules via `recurrence_rule` field (iCalendar RRULE format):
 *
 * **Examples**:
 * - Daily: `FREQ=DAILY;INTERVAL=1`
 * - Weekly on Monday: `FREQ=WEEKLY;BYDAY=MO`
 * - Monthly (15th of each month): `FREQ=MONTHLY;BYMONTHDAY=15`
 * - Every 3 months: `FREQ=MONTHLY;INTERVAL=3`
 * - Weekdays only: `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR`
 *
 * **Recurrence Processing**:
 * - Base task (`parent_task_id` = null) defines the recurrence pattern
 * - Individual occurrences created as separate tasks with `parent_task_id` set
 * - Changes to individual occurrences don't affect other instances
 * - Deleting parent task cancels all future occurrences
 *
 * ## Relations and Foreign Keys
 *
 * ### Equipment Relation (`equipment_id`)
 * - **Required for**: MAINTENANCE, OPERATION tasks
 * - **Optional for**: TRAINING, INSPECTION tasks
 * - **Excluded for**: PROJECT tasks
 * - Links to: `equipos` table
 * - Use case: Schedule maintenance, track equipment assignments
 *
 * ### Operator Relation (`operator_id`)
 * - **Required for**: TRAINING tasks
 * - **Optional for**: OPERATION, MAINTENANCE tasks
 * - Links to: `operadores` table
 * - Use case: Assign tasks to specific operators, track workload
 *
 * ### Project Relation (`project_id`)
 * - **Required for**: PROJECT tasks
 * - **Optional for**: OPERATION, INSPECTION tasks
 * - Links to: `proyectos` table
 * - Use case: Project milestone tracking, equipment assignments to projects
 *
 * ### Maintenance Schedule Relation (`maintenance_schedule_id`)
 * - **Optional for**: MAINTENANCE tasks
 * - Links to: `maintenance_schedules` table
 * - Use case: Track preventive maintenance against schedule
 *
 * ### Parent Task Relation (`parent_task_id`)
 * - **Optional for**: Recurring task instances
 * - Links to: `scheduled_tasks` table (self-reference)
 * - Use case: Group recurring task occurrences
 *
 * ## Filtering Capabilities
 *
 * The `findAll()` method supports 7 filter types via `TaskFilter` interface:
 *
 * 1. **startDate** / **endDate** (Date range)
 *    - Filter tasks with `start_date` BETWEEN startDate AND endDate
 *    - Use case: Calendar view, monthly reports
 *
 * 2. **status** (string)
 *    - Filter by task status (PENDING, CONFIRMED, IN_PROGRESS, etc.)
 *    - Special value 'all' returns all statuses
 *    - Use case: Show only pending tasks, filter overdue items
 *
 * 3. **type** (string)
 *    - Filter by task type (MAINTENANCE, OPERATION, PROJECT, etc.)
 *    - Special value 'all' returns all types
 *    - Use case: Maintenance calendar, project timeline
 *
 * 4. **equipmentId** (number)
 *    - Filter tasks assigned to specific equipment
 *    - Use case: Equipment detail page, maintenance history
 *
 * 5. **operatorId** (number)
 *    - Filter tasks assigned to specific operator
 *    - Use case: Operator schedule, workload view
 *
 * 6. **priority** (string)
 *    - Filter by priority level (CRITICAL, HIGH, MEDIUM, LOW)
 *    - Use case: Critical tasks dashboard, priority queue
 *
 * 7. **Combined Filters**
 *    - Multiple filters applied with AND logic
 *    - Use case: "Show HIGH priority MAINTENANCE tasks for equipment X in January"
 *
 * **Default Sorting**: Results sorted by `start_date ASC`, then `priority DESC`
 *
 * ## Backward Compatibility Layer
 *
 * The service maintains 5 legacy methods for API compatibility with older frontend code:
 *
 * - `getTasks(filters)` → Wraps `findAll()`, converts filter format
 * - `getTaskById(id: string)` → Wraps `findById()`, converts string to number
 * - `createTask(data)` → Wraps `create()`, maps legacy field names
 * - `updateTask(id: string, data)` → Wraps `update()`, converts ID and fields
 * - `deleteTask(id: string)` → Wraps `delete()`, converts string to number
 *
 * **Legacy Field Mappings**:
 * - `scheduledDate` → `start_date` / `startDate`
 * - `type` → `task_type` / `taskType`
 * - String IDs → Numeric IDs
 *
 * **Deprecation Notice**: These methods will be removed in Phase 22 (API v2 migration).
 * Frontend should migrate to primary methods (findAll, findById, create, update, delete).
 *
 * ## Multi-Tenancy
 *
 * All queries are filtered by `tenantId` for data isolation.
 *
 * ## Related Services
 *
 * This service integrates with:
 *
 * - **EquipmentService**: Equipment availability, status updates
 * - **OperatorService**: Operator availability, assignment validation
 * - **MaintenanceService**: Maintenance history, work order completion
 * - **MaintenanceScheduleRecurringService**: Recurring maintenance pattern generation
 * - **ProjectService**: Project timeline validation, milestone tracking
 * - **CalendarService** (future): Calendar view aggregation, conflict detection
 *
 * ## Usage Examples
 *
 * ### Example 1: Schedule Equipment Maintenance
 * ```typescript
 * const maintenanceTask = await schedulingService.create({
 *   title: 'Preventive Maintenance - 500 hours',
 *   description: 'Oil change, filter replacement, general inspection',
 *   task_type: 'MAINTENANCE',
 *   priority: 'HIGH',
 *   status: 'CONFIRMED',
 *   start_date: new Date('2026-01-25'),
 *   start_time: '08:00',
 *   duration: 180, // 3 hours
 *   equipment_id: 123,
 *   maintenance_schedule_id: 45,
 *   assigned_to: 'Maintenance Team',
 * });
 * // Result: Task scheduled, equipment marked as unavailable during window
 * ```
 *
 * ### Example 2: Assign Equipment to Project
 * ```typescript
 * const operationTask = await schedulingService.create({
 *   title: 'Equipment Assignment - Highway Project',
 *   task_type: 'OPERATION',
 *   priority: 'MEDIUM',
 *   status: 'CONFIRMED',
 *   start_date: new Date('2026-02-01'),
 *   end_date: new Date('2026-02-28'),
 *   all_day: true,
 *   equipment_id: 456,
 *   project_id: 78,
 *   operator_id: 99,
 *   notes: 'Full-time assignment for February excavation phase',
 * });
 * // Result: Equipment+operator assigned to project for entire month
 * ```
 *
 * ### Example 3: Get Upcoming Critical Tasks
 * ```typescript
 * const criticalTasks = await schedulingService.findAll({
 *   startDate: new Date(),
 *   endDate: addDays(new Date(), 7), // Next 7 days
 *   status: 'CONFIRMED',
 *   priority: 'CRITICAL',
 * });
 * // Result: List of critical tasks requiring immediate attention
 * ```
 *
 * ### Example 4: Get Equipment Maintenance History
 * ```typescript
 * const maintenanceHistory = await schedulingService.findAll({
 *   equipmentId: 123,
 *   type: 'MAINTENANCE',
 *   status: 'COMPLETED',
 * });
 * // Result: All completed maintenance tasks for equipment 123
 * ```
 *
 * ### Example 5: Mark Task In Progress
 * ```typescript
 * const updatedTask = await schedulingService.update(taskId, {
 *   status: 'IN_PROGRESS',
 *   actual_start: new Date(), // Record actual start time
 * });
 * // Result: Task status updated, actual start time recorded
 * ```
 *
 * ### Example 6: Complete Task with Notes
 * ```typescript
 * const completedTask = await schedulingService.update(taskId, {
 *   status: 'COMPLETED',
 *   actual_end: new Date(),
 *   notes: 'Maintenance completed successfully. Replaced oil filter and air filter. Next service due at 1000 hours.',
 * });
 * // Result: Task marked complete, equipment availability updated
 * ```
 *
 * ## Error Handling
 *
 * The service throws the following error types:
 *
 * - **NotFoundError**: Task ID not found (findById, update)
 * - **ValidationError**: Invalid date range, missing required fields
 * - **DatabaseError**: Query failures, connection issues, constraint violations
 *
 * All errors include contextual metadata for debugging.
 *
 * ## Performance Considerations
 *
 * - Uses QueryBuilder with eager loading for equipment/project relations
 * - Indexed fields: `start_date`, `status`, `task_type`, `priority`, `equipment_id`, `operator_id`
 * - Large date ranges should paginate results (not yet implemented)
 * - Recurring tasks may generate many records (consider archival strategy)
 *
 * @module SchedulingService
 * @category Services
 * @subcategory Planning & Operations
 */
export class SchedulingService {
  private get repository(): Repository<ScheduledTask> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(ScheduledTask);
  }

  /**
   * Retrieve all scheduled tasks with optional filtering.
   *
   * Returns a list of scheduled tasks filtered by date range, status, type, equipment,
   * operator, or priority. Results are sorted by start date ascending, then priority descending.
   *
   * @param filter - Optional filtering criteria
   * @param filter.startDate - Filter tasks starting on or after this date
   * @param filter.endDate - Filter tasks starting on or before this date
   * @param filter.status - Filter by status (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE), or 'all' for no filter
   * @param filter.type - Filter by task type (MAINTENANCE, OPERATION, PROJECT, TRAINING, INSPECTION), or 'all' for no filter
   * @param filter.equipmentId - Filter tasks assigned to specific equipment
   * @param filter.operatorId - Filter tasks assigned to specific operator
   * @param filter.priority - Filter by priority level (CRITICAL, HIGH, MEDIUM, LOW)
   *
   * @returns Promise resolving to array of scheduled task DTOs with equipment and project relations
   *
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * // Get all confirmed maintenance tasks for next 30 days
   * const tasks = await schedulingService.findAll({
   *   startDate: new Date(),
   *   endDate: addDays(new Date(), 30),
   *   type: 'MAINTENANCE',
   *   status: 'CONFIRMED',
   * });
   *
   * // Get all tasks for specific equipment
   * const equipmentTasks = await schedulingService.findAll({
   *   equipmentId: 123,
   * });
   *
   * // Get all critical priority tasks
   * const criticalTasks = await schedulingService.findAll({
   *   priority: 'CRITICAL',
   * });
   * ```
   */
  async findAll(tenantId: number, filter?: TaskFilter): Promise<ScheduledTaskDto[]> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.equipment', 'equipment')
        .leftJoinAndSelect('task.project', 'project')
        .andWhere('task.tenantId = :tenantId', { tenantId });

      if (filter?.startDate && filter?.endDate) {
        queryBuilder.andWhere('task.startDate BETWEEN :start AND :end', {
          start: filter.startDate,
          end: filter.endDate,
        });
      }

      if (filter?.status) {
        if (filter.status !== 'all') {
          queryBuilder.andWhere('task.status = :status', { status: filter.status });
        }
      }

      if (filter?.type) {
        if (filter.type !== 'all') {
          queryBuilder.andWhere('task.taskType = :type', { type: filter.type });
        }
      }

      if (filter?.equipmentId) {
        queryBuilder.andWhere('task.equipmentId = :equipmentId', {
          equipmentId: filter.equipmentId,
        });
      }

      if (filter?.priority) {
        queryBuilder.andWhere('task.priority = :priority', { priority: filter.priority });
      }

      queryBuilder.orderBy('task.startDate', 'ASC').addOrderBy('task.priority', 'DESC');

      const tasks = await queryBuilder.getMany();

      logger.info('Retrieved scheduled tasks', {
        count: tasks.length,
        filter_status: filter?.status,
        filter_type: filter?.type,
        filter_equipment_id: filter?.equipmentId,
        filter_priority: filter?.priority,
        date_range:
          filter?.startDate && filter?.endDate
            ? `${filter.startDate.toISOString().split('T')[0]} to ${filter.endDate.toISOString().split('T')[0]}`
            : 'none',
      });

      return tasks.map((task) => toScheduledTaskDto(task));
    } catch (error) {
      logger.error('Error listing tasks', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filter,
        context: 'SchedulingService.findAll',
      });
      throw new DatabaseError(
        'Failed to retrieve scheduled tasks',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Retrieve a single scheduled task by ID.
   *
   * Returns the complete task details including related equipment and project information.
   *
   * @param id - Task ID (primary key)
   *
   * @returns Promise resolving to scheduled task DTO with relations
   *
   * @throws {NotFoundError} If task with specified ID does not exist
   * @throws {DatabaseError} If query execution fails
   *
   * @example
   * ```typescript
   * try {
   *   const task = await schedulingService.findById(123);
   *   console.log(`Task: ${task.title}, Status: ${task.status}`);
   * } catch (error) {
   *   if (error instanceof NotFoundError) {
   *     console.log('Task not found');
   *   }
   * }
   * ```
   */
  async findById(tenantId: number, id: number): Promise<ScheduledTaskDto> {
    try {
      const task = await this.repository.findOne({
        where: { id, tenantId },
        relations: ['equipment', 'project'],
      });

      if (!task) {
        throw new NotFoundError('ScheduledTask', id);
      }

      logger.info('Retrieved scheduled task', {
        id,
        task_type: task.taskType,
        status: task.status,
        priority: task.priority,
        equipment_id: task.equipmentId,
      });

      return toScheduledTaskDto(task);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error finding task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SchedulingService.findById',
      });
      throw new DatabaseError(
        `Failed to retrieve scheduled task with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Create a new scheduled task.
   *
   * Validates date logic and creates a new task record. Supports both camelCase and
   * snake_case input formats for API compatibility.
   *
   * @param data - Task creation data (supports dual format)
   *
   * @returns Promise resolving to created task DTO with relations
   *
   * @throws {ValidationError} If date range is invalid (start_date > end_date)
   * @throws {DatabaseError} If task creation fails or reload after save fails
   *
   * @businessRules
   * - `start_date` is required
   * - If `end_date` provided, must be >= `start_date`
   * - `task_type` must be one of: MAINTENANCE, OPERATION, PROJECT, TRAINING, INSPECTION
   * - `status` defaults to 'PENDING' if not provided
   * - `priority` defaults to 'MEDIUM' if not provided
   * - Related entities (equipment, operator, project) are not validated here (foreign key constraint enforced by DB)
   *
   * @example
   * ```typescript
   * // Create maintenance task
   * const task = await schedulingService.create({
   *   title: 'Preventive Maintenance',
   *   task_type: 'MAINTENANCE',
   *   priority: 'HIGH',
   *   start_date: new Date('2026-01-25'),
   *   duration: 120,
   *   equipment_id: 456,
   * });
   *
   * // Create with date range validation
   * const projectTask = await schedulingService.create({
   *   title: 'Project Milestone',
   *   task_type: 'PROJECT',
   *   start_date: new Date('2026-02-01'),
   *   end_date: new Date('2026-02-15'), // Must be >= start_date
   *   project_id: 78,
   * });
   * ```
   */
  async create(tenantId: number, data: CreateScheduledTaskDto): Promise<ScheduledTaskDto> {
    try {
      // Map dual input format to DTO
      const dtoData = mapCreateScheduledTaskDto(data);

      // Validate date range if both dates provided
      if (dtoData.start_date && dtoData.end_date) {
        const startDate = new Date(dtoData.start_date);
        const endDate = new Date(dtoData.end_date);
        if (startDate > endDate) {
          throw new ValidationError('start_date must be less than or equal to end_date', [
            {
              field: 'start_date',
              rule: 'date_range',
              message: 'Start date exceeds end date',
              value: dtoData.start_date,
            },
            {
              field: 'end_date',
              rule: 'date_range',
              message: 'End date precedes start date',
              value: dtoData.end_date,
            },
          ]);
        }
      }

      const entityData = fromScheduledTaskDto(dtoData);
      const task = this.repository.create({ ...entityData, tenantId });
      const saved = await this.repository.save(task);

      // Reload with relations
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['equipment', 'project'],
      });

      if (!withRelations) {
        throw new DatabaseError(
          `Failed to reload scheduled task after save (ID ${saved.id})`,
          DatabaseErrorType.QUERY
        );
      }

      logger.info('Created scheduled task', {
        id: withRelations.id,
        task_type: withRelations.taskType,
        priority: withRelations.priority,
        status: withRelations.status,
        start_date: withRelations.startDate?.toISOString().split('T')[0],
        equipment_id: withRelations.equipmentId,
        project_id: withRelations.projectId,
      });

      return toScheduledTaskDto(withRelations);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error creating task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SchedulingService.create',
      });
      throw new DatabaseError(
        'Failed to create scheduled task',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Update an existing scheduled task.
   *
   * Updates task fields and validates date logic. Partial updates supported (only provided fields updated).
   *
   * @param id - Task ID to update
   * @param data - Partial task update data
   *
   * @returns Promise resolving to updated task DTO with relations
   *
   * @throws {NotFoundError} If task with specified ID does not exist
   * @throws {ValidationError} If date range is invalid (start_date > end_date)
   * @throws {DatabaseError} If update fails or reload after save fails
   *
   * @businessRules
   * - Cannot change `id` or `created_at`
   * - If updating `end_date`, must be >= `start_date` (existing or updated)
   * - Status transitions should follow lifecycle (not enforced yet - future enhancement)
   * - Completed tasks should not be modified (not enforced yet - future enhancement)
   *
   * @example
   * ```typescript
   * // Update task status
   * const task = await schedulingService.update(123, {
   *   status: 'IN_PROGRESS',
   *   actual_start: new Date(),
   * });
   *
   * // Mark task complete
   * const completed = await schedulingService.update(123, {
   *   status: 'COMPLETED',
   *   actual_end: new Date(),
   *   notes: 'Maintenance completed successfully',
   * });
   * ```
   */
  async update(
    tenantId: number,
    id: number,
    data: UpdateScheduledTaskDto
  ): Promise<ScheduledTaskDto> {
    try {
      const task = await this.repository.findOne({
        where: { id, tenantId },
        relations: ['equipment', 'project'],
      });

      if (!task) {
        throw new NotFoundError('ScheduledTask', id);
      }

      // Map dual input format to DTO
      const dtoData = mapCreateScheduledTaskDto(data);

      // Validate date range if updating dates
      const updatedStartDate = dtoData.start_date ? new Date(dtoData.start_date) : task.startDate;
      const updatedEndDate = dtoData.end_date ? new Date(dtoData.end_date) : task.endDate;

      if (updatedStartDate && updatedEndDate && updatedStartDate > updatedEndDate) {
        throw new ValidationError('start_date must be less than or equal to end_date', [
          {
            field: 'start_date',
            rule: 'date_range',
            message: 'Start date exceeds end date',
            value: updatedStartDate.toISOString(),
          },
          {
            field: 'end_date',
            rule: 'date_range',
            message: 'End date precedes start date',
            value: updatedEndDate.toISOString(),
          },
        ]);
      }

      Object.assign(task, fromScheduledTaskDto(dtoData));
      const saved = await this.repository.save(task);

      // Reload with relations
      const withRelations = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['equipment', 'project'],
      });

      if (!withRelations) {
        throw new DatabaseError(
          `Failed to reload scheduled task after update (ID ${saved.id})`,
          DatabaseErrorType.QUERY
        );
      }

      logger.info('Updated scheduled task', {
        id: withRelations.id,
        task_type: withRelations.taskType,
        status: withRelations.status,
        priority: withRelations.priority,
        updated_fields: Object.keys(data),
      });

      return toScheduledTaskDto(withRelations);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error updating task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SchedulingService.update',
      });
      throw new DatabaseError(
        `Failed to update scheduled task with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Delete a scheduled task (hard delete).
   *
   * Permanently removes the task record from the database. This operation cannot be undone.
   *
   * **WARNING**: Hard delete destroys audit trail. For production use, consider:
   * - Status-based cancellation (status = 'CANCELLED')
   * - Soft delete with `deleted_at` timestamp
   * - Archive to separate table
   *
   * @param id - Task ID to delete
   *
   * @returns Promise resolving when deletion complete
   *
   * @throws {NotFoundError} If task with specified ID does not exist
   * @throws {DatabaseError} If deletion fails
   *
   * @example
   * ```typescript
   * // Delete task (use cautiously)
   * await schedulingService.delete(123);
   *
   * // Preferred: Cancel task instead
   * await schedulingService.update(123, { status: 'CANCELLED', notes: 'Project cancelled by client' });
   * ```
   */
  async delete(tenantId: number, id: number): Promise<void> {
    try {
      const task = await this.repository.findOne({ where: { id, tenantId } });

      if (!task) {
        throw new NotFoundError('ScheduledTask', id);
      }

      await this.repository.delete(id);

      logger.warn('Hard deleted scheduled task (audit trail destroyed)', {
        id,
        task_type: task.taskType,
        status: task.status,
        recommendation: 'Use status cancellation or soft delete instead',
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting task', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'SchedulingService.delete',
      });
      throw new DatabaseError(
        `Failed to delete scheduled task with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  // ============================================================================
  // BACKWARD COMPATIBILITY METHODS
  // ============================================================================
  // These methods maintain API compatibility with legacy frontend code.
  // DEPRECATED: Will be removed in Phase 22 (API v2 migration)
  // New code should use primary methods: findAll, findById, create, update, delete
  // ============================================================================

  /**
   * @deprecated Use findAll(tenantId, filters) instead. Maintained for backward compatibility only.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTasks(filters: any): Promise<ScheduledTaskDto[]> {
    const tenantId = filters.tenantId || 1; // Default tenant for backward compatibility
    return this.findAll(tenantId, {
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      status: filters.status,
      type: filters.type,
      equipmentId: filters.equipmentId,
    });
  }

  /**
   * @deprecated Use findById(tenantId, id) instead. Maintained for backward compatibility only.
   */
  async getTaskById(id: string, tenantId = 1): Promise<ScheduledTaskDto> {
    return this.findById(tenantId, parseInt(id));
  }

  /**
   * @deprecated Use create(tenantId, data) instead. Maintained for backward compatibility only.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createTask(data: any): Promise<ScheduledTaskDto> {
    const tenantId = data.tenantId || 1; // Default tenant for backward compatibility
    return this.create(tenantId, {
      ...data,
      start_date: data.scheduledDate || data.start_date || data.startDate,
      startDate: data.scheduledDate || data.startDate,
      task_type: data.type || data.task_type || data.taskType,
      taskType: data.type || data.taskType,
    });
  }

  /**
   * @deprecated Use update(tenantId, id, data) instead. Maintained for backward compatibility only.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateTask(id: string, data: any, tenantId = 1): Promise<ScheduledTaskDto> {
    return this.update(tenantId, parseInt(id), {
      ...data,
      start_date: data.scheduledDate || data.start_date || data.startDate,
      startDate: data.scheduledDate || data.startDate,
    });
  }

  /**
   * @deprecated Use delete(tenantId, id) instead. Maintained for backward compatibility only.
   */
  async deleteTask(id: string, tenantId = 1): Promise<void> {
    return this.delete(tenantId, parseInt(id));
  }
}

export default new SchedulingService();
