/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { CombustibleConfigService } from '../../services/combustible-config.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class CombustibleConfigController {
  private service = new CombustibleConfigService();

  /** GET /api/combustible-config */
  obtener = async (_req: Request, res: Response): Promise<void> => {
    try {
      const config = await this.service.obtener();
      sendSuccess(
        res,
        config ?? {
          precio_manipuleo: CombustibleConfigService.DEFAULT_MANIPULEO_RATE,
          activo: true,
        }
      );
    } catch (error: any) {
      sendError(
        res,
        500,
        'COMBUSTIBLE_CONFIG_ERROR',
        'Error al obtener configuración de combustible',
        error.message
      );
    }
  };

  /** GET /api/combustible-config/precio-manipuleo */
  obtenerPrecio = async (_req: Request, res: Response): Promise<void> => {
    try {
      const precio = await this.service.obtenerPrecioManipuleo();
      sendSuccess(res, { precio_manipuleo: precio });
    } catch (error: any) {
      sendError(
        res,
        500,
        'COMBUSTIBLE_CONFIG_ERROR',
        'Error al obtener precio de manipuleo',
        error.message
      );
    }
  };

  /** PUT /api/combustible-config */
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { precio_manipuleo } = req.body;
      if (precio_manipuleo === undefined || precio_manipuleo === null) {
        sendError(res, 400, 'VALIDATION_ERROR', 'El campo precio_manipuleo es obligatorio');
        return;
      }
      const precio = parseFloat(precio_manipuleo);
      if (isNaN(precio) || precio < 0) {
        sendError(res, 400, 'VALIDATION_ERROR', 'precio_manipuleo debe ser un número >= 0');
        return;
      }
      const userId = req.user!.id_usuario;
      const config = await this.service.actualizar(precio, userId);
      sendSuccess(res, config);
    } catch (error: any) {
      sendError(
        res,
        500,
        'COMBUSTIBLE_CONFIG_ERROR',
        error.message || 'Error al actualizar configuración',
        error.message
      );
    }
  };
}
