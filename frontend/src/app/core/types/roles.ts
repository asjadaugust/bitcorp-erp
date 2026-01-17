/**
 * Role Type Definitions and Constants (Frontend)
 *
 * This file defines the authoritative list of user roles in the system.
 * Use these constants instead of string literals to ensure type safety
 * and catch role misuse at compile time.
 *
 * Must match backend role definitions in backend/src/types/roles.ts
 *
 * @example
 * // Component role check
 * if (user.roles.includes(ROLES.ADMIN)) { ... }
 *
 * // Route data
 * { path: 'admin', canActivate: [roleGuard], data: { roles: [ROLES.ADMIN] } }
 */

/**
 * System role codes as defined in the database (sistema.rol.codigo)
 */
export const ROLES = {
  /** Administrator - Full system access */
  ADMIN: 'ADMIN' as const,

  /** Project Director - Project-level management access */
  DIRECTOR: 'DIRECTOR' as const,

  /** Team Leader - Department/team-level access */
  JEFE_EQUIPO: 'JEFE_EQUIPO' as const,

  /** Field Operator - Mobile app access only */
  OPERADOR: 'OPERADOR' as const,
};

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
export const ALL_ROLES: readonly Role[] = Object.values(ROLES) as Role[];

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

/**
 * Legacy lowercase role codes for backward compatibility
 * @deprecated Use uppercase ROLES constants instead
 */
export const LEGACY_ROLES = {
  admin: ROLES.ADMIN,
  director: ROLES.DIRECTOR,
  jefe_equipo: ROLES.JEFE_EQUIPO,
  operador: ROLES.OPERADOR,
} as const;

/**
 * Normalize a role string to uppercase format
 * Handles both old lowercase and new uppercase formats
 */
export function normalizeRole(role: string): Role | null {
  const upper = role.toUpperCase();
  if (isValidRole(upper)) {
    return upper as Role;
  }

  // Try legacy mapping
  const legacy = role.toLowerCase() as keyof typeof LEGACY_ROLES;
  if (legacy in LEGACY_ROLES) {
    return LEGACY_ROLES[legacy];
  }

  return null;
}
