/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { PrecalentamientoConfigService } from '../../services/precalentamiento-config.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class PrecalentamientoConfigController {
  private service = new PrecalentamientoConfigService();

  /** GET /api/precalentamiento-config — lista completa de configs */
  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      const configs = await this.service.listar();
      sendSuccess(res, configs);
    } catch (error: any) {
      sendError(
        res,
        500,
        'PRECALENTAMIENTO_CONFIG_ERROR',
        'Error al obtener configuraciones de precalentamiento',
        error.message
      );
    }
  };

  /** GET /api/precalentamiento-config/tipo-equipo/:tipoEquipoId */
  obtenerPorTipoEquipo = async (req: Request, res: Response): Promise<void> => {
    try {
      const tipoEquipoId = parseInt(req.params.tipoEquipoId);
      if (isNaN(tipoEquipoId)) {
        sendError(res, 400, 'VALIDATION_ERROR', 'tipoEquipoId debe ser un número válido');
        return;
      }
      const config = await this.service.obtenerPorTipoEquipo(tipoEquipoId);
      if (!config) {
        sendError(
          res,
          404,
          'PRECALENTAMIENTO_CONFIG_NOT_FOUND',
          `No se encontró configuración para tipo_equipo_id=${tipoEquipoId}`
        );
        return;
      }
      sendSuccess(res, config);
    } catch (error: any) {
      sendError(
        res,
        500,
        'PRECALENTAMIENTO_CONFIG_ERROR',
        'Error al obtener configuración de precalentamiento',
        error.message
      );
    }
  };

  /** GET /api/precalentamiento-config/tipo-equipo/:tipoEquipoId/horas — devuelve solo el número */
  obtenerHoras = async (req: Request, res: Response): Promise<void> => {
    try {
      const tipoEquipoId = parseInt(req.params.tipoEquipoId);
      if (isNaN(tipoEquipoId)) {
        sendError(res, 400, 'VALIDATION_ERROR', 'tipoEquipoId debe ser un número válido');
        return;
      }
      const horas = await this.service.obtenerHoras(tipoEquipoId);
      sendSuccess(res, { tipo_equipo_id: tipoEquipoId, horas_precalentamiento: horas });
    } catch (error: any) {
      sendError(
        res,
        500,
        'PRECALENTAMIENTO_CONFIG_ERROR',
        'Error al obtener horas de precalentamiento',
        error.message
      );
    }
  };

  /** PUT /api/precalentamiento-config/tipo-equipo/:tipoEquipoId */
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const tipoEquipoId = parseInt(req.params.tipoEquipoId);
      if (isNaN(tipoEquipoId)) {
        sendError(res, 400, 'VALIDATION_ERROR', 'tipoEquipoId debe ser un número válido');
        return;
      }
      const { horas_precalentamiento } = req.body;
      if (horas_precalentamiento === undefined || horas_precalentamiento === null) {
        sendError(res, 400, 'VALIDATION_ERROR', 'El campo horas_precalentamiento es obligatorio');
        return;
      }
      const horas = parseFloat(horas_precalentamiento);
      if (isNaN(horas) || horas < 0) {
        sendError(res, 400, 'VALIDATION_ERROR', 'horas_precalentamiento debe ser un número >= 0');
        return;
      }
      const config = await this.service.actualizar(tipoEquipoId, horas);
      sendSuccess(res, config);
    } catch (error: any) {
      const status = error.name === 'NotFoundError' ? 404 : 500;
      sendError(
        res,
        status,
        'PRECALENTAMIENTO_CONFIG_ERROR',
        error.message || 'Error al actualizar configuración de precalentamiento',
        error.message
      );
    }
  };
}
