/**
 * Role Type Definitions and Constants
 *
 * This file defines the authoritative list of user roles in the system.
 * Use these constants instead of string literals to ensure type safety
 * and catch role misuse at compile time.
 *
 * @example
 * // Backend route protection
 * router.get('/admin', authorize(ROLES.ADMIN), handler);
 *
 * // Multiple roles
 * router.get('/equipment', authorize(ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO), handler);
 */

/**
 * System role codes as defined in the database (sistema.rol.codigo)
 */
export const ROLES = {
  /** Administrator - Full system access */
  ADMIN: 'ADMIN',

  /** Project Director - Project-level management access */
  DIRECTOR: 'DIRECTOR',

  /** Team Leader - Department/team-level access */
  JEFE_EQUIPO: 'JEFE_EQUIPO',

  /** Field Operator - Mobile app access only */
  OPERADOR: 'OPERADOR',
} as const;

/**
 * Role type - ensures only valid role codes are used
 *
 * @example
 * function checkRole(role: Role) { ... }
 * checkRole('ADMIN'); // ✅ Valid
 * checkRole('invalid'); // ❌ TypeScript error
 */
export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Array of all valid roles - useful for iteration or validation
 */
export const ALL_ROLES: readonly Role[] = Object.values(ROLES);

/**
 * Type guard to check if a string is a valid role
 *
 * @example
 * if (isValidRole(input)) {
 *   // TypeScript now knows input is Role
 * }
 */
export function isValidRole(value: string): value is Role {
  return ALL_ROLES.includes(value as Role);
}

/**
 * Role display names for UI (Spanish)
 */
export const ROLE_NAMES: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrador del Sistema',
  [ROLES.DIRECTOR]: 'Director de Proyecto',
  [ROLES.JEFE_EQUIPO]: 'Jefe de Equipo',
  [ROLES.OPERADOR]: 'Operador de Equipos',
};

/**
 * Get display name for a role
 */
export function getRoleName(role: Role): string {
  return ROLE_NAMES[role];
}

/**
 * Role hierarchy levels (higher number = more permissions)
 * Useful for permission comparison
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.OPERADOR]: 1,
  [ROLES.JEFE_EQUIPO]: 2,
  [ROLES.DIRECTOR]: 3,
  [ROLES.ADMIN]: 4,
};

/**
 * Check if a role has at least the same level as another role
 *
 * @example
 * hasRoleLevel('ADMIN', 'DIRECTOR') // true
 * hasRoleLevel('OPERADOR', 'ADMIN') // false
 */
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
