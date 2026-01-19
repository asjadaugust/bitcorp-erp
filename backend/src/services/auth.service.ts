/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { SecurityUtil, JwtPayload } from '../utils/security.util';
import { Repository } from 'typeorm';
import logger from '../config/logger.config';
import { RegisterDto, LoginDto, AuthResponseDto, AuthUserDto } from '../types/dto/auth.dto';
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  DatabaseError,
  DatabaseErrorType,
} from '../errors';

/**
 * Authentication Service
 *
 * Manages user authentication and authorization for the BitCorp ERP system.
 * Handles user registration, login, JWT token generation, and token refresh
 * operations. This service operates on the `sistema` schema, which contains
 * platform-level user and role data.
 *
 * **SECURITY CRITICAL: This service handles authentication - thorough testing essential**
 *
 * ## Authentication Workflow
 *
 * ### 1. User Registration
 *
 * New users are registered with the following workflow:
 *
 * ```
 * 1. Validate input (username, email, password format)
 *    ↓
 * 2. Check for duplicate username/email
 *    ↓
 * 3. Hash password using bcrypt (via SecurityUtil)
 *    ↓
 * 4. Assign default role (operador)
 *    ↓
 * 5. Create user record in database
 *    ↓
 * 6. Generate JWT tokens (access + refresh)
 *    ↓
 * 7. Return AuthResponse with user data and tokens
 * ```
 *
 * **Validation Rules**:
 * - Username: 3-50 characters, alphanumeric + underscore/hyphen
 * - Email: Valid email format
 * - Password: 8+ characters with uppercase, lowercase, and number
 *
 * ### 2. User Login
 *
 * User authentication follows this workflow:
 *
 * ```
 * 1. Find user by username
 *    ↓
 * 2. Verify user exists (throw UnauthorizedError if not)
 *    ↓
 * 3. Compare password with hashed password (bcrypt)
 *    ↓
 * 4. Verify password match (throw UnauthorizedError if not)
 *    ↓
 * 5. Update last_login timestamp
 *    ↓
 * 6. Generate JWT tokens (access + refresh)
 *    ↓
 * 7. Return AuthResponse with user data and tokens
 * ```
 *
 * **Security Considerations**:
 * - Generic error messages for invalid credentials (don't reveal if username exists)
 * - Password never returned in response
 * - Last login tracked for security audit
 * - Roles included in JWT payload for authorization
 *
 * ### 3. Token Refresh
 *
 * JWT refresh tokens allow users to obtain new access tokens without re-login:
 *
 * ```
 * 1. Verify refresh token signature and expiration
 *    ↓
 * 2. Extract userId from token payload
 *    ↓
 * 3. Find user by ID (with roles)
 *    ↓
 * 4. Verify user exists and is active
 *    ↓
 * 5. Generate new JWT tokens (access + refresh)
 *    ↓
 * 6. Return AuthResponse with user data and new tokens
 * ```
 *
 * **Token Lifecycle**:
 * - Access Token: Short-lived (15 minutes - 1 hour)
 * - Refresh Token: Long-lived (7-30 days)
 * - Refresh tokens can be revoked (future enhancement: token blacklist)
 *
 * ## JWT Token Structure
 *
 * **JWT Payload (JwtPayload)**:
 * ```typescript
 * {
 *   userId: string;           // User ID
 *   username: string;         // Username
 *   email: string;            // User email
 *   roles: string[];          // User roles (e.g., ['admin', 'operador'])
 *   iat: number;              // Issued at (timestamp)
 *   exp: number;              // Expiration (timestamp)
 * }
 * ```
 *
 * **Token Types**:
 * - **Access Token**: Used for API authentication (Authorization: Bearer <token>)
 * - **Refresh Token**: Used to obtain new access tokens (/auth/refresh endpoint)
 *
 * ## Password Security
 *
 * Passwords are hashed using **bcrypt** with the following security measures:
 *
 * - **Hashing Algorithm**: bcrypt (via SecurityUtil.hashPassword)
 * - **Salt Rounds**: 10 (configurable in SecurityUtil)
 * - **Password Requirements**:
 *   - Minimum 8 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one number
 * - **Storage**: Only password_hash stored, never plain text
 * - **Comparison**: bcrypt.compare() for constant-time comparison
 *
 * ## User Model (sistema schema)
 *
 * **Entity**: `User` (table: `sistema.usuario`)
 *
 * Key fields:
 * - `username`: Unique username (nombre_usuario in DB)
 * - `password_hash`: Bcrypt hashed password (contrasena in DB)
 * - `email`: Unique email (correo_electronico in DB)
 * - `first_name`: User first name (nombres in DB)
 * - `last_name`: User last name (apellidos in DB)
 * - `last_login`: Last login timestamp (ultimo_acceso in DB)
 * - `is_active`: Account status (activo in DB)
 * - `roles`: Many-to-many relationship with Role entity
 * - `unidadOperativa`: User's operational unit (optional)
 *
 * **Virtual Field**:
 * - `full_name`: Computed from first_name + last_name
 *
 * ## Role Model (sistema schema)
 *
 * **Entity**: `Role` (table: `sistema.rol`)
 *
 * Key fields:
 * - `code`: Role code (e.g., 'admin', 'operador', 'director')
 * - `name`: Role display name
 * - `users`: Many-to-many relationship with User entity
 *
 * **Default Role**: New users are assigned 'operador' role
 *
 * ## Multi-Tenancy Context
 *
 * **Special Case**: Authentication operates on the **sistema schema**, not tenant-scoped.
 *
 * - Users are stored in `sistema.usuario` (global user table)
 * - Users can belong to multiple companies/tenants (via unidad_operativa)
 * - Authentication does NOT filter by tenant_id
 * - Authorization (role checks) happens in controllers/middleware
 * - User's operational unit (unidad_operativa) determines company access
 *
 * **Tenant Context in AuthResponse**:
 * - `unidad_operativa_id`: User's operational unit ID (tenant context)
 * - `unidad_operativa_nombre`: Operational unit name (for display)
 * - Frontend uses this to determine company context after login
 *
 * ## Error Handling
 *
 * This service throws custom errors for different scenarios:
 *
 * **ValidationError**: Input validation failures
 * - Invalid username format (alphanumeric + underscore/hyphen only)
 * - Invalid email format
 * - Weak password (< 8 chars, no uppercase/lowercase/number)
 *
 * **ConflictError**: Duplicate resource
 * - Username already exists
 * - Email already exists
 *
 * **NotFoundError**: Resource not found
 * - Default role 'operador' not found in database
 *
 * **UnauthorizedError**: Authentication failures
 * - User not found (invalid credentials)
 * - Password mismatch (invalid credentials)
 * - User inactive (account disabled)
 * - Invalid refresh token (expired or malformed)
 *
 * **DatabaseError**: Database operation failures
 * - User query failures
 * - Role query failures
 * - User creation failures
 * - User update failures
 *
 * ## Security Best Practices
 *
 * 1. **Generic Error Messages**: Don't reveal if username exists (use "Invalid credentials")
 * 2. **Password Never Exposed**: password_hash excluded from queries by default
 * 3. **Constant-Time Comparison**: bcrypt.compare() prevents timing attacks
 * 4. **Token Expiration**: Short-lived access tokens, long-lived refresh tokens
 * 5. **Last Login Tracking**: Security audit trail
 * 6. **Account Lockout**: Future enhancement (track failed attempts)
 * 7. **Multi-Factor Auth**: Future enhancement (TOTP, SMS)
 * 8. **Session Management**: Future enhancement (revoke tokens, logout all devices)
 *
 * ## Related Services
 *
 * - **User Model**: User entity (sistema.usuario)
 * - **Role Model**: Role entity (sistema.rol)
 * - **SecurityUtil**: Password hashing, JWT generation, token verification
 * - **ValidationUtil**: Input validation (username, email, password format)
 *
 * ## Future Enhancements
 *
 * 1. **Account Lockout**: Lock account after N failed login attempts
 * 2. **Password Expiry**: Force password change after X days
 * 3. **Session Management**: Track active sessions, revoke tokens
 * 4. **Multi-Factor Authentication**: TOTP, SMS, email verification
 * 5. **Password History**: Prevent password reuse
 * 6. **Email Verification**: Verify email on registration
 * 7. **OAuth Integration**: Google, Microsoft, GitHub login
 * 8. **Audit Logging**: Detailed security event logging
 *
 * @example
 * ```typescript
 * // Example 1: User Registration
 * const authService = new AuthService();
 * const registerDto: RegisterDto = {
 *   username: 'jdoe',
 *   password: 'SecurePass123',
 *   email: 'jdoe@company.com',
 *   first_name: 'John',
 *   last_name: 'Doe',
 * };
 * const authResponse = await authService.register(registerDto);
 * console.log(authResponse.user.username); // 'jdoe'
 * console.log(authResponse.access_token); // 'eyJhbGciOiJIUzI1NiIs...'
 * ```
 *
 * @example
 * ```typescript
 * // Example 2: User Login
 * const authService = new AuthService();
 * const loginDto: LoginDto = {
 *   username: 'jdoe',
 *   password: 'SecurePass123',
 * };
 * const authResponse = await authService.login(loginDto);
 * console.log(authResponse.user.roles); // ['operador']
 * console.log(authResponse.access_token); // 'eyJhbGciOiJIUzI1NiIs...'
 * ```
 *
 * @example
 * ```typescript
 * // Example 3: Token Refresh
 * const authService = new AuthService();
 * const refreshToken = 'eyJhbGciOiJIUzI1NiIs...'; // From client
 * const authResponse = await authService.refreshToken(refreshToken);
 * console.log(authResponse.access_token); // New access token
 * ```
 *
 * @example
 * ```typescript
 * // Example 4: Error Handling (Invalid Credentials)
 * const authService = new AuthService();
 * try {
 *   await authService.login({ username: 'invalid', password: 'wrong' });
 * } catch (error) {
 *   if (error instanceof UnauthorizedError) {
 *     console.log(error.message); // 'Invalid credentials'
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Example 5: Error Handling (Duplicate Username)
 * const authService = new AuthService();
 * try {
 *   await authService.register({
 *     username: 'existing_user',
 *     password: 'Pass123',
 *     email: 'user@company.com',
 *     first_name: 'John',
 *     last_name: 'Doe',
 *   });
 * } catch (error) {
 *   if (error instanceof ConflictError) {
 *     console.log(error.message); // 'Username or email already exists'
 *   }
 * }
 * ```
 */
