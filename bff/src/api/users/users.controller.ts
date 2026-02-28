/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { UserService } from '../../services/user.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendPaginatedSuccess,
} from '../../utils/api-response';

export class UsersController {
  private userService = new UserService();

  search = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const q = ((req.query.q as string) || '').trim();
      if (!q || q.length < 2) {
        sendSuccess(res, []);
        return;
      }

      const tenantId = req.user!.id_empresa;
      const { data } = await this.userService.findAll(tenantId, {
        search: q,
        page: 1,
        limit: 20,
      });

      const results = data.map((u: any) => ({
        id: u.id,
        nombre: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email,
        rol: u.rol?.name || u.rol?.code || '',
      }));
      sendSuccess(res, results);
    } catch (error: any) {
      sendError(res, 500, 'USER_SEARCH_FAILED', error.message);
    }
  };

  findAll = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { search, role, status, page, limit } = req.query;

      const filters = {
        search: search as string,
        role: role as string,
        status: status as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
      };

      const tenantId = req.user!.id_empresa;
      const { data, total } = await this.userService.findAll(tenantId, filters);
      sendPaginatedSuccess(res, data, {
        page: filters.page,
        limit: filters.limit,
        total,
      });
    } catch (error: any) {
      sendError(res, 500, 'USER_LIST_FAILED', error.message);
    }
  };

  findById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de usuario inválido');
        return;
      }

      const tenantId = req.user!.id_empresa;
      const user = await this.userService.findById(tenantId, id);
      sendSuccess(res, user);
    } catch (error: any) {
      if (error.message === 'Usuario no encontrado') {
        sendError(res, 404, 'USER_NOT_FOUND', error.message);
      } else {
        sendError(res, 500, 'USER_FETCH_FAILED', error.message);
      }
    }
  };

  create = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa;
      const user = await this.userService.create(tenantId, req.body);
      sendCreated(res, user);
    } catch (error: any) {
      if (error.message.includes('ya está en uso') || error.message.includes('no existe')) {
        sendError(res, 400, 'USER_CREATE_FAILED', error.message);
      } else {
        sendError(res, 500, 'USER_CREATE_FAILED', error.message);
      }
    }
  };

  update = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de usuario inválido');
        return;
      }

      const tenantId = req.user!.id_empresa;
      const user = await this.userService.update(tenantId, id, req.body);
      sendSuccess(res, user);
    } catch (error: any) {
      if (error.message === 'Usuario no encontrado') {
        sendError(res, 404, 'USER_NOT_FOUND', error.message);
      } else if (error.message.includes('ya está en uso') || error.message.includes('no existe')) {
        sendError(res, 400, 'USER_UPDATE_FAILED', error.message);
      } else {
        sendError(res, 500, 'USER_UPDATE_FAILED', error.message);
      }
    }
  };

  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de usuario inválido');
        return;
      }

      const { new_password } = req.body;
      const tenantId = req.user!.id_empresa;
      await this.userService.changePassword(tenantId, id, new_password);
      sendSuccess(res, { message: 'Contraseña actualizada exitosamente' });
    } catch (error: any) {
      if (error.message === 'Usuario no encontrado') {
        sendError(res, 404, 'USER_NOT_FOUND', error.message);
      } else {
        sendError(res, 500, 'PASSWORD_CHANGE_FAILED', error.message);
      }
    }
  };

  toggleActive = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        sendError(res, 400, 'INVALID_ID', 'ID de usuario inválido');
        return;
      }

      const currentUserId = req.user?.id_usuario;
      if (!currentUserId) {
        sendError(res, 401, 'UNAUTHORIZED', 'No se pudo determinar el usuario actual');
        return;
      }

      const tenantId = req.user!.id_empresa;
      const user = await this.userService.toggleActive(tenantId, id, currentUserId);
      sendSuccess(res, user);
    } catch (error: any) {
      if (error.message === 'Usuario no encontrado') {
        sendError(res, 404, 'USER_NOT_FOUND', error.message);
      } else if (error.message.includes('No puedes') || error.message.includes('No se puede')) {
        sendError(res, 400, 'TOGGLE_ACTIVE_FAILED', error.message);
      } else {
        sendError(res, 500, 'TOGGLE_ACTIVE_FAILED', error.message);
      }
    }
  };

  getRoles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const roles = await this.userService.getRoles();
      sendSuccess(res, roles);
    } catch (error: any) {
      sendError(res, 500, 'ROLES_FETCH_FAILED', error.message);
    }
  };
}
