import { AccountsPayableStatus } from '../models/accounts-payable.model';
import { AccountsPayableRepository } from '../repositories/accounts-payable.repository';
import {
  toAccountsPayableDto,
  fromAccountsPayableDto,
  AccountsPayableDto,
} from '../types/dto/accounts-payable.dto';
import { NotFoundError, DatabaseError, ValidationError, DatabaseErrorType } from '../errors';
import logger from '../utils/logger';

// DTOs for create/update operations
// Support only Spanish snake_case (from API) replace English camelCase with Spanish snake_case
export interface CreateAccountsPayableDto {
  providerId?: number; // proveedor_id
  documentNumber?: string; // numero_factura
  issueDate?: string; // fecha_emision
  dueDate?: string; // fecha_vencimiento
  amount?: number; // monto_total
  amountPaid?: number; // monto_pagado
  currency?: string; // moneda
  status?: AccountsPayableStatus; // estado
  description?: string; // observaciones

  // Also support Spanish snake_case
  proveedor_id?: number;
  numero_factura?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  monto_total?: number;
  monto_pagado?: number;
  moneda?: string;
  estado?: AccountsPayableStatus;
  observaciones?: string;
}

export interface UpdateAccountsPayableDto extends Partial<CreateAccountsPayableDto> {}

/**
 * Accounts Payable Service
 *
 * Manages financial liabilities (cuentas por pagar) - invoices and bills owed to providers (suppliers).
 * This service handles payment obligations, due date tracking, payment status, and provider billing.
 *
 * **Business Domain**: Financial Management
 *
 * ## Purpose and Criticality
 *
 * Accounts Payable is a **CORE FINANCIAL ENTITY** in BitCorp ERP that tracks all money owed to
 * external providers (suppliers, subcontractors, service providers). Every purchase, rental, or
 * service invoice creates an accounts payable record that must be tracked until fully paid.
 *
 * **Why This Service is Critical**:
 * - **Cash Flow Management**: Tracks when payments are due to manage company liquidity
 * - **Provider Relations**: Timely payments maintain good provider relationships
 * - **Financial Reporting**: Required for balance sheet (pasivos corrientes)
 * - **Audit Trail**: Legal requirement to track all financial obligations
 * - **Budget Control**: Monitors spending against cost centers and projects
 *
 * ## Payment Status Lifecycle
 *
 * Every accounts payable record progresses through payment states:
 *
 * ### PENDIENTE (Pending)
 * - **Description**: Invoice received but not yet paid
 * - **Characteristics**:
 *   - Initial status for all new invoices
 *   - `monto_pagado` = 0
 *   - `saldo` = `monto_total`
 *   - Due date (`fecha_vencimiento`) tracked for overdue alerts
 * - **Business Actions**:
 *   - Review and approve invoice
 *   - Schedule payment
 *   - Track against budget
 * - **Next States**: PARCIAL, PAGADO, ANULADO
 *
 * ### PARCIAL (Partial Payment)
 * - **Description**: Partial payment made, balance remaining
 * - **Characteristics**:
 *   - 0 < `monto_pagado` < `monto_total`
 *   - `saldo` = `monto_total` - `monto_pagado`
 *   - Common for large invoices paid in installments
 * - **Business Actions**:
 *   - Track remaining balance
 *   - Schedule next payment installment
 *   - Update payment schedule
 * - **Next States**: PAGADO, ANULADO
 *
 * ### PAGADO (Fully Paid)
 * - **Description**: Invoice fully paid, no balance remaining
 * - **Characteristics**:
 *   - `monto_pagado` >= `monto_total`
 *   - `saldo` = 0
 *   - Final state for successful payment
 * - **Business Actions**:
 *   - Archive payment proof
 *   - Close accounts payable record
 *   - Update provider payment history
 * - **Next States**: None (terminal state, except ANULADO for corrections)
 *
 * ### ANULADO (Cancelled/Voided)
 * - **Description**: Invoice cancelled or voided
 * - **Characteristics**:
 *   - Invoice rejected, returned, or cancelled by provider
 *   - No payment made or payment reversed
 *   - Permanent status (cannot be un-cancelled)
 * - **Business Actions**:
 *   - Document cancellation reason
 *   - Request credit note from provider
 *   - Adjust budget/project costs
 * - **Next States**: None (terminal state)
 *
 * ## Valid Status Transitions
 *
 * ```
 * PENDIENTE → PARCIAL  (partial payment made)
 * PENDIENTE → PAGADO   (full payment made)
 * PARCIAL → PAGADO     (remaining balance paid)
 * PENDIENTE → ANULADO  (invoice cancelled before payment)
 * PARCIAL → ANULADO    (invoice cancelled after partial payment)
 * ```
 *
 * ## Invalid Status Transitions
 *
 * ```
 * PAGADO → PENDIENTE   (cannot unpay - create reversal instead)
 * PAGADO → PARCIAL     (cannot unpay - create reversal instead)
 * ANULADO → any state  (cancelled is permanent - create new invoice)
 * ```
 *
 * ## Balance Calculation
 *
 * The balance (saldo) represents the remaining amount to be paid:
 *
 * ```typescript
 * saldo = monto_total - monto_pagado
 * ```
 *
 * **Validation Rules**:
 * - `monto_pagado` cannot exceed `monto_total`
 * - `saldo` must be >= 0
 * - If `monto_pagado` >= `monto_total`, status must be PAGADO
 * - If 0 < `monto_pagado` < `monto_total`, status must be PARCIAL
 * - If `monto_pagado` = 0, status must be PENDIENTE
 *
 * **Automatic Status Update** (not yet implemented):
 * When payment is recorded, status should automatically update based on payment amount.
 *
 * ## Currency Support
 *
 * BitCorp ERP supports multi-currency accounts payable:
 *
 * ### PEN (Peruvian Sol)
 * - **Default currency** for domestic providers
 * - Most common for local equipment rentals and services
 * - No exchange rate needed
 *
 * ### USD (US Dollar)
 * - Used for international providers
 * - Common for imported equipment and specialized services
 * - Requires exchange rate for financial reporting
 *
 * ### EUR (Euro)
 * - Used for European providers
 * - Less common, typically for specialized equipment
 * - Requires exchange rate for financial reporting
 *
 * **Currency Rules**:
 * - Currency cannot change after invoice creation
 * - Multi-currency reporting requires exchange rates (not yet implemented)
 * - All amounts stored in original currency (no automatic conversion)
 *
 * ## Due Date Tracking and Overdue Logic
 *
 * ### Date Fields
 * - **fecha_emision** (Issue Date): Date invoice was issued by provider
 * - **fecha_vencimiento** (Due Date): Date payment is due
 *
 * **Validation Rule**: `fecha_vencimiento` must be >= `fecha_emision`
 *
 * ### Overdue Detection
 *
 * An invoice is considered overdue if:
 * ```typescript
 * fecha_vencimiento < current_date AND estado != PAGADO
 * ```
 *
 * **Overdue Actions**:
 * - Alert finance team
 * - Track provider payment terms compliance
 * - Avoid late payment penalties
 * - Maintain good provider credit standing
 *
 * ## Provider Relation (Required)
 *
 * Every accounts payable record MUST have a provider:
 * - **proveedor_id** is required field
 * - Provider relation is **eagerly loaded** for API responses
 * - Provider information includes:
 *   - RUC (tax ID)
 *   - Razon Social (legal name)
 *   - Nombre Comercial (trade name)
 *
 * **Business Rules**:
 * - Cannot create invoice without valid provider
 * - Cannot delete provider with pending accounts payable
 * - Provider payment history affects future negotiations
 *
 * ## Hard Delete vs Soft Delete
 *
 * **Current Implementation**: Hard delete (permanent removal)
 *
 * **Financial Implications**:
 * - ⚠️ **DANGER**: Hard deleting accounts payable destroys financial audit trail
 * - Violates accounting best practices (all transactions must be traceable)
 * - Can cause issues with tax audits (SUNAT requirements)
 *
 * **Recommendation for Phase 21**:
 * - Add `is_active` column for soft delete
 * - Keep all records permanently (even cancelled)
 * - Use ANULADO status instead of delete
 * - Implement proper audit trail
 *
 * ## Multi-Tenancy
 *
 * All methods accept `tenantId` as a parameter and filter queries accordingly.
 * Tenant isolation is enforced via `tenantId` in WHERE clauses.
 *
 * ## Related Services
 *
 * - **ProviderService**: Manages provider master data (required for accounts payable)
 * - **ProjectService**: Links invoices to specific projects (for cost allocation)
 * - **CostCenterService**: Links invoices to cost centers (for budget tracking)
 * - **PaymentScheduleService**: Manages payment installments (not yet implemented)
 * - **ReportingService**: Generates accounts payable aging reports
 *
 * ## Usage Examples
 *
 * ### Create New Invoice
 * ```typescript
 * const accountsPayable = await accountsPayableService.create({
 *   proveedor_id: 5,
 *   numero_factura: 'F001-00123',
 *   fecha_emision: '2026-01-15',
 *   fecha_vencimiento: '2026-02-15',
 *   monto_total: 15000.00,
 *   moneda: 'PEN',
 *   estado: 'PENDIENTE',
 *   observaciones: 'Alquiler de excavadora - Enero 2026'
 * });
 * // Returns: AccountsPayableDto with id, saldo calculated
 * ```
 *
 * ### Record Partial Payment
 * ```typescript
 * const updated = await accountsPayableService.update(123, {
 *   monto_pagado: 7500.00,
 *   estado: 'PARCIAL'
 * });
 * // saldo = 15000 - 7500 = 7500 (remaining balance)
 * ```
 *
 * ### Record Full Payment
 * ```typescript
 * const paid = await accountsPayableService.update(123, {
 *   monto_pagado: 15000.00,
 *   estado: 'PAGADO'
 * });
 * // saldo = 0 (fully paid)
 * ```
 *
 * ### Find Overdue Invoices
 * ```typescript
 * const pending = await accountsPayableService.findPending();
 * const overdue = pending.filter(ap =>
 *   new Date(ap.fecha_vencimiento) < new Date() && ap.estado !== 'PAGADO'
 * );
 * ```
 *
 * ### List with Pagination and Sorting
 * ```typescript
 * const result = await accountsPayableService.findAll({
 *   page: 1,
 *   limit: 20,
 *   sort_by: 'fecha_vencimiento',
 *   sort_order: 'ASC'
 * });
 * // Returns: { data: AccountsPayableDto[], total: number }
 * ```
 *
 * @class AccountsPayableService
 */
