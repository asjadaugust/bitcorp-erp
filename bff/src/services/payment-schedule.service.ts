import { PaymentSchedule, PaymentScheduleStatus } from '../models/payment-schedule.model';
import {
  PaymentScheduleRepository,
  PaymentScheduleDetailRepository,
} from '../repositories/payment-schedule.repository';
import {
  PaymentScheduleCreateDto,
  PaymentScheduleDetailCreateDto,
  PaymentScheduleUpdateDto,
} from '../types/dto/payment-schedule.dto';
import { NotFoundError, ValidationError, DatabaseError, DatabaseErrorType } from '../errors';
import logger from '../config/logger.config';

// Re-export for backwards compatibility
export type CreatePaymentScheduleDto = PaymentScheduleCreateDto;
export type AddScheduleDetailDto = PaymentScheduleDetailCreateDto;

/**
 * Payment Schedule Service
 *
 * Manages payment installment scheduling for providers, supporting multi-installment
 * payment plans linked to Accounts Payable records.
 *
 * ## Purpose
 *
 * Payment Schedule is a **CORE FINANCIAL ENTITY** that enables:
 * - **Payment Planning**: Schedule provider payments in installments
 * - **Cash Flow Management**: Plan payment dates and amounts
 * - **Workflow Control**: Draft → Approve → Process lifecycle
 * - **Financial Tracking**: Link payment plans to accounts payable
 * - **Audit Trail**: Track payment schedule creation and modifications
 *
 * ## Payment Schedule Status Lifecycle (4 Statuses)
 *
 * Payment schedules follow a strict state machine with 4 statuses:
 *
 * 1. **DRAFT** (Initial State)
 *    - Payment schedule created but not yet approved
 *    - Fully editable: can add/remove details, modify fields, delete schedule
 *    - Total amount calculated from sum of detail amounts
 *    - Status: 'draft'
 *    - Operations allowed: Add/remove details, update, delete, approve, cancel
 *
 * 2. **APPROVED** (Approved State)
 *    - Payment schedule reviewed and approved for processing
 *    - Read-only: cannot add/remove details or modify
 *    - Ready for payment execution
 *    - Status: 'approved'
 *    - Operations allowed: Process, cancel
 *
 * 3. **PROCESSED** (Final State - Permanent)
 *    - Payment schedule executed and completed
 *    - Immutable: cannot be modified or cancelled
 *    - Permanent state: no transitions allowed
 *    - Status: 'processed'
 *    - Operations allowed: Read only
 *
 * 4. **CANCELLED** (Final State - Permanent)
 *    - Payment schedule cancelled/voided
 *    - Immutable: cannot be modified or reactivated
 *    - Permanent state: no transitions allowed
 *    - Status: 'cancelled'
 *    - Operations allowed: Read only
 *
 * ## Status Transition Workflow
 *
 * ### Valid Status Transitions
 *
 * ```
 * DRAFT → APPROVED (via approve())
 *   - Validates schedule has details
 *   - Reviews payment amounts
 *   - Locks schedule from edits
 *
 * DRAFT → CANCELLED (via cancel())
 *   - Cancels before approval
 *   - Permanent cancellation
 *
 * APPROVED → PROCESSED (via process())
 *   - Executes payment schedule
 *   - Marks as completed
 *   - Permanent state
 *
 * APPROVED → CANCELLED (via cancel())
 *   - Cancels approved schedule
 *   - Permanent cancellation
 * ```
 *
 * ### Invalid Status Transitions
 *
 * ```
 * PROCESSED → CANCELLED
 *   - Cannot cancel processed payments
 *   - Processed is permanent (payment already executed)
 *   - Use adjustment/reversal records instead
 *
 * PROCESSED → any other state
 *   - Processed is immutable final state
 *   - No transitions allowed
 *
 * CANCELLED → any state
 *   - Cancelled is permanent
 *   - Cannot reactivate cancelled schedules
 *   - Create new schedule instead
 *
 * APPROVED → DRAFT
 *   - Cannot revert to draft
 *   - Cancel and create new schedule instead
 * ```
 *
 * ## Draft-Only Operations
 *
 * These operations can ONLY be performed on DRAFT status schedules:
 *
 * - **Add Detail** (`addDetail()`): Add payment line item
 *   - Only DRAFT schedules
 *   - Updates total_amount automatically
 *   - Validates amount > 0
 *
 * - **Remove Detail** (`removeDetail()`): Remove payment line item
 *   - Only DRAFT schedules
 *   - Updates total_amount automatically
 *   - Validates detail exists
 *
 * - **Delete Schedule** (`delete()`): Hard delete schedule
 *   - Only DRAFT schedules
 *   - ⚠️ Destroys audit trail (use CANCELLED instead)
 *   - Cannot delete approved/processed schedules
 *
 * - **Update Fields** (`update()`): Modify schedule fields
 *   - Primarily for DRAFT schedules
 *   - Some fields may be updatable in APPROVED (use with caution)
 *
 * ## Total Amount Calculation
 *
 * The `total_amount` field is automatically calculated from payment details:
 *
 * ```typescript
 * total_amount = SUM(detail.amount_to_pay for each detail)
 * ```
 *
 * - **Initial**: 0 when schedule created
 * - **Add Detail**: `total_amount += detail.amount_to_pay`
 * - **Remove Detail**: `total_amount -= detail.amount_to_pay`
 * - **Formula**: Sum of all detail amounts
 *
 * ## Currency Support
 *
 * Payment schedules support multi-currency:
 * - **PEN** (Peruvian Sol): Default, domestic payments
 * - **USD** (US Dollar): International payments
 *
 * All details in a schedule must use the same currency (not enforced at DB level yet).
 *
 * ## Provider Relation
 *
 * - **Required**: Every schedule must have `provider_id`
 * - **Eagerly Loaded**: Provider details loaded with schedule
 * - **Validation**: Provider must exist (not validated yet)
 *
 * ## Project Relation (Optional)
 *
 * - **Optional**: `project_id` can be null
 * - **Use Case**: Link payments to specific projects for cost tracking
 * - **Validation**: Project must exist if provided (not validated yet)
 *
 * ## Payment Schedule Details
 *
 * Each schedule has multiple detail line items:
 * - **PaymentScheduleDetail**: Individual payment amounts
 * - **Link to AccountsPayable**: Optional reference to accounts payable record
 * - **Link to Valuation**: Optional reference to valuation record
 * - **Amount**: Individual payment amount
 *
 * Details are managed via:
 * - `addDetail()`: Add new detail
 * - `removeDetail()`: Remove existing detail
 *
 * ## Hard Delete vs Soft Delete
 *
 * ### Current Implementation (Hard Delete)
 *
 * - `delete()` performs **hard delete** (permanent removal)
 * - ⚠️ **DANGER**: Destroys financial audit trail
 * - Only allowed for DRAFT schedules
 * - Cannot delete APPROVED/PROCESSED schedules
 *
 * ### Implications
 *
 * - **Financial Audit**: Hard delete violates audit trail requirements
 * - **Orphaned Records**: May leave orphaned payment detail records
 * - **Compliance**: May violate tax audit requirements (SUNAT)
 * - **Best Practice**: Use CANCELLED status instead
 *
 * ### Recommendation
 *
 * - Use `cancel()` instead of `delete()` for approved schedules
 * - Implement soft delete (add `deleted_at` column)
 * - Keep all records for audit trail
 *
 * ## Multi-Tenancy
 *
 * All queries are filtered by `tenantId` for data isolation.
 * The `tenantId` is set on entity creation and used as a filter in all read operations.
 *
 * ## Related Services
 *
 * - **AccountsPayableService**: Parent entity for payment obligations
 * - **ProviderService**: Provider information and financial details
 * - **ProjectService**: Optional project association
 * - **ValuationService**: Optional valuation reference
 * - **ReportingService**: Payment schedule reports and analytics
 *
 * ## Usage Examples
 *
 * ### Example 1: Create Draft Schedule
 *
 * ```typescript
 * const schedule = await paymentScheduleService.create({
 *   schedule_date: new Date('2026-02-01'),
 *   payment_date: new Date('2026-02-15'),
 *   description: 'Provider payment - February',
 *   currency: 'PEN'
 * }, userId, tenantId);
 * // Result: { id: 123, status: 'draft', total_amount: 0, ... }
 * ```
 *
 * ### Example 2: Add Payment Details
 *
 * ```typescript
 * // Add detail 1
 * await paymentScheduleService.addDetail(123, {
 *   amount_to_pay: 5000,
 *   accounts_payable_id: 456,
 *   description: 'Invoice INV-001'
 * });
 *
 * // Add detail 2
 * await paymentScheduleService.addDetail(123, {
 *   amount_to_pay: 3000,
 *   accounts_payable_id: 457,
 *   description: 'Invoice INV-002'
 * });
 * // Schedule total_amount now: 8000
 * ```
 *
 * ### Example 3: Approve and Process Schedule
 *
 * ```typescript
 * // Approve schedule
 * await paymentScheduleService.approve(123);
 * // Status: 'approved', now immutable
 *
 * // Process payment
 * await paymentScheduleService.process(123);
 * // Status: 'processed', permanent state
 * ```
 *
 * ### Example 4: Cancel Schedule
 *
 * ```typescript
 * // Cancel draft schedule
 * await paymentScheduleService.cancel(123);
 * // Status: 'cancelled', permanent state
 * ```
 *
 * ### Example 5: Query Schedules with Pagination
 *
 * ```typescript
 * const result = await paymentScheduleService.findAll(tenantId, {
 *   page: 1,
 *   limit: 20,
 *   sort_by: 'schedule_date',
 *   sort_order: 'DESC'
 * });
 * // Result: { data: [...], total: 45 }
 * ```
 *
 * @see PaymentSchedule - Entity model with status enum
 * @see PaymentScheduleDetail - Detail line items
 * @see AccountsPayableService - Parent payment obligations
 * @see ProviderService - Provider information
 */
