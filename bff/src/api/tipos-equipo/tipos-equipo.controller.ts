/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { TipoEquipoService } from '../../services/tipo-equipo.service';
import { sendSuccess, sendError } from '../../utils/api-response';
import { CategoriaPrd } from '../../models/tipo-equipo.model';

export class TiposEquipoController {
  private service = new TipoEquipoService();

  /** GET /api/tipos-equipo — all active tipos */
  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      const tipos = await this.service.listar();
      sendSuccess(res, tipos);
    } catch (error: any) {
      sendError(res, 500, 'TIPOS_EQUIPO_ERROR', 'Error al obtener tipos de equipo', error.message);
    }
  };

  /** GET /api/tipos-equipo/agrupados — grouped by categoria_prd */
  listarAgrupados = async (_req: Request, res: Response): Promise<void> => {
    try {
      const grupos = await this.service.listarAgrupados();
      sendSuccess(res, grupos);
    } catch (error: any) {
      sendError(
        res,
        500,
        'TIPOS_EQUIPO_AGRUPADOS_ERROR',
        'Error al obtener tipos agrupados',
        error.message
      );
    }
  };

  /** GET /api/tipos-equipo/categoria/:categoria — tipos for one PRD category */
  listarPorCategoria = async (req: Request, res: Response): Promise<void> => {
    try {
      const { categoria } = req.params;
      const tipos = await this.service.listarPorCategoria(categoria as CategoriaPrd);
      sendSuccess(res, tipos);
    } catch (error: any) {
      sendError(
        res,
        500,
        'TIPOS_EQUIPO_CATEGORIA_ERROR',
        'Error al obtener tipos por categoría',
        error.message
      );
    }
  };

  /** GET /api/tipos-equipo/:id */
  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const tipo = await this.service.obtenerPorId(id);
      sendSuccess(res, tipo);
    } catch (error: any) {
      const status = error.name === 'NotFoundError' ? 404 : 500;
      sendError(
        res,
        status,
        'TIPO_EQUIPO_NOT_FOUND',
        error.message || 'Tipo de equipo no encontrado',
        error.message
      );
    }
  };
}
