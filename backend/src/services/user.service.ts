/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { Repository } from 'typeorm';
import { SecurityUtil } from '../utils/security.util';
import Logger from '../utils/logger';
import { CreateUserDto, UpdateUserDto } from '../types/dto/user.dto';

export class UserService {
  private get userRepository(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  private get roleRepository(): Repository<Role> {
    return AppDataSource.getRepository(Role);
  }

  /**
   * List users with pagination, search, and filters
   */
  async findAll(filters: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 100);
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.rol', 'rol')
      .leftJoinAndSelect('user.unidadOperativa', 'unidadOperativa')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.dni',
        'user.phone',
        'user.isActive',
        'user.last_login',
        'user.createdAt',
        'user.updatedAt',
        'rol.id',
        'rol.code',
        'rol.name',
        'unidadOperativa.id',
        'unidadOperativa.nombre',
      ]);

    if (filters.search) {
      qb.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.dni ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.role) {
      qb.andWhere('rol.code = :role', { role: filters.role });
    }

    if (filters.status === 'active') {
      qb.andWhere('user.isActive = true');
    } else if (filters.status === 'inactive') {
      qb.andWhere('user.isActive = false');
    }

    qb.orderBy('user.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    const data = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      dni: user.dni,
      phone: user.phone,
      rol: user.rol ? { id: user.rol.id, code: user.rol.code, name: user.rol.name } : null,
      unidad_operativa: user.unidadOperativa
        ? { id: user.unidadOperativa.id, nombre: (user.unidadOperativa as any).nombre }
        : null,
      is_active: user.isActive,
      last_login: user.last_login,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    }));

    return { data, total };
  }

  /**
   * Get a single user by ID with relations
   */
  async findById(id: number): Promise<any> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.rol', 'rol')
      .leftJoinAndSelect('user.unidadOperativa', 'unidadOperativa')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.dni',
        'user.phone',
        'user.rolId',
        'user.unidadOperativaId',
        'user.isActive',
        'user.last_login',
        'user.createdAt',
        'user.updatedAt',
        'rol.id',
        'rol.code',
        'rol.name',
        'unidadOperativa.id',
        'unidadOperativa.nombre',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: user.full_name,
      dni: user.dni,
      phone: user.phone,
      rol_id: user.rolId,
      unidad_operativa_id: user.unidadOperativaId,
      rol: user.rol ? { id: user.rol.id, code: user.rol.code, name: user.rol.name } : null,
      unidad_operativa: user.unidadOperativa
        ? { id: user.unidadOperativa.id, nombre: (user.unidadOperativa as any).nombre }
        : null,
      is_active: user.isActive,
      last_login: user.last_login,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  /**
   * Create a new user
   */
  async create(dto: CreateUserDto): Promise<any> {
    // Check for duplicate username
    const existingUsername = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    // Check for duplicate email
    const existingEmail = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new Error('El correo electrónico ya está en uso');
    }

    // Verify role exists
    const role = await this.roleRepository.findOne({ where: { id: dto.rol_id } });
    if (!role) {
      throw new Error('El rol especificado no existe');
    }

    // Hash password
    const hashedPassword = await SecurityUtil.hashPassword(dto.password);

    const user = this.userRepository.create({
      username: dto.username,
      password_hash: hashedPassword,
      email: dto.email,
      first_name: dto.first_name,
      last_name: dto.last_name,
      dni: dto.dni,
      phone: dto.phone,
      rolId: dto.rol_id,
      unidadOperativaId: dto.unidad_operativa_id,
      isActive: dto.is_active !== undefined ? dto.is_active : true,
    });

    const saved = await this.userRepository.save(user);
    Logger.info('User created', { userId: saved.id, username: saved.username });

    return this.findById(saved.id);
  }

  /**
   * Update a user
   */
  async update(id: number, dto: UpdateUserDto): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Check for duplicate username if changing
    if (dto.username && dto.username !== user.username) {
      const existing = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existing) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }

    // Check for duplicate email if changing
    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new Error('El correo electrónico ya está en uso');
      }
    }

    // Verify role exists if changing
    if (dto.rol_id) {
      const role = await this.roleRepository.findOne({ where: { id: dto.rol_id } });
      if (!role) {
        throw new Error('El rol especificado no existe');
      }
    }

    // Update fields
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.first_name !== undefined) user.first_name = dto.first_name;
    if (dto.last_name !== undefined) user.last_name = dto.last_name;
    if (dto.dni !== undefined) user.dni = dto.dni;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.rol_id !== undefined) user.rolId = dto.rol_id;
    if (dto.unidad_operativa_id !== undefined) user.unidadOperativaId = dto.unidad_operativa_id;
    if (dto.is_active !== undefined) user.isActive = dto.is_active;

    // Hash password if provided
    if (dto.password) {
      user.password_hash = await SecurityUtil.hashPassword(dto.password);
    }

    await this.userRepository.save(user);
    Logger.info('User updated', { userId: id });

    return this.findById(id);
  }

  /**
   * Admin password reset
   */
  async changePassword(id: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.password_hash = await SecurityUtil.hashPassword(newPassword);
    await this.userRepository.save(user);
    Logger.info('User password changed by admin', { userId: id });
  }

  /**
   * Toggle user active status
   */
  async toggleActive(id: number, currentUserId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['rol'],
    });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Cannot deactivate yourself
    if (id === currentUserId) {
      throw new Error('No puedes desactivar tu propia cuenta');
    }

    // Cannot deactivate the last active admin
    if (user.isActive && user.rol?.code === 'ADMIN') {
      const activeAdminCount = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.rol', 'rol')
        .where('rol.code = :code', { code: 'ADMIN' })
        .andWhere('user.isActive = true')
        .getCount();

      if (activeAdminCount <= 1) {
        throw new Error('No se puede desactivar al último administrador activo');
      }
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    Logger.info('User active status toggled', { userId: id, isActive: user.isActive });

    return this.findById(id);
  }

  /**
   * List all available roles
   */
  async getRoles(): Promise<any[]> {
    // Seed roles if they don't exist
    await this.seedRolesIfNeeded();

    const roles = await this.roleRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });

    return roles.map((r) => ({ id: r.id, code: r.code, name: r.name }));
  }

  /**
   * Seed additional roles if they don't exist in the database
   */
  private async seedRolesIfNeeded(): Promise<void> {
    const rolesToSeed = [
      { code: 'RESIDENTE', name: 'Residente de Proyecto' },
      { code: 'ADMINISTRADOR_PROYECTO', name: 'Administrador de Proyecto' },
      { code: 'SSOMA', name: 'Responsable SSOMA' },
    ];

    for (const roleData of rolesToSeed) {
      const existing = await this.roleRepository.findOne({ where: { code: roleData.code } });
      if (!existing) {
        const role = this.roleRepository.create({
          code: roleData.code,
          name: roleData.name,
          isActive: true,
        });
        await this.roleRepository.save(role);
        Logger.info('Seeded role', { code: roleData.code, name: roleData.name });
      }
    }
  }
}
