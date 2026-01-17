import { AppError } from './base.error';

/**
 * Business Rule Error (422)
 *
 * Represents violations of business logic rules.
 *
 * Business rules are domain-specific constraints that go beyond
 * basic validation. They represent the core business logic of the application.
 *
 * Examples:
 * - Cannot delete a project with active equipment assignments
 * - Cannot approve a valuation without operator signature
 * - Cannot schedule maintenance on equipment that is in use
 * - Cannot assign operator to multiple projects on the same date
 * - Budget allocation exceeds available funds
 * - Cannot close a project with pending tasks
 *
 * Usage:
 *   if (project.hasActiveEquipment()) {
 *     throw new BusinessRuleError(
 *       'Cannot delete project with active equipment',
 *       'PROJECT_HAS_ACTIVE_EQUIPMENT',
 *       { projectId: project.id, equipmentCount: project.activeEquipmentCount }
 *     );
 *   }
 */
export class BusinessRuleError extends AppError {
  /**
   * Machine-readable error code for this business rule
   *
   * Examples:
   * - PROJECT_HAS_ACTIVE_EQUIPMENT
   * - BUDGET_EXCEEDED
   * - OPERATOR_ALREADY_ASSIGNED
   * - INVALID_DATE_RANGE
   * - EQUIPMENT_IN_USE
   */
  public readonly code: string;

  /**
   * Entity or resource involved in the violation
   */
  public readonly entity?: string;

  /**
   * Suggested action to resolve the error
   */
  public readonly suggestedAction?: string;

  constructor(
    message: string,
    code: string,
    metadata?: Record<string, unknown>,
    suggestedAction?: string
  ) {
    super(message, 422, true, { code, ...metadata });
    this.code = code;
    this.entity = metadata?.entity as string | undefined;
    this.suggestedAction = suggestedAction;
  }

  getUserMessage(): string {
    if (this.suggestedAction) {
      return `${this.message}. ${this.suggestedAction}`;
    }
    return this.message;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      code: this.code,
      ...(this.entity && { entity: this.entity }),
      ...(this.suggestedAction && { suggestedAction: this.suggestedAction }),
    };
  }

  // Common business rule error factories

  /**
   * Entity has dependencies that prevent deletion
   */
  static cannotDelete(
    entity: string,
    reason: string,
    dependencies?: Record<string, unknown>
  ): BusinessRuleError {
    const message = `Cannot delete ${entity}: ${reason}`;
    return new BusinessRuleError(
      message,
      'CANNOT_DELETE_WITH_DEPENDENCIES',
      { entity, ...dependencies },
      `Remove or reassign dependencies before deleting ${entity}`
    );
  }

  /**
   * Entity state does not allow the operation
   */
  static invalidState(
    entity: string,
    currentState: string,
    operation: string,
    allowedStates: string[]
  ): BusinessRuleError {
    const message = `Cannot ${operation} ${entity} in ${currentState} state`;
    return new BusinessRuleError(
      message,
      'INVALID_STATE',
      { entity, currentState, operation, allowedStates },
      `${entity} must be in one of these states: ${allowedStates.join(', ')}`
    );
  }

  /**
   * Resource limit exceeded
   */
  static limitExceeded(
    resource: string,
    limit: number,
    current: number,
    requested: number
  ): BusinessRuleError {
    const message = `${resource} limit exceeded: ${current + requested} / ${limit}`;
    return new BusinessRuleError(
      message,
      'LIMIT_EXCEEDED',
      { resource, limit, current, requested },
      `Reduce usage or increase ${resource} limit`
    );
  }

  /**
   * Budget or financial constraint exceeded
   */
  static budgetExceeded(budget: number, allocated: number, requested: number): BusinessRuleError {
    const remaining = budget - allocated;
    const message = `Budget exceeded: requested ${requested}, available ${remaining}`;
    return new BusinessRuleError(
      message,
      'BUDGET_EXCEEDED',
      { budget, allocated, requested, remaining },
      'Reduce requested amount or increase budget'
    );
  }

  /**
   * Date range conflict
   */
  static dateConflict(
    entity: string,
    requestedStart: Date,
    requestedEnd: Date,
    conflictingEntity?: string
  ): BusinessRuleError {
    const message = conflictingEntity
      ? `${entity} dates conflict with ${conflictingEntity}`
      : `${entity} dates are invalid`;
    return new BusinessRuleError(
      message,
      'DATE_CONFLICT',
      {
        entity,
        requestedStart: requestedStart.toISOString(),
        requestedEnd: requestedEnd.toISOString(),
        conflictingEntity,
      },
      'Choose different dates'
    );
  }

  /**
   * Resource already in use
   */
  static resourceInUse(
    resource: string,
    resourceId: string | number,
    usedBy?: string
  ): BusinessRuleError {
    const message = usedBy
      ? `${resource} is currently in use by ${usedBy}`
      : `${resource} is currently in use`;
    return new BusinessRuleError(
      message,
      'RESOURCE_IN_USE',
      { resource, resourceId, usedBy },
      'Wait until resource is available or choose a different one'
    );
  }

  /**
   * Duplicate assignment
   */
  static duplicateAssignment(
    entity: string,
    assignee: string,
    context?: string
  ): BusinessRuleError {
    const message = context
      ? `${assignee} is already assigned to ${entity} in ${context}`
      : `${assignee} is already assigned to ${entity}`;
    return new BusinessRuleError(
      message,
      'DUPLICATE_ASSIGNMENT',
      { entity, assignee, context },
      'Remove existing assignment first'
    );
  }

  /**
   * Required approval missing
   */
  static approvalRequired(
    entity: string,
    requiredApprover: string,
    operation?: string
  ): BusinessRuleError {
    const message = operation
      ? `${entity} requires approval from ${requiredApprover} before ${operation}`
      : `${entity} requires approval from ${requiredApprover}`;
    return new BusinessRuleError(
      message,
      'APPROVAL_REQUIRED',
      { entity, requiredApprover, operation },
      `Request approval from ${requiredApprover}`
    );
  }

  /**
   * Incomplete or missing data
   */
  static incompleteData(
    entity: string,
    missingFields: string[],
    operation?: string
  ): BusinessRuleError {
    const message = operation
      ? `Cannot ${operation} ${entity}: missing required data`
      : `${entity} is incomplete`;
    return new BusinessRuleError(
      message,
      'INCOMPLETE_DATA',
      { entity, missingFields, operation },
      `Complete the following fields: ${missingFields.join(', ')}`
    );
  }

  /**
   * Operation not allowed in current context
   */
  static notAllowed(entity: string, operation: string, reason: string): BusinessRuleError {
    const message = `Cannot ${operation} ${entity}: ${reason}`;
    return new BusinessRuleError(message, 'OPERATION_NOT_ALLOWED', { entity, operation, reason });
  }
}
