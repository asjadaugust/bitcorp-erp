import { AppDataSource } from '../config/database.config';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { SecurityUtil, JwtPayload } from '../utils/security.util';
import { ValidationUtil } from '../utils/validation.util';
import Logger from '../utils/logger';

export interface RegisterDto {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    roles: string[];
  };
  access_token: string;
  refresh_token: string;
}

export class AuthService {
  private get userRepository() {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(User);
  }

  private get roleRepository() {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Role);
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    // Validate input
    if (!ValidationUtil.isValidUsername(data.username)) {
      throw new Error('Invalid username format');
    }
    if (!ValidationUtil.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }
    if (!ValidationUtil.isValidPassword(data.password)) {
      throw new Error(
        'Password must be at least 8 characters with uppercase, lowercase, and number'
      );
    }

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username: data.username }, { email: data.email }],
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    // Hash password
    const password_hash = await SecurityUtil.hashPassword(data.password);

    // Get default role (operator)
    const operatorRole = await this.roleRepository.findOne({
      where: { code: 'operador' },
    });

    if (!operatorRole) {
      throw new Error('Default role not found');
    }

    // Create user
    const user = this.userRepository.create({
      ...data,
      password_hash,
      roles: [operatorRole],
    });

    await this.userRepository.save(user);

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    Logger.debug('Login attempt started', {
      username: data.username,
      context: 'AuthService.login',
    });

    // Find user with password and roles
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.username = :username', { username: data.username })
      .getOne();

    if (user) {
      Logger.debug('User fetched from database', {
        username: user.username,
        roles: user.roles?.map((r) => r.code),
        hasPassword: !!user.password_hash,
        context: 'AuthService.login',
      });
    }

    if (!user) {
      Logger.warn('Login failed - user not found', {
        username: data.username,
        context: 'AuthService.login',
      });
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await SecurityUtil.comparePassword(data.password, user.password_hash);

    Logger.debug('Password verification completed', {
      username: user.username,
      isValid: isValidPassword,
      context: 'AuthService.login',
    });

    if (!isValidPassword) {
      Logger.warn('Login failed - invalid password', {
        username: data.username,
        context: 'AuthService.login',
      });
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.last_login = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = SecurityUtil.verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findOne({
        where: { id: parseInt(String(payload.userId)) },
        relations: ['roles'],
      });

      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  private generateAuthResponse(user: User): AuthResponse {
    Logger.debug('Generating authentication response', {
      username: user.username,
      userId: user.id,
      roleCount: user.roles?.length || 0,
      context: 'AuthService.generateAuthResponse',
    });

    const roleCodes =
      user.roles?.map((r) => {
        Logger.debug('Processing user role', {
          roleName: r.name,
          roleCode: r.code,
          username: user.username,
          context: 'AuthService.generateAuthResponse',
        });
        return r.code || r.name;
      }) || [];

    Logger.debug('Authentication tokens generated', {
      username: user.username,
      roles: roleCodes,
      context: 'AuthService.generateAuthResponse',
    });

    const payload: JwtPayload = {
      userId: String(user.id),
      username: user.username,
      email: user.email,
      roles: roleCodes,
    };

    return {
      user: {
        id: String(user.id),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        roles: roleCodes,
      },
      access_token: SecurityUtil.generateAccessToken(payload),
      refresh_token: SecurityUtil.generateRefreshToken(payload),
    };
  }
}