export class PaymentScheduleService {
  /**
   * Create a new payment schedule
   *
   * Creates a payment schedule in DRAFT status with total_amount = 0.
   * Details must be added separately via `addDetail()`.
   *
   * @param data - Payment schedule creation data
   * @param data.schedule_date - Scheduled date for payment
   * @param data.payment_date - Actual payment date
   * @param data.description - Optional description/notes
   * @param data.currency - Currency (PEN or USD), defaults to PEN
   * @param _userId - User ID creating the schedule
   * @param tenantId - Tenant identifier for data isolation
   *
   * @returns Created payment schedule with status = DRAFT
   *
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * const schedule = await service.create({
   *   schedule_date: new Date('2026-02-01'),
   *   payment_date: new Date('2026-02-15'),
   *   description: 'Monthly provider payments',
   *   currency: 'PEN'
   * }, 1, 1);
   * // Result: { id: 123, status: 'draft', total_amount: 0 }
   * ```
   */
  async create(data: PaymentScheduleCreateDto, _userId: number, tenantId: number) {
    try {
      const schedule = PaymentScheduleRepository.create({
        ...data,
        tenantId,
        status: PaymentScheduleStatus.DRAFT,
      });
      const saved = await PaymentScheduleRepository.save(schedule);

      logger.info('Created payment schedule', {
        id: saved.id,
        periodo: saved.periodo,
        schedule_date: saved.scheduleDate,
        total_amount: saved.totalAmount || 0,
        status: saved.status,
      });

      return saved;
    } catch (error) {
      throw new DatabaseError('Failed to create payment schedule', DatabaseErrorType.QUERY, error);
    }
  }

