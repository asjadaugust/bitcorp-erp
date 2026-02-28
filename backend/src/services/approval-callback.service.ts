/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { DailyReport } from '../models/daily-report-typeorm.model';
import { Valuation } from '../models/valuation.model';
import { SolicitudEquipo } from '../models/solicitud-equipo.model';
import { ModuleName } from '../models/plantilla-aprobacion.model';
import logger from '../utils/logger';

/**
 * ApprovalCallbackService
 *
 * Bridges the generic approval engine back to domain entities.
 * Called by ApprovalRequestService when a solicitud reaches terminal state.
 * Uses AppDataSource directly (not request-scoped) for simplicity.
 */
export class ApprovalCallbackService {
  async onAprobado(
    moduleName: ModuleName,
    entityId: number,
    solicitudId: number,
    _tenantId?: number
  ): Promise<void> {
    switch (moduleName) {
      case 'daily_report': {
        const repo = AppDataSource.getRepository(DailyReport);
        await repo.update(entityId, { estado: 'APROBADO' } as any);
        logger.info('ApprovalCallback: daily_report approved', { entityId, solicitudId });
        break;
      }
      case 'valorizacion': {
        const repo = AppDataSource.getRepository(Valuation);
        await repo.update(entityId, { estado: 'APROBADO' } as any);
        logger.info('ApprovalCallback: valorizacion approved', { entityId, solicitudId });
        break;
      }
      case 'solicitud_equipo': {
        const repo = AppDataSource.getRepository(SolicitudEquipo);
        await repo.update(entityId, { estado: 'APROBADO' } as any);
        logger.info('ApprovalCallback: solicitud_equipo approved', { entityId, solicitudId });
        break;
      }
      default:
        logger.warn('ApprovalCallback: unknown module', { moduleName, entityId, solicitudId });
    }
  }

  async onRechazado(
    moduleName: ModuleName,
    entityId: number,
    solicitudId: number,
    _tenantId?: number
  ): Promise<void> {
    switch (moduleName) {
      case 'daily_report': {
        const repo = AppDataSource.getRepository(DailyReport);
        await repo.update(entityId, { estado: 'RECHAZADO' } as any);
        logger.info('ApprovalCallback: daily_report rejected', { entityId, solicitudId });
        break;
      }
      case 'valorizacion': {
        const repo = AppDataSource.getRepository(Valuation);
        await repo.update(entityId, { estado: 'RECHAZADO' } as any);
        logger.info('ApprovalCallback: valorizacion rejected', { entityId, solicitudId });
        break;
      }
      case 'solicitud_equipo': {
        const repo = AppDataSource.getRepository(SolicitudEquipo);
        await repo.update(entityId, { estado: 'RECHAZADO' } as any);
        logger.info('ApprovalCallback: solicitud_equipo rejected', { entityId, solicitudId });
        break;
      }
      default:
        logger.warn('ApprovalCallback: unknown module for rejection', {
          moduleName,
          entityId,
          solicitudId,
        });
    }
  }
}
