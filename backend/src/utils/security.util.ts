import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * JWT Payload Structure for Multi-Tenant Authentication
 *
 * This payload follows the BitCorp ERP multi-tenancy architecture where:
 * - Each user belongs to ONE company (tenant)
 * - Each user has ONE primary role
 * - Tenant context is embedded in JWT for isolation
 *
 * @see MULTITENANCY.md for architecture details
 */
export interface JwtPayload {
  id_usuario: number; // User ID
  id_empresa: number; // Company/Tenant ID (enables tenant isolation)
  codigo_empresa: string; // Company code (e.g., "aramsa", "cosapi")
  username: string; // Username for login
  email: string; // User email
  rol: string; // Primary role (ADMIN, DIRECTOR, JEFE_EQUIPO, OPERADOR)
  nombre_completo: string; // Full name (for UI display)
  iat?: number; // Issued at timestamp (added by jwt.sign)
  exp?: number; // Expiration timestamp (added by jwt.sign)
}

export class SecurityUtil {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(payload: JwtPayload): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
  }

  static generateRefreshToken(payload: JwtPayload): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  }
}