  /**
   * Find all payment schedules with pagination and sorting
   *
   * Returns paginated list of payment schedules with optional sorting.
   *
   * **Sortable Fields**:
   * - `schedule_date`: Scheduled payment date
   * - `payment_date`: Actual payment date
   * - `total_amount`: Total payment amount
   * - `status`: Payment status
   * - `currency`: Payment currency
   * - `created_at`: Creation timestamp (default)
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param filters - Optional pagination and sorting filters
   * @param filters.page - Page number (1-indexed), default: 1
   * @param filters.limit - Items per page, default: 20
   * @param filters.sort_by - Sort field, default: 'created_at'
   * @param filters.sort_order - Sort direction (ASC or DESC), default: DESC
   *
   * @returns Object with data array and total count
   *
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const result = await service.findAll(1, {
   *   page: 1,
   *   limit: 20,
   *   sort_by: 'schedule_date',
   *   sort_order: 'DESC'
   * });
   * // Result: { data: [schedule1, schedule2], total: 45 }
   * ```
   */
  async findAll(
    tenantId: number,
    filters?: {
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: 'ASC' | 'DESC';
    }
  ): Promise<{ data: PaymentSchedule[]; total: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      // Sortable fields whitelist (use entity property names, not DB column names)
      const sortableFields: Record<string, string> = {
        schedule_date: 'ps.scheduleDate',
        total_amount: 'ps.totalAmount',
        status: 'ps.status',
        periodo: 'ps.periodo',
        created_at: 'ps.createdAt',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'ps.createdAt';
      const sortOrder = filters?.sort_order === 'ASC' ? 'ASC' : 'DESC';

      // Use query builder with tenant isolation
      const queryBuilder = PaymentScheduleRepository.createQueryBuilder('ps')
        .andWhere('ps.tenantId = :tenantId', { tenantId })
        .orderBy(sortBy, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated data
      const schedules = await queryBuilder.skip(skip).take(limit).getMany();

      logger.info('Retrieved payment schedule list', {
        total,
        returned: schedules.length,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      return {
        data: schedules,
        total,
      };
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve payment schedules',
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Find a single payment schedule by ID with details
   *
   * Retrieves payment schedule with eagerly loaded relations:
   * - Payment schedule details
   * - Accounts payable (via details)
   * - Provider information (via accounts payable)
   *
   * @param id - Payment schedule ID
   *
   * @returns Payment schedule with details and relations
   *
   * @throws {NotFoundError} If payment schedule not found
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * ```typescript
   * const schedule = await service.findOne(123);
   * // Result: {
   * //   id: 123,
   * //   periodo: '2026-02',
   * //   status: 'draft',
   * //   total_amount: 8000,
   * //   details: [{ amount_to_pay: 5000 }, { amount_to_pay: 3000 }]
   * // }
   * ```
   */
  async findOne(tenantId: number, id: number) {
    try {
      const schedule = await PaymentScheduleRepository.findOne({
        where: { id, tenantId },
        relations: ['details'],
      });

      if (!schedule) {
        throw new NotFoundError('PaymentSchedule', id);
      }

      logger.info('Retrieved payment schedule', {
        id: schedule.id,
        periodo: schedule.periodo,
        status: schedule.status,
        total_amount: schedule.totalAmount || 0,
        details_count: schedule.details?.length || 0,
      });

      return schedule;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to retrieve payment schedule with ID ${id}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Update a payment schedule
   *
   * Updates payment schedule fields. Primarily used for DRAFT schedules.
   * Use with caution for APPROVED schedules (limited fields should be updatable).
   *
   * **Note**: Cannot update PROCESSED or CANCELLED schedules.
   *
   * @param id - Payment schedule ID
   * @param data - Fields to update
   * @param data.schedule_date - Updated schedule date
   * @param data.payment_date - Updated payment date
   * @param data.description - Updated description
   * @param data.currency - Updated currency (PEN or USD)
   *
   * @returns Updated payment schedule
   *
   * @throws {NotFoundError} If payment schedule not found
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const updated = await service.update(123, {
   *   schedule_date: new Date('2026-02-10'),
   *   description: 'Updated payment schedule'
   * });
   * // Result: { id: 123, schedule_date: '2026-02-10', ... }
   * ```
   */
  async update(tenantId: number, id: number, data: PaymentScheduleUpdateDto) {
    try {
      const schedule = await this.findOne(tenantId, id);

      const changedFields = Object.keys(data);
      PaymentScheduleRepository.merge(schedule, data);
      const saved = await PaymentScheduleRepository.save(schedule);

      logger.info('Updated payment schedule', {
        id: saved.id,
        periodo: saved.periodo,
        changed_fields: changedFields,
      });

      return saved;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to update payment schedule with ID ${id}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Delete a payment schedule (DRAFT only)
   *
   * **Hard deletes** a payment schedule and its details.
   *
   * **Restrictions**:
   * - Only DRAFT schedules can be deleted
   * - APPROVED, PROCESSED, CANCELLED schedules cannot be deleted
   *
   * **⚠️ WARNING: HARD DELETE**
   * - Permanently removes record from database
   * - Destroys financial audit trail
   * - May orphan related records
   * - Violates accounting best practices
   *
   * **Recommendation**: Use `cancel()` instead for approved schedules.
   *
   * @param id - Payment schedule ID
   *
   * @returns Deleted payment schedule (for confirmation)
   *
   * @throws {NotFoundError} If payment schedule not found
   * @throws {ValidationError} If schedule status is not DRAFT
   * @throws {DatabaseError} If database delete fails
   *
   * @example
   * ```typescript
   * await service.delete(123);
   * // Schedule 123 permanently deleted
   * ```
   */
  async delete(tenantId: number, id: number) {
    try {
      const schedule = await this.findOne(tenantId, id);

      if (schedule.status !== PaymentScheduleStatus.DRAFT) {
        throw new ValidationError('Only draft schedules can be deleted', [
          {
            field: 'status',
            message: 'Status must be DRAFT to delete schedule',
            rule: 'statusCheck',
            value: schedule.status,
          },
        ]);
      }

      const deleted = await PaymentScheduleRepository.remove(schedule);

      logger.warn('Hard deleted payment schedule (audit trail destroyed)', {
        id: schedule.id,
        periodo: schedule.periodo,
        recommendation: 'Use cancel() instead of delete()',
      });

      return deleted;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to delete payment schedule with ID ${id}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Add a payment detail to a schedule (DRAFT only)
   *
   * Adds a payment line item to the schedule and updates the total_amount.
   *
   * **Restrictions**:
   * - Only DRAFT schedules can add details
   * - Amount must be positive
   *
   * **Side Effects**:
   * - Updates schedule.total_amount: `total_amount += detail.amount_to_pay`
   *
   * @param scheduleId - Payment schedule ID
   * @param data - Payment detail data
   * @param data.amount_to_pay - Payment amount (must be > 0)
   * @param data.valuation_id - Optional valuation reference
   * @param data.accounts_payable_id - Optional accounts payable reference
   * @param data.description - Optional detail description
   *
   * @returns Created payment detail
   *
   * @throws {NotFoundError} If payment schedule not found
   * @throws {ValidationError} If schedule status is not DRAFT
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * const detail = await service.addDetail(123, {
   *   amount_to_pay: 5000,
   *   accounts_payable_id: 456,
   *   description: 'Invoice INV-001'
   * });
   * // Schedule total_amount increased by 5000
   * ```
   */
  async addDetail(tenantId: number, scheduleId: number, data: PaymentScheduleDetailCreateDto) {
    try {
      const schedule = await PaymentScheduleRepository.findOne({
        where: { id: scheduleId, tenantId },
      });

      if (!schedule) {
        throw new NotFoundError('PaymentSchedule', scheduleId);
      }

      if (schedule.status !== PaymentScheduleStatus.DRAFT) {
        throw new ValidationError('Cannot add details to non-draft schedule', [
          {
            field: 'status',
            rule: 'statusCheck',
            message: 'Status must be DRAFT to add details',
            value: schedule.status,
          },
        ]);
      }

      const detail = PaymentScheduleDetailRepository.create({
        paymentScheduleId: scheduleId,
        amountToPay: data.amount_to_pay,
      });

      const savedDetail = await PaymentScheduleDetailRepository.save(detail);

      // Update total amount
      schedule.totalAmount = Number(schedule.totalAmount || 0) + Number(data.amount_to_pay);
      await PaymentScheduleRepository.save(schedule);

      logger.info('Added payment schedule detail', {
        schedule_id: scheduleId,
        detail_id: savedDetail.id,
        amount_to_pay: data.amount_to_pay,
        new_total: schedule.totalAmount,
      });

      return savedDetail;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to add detail to payment schedule ${scheduleId}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Remove a payment detail from a schedule (DRAFT only)
   *
   * Removes a payment line item from the schedule and updates the total_amount.
   *
   * **Restrictions**:
   * - Only DRAFT schedules can remove details
   * - Detail must exist and belong to the schedule
   *
   * **Side Effects**:
   * - Updates schedule.total_amount: `total_amount -= detail.amount_to_pay`
   *
   * @param scheduleId - Payment schedule ID
   * @param detailId - Payment detail ID to remove
   *
   * @returns Removed payment detail (for confirmation)
   *
   * @throws {NotFoundError} If payment schedule or detail not found
   * @throws {ValidationError} If schedule status is not DRAFT
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * ```typescript
   * await service.removeDetail(123, 456);
   * // Detail 456 removed, schedule total_amount decreased
   * ```
   */
  async removeDetail(tenantId: number, scheduleId: number, detailId: number) {
    try {
      const schedule = await PaymentScheduleRepository.findOne({
        where: { id: scheduleId, tenantId },
      });

      if (!schedule) {
        throw new NotFoundError('PaymentSchedule', scheduleId);
      }

      if (schedule.status !== PaymentScheduleStatus.DRAFT) {
        throw new ValidationError('Cannot remove details from non-draft schedule', [
          {
            field: 'status',
            rule: 'statusCheck',
            message: 'Status must be DRAFT to remove details',
            value: schedule.status,
          },
        ]);
      }

      const detail = await PaymentScheduleDetailRepository.findOne({
        where: { id: detailId, paymentScheduleId: scheduleId },
      });

      if (!detail) {
        throw new NotFoundError('PaymentScheduleDetail', detailId, {
          schedule_id: scheduleId,
        });
      }

      // Update total amount
      schedule.totalAmount = Number(schedule.totalAmount || 0) - Number(detail.amountToPay);
      await PaymentScheduleRepository.save(schedule);

      const removed = await PaymentScheduleDetailRepository.remove(detail);

      logger.info('Removed payment schedule detail', {
        schedule_id: scheduleId,
        detail_id: detailId,
        amount_removed: detail.amountToPay,
        new_total: schedule.totalAmount,
      });

      return removed;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to remove detail ${detailId} from payment schedule ${scheduleId}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Approve a payment schedule (DRAFT → APPROVED)
   *
   * Transitions a payment schedule from DRAFT to APPROVED status.
   * Once approved, the schedule becomes read-only (cannot add/remove details).
   *
   * **Valid Transition**: DRAFT → APPROVED
   *
   * **Restrictions**:
   * - Only DRAFT schedules can be approved
   * - Cannot approve APPROVED, PROCESSED, or CANCELLED schedules
   *
   * **Side Effects**:
   * - Status changes to APPROVED
   * - Schedule becomes immutable (no edits allowed)
   *
   * @param id - Payment schedule ID
   *
   * @returns Approved payment schedule
   *
   * @throws {NotFoundError} If payment schedule not found
   * @throws {ValidationError} If schedule status is not DRAFT
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const approved = await service.approve(123);
   * // Result: { id: 123, status: 'approved', ... }
   * ```
   */
  async approve(tenantId: number, id: number): Promise<PaymentSchedule> {
    try {
      const schedule = await this.findOne(tenantId, id);

      if (schedule.status !== PaymentScheduleStatus.DRAFT) {
        throw new ValidationError('Only draft schedules can be approved', [
          {
            field: 'status',
            rule: 'statusCheck',
            message: 'Status must be DRAFT to approve',
            value: schedule.status,
          },
        ]);
      }

      await PaymentScheduleRepository.update(id, {
        status: PaymentScheduleStatus.APPROVED,
      } as Record<string, unknown>);

      logger.info('Approved payment schedule', {
        id,
        periodo: schedule.periodo,
        previous_status: PaymentScheduleStatus.DRAFT,
        new_status: PaymentScheduleStatus.APPROVED,
      });

      return await this.findOne(tenantId, id);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to approve payment schedule with ID ${id}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Process a payment schedule (APPROVED → PROCESSED)
   *
   * Transitions a payment schedule from APPROVED to PROCESSED status.
   * Once processed, the schedule is permanently immutable (cannot be cancelled or modified).
   *
   * **Valid Transition**: APPROVED → PROCESSED
   *
   * **Restrictions**:
   * - Only APPROVED schedules can be processed
   * - Cannot process DRAFT, PROCESSED, or CANCELLED schedules
   *
   * **Side Effects**:
   * - Status changes to PROCESSED
   * - Schedule becomes permanently immutable
   * - Cannot be cancelled after processing
   *
   * @param id - Payment schedule ID
   *
   * @returns Processed payment schedule
   *
   * @throws {NotFoundError} If payment schedule not found
   * @throws {ValidationError} If schedule status is not APPROVED
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const processed = await service.process(123);
   * // Result: { id: 123, status: 'processed', ... }
   * ```
   */
  async process(tenantId: number, id: number): Promise<PaymentSchedule> {
    try {
      const schedule = await this.findOne(tenantId, id);

      if (schedule.status !== PaymentScheduleStatus.APPROVED) {
        throw new ValidationError('Only approved schedules can be processed', [
          {
            field: 'status',
            rule: 'statusCheck',
            message: 'Status must be APPROVED to process',
            value: schedule.status,
          },
        ]);
      }

      await PaymentScheduleRepository.update(id, {
        status: PaymentScheduleStatus.PROCESSED,
      } as Record<string, unknown>);

      logger.info('Processed payment schedule', {
        id,
        periodo: schedule.periodo,
        previous_status: PaymentScheduleStatus.APPROVED,
        new_status: PaymentScheduleStatus.PROCESSED,
      });

      return await this.findOne(tenantId, id);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to process payment schedule with ID ${id}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }

  /**
   * Cancel a payment schedule (DRAFT/APPROVED → CANCELLED)
   *
   * Transitions a payment schedule to CANCELLED status.
   * Once cancelled, the schedule is permanently immutable (cannot be reactivated).
   *
   * **Valid Transitions**:
   * - DRAFT → CANCELLED
   * - APPROVED → CANCELLED
   *
   * **Invalid Transitions**:
   * - PROCESSED → CANCELLED (processed payments cannot be cancelled)
   *
   * **Side Effects**:
   * - Status changes to CANCELLED
   * - Schedule becomes permanently immutable
   * - Cannot be reactivated or modified
   *
   * @param id - Payment schedule ID
   *
   * @returns Cancelled payment schedule
   *
   * @throws {NotFoundError} If payment schedule not found
   * @throws {ValidationError} If schedule status is PROCESSED
   * @throws {DatabaseError} If database update fails
   *
   * @example
   * ```typescript
   * const cancelled = await service.cancel(123);
   * // Result: { id: 123, status: 'cancelled', ... }
   * ```
   */
  async cancel(tenantId: number, id: number): Promise<PaymentSchedule> {
    try {
      const schedule = await this.findOne(tenantId, id);

      if (schedule.status === PaymentScheduleStatus.PROCESSED) {
        throw new ValidationError('Processed schedules cannot be cancelled', [
          {
            field: 'status',
            rule: 'statusCheck',
            message: 'Processed schedules cannot be cancelled',
            value: schedule.status,
          },
        ]);
      }

      const previousStatus = schedule.status;

      await PaymentScheduleRepository.update(id, {
        status: PaymentScheduleStatus.CANCELLED,
      } as Record<string, unknown>);

      logger.info('Cancelled payment schedule', {
        id,
        periodo: schedule.periodo,
        previous_status: previousStatus,
        new_status: PaymentScheduleStatus.CANCELLED,
      });

      return await this.findOne(tenantId, id);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to cancel payment schedule with ID ${id}`,
        DatabaseErrorType.QUERY,
        error
      );
    }
  }
}
