import { Request, Response } from 'express';
import { pool } from '../../config/database.config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import Logger from '../../utils/logger';
import { sendSuccess, sendError } from '../../utils/api-response';

interface LoginRequest {
  username: string;
  password: string;
}

export async function simpleLogin(req: Request, res: Response): Promise<void> {
  try {
    // Validation is handled by middleware (validateDto(LoginDto))
    const { username, password }: LoginRequest = req.body;

    Logger.debug('Login attempt', {
      username,
      context: 'simpleLogin',
    });

    // Query user with roles and unidad_operativa (tenant context)
    // Support both direct rol_id and many-to-many usuario_rol
    const result = await pool.query(
      `
      SELECT 
        u.id, u.nombre_usuario as username, u.correo_electronico as email, 
        u.nombres, u.apellidos, u.contrasena as password,
        u.unidad_operativa_id,
        uo.codigo as unidad_operativa_codigo,
        uo.nombre as unidad_operativa_nombre,
        array_agg(DISTINCT COALESCE(r_direct.codigo, r_many.codigo, r_direct.nombre, r_many.nombre)) 
          FILTER (WHERE r_direct.nombre IS NOT NULL OR r_many.nombre IS NOT NULL) as roles
      FROM sistema.usuario u
      LEFT JOIN sistema.rol r_direct ON u.rol_id = r_direct.id
      LEFT JOIN sistema.usuario_rol ur ON u.id = ur.usuario_id
      LEFT JOIN sistema.rol r_many ON ur.rol_id = r_many.id
      LEFT JOIN sistema.unidad_operativa uo ON u.unidad_operativa_id = uo.id
      WHERE u.nombre_usuario = $1 AND u.is_active = true
      GROUP BY u.id, u.nombre_usuario, u.correo_electronico, u.nombres, u.apellidos, 
               u.contrasena, u.unidad_operativa_id, uo.codigo, uo.nombre
    `,
      [username]
    );

    if (result.rows.length === 0) {
      Logger.warn('Login failed - user not found or inactive', {
        username,
        context: 'simpleLogin',
      });
      sendError(res, 401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
      return;
    }

    const user = result.rows[0];
    Logger.debug('User authenticated - verifying password', {
      username: user.username,
      hasPassword: !!user.password,
      roleCount: user.roles?.length || 0,
      context: 'simpleLogin',
    });

    // Verify password
    if (!user.password) {
      Logger.warn('Login failed - user has no password hash', {
        username,
        userId: user.id,
        context: 'simpleLogin',
      });
      sendError(res, 401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    Logger.debug('Password verification result', {
      username,
      isValid: isValidPassword,
      context: 'simpleLogin',
    });

    if (!isValidPassword) {
      sendError(res, 401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
      return;
    }

    // Generate JWT tokens with multi-tenant structure
    const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
    const jwtRefreshSecret =
      process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production';

    // NEW JWT Payload Structure (multi-tenant)
    // Matches JwtPayload interface in security.util.ts
    const tokenPayload = {
      id_usuario: user.id, // User ID
      id_empresa: user.unidad_operativa_id || 0, // Tenant ID (0 = no assignment)
      codigo_empresa: user.unidad_operativa_codigo || 'SISTEMA', // Tenant code
      username: user.username,
      email: user.email,
      rol: (user.roles && user.roles[0]) || 'OPERADOR', // Primary role (first in array)
      nombre_completo: `${user.nombres || ''} ${user.apellidos || ''}`.trim(),
    };

    Logger.debug('Generating JWT tokens', {
      userId: user.id,
      username: user.username,
      tenantId: tokenPayload.id_empresa,
      tenantCode: tokenPayload.codigo_empresa,
      rol: tokenPayload.rol,
      context: 'simpleLogin',
    });

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });
    const refreshToken = jwt.sign(tokenPayload, jwtRefreshSecret, { expiresIn: '7d' });

    // Update last login
    await pool.query('UPDATE sistema.usuario SET ultimo_acceso = NOW() WHERE id = $1', [user.id]);

    Logger.info('User login successful', {
      userId: user.id,
      username: user.username,
      tenantId: tokenPayload.id_empresa,
      rol: tokenPayload.rol,
      context: 'simpleLogin',
    });

    // Return auth response using standard format
    sendSuccess(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: tokenPayload.nombre_completo,
        nombres: user.nombres,
        apellidos: user.apellidos,
        roles: user.roles || [], // Keep for backward compatibility in response
        unidad_operativa_id: user.unidad_operativa_id,
        unidad_operativa_nombre: user.unidad_operativa_nombre,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    Logger.error('Login error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'simpleLogin',
    });
    sendError(res, 500, 'INTERNAL_ERROR', 'Error interno del servidor');
  }
}

export async function simpleMe(req: Request, res: Response): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, 'NO_TOKEN', 'No se proporcionó token de autenticación');
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';

    // Verify token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      Logger.warn('Invalid token', {
        error: jwtError instanceof Error ? jwtError.message : String(jwtError),
        context: 'simpleMe',
      });
      sendError(res, 401, 'INVALID_TOKEN', 'Token inválido o expirado');
      return;
    }

    // Get fresh user data with unidad_operativa (tenant context)
    // Support both direct rol_id and many-to-many usuario_rol
    const result = await pool.query(
      `
      SELECT 
        u.id, u.nombre_usuario as username, u.correo_electronico as email, u.nombres, u.apellidos,
        u.unidad_operativa_id,
        uo.codigo as unidad_operativa_codigo,
        uo.nombre as unidad_operativa_nombre,
        array_agg(DISTINCT COALESCE(r_direct.codigo, r_many.codigo, r_direct.nombre, r_many.nombre)) 
          FILTER (WHERE r_direct.nombre IS NOT NULL OR r_many.nombre IS NOT NULL) as roles
      FROM sistema.usuario u
      LEFT JOIN sistema.rol r_direct ON u.rol_id = r_direct.id
      LEFT JOIN sistema.usuario_rol ur ON u.id = ur.usuario_id
      LEFT JOIN sistema.rol r_many ON ur.rol_id = r_many.id
      LEFT JOIN sistema.unidad_operativa uo ON u.unidad_operativa_id = uo.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id, u.nombre_usuario, u.correo_electronico, u.nombres, u.apellidos,
               u.unidad_operativa_id, uo.codigo, uo.nombre
    `,
      [decoded.id_usuario || decoded.id] // Support both new and old JWT structure during transition
    );

    if (result.rows.length === 0) {
      sendError(res, 401, 'USER_NOT_FOUND', 'Usuario no encontrado o inactivo');
      return;
    }

    const user = result.rows[0];

    sendSuccess(res, {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: `${user.nombres || ''} ${user.apellidos || ''}`.trim(),
        nombres: user.nombres,
        apellidos: user.apellidos,
        roles: user.roles || [],
        unidad_operativa_id: user.unidad_operativa_id,
        unidad_operativa_nombre: user.unidad_operativa_nombre,
      },
    });
  } catch (error) {
    Logger.error('Auth/me error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'simpleMe',
    });
    sendError(res, 500, 'INTERNAL_ERROR', 'Error interno del servidor');
  }
}