export class AccountsPayableService {
  /**
   * Create new accounts payable record
   *
   * Creates a new invoice/bill owed to a provider. Accepts both Spanish snake_case (from API) field names for backward compatibility.
   *
   * **Business Rules**:
   * - Provider (proveedor_id) is required
   * - Invoice number (numero_factura) must be unique per provider
   * - Due date must be >= issue date
   * - Payment amount cannot exceed total amount
   * - Default status is PENDIENTE
   * - Default currency is PEN
   *
   * **Validation**:
   * - Validates payment amount <= total amount
   * - Validates date range (due date >= issue date)
   * - Calculates initial balance (monto_total - monto_pagado)
   *
   * @param data - Invoice data (supports dual field names)
   * @returns AccountsPayableDto with calculated balance
   * @throws {ValidationError} If payment amount > total amount or invalid dates
   * @throws {DatabaseError} If save operation fails
   * @throws {NotFoundError} If reload after save returns null
   *
   * @example
   * ```typescript
   * const invoice = await service.create({
   *   proveedor_id: 5,
   *   numero_factura: 'F001-00123',
   *   fecha_emision: '2026-01-15',
   *   fecha_vencimiento: '2026-02-15',
   *   monto_total: 15000.00,
   *   monto_pagado: 0,
   *   moneda: 'PEN',
   *   estado: 'PENDIENTE'
   * });
   * ```
   */
  async create(tenantId: number, data: CreateAccountsPayableDto): Promise<AccountsPayableDto> {
    // Map frontend camelCase and Spanish snake_case to DTO format
    const accountsPayableData: Partial<AccountsPayableDto> = {
      proveedor_id: data.proveedor_id || data.providerId,
      numero_factura: data.numero_factura || data.documentNumber,
      fecha_emision: data.fecha_emision || data.issueDate,
      fecha_vencimiento: data.fecha_vencimiento || data.dueDate,
      monto_total: data.monto_total || data.amount,
      monto_pagado: data.monto_pagado || data.amountPaid || 0,
      moneda: data.moneda || data.currency || 'PEN',
      estado: data.estado || data.status || AccountsPayableStatus.PENDING,
      observaciones: data.observaciones || data.description || null,
    };

    // Validate payment amount
    if (accountsPayableData.monto_pagado! > accountsPayableData.monto_total!) {
      throw new ValidationError('Payment amount cannot exceed total amount', [
        {
          field: 'monto_pagado',
          message: `Payment amount (${accountsPayableData.monto_pagado}) cannot exceed total amount (${accountsPayableData.monto_total})`,
          rule: 'max',
          value: accountsPayableData.monto_pagado,
          constraints: { max: accountsPayableData.monto_total },
        },
      ]);
    }

    // Validate date range
    this.validateDateRange(
      accountsPayableData.fecha_emision!,
      accountsPayableData.fecha_vencimiento!
    );

    try {
      const entity = AccountsPayableRepository.create({
        ...fromAccountsPayableDto(accountsPayableData),
        tenantId,
      });
      const saved = await AccountsPayableRepository.save(entity);

      // Reload with relations
      const reloaded = await AccountsPayableRepository.findOne({
        where: { id: saved.id, tenantId },
        relations: ['provider'],
      });

      if (!reloaded) {
        throw new NotFoundError('AccountsPayable', saved.id, {
          reason: 'Failed to reload created accounts payable record',
        });
      }

      logger.info('Created accounts payable', {
        id: reloaded.id,
        numero_factura: reloaded.documentNumber,
        proveedor_id: reloaded.providerId,
        monto_total: reloaded.amount,
        monto_pagado: reloaded.amountPaid,
        saldo: Number(reloaded.amount) - Number(reloaded.amountPaid),
        estado: reloaded.status,
        moneda: reloaded.currency,
      });

      return toAccountsPayableDto(reloaded);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to create accounts payable',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Find all accounts payable with pagination and sorting
   *
   * Retrieves paginated list of accounts payable with optional sorting.
   * Provider information is eagerly loaded for each record.
   *
   * **Sortable Fields**:
   * - fecha_emision (issue date)
   * - fecha_vencimiento (due date)
   * - monto_total (total amount)
   * - monto_pagado (paid amount)
   * - saldo (balance)
   * - estado (status)
   * - numero_factura (invoice number)
   * - created_at (creation timestamp)
   *
   * **Default Sorting**: created_at DESC (newest first)
   *
   * @param filters - Pagination and sorting options
   * @returns Object with data array and total count
   * @throws {DatabaseError} If query fails
   *
   * @example
   * ```typescript
   * const result = await service.findAll({
   *   page: 1,
   *   limit: 20,
   *   sort_by: 'fecha_vencimiento',
   *   sort_order: 'ASC'
   * });
   * // Returns: { data: [...], total: 145 }
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
  ): Promise<{ data: AccountsPayableDto[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    // Sortable fields whitelist (use entity property names, not DB column names)
    const sortableFields: Record<string, string> = {
      fecha_emision: 'ap.issueDate',
      fecha_vencimiento: 'ap.dueDate',
      monto_total: 'ap.amount',
      monto_pagado: 'ap.amountPaid',
      saldo: 'ap.balance',
      estado: 'ap.status',
      numero_factura: 'ap.documentNumber',
      created_at: 'ap.createdAt',
    };

    const sortBy =
      filters?.sort_by && sortableFields[filters.sort_by]
        ? sortableFields[filters.sort_by]
        : 'ap.createdAt';
    const sortOrder = filters?.sort_order === 'ASC' ? 'ASC' : 'DESC';

    try {
      // Use query builder for dynamic sorting
      const queryBuilder = AccountsPayableRepository.createQueryBuilder('ap')
        .where('ap.tenantId = :tenantId', { tenantId })
        .leftJoinAndSelect('ap.provider', 'provider')
        .orderBy(sortBy, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Get paginated data
      const accounts = await queryBuilder.skip(skip).take(limit).getMany();

      logger.info('Retrieved accounts payable list', {
        total,
        returned: accounts.length,
        page,
        limit,
        sortBy: filters?.sort_by || 'created_at',
        sortOrder,
      });

      return {
        data: accounts.map((a) => toAccountsPayableDto(a)),
        total,
      };
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve accounts payable list',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Find single accounts payable record by ID
   *
   * Retrieves a single accounts payable record with provider information.
   *
   * @param id - Accounts payable ID
   * @returns AccountsPayableDto or null if not found
   * @throws {NotFoundError} If record not found
   * @throws {DatabaseError} If query fails
   *
   * @example
   * ```typescript
   * const invoice = await service.findOne(123);
   * console.log(invoice.saldo); // Remaining balance
   * ```
   */
  async findOne(tenantId: number, id: number): Promise<AccountsPayableDto | null> {
    try {
      const account = await AccountsPayableRepository.findOne({
        where: { id, tenantId },
        relations: ['provider'],
      });

      if (!account) {
        throw new NotFoundError('AccountsPayable', id);
      }

      logger.info('Retrieved accounts payable', {
        id: account.id,
        numero_factura: account.documentNumber,
        proveedor_id: account.providerId,
        estado: account.status,
        saldo: Number(account.amount) - Number(account.amountPaid),
      });

      return toAccountsPayableDto(account);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to retrieve accounts payable',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Update accounts payable record
   *
   * Updates invoice details including payment amounts and status. Accepts only
   * Spanish snake_case field names.
   *
   * **Updatable Fields**:
   * - proveedor_id (provider - rarely changed)
   * - numero_factura (invoice number - rarely changed)
   * - fecha_emision (issue date)
   * - fecha_vencimiento (due date)
   * - monto_total (total amount)
   * - monto_pagado (paid amount - most common update)
   * - moneda (currency - cannot change after creation)
   * - estado (status - updated with payments)
   * - observaciones (notes)
   *
   * **Business Rules**:
   * - Payment amount cannot exceed total amount
   * - Due date must be >= issue date
   * - Status should match payment amount (validated separately)
   *
   * @param id - Accounts payable ID
   * @param data - Fields to update (partial)
   * @returns Updated AccountsPayableDto
   * @throws {NotFoundError} If record not found
   * @throws {ValidationError} If validation fails
   * @throws {DatabaseError} If update fails
   *
   * @example
   * ```typescript
   * // Record partial payment
   * const updated = await service.update(123, {
   *   monto_pagado: 7500.00,
   *   estado: 'PARCIAL'
   * });
   * ```
   */
  async update(
    tenantId: number,
    id: number,
    data: UpdateAccountsPayableDto
  ): Promise<AccountsPayableDto | null> {
    try {
      const accountPayable = await AccountsPayableRepository.findOne({
        where: { id, tenantId },
        relations: ['provider'],
      });

      if (!accountPayable) {
        throw new NotFoundError('AccountsPayable', id);
      }

      // Map frontend camelCase and Spanish snake_case to DTO format
      const updateData: Partial<AccountsPayableDto> = {};

      if (data.proveedor_id !== undefined || data.providerId !== undefined)
        updateData.proveedor_id = data.proveedor_id || data.providerId;
      if (data.numero_factura !== undefined || data.documentNumber !== undefined)
        updateData.numero_factura = data.numero_factura || data.documentNumber;
      if (data.fecha_emision !== undefined || data.issueDate !== undefined)
        updateData.fecha_emision = data.fecha_emision || data.issueDate;
      if (data.fecha_vencimiento !== undefined || data.dueDate !== undefined)
        updateData.fecha_vencimiento = data.fecha_vencimiento || data.dueDate;
      if (data.monto_total !== undefined || data.amount !== undefined)
        updateData.monto_total = data.monto_total || data.amount;
      if (data.monto_pagado !== undefined || data.amountPaid !== undefined)
        updateData.monto_pagado = data.monto_pagado || data.amountPaid;
      if (data.moneda !== undefined || data.currency !== undefined)
        updateData.moneda = data.moneda || data.currency;
      if (data.estado !== undefined || data.status !== undefined)
        updateData.estado = data.estado || data.status;
      if (data.observaciones !== undefined || data.description !== undefined)
        updateData.observaciones = data.observaciones || data.description;

      // Validate payment amount if being updated
      const newTotal = updateData.monto_total ?? Number(accountPayable.amount);
      const newPaid = updateData.monto_pagado ?? Number(accountPayable.amountPaid);

      if (newPaid > newTotal) {
        throw new ValidationError('Payment amount cannot exceed total amount', [
          {
            field: 'monto_pagado',
            message: `Payment amount (${newPaid}) cannot exceed total amount (${newTotal})`,
            rule: 'max',
            value: newPaid,
            constraints: { max: newTotal },
          },
        ]);
      }

      // Validate date range if dates are being updated
      if (updateData.fecha_emision || updateData.fecha_vencimiento) {
        const issueDate =
          updateData.fecha_emision || accountPayable.issueDate.toISOString().split('T')[0];
        const dueDate =
          updateData.fecha_vencimiento || accountPayable.dueDate.toISOString().split('T')[0];
        this.validateDateRange(issueDate, dueDate);
      }

      // Track changed fields for logging
      const changedFields = Object.keys(updateData);

      // Merge changes
      const entityChanges = fromAccountsPayableDto(updateData);
      AccountsPayableRepository.merge(accountPayable, entityChanges);

      const saved = await AccountsPayableRepository.save(accountPayable);

      logger.info('Updated accounts payable', {
        id: saved.id,
        numero_factura: saved.documentNumber,
        changed_fields: changedFields,
      });

      return toAccountsPayableDto(saved);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to update accounts payable',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Delete accounts payable record
   *
   * **⚠️ WARNING**: This is a HARD DELETE that permanently removes the record.
   * This destroys financial audit trail and violates accounting best practices.
   *
   * **Recommendation**: Use status ANULADO instead of delete for financial records.
   *
   * **Future Enhancement (Phase 21)**:
   * - Implement soft delete with `is_active` flag
   * - Keep all records for audit trail
   * - Use ANULADO status for cancelled invoices
   *
   * @param id - Accounts payable ID to delete
   * @returns True if deleted, false if not found
   * @throws {NotFoundError} If record not found
   * @throws {DatabaseError} If delete fails
   *
   * @example
   * ```typescript
   * const deleted = await service.delete(123);
   * // ⚠️ Record permanently deleted - prefer ANULADO status
   * ```
   */
  async delete(tenantId: number, id: number): Promise<boolean> {
    try {
      // Check if record exists
      const existing = await AccountsPayableRepository.findOne({
        where: { id, tenantId },
      });

      if (!existing) {
        throw new NotFoundError('AccountsPayable', id);
      }

      const result = await AccountsPayableRepository.delete({ id, tenantId });

      logger.warn('Hard deleted accounts payable (audit trail destroyed)', {
        id,
        numero_factura: existing.documentNumber,
        recommendation: 'Use ANULADO status instead of delete',
      });

      return result.affected !== 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to delete accounts payable',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Find all pending accounts payable
   *
   * Retrieves all invoices with status PENDIENTE, ordered by due date (earliest first).
   * Used for payment scheduling and cash flow planning.
   *
   * **Status Filter**: PENDIENTE only
   * **Ordering**: due_date ASC (most urgent first)
   * **Relations**: Provider information included
   *
   * @returns Array of pending AccountsPayableDto
   * @throws {DatabaseError} If query fails
   *
   * @example
   * ```typescript
   * const pending = await service.findPending();
   * const totalOwed = pending.reduce((sum, ap) => sum + ap.saldo, 0);
   * console.log(`Total pending: ${totalOwed}`);
   * ```
   */
  async findPending(tenantId: number): Promise<AccountsPayableDto[]> {
    try {
      const accounts = await AccountsPayableRepository.findPending(tenantId);

      const totalSaldo = accounts.reduce(
        (sum, ap) => sum + (Number(ap.amount) - Number(ap.amountPaid)),
        0
      );

      logger.info('Retrieved pending accounts payable', {
        count: accounts.length,
        total_saldo: totalSaldo,
      });

      return accounts.map((a) => toAccountsPayableDto(a));
    } catch (error) {
      throw new DatabaseError(
        'Failed to retrieve pending accounts payable',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Update payment status
   *
   * Convenience method to update only the status field. Delegates to update() method.
   *
   * **Valid Status Transitions**:
   * - PENDIENTE → PARCIAL (partial payment)
   * - PENDIENTE → PAGADO (full payment)
   * - PARCIAL → PAGADO (complete payment)
   * - PENDIENTE/PARCIAL → ANULADO (cancel)
   *
   * **Note**: This method does NOT validate status transitions or payment amounts.
   * Consider implementing validateStatusTransition() in future.
   *
   * @param id - Accounts payable ID
   * @param status - New status
   * @returns Updated AccountsPayableDto
   * @throws {NotFoundError} If record not found
   * @throws {DatabaseError} If update fails
   *
   * @example
   * ```typescript
   * // Mark as paid
   * const paid = await service.updateStatus(123, 'PAGADO');
   * ```
   */
  async updateStatus(
    tenantId: number,
    id: number,
    status: AccountsPayableStatus
  ): Promise<AccountsPayableDto | null> {
    try {
      const result = await this.update(tenantId, id, { estado: status });

      if (result) {
        logger.info('Updated accounts payable status', {
          id,
          numero_factura: result.numero_factura,
          new_status: status,
        });
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        'Failed to update accounts payable status',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Validate date range
   *
   * Ensures due date is on or after issue date.
   *
   * @param fecha_emision - Issue date (YYYY-MM-DD)
   * @param fecha_vencimiento - Due date (YYYY-MM-DD)
   * @throws {ValidationError} If due date < issue date
   * @private
   */
  private validateDateRange(fecha_emision: string, fecha_vencimiento: string): void {
    const issueDate = new Date(fecha_emision);
    const dueDate = new Date(fecha_vencimiento);

    if (dueDate < issueDate) {
      throw new ValidationError('Due date must be on or after issue date', [
        {
          field: 'fecha_vencimiento',
          message: `Due date (${fecha_vencimiento}) must be on or after issue date (${fecha_emision})`,
          rule: 'dateRange',
          value: fecha_vencimiento,
          constraints: { minDate: fecha_emision },
        },
      ]);
    }
  }
}
