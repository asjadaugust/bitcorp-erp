/**
 * Valuation Email Notification Service
 *
 * Handles sending email notifications for valuation workflow events.
 * This is a separate service to keep valuation.service.ts clean.
 */

import { AppDataSource } from '../config/database.config';
import { Valorizacion } from '../models/valuation.model';
import { Contract } from '../models/contract.model';
import { User } from '../models/user.model';
import { Repository } from 'typeorm';
import Logger from '../utils/logger';
import { emailService } from './email.service';
import { emailRecipients } from '../config/email.config';

export class ValuationEmailNotifier {
  private get userRepository(): Repository<User> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(User);
  }

  private get contractRepository(): Repository<Contract> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Contract);
  }

  /**
   * Get users with approval roles
   */
  private async getApprovers(): Promise<User[]> {
    try {
      const approvers = await this.userRepository
        .createQueryBuilder('u')
        .innerJoinAndSelect('u.rol', 'r')
        .where('r.code IN (:...roles)', { roles: emailRecipients.approvalRoles })
        .andWhere('u.is_active = :isActive', { isActive: true })
        .getMany();

      return approvers;
    } catch (error) {
      Logger.error('Error fetching approvers', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ValuationEmailNotifier.getApprovers',
      });
      return [];
    }
  }

  /**
   * Get users who should receive payment notifications
   */
  private async getPaymentRecipients(): Promise<User[]> {
    try {
      const recipients = await this.userRepository
        .createQueryBuilder('u')
        .innerJoinAndSelect('u.rol', 'r')
        .where('r.code IN (:...roles)', { roles: emailRecipients.paymentRoles })
        .andWhere('u.is_active = :isActive', { isActive: true })
        .getMany();

      return recipients;
    } catch (error) {
      Logger.error('Error fetching payment recipients', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ValuationEmailNotifier.getPaymentRecipients',
      });
      return [];
    }
  }

  /**
   * Send email notification for valuation submitted
   */
  async notifySubmitted(valorizacion: Valorizacion): Promise<void> {
    try {
      const [contract, creator, approvers] = await Promise.all([
        this.contractRepository.findOne({ where: { id: valorizacion.contratoId } }),
        valorizacion.creadoPor
          ? this.userRepository.findOne({ where: { id: valorizacion.creadoPor } })
          : null,
        this.getApprovers(),
      ]);

      if (!contract || !creator || approvers.length === 0) {
        Logger.warn('Cannot send submitted email: missing data', {
          valuationId: valorizacion.id,
          hasContract: !!contract,
          hasCreator: !!creator,
          approverCount: approvers.length,
        });
        return;
      }

      const emailData = {
        valuation: {
          id: valorizacion.id,
          numero_valorizacion: valorizacion.numeroValorizacion || `VAL-${valorizacion.id}`,
          periodo: valorizacion.periodo || '',
          monto_total: valorizacion.totalValorizado || 0,
          monto_deduccion: 0,
          monto_neto: valorizacion.totalConIgv || valorizacion.totalValorizado || 0,
          estado: valorizacion.estado,
        },
        contract: {
          codigo: contract.numeroContrato || `CONT-${contract.id}`,
          nombre_proyecto: undefined,
        },
        user: {
          nombre:
            `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.username,
          email: creator.email,
        },
        detailUrl: `${process.env.FRONTEND_URL || 'http://localhost:3420'}/equipment/valuations/${valorizacion.id}`,
      };

      const recipients = approvers.map((u) => u.email).filter((email) => email);
      await emailService.sendValuationSubmitted(emailData, recipients);

      Logger.info('Valuation submitted email sent', {
        valuationId: valorizacion.id,
        recipientCount: recipients.length,
      });
    } catch (error) {
      Logger.error('Error sending submitted email', {
        error: error instanceof Error ? error.message : String(error),
        valuationId: valorizacion.id,
      });
    }
  }

  /**
   * Send email notification for valuation approved
   */
  async notifyApproved(valorizacion: Valorizacion, approverId: number): Promise<void> {
    try {
      const [contract, creator, approver, paymentRecipients] = await Promise.all([
        this.contractRepository.findOne({ where: { id: valorizacion.contratoId } }),
        valorizacion.creadoPor
          ? this.userRepository.findOne({ where: { id: valorizacion.creadoPor } })
          : null,
        this.userRepository.findOne({ where: { id: approverId } }),
        this.getPaymentRecipients(),
      ]);

      if (!contract || !creator) {
        Logger.warn('Cannot send approved email: missing data', {
          valuationId: valorizacion.id,
        });
        return;
      }

      const emailData = {
        valuation: {
          id: valorizacion.id,
          numero_valorizacion: valorizacion.numeroValorizacion || `VAL-${valorizacion.id}`,
          periodo: valorizacion.periodo || '',
          monto_total: valorizacion.totalValorizado || 0,
          monto_deduccion: 0,
          monto_neto: valorizacion.totalConIgv || valorizacion.totalValorizado || 0,
          estado: valorizacion.estado,
        },
        contract: {
          codigo: contract.numeroContrato || `CONT-${contract.id}`,
          nombre_proyecto: undefined,
        },
        user: {
          nombre:
            `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.username,
          email: creator.email,
        },
        approver: approver
          ? {
              nombre:
                `${approver.first_name || ''} ${approver.last_name || ''}`.trim() ||
                approver.username,
              email: approver.email,
            }
          : undefined,
        detailUrl: `${process.env.FRONTEND_URL || 'http://localhost:3420'}/equipment/valuations/${valorizacion.id}`,
      };

      const recipients = [creator.email, ...paymentRecipients.map((u) => u.email)].filter(
        (email) => email
      );

      await emailService.sendValuationApproved(emailData, recipients);

      Logger.info('Valuation approved email sent', {
        valuationId: valorizacion.id,
        recipientCount: recipients.length,
      });
    } catch (error) {
      Logger.error('Error sending approved email', {
        error: error instanceof Error ? error.message : String(error),
        valuationId: valorizacion.id,
      });
    }
  }

  /**
   * Send email notification for valuation rejected
   */
  async notifyRejected(
    valorizacion: Valorizacion,
    reason: string,
    rejecterId: number
  ): Promise<void> {
    try {
      const [contract, creator, rejecter] = await Promise.all([
        this.contractRepository.findOne({ where: { id: valorizacion.contratoId } }),
        valorizacion.creadoPor
          ? this.userRepository.findOne({ where: { id: valorizacion.creadoPor } })
          : null,
        this.userRepository.findOne({ where: { id: rejecterId } }),
      ]);

      if (!contract || !creator) {
        Logger.warn('Cannot send rejected email: missing data', {
          valuationId: valorizacion.id,
        });
        return;
      }

      const emailData = {
        valuation: {
          id: valorizacion.id,
          numero_valorizacion: valorizacion.numeroValorizacion || `VAL-${valorizacion.id}`,
          periodo: valorizacion.periodo || '',
          monto_total: valorizacion.totalValorizado || 0,
          monto_deduccion: 0,
          monto_neto: valorizacion.totalConIgv || valorizacion.totalValorizado || 0,
          estado: valorizacion.estado,
        },
        contract: {
          codigo: contract.numeroContrato || `CONT-${contract.id}`,
          nombre_proyecto: undefined,
        },
        user: {
          nombre:
            `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.username,
          email: creator.email,
        },
        approver: rejecter
          ? {
              nombre:
                `${rejecter.first_name || ''} ${rejecter.last_name || ''}`.trim() ||
                rejecter.username,
              email: rejecter.email,
            }
          : undefined,
        rejectReason: reason,
        detailUrl: `${process.env.FRONTEND_URL || 'http://localhost:3420'}/equipment/valuations/${valorizacion.id}`,
      };

      const recipients = [creator.email].filter((email) => email);
      await emailService.sendValuationRejected(emailData, recipients);

      Logger.info('Valuation rejected email sent', {
        valuationId: valorizacion.id,
        recipientCount: recipients.length,
      });
    } catch (error) {
      Logger.error('Error sending rejected email', {
        error: error instanceof Error ? error.message : String(error),
        valuationId: valorizacion.id,
      });
    }
  }

  /**
   * Send email notification for valuation marked as paid
   */
  async notifyPaid(
    valorizacion: Valorizacion,
    paymentData: { fecha_pago: string; metodo_pago: string; referencia_pago?: string }
  ): Promise<void> {
    try {
      const [contract, creator, paymentRecipients] = await Promise.all([
        this.contractRepository.findOne({ where: { id: valorizacion.contratoId } }),
        valorizacion.creadoPor
          ? this.userRepository.findOne({ where: { id: valorizacion.creadoPor } })
          : null,
        this.getPaymentRecipients(),
      ]);

      if (!contract || !creator) {
        Logger.warn('Cannot send paid email: missing data', {
          valuationId: valorizacion.id,
        });
        return;
      }

      const emailData = {
        valuation: {
          id: valorizacion.id,
          numero_valorizacion: valorizacion.numeroValorizacion || `VAL-${valorizacion.id}`,
          periodo: valorizacion.periodo || '',
          monto_total: valorizacion.totalValorizado || 0,
          monto_deduccion: 0,
          monto_neto: valorizacion.totalConIgv || valorizacion.totalValorizado || 0,
          estado: valorizacion.estado,
        },
        contract: {
          codigo: contract.numeroContrato || `CONT-${contract.id}`,
          nombre_proyecto: undefined,
        },
        user: {
          nombre:
            `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.username,
          email: creator.email,
        },
        paymentData,
        detailUrl: `${process.env.FRONTEND_URL || 'http://localhost:3420'}/equipment/valuations/${valorizacion.id}`,
      };

      const recipients = [creator.email, ...paymentRecipients.map((u) => u.email)].filter(
        (email) => email
      );

      await emailService.sendValuationPaid(emailData, recipients);

      Logger.info('Valuation paid email sent', {
        valuationId: valorizacion.id,
        recipientCount: recipients.length,
      });
    } catch (error) {
      Logger.error('Error sending paid email', {
        error: error instanceof Error ? error.message : String(error),
        valuationId: valorizacion.id,
      });
    }
  }
}

// Export singleton instance
export const valuationEmailNotifier = new ValuationEmailNotifier();