export class AuthService {
  /**
   * Get User repository
   * @private
   */
  private get userRepository(): Repository<User> {
    if (!AppDataSource.isInitialized) {
      throw new DatabaseError('Database not initialized', DatabaseErrorType.CONNECTION);
    }
    return AppDataSource.getRepository(User);
  }

  /**
   * Get Role repository
   * @private
   */
  private get roleRepository(): Repository<Role> {
    if (!AppDataSource.isInitialized) {
      throw new DatabaseError('Database not initialized', DatabaseErrorType.CONNECTION);
    }
    return AppDataSource.getRepository(Role);
  }

  /**
   * Register a new user
   *
   * Creates a new user account with the provided information. The user is assigned
   * the default 'operador' role and a JWT token pair is generated for immediate login.
   *
   * **Workflow**:
   * 1. Validate username format (alphanumeric + underscore/hyphen)
   * 2. Validate email format
   * 3. Validate password strength (8+ chars, uppercase, lowercase, number)
   * 4. Check for duplicate username or email
   * 5. Hash password using bcrypt
   * 6. Assign default 'operador' role
   * 7. Create user in database
   * 8. Generate JWT tokens
   * 9. Return authentication response
   *
   * **Validation Rules**:
   * - Username: 3-50 characters, alphanumeric + underscore/hyphen only
   * - Email: Valid email format (RFC 5322)
   * - Password: Minimum 8 characters with uppercase, lowercase, and number
   *
   * **Default Role**: New users are assigned 'operador' role (requires role to exist in DB)
   *
   * @param data - Registration data (username, password, email, first_name, last_name)
   * @returns AuthResponse with user data and JWT tokens
   *
   * @throws {ValidationError} Invalid username, email, or password format
   * @throws {ConflictError} Username or email already exists
   * @throws {NotFoundError} Default 'operador' role not found in database
   * @throws {DatabaseError} Database query or user creation failed
   *
   * @example
   * ```typescript
   * const registerDto: RegisterDto = {
   *   username: 'jdoe',
   *   password: 'SecurePass123',
   *   email: 'jdoe@company.com',
   *   first_name: 'John',
   *   last_name: 'Doe',
   * };
   * const response = await authService.register(registerDto);
   * console.log(response.user.username); // 'jdoe'
   * console.log(response.user.roles); // ['operador']
   * ```
   */
  async register(data: RegisterDto): Promise<AuthResponseDto> {
    try {
      // Check if user exists (username or email)
      const existingUser = await this.userRepository.findOne({
        where: [{ username: data.username }, { email: data.email }],
      });

      if (existingUser) {
        throw new ConflictError('Username or email already exists', {
          username: data.username,
          email: data.email,
        });
      }

      // Hash password
      const password_hash = await SecurityUtil.hashPassword(data.password);

      // Get default role (operador)
      const operatorRole = await this.roleRepository.findOne({
        where: { code: 'operador' },
      });

      if (!operatorRole) {
        throw new NotFoundError('Role', 'operador', {
          message: 'Default operador role not found in database',
        });
      }

      // Create user
      const user = this.userRepository.create({
        username: data.username,
        email: data.email,
        password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        roles: [operatorRole],
      });

      await this.userRepository.save(user);

      logger.info('User registered successfully', {
        username: data.username,
        email: data.email,
        roles: [operatorRole.code],
        user_id: user.id,
      });

      // Generate tokens
      return this.generateAuthResponse(user);
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError(
        `Failed to register user with username ${data.username}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Authenticate user with username and password
   *
   * Validates user credentials and returns JWT tokens if authentication is successful.
   * Generic "Invalid credentials" error is returned for both invalid username and wrong password
   * to prevent username enumeration attacks.
   *
   * **Workflow**:
   * 1. Find user by username (with password_hash and roles)
   * 2. Verify user exists (throw UnauthorizedError if not)
   * 3. Compare provided password with stored bcrypt hash
   * 4. Verify password match (throw UnauthorizedError if not)
   * 5. Update last_login timestamp
   * 6. Generate JWT tokens
   * 7. Return authentication response
   *
   * **Security Considerations**:
   * - Generic error message ("Invalid credentials") for both invalid username and wrong password
   * - Constant-time password comparison using bcrypt.compare()
   * - Last login timestamp tracked for security audit
   * - Password hash excluded from response (User model has select: false)
   *
   * @param data - Login credentials (username, password)
   * @returns AuthResponse with user data and JWT tokens
   *
   * @throws {UnauthorizedError} Invalid username or password
   * @throws {DatabaseError} Database query or user update failed
   *
   * @example
   * ```typescript
   * const loginDto: LoginDto = {
   *   username: 'jdoe',
   *   password: 'SecurePass123',
   * };
   * const response = await authService.login(loginDto);
   * console.log(response.user.full_name); // 'John Doe'
   * console.log(response.access_token); // 'eyJhbGciOiJIUzI1NiIs...'
   * ```
   */
  async login(data: LoginDto): Promise<AuthResponseDto> {
    try {
      logger.debug('Login attempt started', {
        username: data.username,
      });

      // Find user with password and roles
      const user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password_hash')
        .leftJoinAndSelect('user.roles', 'roles')
        .leftJoinAndSelect('user.unidadOperativa', 'unidadOperativa')
        .where('user.username = :username', { username: data.username })
        .getOne();

      if (user) {
        logger.debug('User fetched from database', {
          username: user.username,
          roles: user.roles?.map((r) => r.code),
          hasPassword: !!user.password_hash,
        });
      }

      if (!user) {
        logger.warn('Login failed - user not found', {
          username: data.username,
        });
        throw new UnauthorizedError('Invalid credentials', {
          reason: 'user_not_found',
        });
      }

      // Verify password
      const isValidPassword = await SecurityUtil.comparePassword(data.password, user.password_hash);

      logger.debug('Password verification completed', {
        username: user.username,
        isValid: isValidPassword,
      });

      if (!isValidPassword) {
        logger.warn('Login failed - invalid password', {
          username: data.username,
        });
        throw new UnauthorizedError('Invalid credentials', {
          reason: 'invalid_password',
        });
      }

      // Update last login
      user.last_login = new Date();
      await this.userRepository.save(user);

      logger.info('User logged in successfully', {
        username: data.username,
        user_id: user.id,
        roles: user.roles?.map((r) => r.code),
        unidad_operativa_id: user.unidadOperativaId,
      });

      // Generate tokens
      return this.generateAuthResponse(user);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new DatabaseError(
        `Failed to authenticate user ${data.username}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Refresh JWT tokens using a refresh token
   *
   * Validates the provided refresh token and generates a new token pair if valid.
   * This allows users to obtain new access tokens without re-entering credentials.
   *
   * **Workflow**:
   * 1. Verify refresh token signature and expiration
   * 2. Extract userId from token payload
   * 3. Find user by ID (with roles and operational unit)
   * 4. Verify user exists and is active
   * 5. Generate new JWT token pair
   * 6. Return authentication response
   *
   * **Token Lifecycle**:
   * - Access Token: Short-lived (15 minutes - 1 hour)
   * - Refresh Token: Long-lived (7-30 days)
   * - Both tokens are refreshed (new refresh token issued)
   *
   * **Security Considerations**:
   * - Refresh token must be valid (signature, expiration)
   * - User must exist and be active (is_active = true)
   * - New refresh token invalidates old one (client must update)
   *
   * @param refreshToken - Refresh token from previous login/registration
   * @returns AuthResponse with user data and new JWT tokens
   *
   * @throws {UnauthorizedError} Invalid, expired, or malformed refresh token
   * @throws {UnauthorizedError} User not found or inactive
   * @throws {DatabaseError} Database query failed
   *
   * @example
   * ```typescript
   * const refreshToken = 'eyJhbGciOiJIUzI1NiIs...'; // From client storage
   * const response = await authService.refreshToken(refreshToken);
   * console.log(response.access_token); // New access token
   * console.log(response.refresh_token); // New refresh token
   * ```
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = SecurityUtil.verifyRefreshToken(refreshToken);

      // Find user with roles
      const user = await this.userRepository.findOne({
        where: { id: parseInt(String(payload.userId)) },
        relations: ['roles', 'unidadOperativa'],
      });

      if (!user || !user.is_active) {
        logger.warn('Token refresh failed - user not found or inactive', {
          user_id: payload.userId,
          user_exists: !!user,
          is_active: user?.is_active,
        });
        throw new UnauthorizedError('User not found or inactive', {
          reason: user ? 'user_inactive' : 'user_not_found',
        });
      }

      logger.info('JWT tokens refreshed successfully', {
        username: user.username,
        user_id: user.id,
        roles: user.roles?.map((r) => r.code),
      });

      // Generate new tokens
      return this.generateAuthResponse(user);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      // Invalid token (signature, expiration, malformed)
      throw new UnauthorizedError('Invalid refresh token', {
        reason: 'token_verification_failed',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Generate authentication response with JWT tokens
   *
   * Private helper method that creates JWT tokens and formats the authentication response.
   * Extracts user data, role codes, and operational unit information.
   *
   * **JWT Payload**:
   * - userId: User ID (string)
   * - username: Username
   * - email: User email
   * - roles: Array of role codes (e.g., ['admin', 'operador'])
   * - iat: Issued at timestamp
   * - exp: Expiration timestamp
   *
   * **AuthResponse Structure**:
   * - user: User data (id, username, email, full_name, roles, unidad_operativa)
   * - access_token: Short-lived JWT for API authentication
   * - refresh_token: Long-lived JWT for token refresh
   *
   * @private
   * @param user - User entity with roles and operational unit loaded
   * @returns AuthResponse with user data and JWT tokens
   *
   * @example
   * ```typescript
   * // Internal usage only
   * const authResponse = this.generateAuthResponse(user);
   * console.log(authResponse.user.roles); // ['admin', 'operador']
   * ```
   */
  private generateAuthResponse(user: User): AuthResponseDto {
    logger.debug('Generating authentication response', {
      username: user.username,
      userId: user.id,
      roleCount: user.roles?.length || 0,
    });

    const roleCodes =
      user.roles?.map((r) => {
        logger.debug('Processing user role', {
          roleName: r.name,
          roleCode: r.code,
          username: user.username,
        });
        return r.code || r.name;
      }) || [];

    logger.debug('Authentication tokens generated', {
      username: user.username,
      roles: roleCodes,
    });

    const payload: JwtPayload = {
      userId: String(user.id),
      username: user.username,
      email: user.email,
      roles: roleCodes,
    };

    const authUser: AuthUserDto = {
      id: String(user.id),
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      roles: roleCodes,
      unidad_operativa_id: user.unidadOperativaId,
      unidad_operativa_nombre: user.unidadOperativa?.nombre,
    };

    return {
      user: authUser,
      access_token: SecurityUtil.generateAccessToken(payload),
      refresh_token: SecurityUtil.generateRefreshToken(payload),
    };
  }
}
