/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refresh_token } = req.body;
      const result = await this.authService.refreshToken(refresh_token);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  };

  me = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      res.json({ user: req.user });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  };
}
