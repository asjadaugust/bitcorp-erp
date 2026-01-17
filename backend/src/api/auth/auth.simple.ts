import { Request, Response } from 'express';
import { pool } from '../../config/database.config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import Logger from '../../utils/logger';

interface LoginRequest {
  username: string;
  password: string;
}

export async function simpleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    Logger.debug('Login attempt', {
      username,
      context: 'simpleLogin',
    });

    // Query user with roles (using code for authorization)
    // Support both direct rol_id and many-to-many usuario_rol
    const result = await pool.query(
      `
      SELECT 
        u.id, u.nombre_usuario as username, u.correo_electronico as email, u.nombres, u.apellidos, u.contrasena as password,
        array_agg(DISTINCT COALESCE(r_direct.codigo, r_many.codigo, r_direct.nombre, r_many.nombre)) 
          FILTER (WHERE r_direct.nombre IS NOT NULL OR r_many.nombre IS NOT NULL) as roles
      FROM sistema.usuario u
      LEFT JOIN sistema.rol r_direct ON u.rol_id = r_direct.id
      LEFT JOIN sistema.usuario_rol ur ON u.id = ur.usuario_id
      LEFT JOIN sistema.rol r_many ON ur.rol_id = r_many.id
      WHERE u.nombre_usuario = $1 AND u.is_active = true
      GROUP BY u.id, u.nombre_usuario, u.correo_electronico, u.nombres, u.apellidos, u.contrasena
    `,
      [username]
    );

    if (result.rows.length === 0) {
      Logger.warn('Login failed - user not found or inactive', {
        username,
        context: 'simpleLogin',
      });
      res.status(401).json({ error: 'Invalid credentials' });
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
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    Logger.debug('Password verification result', {
      username,
      isValid: isValidPassword,
      context: 'simpleLogin',
    });

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT tokens
    const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';
    const jwtRefreshSecret =
      process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production';

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles || [],
    };

    Logger.debug('Generating JWT tokens', {
      userId: user.id,
      username: user.username,
      roles: tokenPayload.roles,
      context: 'simpleLogin',
    });

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });
    const refreshToken = jwt.sign(tokenPayload, jwtRefreshSecret, { expiresIn: '7d' });

    // Update last login
    await pool.query('UPDATE sistema.usuario SET ultimo_acceso = NOW() WHERE id = $1', [user.id]);

    Logger.info('User login successful', {
      userId: user.id,
      username: user.username,
      roleCount: tokenPayload.roles.length,
      context: 'simpleLogin',
    });

    // Return auth response
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: `${user.nombres} ${user.apellidos}`,
        nombres: user.nombres,
        apellidos: user.apellidos,
        roles: user.roles || [],
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
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function simpleMe(req: Request, res: Response): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production';

    // Verify token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Get fresh user data
    // Support both direct rol_id and many-to-many usuario_rol
    const result = await pool.query(
      `
      SELECT 
        u.id, u.nombre_usuario as username, u.correo_electronico as email, u.nombres, u.apellidos,
        array_agg(DISTINCT COALESCE(r_direct.codigo, r_many.codigo, r_direct.nombre, r_many.nombre)) 
          FILTER (WHERE r_direct.nombre IS NOT NULL OR r_many.nombre IS NOT NULL) as roles
      FROM sistema.usuario u
      LEFT JOIN sistema.rol r_direct ON u.rol_id = r_direct.id
      LEFT JOIN sistema.usuario_rol ur ON u.id = ur.usuario_id
      LEFT JOIN sistema.rol r_many ON ur.rol_id = r_many.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id, u.nombre_usuario, u.correo_electronico, u.nombres, u.apellidos
    `,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: `${user.nombres} ${user.apellidos}`,
        nombres: user.nombres,
        apellidos: user.apellidos,
        roles: user.roles || [],
      },
    });
  } catch (error) {
    Logger.error('Auth/me error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: 'simpleMe',
    });
    res.status(401).json({ error: 'Invalid token' });
  }
}
