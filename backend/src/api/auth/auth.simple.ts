import { Request, Response } from 'express';
import { pool } from '../../config/database.config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

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

    console.log(`Simple login attempt for: ${username}`);

    // Query user with roles (using code for authorization)
    const result = await pool.query(
      `
      SELECT 
        u.id, u.username, u.email, u.nombres, u.apellidos, u.password,
        array_agg(DISTINCT COALESCE(r.code, r.name)) FILTER (WHERE r.name IS NOT NULL) as roles
      FROM sistema.usuario u
      LEFT JOIN sistema.usuario_rol ur ON u.id = ur.user_id
      LEFT JOIN sistema.rol r ON ur.role_id = r.id
      WHERE u.username = $1 AND u.is_active = true
      GROUP BY u.id, u.username, u.email, u.nombres, u.apellidos, u.password
    `,
      [username]
    );

    if (result.rows.length === 0) {
      console.log('User not found or inactive');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    console.log(`User found: ${user.username}, has password: ${!!user.password}`);

    // Verify password
    if (!user.password) {
      console.log('User has no password hash');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`Password valid: ${isValidPassword}`);

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

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });
    const refreshToken = jwt.sign(tokenPayload, jwtRefreshSecret, { expiresIn: '7d' });

    // Update last login
    await pool.query('UPDATE sistema.usuario SET last_login = NOW() WHERE id = $1', [user.id]);

    console.log(`Login successful for ${user.username}`);

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
    console.error('Login error:', error);
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
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Get fresh user data
    const result = await pool.query(
      `
      SELECT 
        u.id, u.username, u.email, u.nombres, u.apellidos,
        array_agg(DISTINCT COALESCE(r.code, r.name)) FILTER (WHERE r.name IS NOT NULL) as roles
      FROM sistema.usuario u
      LEFT JOIN sistema.usuario_rol ur ON u.id = ur.user_id
      LEFT JOIN sistema.rol r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id, u.username, u.email, u.nombres, u.apellidos
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
    console.error('Auth/me error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}
