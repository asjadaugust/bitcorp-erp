import { AppDataSource } from '../config/database.config';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { SecurityUtil, JwtPayload } from '../utils/security.util';
import { ValidationUtil } from '../utils/validation.util';

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
      where: { name: 'operador' },
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
    console.log(`Login attempt for username: ${data.username}`);
    // Find user with password and roles
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.username = :username', { username: data.username })
      .getOne();

    if (user) {
      console.log('User fetched from DB:', user.username);
      console.log(
        'Roles fetched:',
        user.roles?.map((r) => r.code)
      );
    }

    if (!user) {
      console.log('User not found');
      throw new Error('Invalid credentials');
    }

    console.log(
      `User found: ${user.username}, Hash: ${user.password_hash ? 'Present' : 'Missing'}`
    );

    // Verify password
    const isValidPassword = await SecurityUtil.comparePassword(data.password, user.password_hash);

    console.log(`Password valid: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('Password mismatch');
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
        where: { id: payload.userId as any },
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
    console.log('Generating auth response for user:', user.username);
    console.log('User roles:', JSON.stringify(user.roles, null, 2));
    const roleCodes = user.roles?.map((r) => {
      console.log(`Role: ${r.name}, Code: ${r.code}`);
      return r.code || r.name;
    }) || [];
    console.log('Final role codes:', roleCodes);
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
