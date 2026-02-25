import cron, { ScheduledTask } from 'node-cron';
import { Repository, Between } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { MaintenanceSchedule, EstadoMantenimiento } from '../models/maintenance-schedule.model';
import { Contract, EstadoContrato } from '../models/contract.model';
import { Trabajador } from '../models/trabajador.model';
import { User } from '../models/user.model';
import { Equipment } from '../models/equipment.model';
import { OperatorDocument } from '../models/operator-document.entity';
import { Valorizacion, EstadoValorizacion } from '../models/valuation.model';
import { AccountsPayable, AccountsPayableStatus } from '../models/accounts-payable.model';
import { NotificationService } from './notification.service';
import { emailService } from './email.service';
import logger from '../config/logger.config';
import { DatabaseError, DatabaseErrorType } from '../errors';

/**
 * CronService - Scheduled Task Automation for BitCorp ERP
 *
 * Purpose:
 * Manages automated scheduled tasks (cron jobs) for BitCorp ERP system. Handles
 * periodic checks for maintenance due dates, contract expirations, and operator
 * certification expiry. Creates notifications to alert relevant users.
 *
 * Scheduled Jobs:
 * 1. Daily Maintenance Checks (8:00 AM daily)
 *    - Checks for equipment maintenance due within 7 days
 *    - Creates warning notifications for maintenance managers
 *
 * 2. Daily Contract Expiration Checks (8:00 AM daily)
 *    - Checks for contracts expiring within 30 days
 *    - Creates warning notifications for contract administrators
 *
 * 3. Daily Certification Expiry Checks (8:00 AM daily)
 *    - Checks for operator certifications expiring within 30 days
 *    - Creates warning notifications for HR managers
 *
 * Architecture:
 * - Uses node-cron for job scheduling (cron syntax)
 * - Runs in application server process (not external cron daemon)
 * - Jobs start automatically when service initializes
 * - Uses TypeORM repositories for database queries
 * - Integrates with NotificationService for alert creation
 *
 * Cron Schedule Format:
 * minute (0-59) hour (0-23) day-of-month (1-31) month (1-12) day-of-week (0-7)
 * Examples:
 * - "0 8 * * *" => Every day at 8:00 AM
 * - "0 0 * * 0" => Every Sunday at midnight
 * - "* /15 * * * *" => Every 15 minutes
 *
 * Notification Recipients:
 * Current Implementation: Sends to all users with specific roles
 * - Maintenance due => Users with ALMACEN or ADMIN role
 * - Contract expiring => Users with ADMIN or DIRECTOR role
 * - Certification expiring => Users with HR or ADMIN role
 *
 * Future Enhancement: Target specific project managers, equipment owners, etc.
 *
 * Business Rules:
 *
 * Maintenance Due Checks:
 * - Threshold: 7 days before scheduled date
 * - Only checks maintenance with status = "PROGRAMADO" or "PENDIENTE"
 * - Creates one notification per equipment (not per maintenance record)
 * - Notification includes equipment code, scheduled date, maintenance type
 *
 * Contract Expiration Checks:
 * - Threshold: 30 days before end date
 * - Only checks contracts with estado = "ACTIVO"
 * - Creates one notification per contract
 * - Notification includes contract number, end date, equipment
 *
 * Certification Expiry Checks:
 * - Threshold: 30 days before expiry date
 * - Only checks certifications with status = "valid" or "expiring_soon"
 * - Creates one notification per operator (not per certification)
 * - Notification includes operator name, certification type, expiry date
 *
 * Error Handling:
 * - Cron job failures are logged but do not crash the application
 * - Each job has try/catch wrapper to prevent cascading failures
 * - Database errors wrapped in DatabaseError with proper context
 * - Failed jobs retry on next scheduled run (no manual intervention needed)
 *
 * Known Limitations:
 * 1. No Distributed Lock: If multiple app instances run, jobs execute multiple times
 *    Solution: Use Redis distributed lock or single cron instance
 * 2. No Job History: No database record of job executions
 *    Solution: Create cron_job_history table
 * 3. Fixed Recipients: Notifications sent to all users with specific roles
 *    Solution: Add project-specific or equipment-specific targeting
 * 4. No Email: Only creates in-app notifications
 *    Solution: Integrate with email service for critical alerts
 * 5. No Manual Trigger: Jobs only run on schedule
 *    Solution: Add API endpoints to trigger checks on-demand
 * 6. Timezone: Uses server timezone (configure TZ environment variable)
 *
 * TypeORM Migration Status:
 * ✅ Fully Migrated (Phase 3)
 * - Uses TypeORM repositories for all database queries
 * - No raw SQL queries
 * - Type-safe query builders with filters
 *
 * Related Services:
 * - NotificationService: Creates in-app notifications for alerts
 * - MaintenanceService: Manages maintenance schedules
 * - ContractService: Manages rental contracts
 * - OperatorService: Manages operator data and certifications
 *
 * Future Enhancements:
 * 1. Redis Distributed Lock: Prevent duplicate job execution in multi-instance deployments
 * 2. Job History Table: Track execution times, results, errors
 * 3. Configurable Thresholds: Make 7-day and 30-day thresholds configurable per company
 * 4. Email Notifications: Send email for critical alerts (maintenance overdue, contract expired)
 * 5. Manual Trigger API: Add REST endpoints to trigger checks on-demand
 * 6. Project-Specific Targeting: Send notifications to project managers for their equipment
 * 7. Equipment Owner Targeting: Notify specific users responsible for equipment
 * 8. SMS Alerts: Integrate SMS for critical certifications expiring
 * 9. Slack/Teams Integration: Send alerts to team channels
 * 10. Job Status Dashboard: Admin UI to view cron job status, last run time, next run time
 *
 * @class CronService
 * @see NotificationService - Creates notifications
 * @see MaintenanceSchedule - Maintenance schedule entity
 * @see Contract - Contract entity
 */
export class CronService {
  private maintenanceRepository: Repository<MaintenanceSchedule>;
  private contractRepository: Repository<Contract>;
  private trabajadorRepository: Repository<Trabajador>;
  private userRepository: Repository<User>;
  private equipmentRepository: Repository<Equipment>;
  private operatorDocumentRepository: Repository<OperatorDocument>;
  private notificationService: NotificationService;
  private jobs: ScheduledTask[] = [];

  constructor() {
    this.maintenanceRepository = AppDataSource.getRepository(MaintenanceSchedule);
    this.contractRepository = AppDataSource.getRepository(Contract);
    this.trabajadorRepository = AppDataSource.getRepository(Trabajador);
    this.userRepository = AppDataSource.getRepository(User);
    this.equipmentRepository = AppDataSource.getRepository(Equipment);
    this.operatorDocumentRepository = AppDataSource.getRepository(OperatorDocument);
    this.notificationService = new NotificationService();
  }

  /**
   * Check for Equipment Maintenance Due Within 7 Days
   *
   * Queries MaintenanceSchedule table for scheduled maintenance due within 7 days
   * and creates warning notifications for maintenance managers.
   *
   * Business Logic:
   * 1. Query maintenance records:
   *    - fechaProgramada between today and today + 7 days
   *    - estado in ["PROGRAMADO", "PENDIENTE"]
   *    - Join with equipment to get equipment details
   *
   * 2. Group by equipment (multiple maintenance records per equipment)
   *
   * 3. For each equipment with maintenance due:
   *    - Get all users with role "ALMACEN" or "ADMIN"
   *    - Create warning notification with:
   *      - Title: "Mantenimiento Próximo - [Equipment Code]"
   *      - Message: "El equipo [code] requiere mantenimiento [type] el [date]"
   *      - URL: /equipment/:id/maintenance
   *
   * 4. Log summary (total equipment with maintenance due, notifications sent)
   *
   * Notification Example:
   * Type: warning
   * Title: Mantenimiento Próximo - EXC-001
   * Message: El equipo EXC-001 (Excavadora CAT 320D) requiere mantenimiento
   *          PREVENTIVO el 26/01/2026 (en 7 días)
   * URL: /equipment/123/maintenance
   *
   * Error Handling:
   * - Database query failures wrapped in DatabaseError
   * - Notification creation failures logged but do not stop processing
   * - Job continues even if some notifications fail
   * - All errors logged with full context
   *
   * @returns Promise that resolves when check completes
   * @throws {DatabaseError} If database query fails
   * @see MaintenanceSchedule - Maintenance schedule entity
   * @see NotificationService.notifyWarning - Creates warning notifications
   */
  async checkMaintenanceDue(): Promise<void> {
    try {
      logger.info('Starting maintenance due check');

      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const maintenanceDue = await this.maintenanceRepository.find({
        where: {
          fechaProgramada: Between(today, sevenDaysFromNow),
          estado: 'PROGRAMADO' as EstadoMantenimiento,
        },
        relations: ['equipo'],
        order: {
          fechaProgramada: 'ASC',
        },
      });

      if (maintenanceDue.length === 0) {
        logger.info('Maintenance check complete: No maintenance due within 7 days');
        return;
      }

      const equipmentMap = new Map<number, MaintenanceSchedule[]>();
      for (const maintenance of maintenanceDue) {
        const equipoId = maintenance.equipoId;
        if (!equipmentMap.has(equipoId)) {
          equipmentMap.set(equipoId, []);
        }
        equipmentMap.get(equipoId)!.push(maintenance);
      }

      // Find users with ALMACEN or ADMIN roles
      const targetUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .where('rol.code IN (:...roles)', { roles: ['ALMACEN', 'ADMIN'] })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .getMany();

      if (targetUsers.length === 0) {
        logger.warn('No ALMACEN or ADMIN users found to notify for maintenance due');
        return;
      }

      let notificationsSent = 0;

      for (const [equipoId, maintenanceRecords] of equipmentMap.entries()) {
        const firstRecord = maintenanceRecords[0];
        const equipo = firstRecord.equipo;

        if (!equipo) {
          logger.warn('Equipment not found for maintenance record', {
            maintenance_id: firstRecord.id,
            equipo_id: equipoId,
          });
          continue;
        }

        // Convert fecha_programada to Date object if it's a string
        const fechaProgramada =
          typeof firstRecord.fechaProgramada === 'string'
            ? new Date(firstRecord.fechaProgramada)
            : firstRecord.fechaProgramada!;

        const daysUntil = Math.ceil(
          (fechaProgramada.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        const title = `Mantenimiento Próximo - ${equipo.codigoEquipo}`;
        const message = `El equipo ${equipo.codigoEquipo} (${equipo.marca} ${equipo.modelo}) requiere mantenimiento ${firstRecord.tipoMantenimiento} el ${fechaProgramada.toLocaleDateString('es-PE')} (en ${daysUntil} día${daysUntil !== 1 ? 's' : ''})`;

        for (const user of targetUsers) {
          try {
            const alreadyNotified = await this.notificationService.wasNotifiedRecently(
              user.id,
              title
            );
            if (!alreadyNotified) {
              await this.notificationService.notifyWarning(String(user.id), title, message, {
                link: `/equipment/${equipoId}/maintenance`,
              });
              notificationsSent++;
            }
          } catch (error) {
            logger.error('Failed to create maintenance notification', {
              error: error instanceof Error ? error.message : String(error),
              user_id: user.id,
              equipo_id: equipoId,
            });
          }
        }
      }

      logger.info('Maintenance check complete', {
        equipment_count: equipmentMap.size,
        maintenance_records: maintenanceDue.length,
        notifications_sent: notificationsSent,
        target_users: targetUsers.length,
      });
    } catch (error) {
      logger.error('Maintenance check failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new DatabaseError(
        'Failed to check maintenance due dates',
        DatabaseErrorType.QUERY,
        error,
        {
          operation: 'checkMaintenanceDue',
          threshold_days: 7,
        }
      );
    }
  }

  /**
   * Check for Contracts Expiring Within 30 Days
   *
   * Queries Contract table for active contracts expiring within 30 days
   * and creates warning notifications for contract administrators.
   *
   * Business Logic:
   * 1. Query contracts:
   *    - fechaFin between today and today + 30 days
   *    - estado = "ACTIVO"
   *    - Join with equipment to get equipment details
   *
   * 2. For each contract expiring:
   *    - Get all users with role "ADMIN" or "DIRECTOR"
   *    - Create warning notification
   *
   * 3. Log summary (total contracts expiring, notifications sent)
   *
   * Error Handling:
   * - Database query failures wrapped in DatabaseError
   * - Notification creation failures logged but do not stop processing
   *
   * @returns Promise that resolves when check completes
   * @throws {DatabaseError} If database query fails
   * @see Contract - Contract entity
   * @see NotificationService.notifyWarning - Creates warning notifications
   */
  async checkContractExpirations(): Promise<void> {
    try {
      logger.info('Starting contract expiration check');

      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const contractsExpiring = await this.contractRepository.find({
        where: {
          fechaFin: Between(today, thirtyDaysFromNow),
          estado: 'ACTIVO' as EstadoContrato,
        },
        relations: ['equipo'],
        order: {
          fechaFin: 'ASC',
        },
      });

      if (contractsExpiring.length === 0) {
        logger.info('Contract check complete: No contracts expiring within 30 days');
        return;
      }

      // Find users with ADMIN or DIRECTOR roles
      const targetUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .where('rol.code IN (:...roles)', { roles: ['ADMIN', 'DIRECTOR'] })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .getMany();

      if (targetUsers.length === 0) {
        logger.warn('No ADMIN or DIRECTOR users found to notify for contract expirations');
        return;
      }

      let notificationsSent = 0;

      for (const contract of contractsExpiring) {
        const equipo = contract.equipo;

        // Convert fechaFin to Date object if it's a string
        const fechaFin =
          typeof contract.fechaFin === 'string' ? new Date(contract.fechaFin) : contract.fechaFin;

        const daysUntil = Math.ceil((fechaFin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const equipoInfo = equipo ? ` para el equipo ${equipo.codigoEquipo}` : '';
        const title = `Contrato por Vencer - ${contract.numeroContrato}`;
        const message = `El contrato ${contract.numeroContrato}${equipoInfo} vence el ${fechaFin.toLocaleDateString('es-PE')} (en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}). Planifique renovación o retorno del equipo.`;

        for (const user of targetUsers) {
          try {
            const alreadyNotified = await this.notificationService.wasNotifiedRecently(
              user.id,
              title
            );
            if (!alreadyNotified) {
              await this.notificationService.notifyWarning(String(user.id), title, message, {
                link: `/contracts/${contract.id}`,
              });
              notificationsSent++;
            }
          } catch (error) {
            logger.error('Failed to create contract notification', {
              error: error instanceof Error ? error.message : String(error),
              user_id: user.id,
              contract_id: contract.id,
            });
          }
        }
      }

      logger.info('Contract check complete', {
        contracts_expiring: contractsExpiring.length,
        notifications_sent: notificationsSent,
        target_users: targetUsers.length,
      });
    } catch (error) {
      logger.error('Contract expiration check failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new DatabaseError(
        'Failed to check contract expirations',
        DatabaseErrorType.QUERY,
        error,
        {
          operation: 'checkContractExpirations',
          threshold_days: 30,
        }
      );
    }
  }

  /**
   * Check for Operator Certifications Expiring Within 30 Days
   *
   * Queries Trabajador table for operator certifications expiring within 30 days
   * and creates warning notifications for HR managers.
   *
   * Business Logic:
   * 1. Query operators with certifications expiring soon
   * 2. Group by operator (multiple certifications per operator)
   * 3. Create warning notifications for HR/ADMIN users
   * 4. Log summary
   *
   * Known Limitations:
   * - Currently uses placeholder logic (needs actual certification schema)
   * - Certification data structure in Trabajador entity needs verification
   * - May need separate OperatorCertification entity for proper querying
   *
   * @returns Promise that resolves when check completes
   * @throws {DatabaseError} If database query fails
   * @see Trabajador - Operator/worker entity
   * @see NotificationService.notifyWarning - Creates warning notifications
   * @todo Verify certification schema in Trabajador entity
   * @todo Consider creating separate OperatorCertification entity
   * @todo Add support for different certification types (license, SCTR, etc.)
   */
  async checkCertificationExpiry(): Promise<void> {
    try {
      logger.info('Starting certification expiry check');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Query operator documents expiring within 30 days
      const expiringDocs = await this.operatorDocumentRepository
        .createQueryBuilder('doc')
        .leftJoinAndSelect('doc.trabajador', 'trabajador')
        .where('doc.fechaVencimiento <= :threshold', { threshold: thirtyDaysFromNow })
        .andWhere('doc.fechaVencimiento IS NOT NULL')
        .andWhere('trabajador.isActive = :isActive', { isActive: true })
        .orderBy('doc.fechaVencimiento', 'ASC')
        .getMany();

      if (expiringDocs.length === 0) {
        logger.info('Certification check complete: No documents expiring within 30 days');
        return;
      }

      // Group by operator
      const operatorMap = new Map<number, { operator: Trabajador; docs: OperatorDocument[] }>();
      for (const doc of expiringDocs) {
        if (!doc.trabajador) continue;
        if (!operatorMap.has(doc.trabajadorId)) {
          operatorMap.set(doc.trabajadorId, { operator: doc.trabajador, docs: [] });
        }
        operatorMap.get(doc.trabajadorId)!.docs.push(doc);
      }

      // Find users with JEFE_EQUIPO or ADMIN roles
      const targetUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .where('rol.code IN (:...roles)', { roles: ['JEFE_EQUIPO', 'ADMIN'] })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .getMany();

      if (targetUsers.length === 0) {
        logger.warn('No JEFE_EQUIPO or ADMIN users found to notify for certification expiry');
        return;
      }

      let notificationsSent = 0;

      for (const [, { operator, docs }] of operatorMap) {
        const certList = docs
          .map((doc) => {
            const expiryDate =
              typeof doc.fechaVencimiento === 'string'
                ? new Date(doc.fechaVencimiento)
                : doc.fechaVencimiento!;
            const daysUntil = Math.ceil(
              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            const statusText =
              daysUntil < 0 ? 'VENCIDO' : `en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`;
            return `- ${doc.tipoDocumento}: ${expiryDate.toLocaleDateString('es-PE')} (${statusText})`;
          })
          .join('\n');

        const title = `Documentos por Vencer - ${operator.nombres} ${operator.apellidoPaterno}`;
        const message = `Los documentos de ${operator.nombres} ${operator.apellidoPaterno} vencen próximamente:\n${certList}`;

        for (const user of targetUsers) {
          try {
            const alreadyNotified = await this.notificationService.wasNotifiedRecently(
              user.id,
              title
            );
            if (!alreadyNotified) {
              await this.notificationService.notifyWarning(String(user.id), title, message, {
                link: `/operators/${operator.id}`,
              });
              notificationsSent++;
            }
          } catch (error) {
            logger.error('Failed to create certification notification', {
              error: error instanceof Error ? error.message : String(error),
              user_id: user.id,
              operator_id: operator.id,
            });
          }
        }
      }

      logger.info('Certification check complete', {
        operators_with_expiring_docs: operatorMap.size,
        total_expiring_docs: expiringDocs.length,
        notifications_sent: notificationsSent,
        target_users: targetUsers.length,
      });
    } catch (error) {
      logger.error('Certification expiry check failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new DatabaseError(
        'Failed to check certification expiry dates',
        DatabaseErrorType.QUERY,
        error,
        {
          operation: 'checkCertificationExpiry',
          threshold_days: 30,
        }
      );
    }
  }

  /**
   * Start All Scheduled Cron Jobs
   *
   * Initializes and starts all cron jobs defined in the service.
   * Jobs are added to internal jobs array for management.
   *
   * Jobs Started:
   * 1. Daily Maintenance Check - 8:00 AM daily (0 8 * * *)
   * 2. Daily Contract Expiration Check - 8:00 AM daily (0 8 * * *)
   * 3. Daily Certification Expiry Check - 8:00 AM daily (0 8 * * *)
   *
   * Call this method during application startup to enable automated checks.
   *
   * Error Handling:
   * - Job scheduling errors are logged but do not crash application
   * - Individual job failures are caught and logged within job execution
   * - Failed jobs will retry on next scheduled run
   *
   * @returns void
   * @see stopAllJobs - Stop all running jobs
   */
  /**
   * Check for equipment documents (SOAT, Póliza, CITV) expiring within 30 days
   */
  async checkEquipmentDocumentExpiry(): Promise<void> {
    try {
      logger.info('Starting equipment document expiry check');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const equipment = await this.equipmentRepository
        .createQueryBuilder('e')
        .where('e.isActive = :isActive', { isActive: true })
        .andWhere(
          '(e.fechaVencSoat <= :threshold OR e.fechaVencPoliza <= :threshold OR e.fechaVencCitv <= :threshold)',
          { threshold: thirtyDaysFromNow }
        )
        .getMany();

      if (equipment.length === 0) {
        logger.info('Equipment document check complete: No documents expiring within 30 days');
        return;
      }

      const targetUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .where('rol.code IN (:...roles)', { roles: ['JEFE_EQUIPO', 'ADMIN'] })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .getMany();

      if (targetUsers.length === 0) {
        logger.warn('No JEFE_EQUIPO or ADMIN users found for equipment document alerts');
        return;
      }

      let notificationsSent = 0;
      const docFields = [
        { field: 'fechaVencSoat' as const, label: 'SOAT' },
        { field: 'fechaVencPoliza' as const, label: 'Póliza TREC' },
        { field: 'fechaVencCitv' as const, label: 'CITV' },
      ];

      for (const equip of equipment) {
        const expiringDocs: string[] = [];

        for (const { field, label } of docFields) {
          const date = equip[field];
          if (!date) continue;
          const expiryDate = typeof date === 'string' ? new Date(date) : date;
          const daysUntil = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntil <= 30) {
            const statusText =
              daysUntil < 0 ? 'VENCIDO' : `en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`;
            expiringDocs.push(
              `- ${label}: ${expiryDate.toLocaleDateString('es-PE')} (${statusText})`
            );
          }
        }

        if (expiringDocs.length === 0) continue;

        const title = `Documentos por Vencer - ${equip.codigoEquipo}`;
        const message = `El equipo ${equip.codigoEquipo} (${equip.marca || ''} ${equip.modelo || ''}) tiene documentos por vencer:\n${expiringDocs.join('\n')}`;

        for (const user of targetUsers) {
          try {
            const alreadyNotified = await this.notificationService.wasNotifiedRecently(
              user.id,
              title
            );
            if (!alreadyNotified) {
              await this.notificationService.notifyWarning(String(user.id), title, message, {
                link: `/equipment/${equip.id}`,
              });
              notificationsSent++;
            }
          } catch (error) {
            logger.error('Failed to create equipment document notification', {
              error: error instanceof Error ? error.message : String(error),
              user_id: user.id,
              equipo_id: equip.id,
            });
          }
        }
      }

      // Send consolidated email digest to users with valid emails
      const recipientEmails = targetUsers.map((u) => u.email).filter(Boolean);
      if (recipientEmails.length > 0) {
        const emailItems = equipment
          .map((equip) => {
            const documentos: Array<{ tipo: string; fecha_vencimiento: string; estado: string }> =
              [];
            for (const { field, label } of docFields) {
              const date = equip[field];
              if (!date) continue;
              const expiryDate = typeof date === 'string' ? new Date(date) : date;
              const daysUntil = Math.ceil(
                (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysUntil <= 30) {
                documentos.push({
                  tipo: label,
                  fecha_vencimiento: expiryDate.toLocaleDateString('es-PE'),
                  estado:
                    daysUntil < 0
                      ? 'VENCIDO'
                      : `vence en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
                });
              }
            }
            return {
              codigo_equipo: equip.codigoEquipo,
              marca: equip.marca || undefined,
              modelo: equip.modelo || undefined,
              documentos,
              link: `/equipment/${equip.id}`,
            };
          })
          .filter((item) => item.documentos.length > 0);

        if (emailItems.length > 0) {
          try {
            await emailService.sendDocumentExpiryAlert({ items: emailItems }, recipientEmails);
          } catch (emailError) {
            logger.error('Failed to send document expiry email alert', {
              error: emailError instanceof Error ? emailError.message : String(emailError),
            });
          }
        }
      }

      logger.info('Equipment document check complete', {
        equipment_with_expiring_docs: equipment.length,
        notifications_sent: notificationsSent,
      });
    } catch (error) {
      logger.error('Equipment document expiry check failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new DatabaseError(
        'Failed to check equipment document expiry',
        DatabaseErrorType.QUERY,
        error,
        { operation: 'checkEquipmentDocumentExpiry', threshold_days: 30 }
      );
    }
  }

  /**
   * Check for overdue valuations (BORRADOR past the day-10 deadline)
   * Per PRD CORP-GEM-P-002: Day 10 of the following month is the final deadline.
   */
  async checkValuationDeadlines(): Promise<void> {
    try {
      logger.info('Starting valuation deadline check');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const valuationRepo = AppDataSource.getRepository(Valorizacion);

      // Find valuations still in BORRADOR or PENDIENTE that may be overdue
      const openValuations = await valuationRepo.find({
        where: [
          { estado: 'BORRADOR' as EstadoValorizacion },
          { estado: 'PENDIENTE' as EstadoValorizacion },
        ],
        relations: ['contrato'],
      });

      if (openValuations.length === 0) {
        logger.info('Valuation deadline check complete: No open valuations');
        return;
      }

      const overdueValuations: Valorizacion[] = [];

      for (const val of openValuations) {
        if (!val.periodo) continue;
        // periodo format: YYYY-MM
        const [year, month] = val.periodo.split('-').map(Number);
        if (!year || !month) continue;
        // Deadline is day 10 of the following month
        const deadlineMonth = month === 12 ? 1 : month + 1;
        const deadlineYear = month === 12 ? year + 1 : year;
        const deadline = new Date(deadlineYear, deadlineMonth - 1, 10);
        deadline.setHours(23, 59, 59, 999);

        if (today > deadline) {
          overdueValuations.push(val);
        }
      }

      if (overdueValuations.length === 0) {
        logger.info('Valuation deadline check complete: No overdue valuations');
        return;
      }

      const targetUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .where('rol.code IN (:...roles)', { roles: ['JEFE_EQUIPO', 'ADMIN'] })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .getMany();

      if (targetUsers.length === 0) {
        logger.warn('No target users for valuation deadline alerts');
        return;
      }

      let notificationsSent = 0;

      for (const val of overdueValuations) {
        const contratoInfo = val.contrato ? ` - Contrato ${val.contrato.numeroContrato}` : '';
        const title = `Valorización Vencida - ${val.periodo}${contratoInfo}`;
        const message = `La valorización del periodo ${val.periodo}${contratoInfo} está en estado ${val.estado} y ha superado el plazo de entrega (día 10 del mes siguiente).`;

        for (const user of targetUsers) {
          try {
            const alreadyNotified = await this.notificationService.wasNotifiedRecently(
              user.id,
              title
            );
            if (!alreadyNotified) {
              await this.notificationService.notifyWarning(String(user.id), title, message, {
                link: `/equipment/valuations/${val.id}`,
              });
              notificationsSent++;
            }
          } catch (error) {
            logger.error('Failed to create valuation deadline notification', {
              error: error instanceof Error ? error.message : String(error),
              user_id: user.id,
              valuation_id: val.id,
            });
          }
        }
      }

      // Send consolidated email digest
      const recipientEmails = targetUsers.map((u) => u.email).filter(Boolean);
      if (recipientEmails.length > 0) {
        try {
          const emailItems = overdueValuations.map((val) => {
            const [year, month] = (val.periodo || '').split('-').map(Number);
            const deadlineMonth = month === 12 ? 1 : month + 1;
            const deadlineYear = month === 12 ? year + 1 : year;
            const deadline = new Date(deadlineYear, deadlineMonth - 1, 10);
            const daysOverdue = Math.ceil(
              (today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              numero_valorizacion: val.numeroValorizacion || `VAL-${val.id}`,
              periodo: val.periodo,
              estado: val.estado,
              contrato: val.contrato?.numeroContrato,
              dias_vencidos: daysOverdue,
              link: `/equipment/valuations/${val.id}`,
            };
          });
          await emailService.sendValuationDeadlineAlert({ items: emailItems }, recipientEmails);
        } catch (emailError) {
          logger.error('Failed to send valuation deadline email alert', {
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }
      }

      logger.info('Valuation deadline check complete', {
        overdue_valuations: overdueValuations.length,
        notifications_sent: notificationsSent,
      });
    } catch (error) {
      logger.error('Valuation deadline check failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new DatabaseError(
        'Failed to check valuation deadlines',
        DatabaseErrorType.QUERY,
        error,
        { operation: 'checkValuationDeadlines' }
      );
    }
  }

  /**
   * Check for overdue accounts payable (past due_date, still PENDIENTE or PARCIAL)
   */
  async checkOverduePayments(): Promise<void> {
    try {
      logger.info('Starting overdue payments check');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const apRepo = AppDataSource.getRepository(AccountsPayable);

      const overduePayments = await apRepo
        .createQueryBuilder('ap')
        .leftJoinAndSelect('ap.provider', 'provider')
        .where('ap.due_date < :today', { today })
        .andWhere('ap.status IN (:...statuses)', {
          statuses: [AccountsPayableStatus.PENDING, AccountsPayableStatus.PARTIAL],
        })
        .orderBy('ap.due_date', 'ASC')
        .getMany();

      if (overduePayments.length === 0) {
        logger.info('Overdue payments check complete: No overdue payments');
        return;
      }

      const targetUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .where('rol.code IN (:...roles)', { roles: ['ADMIN', 'DIRECTOR'] })
        .andWhere('user.is_active = :isActive', { isActive: true })
        .getMany();

      if (targetUsers.length === 0) {
        logger.warn('No ADMIN or DIRECTOR users found for overdue payment alerts');
        return;
      }

      let notificationsSent = 0;

      for (const payment of overduePayments) {
        const dueDate =
          typeof payment.dueDate === 'string' ? new Date(payment.dueDate) : payment.dueDate;
        const daysOverdue = Math.ceil(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const providerName = payment.provider?.razonSocial || 'Proveedor desconocido';
        const title = `Pago Vencido - ${payment.documentNumber}`;
        const message = `La factura ${payment.documentNumber} de ${providerName} venció hace ${daysOverdue} día${daysOverdue !== 1 ? 's' : ''} (${dueDate.toLocaleDateString('es-PE')}). Monto pendiente: S/ ${Number(payment.balance || payment.amount).toFixed(2)}`;

        for (const user of targetUsers) {
          try {
            const alreadyNotified = await this.notificationService.wasNotifiedRecently(
              user.id,
              title
            );
            if (!alreadyNotified) {
              await this.notificationService.notifyWarning(String(user.id), title, message, {
                link: `/payments`,
              });
              notificationsSent++;
            }
          } catch (error) {
            logger.error('Failed to create overdue payment notification', {
              error: error instanceof Error ? error.message : String(error),
              user_id: user.id,
              payment_id: payment.id,
            });
          }
        }
      }

      // Send consolidated email digest
      const recipientEmails = targetUsers.map((u) => u.email).filter(Boolean);
      if (recipientEmails.length > 0) {
        try {
          const emailItems = overduePayments.map((payment) => {
            const dueDate =
              typeof payment.dueDate === 'string' ? new Date(payment.dueDate) : payment.dueDate;
            const daysOverdue = Math.ceil(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              numero_documento: payment.documentNumber,
              proveedor: payment.provider?.razonSocial || 'Proveedor desconocido',
              fecha_vencimiento: dueDate.toLocaleDateString('es-PE'),
              dias_vencidos: daysOverdue,
              monto_pendiente: Number(payment.balance || payment.amount),
              moneda: payment.currency || 'S/',
            };
          });
          await emailService.sendOverduePaymentAlert({ items: emailItems }, recipientEmails);
        } catch (emailError) {
          logger.error('Failed to send overdue payment email alert', {
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }
      }

      logger.info('Overdue payments check complete', {
        overdue_count: overduePayments.length,
        notifications_sent: notificationsSent,
      });
    } catch (error) {
      logger.error('Overdue payments check failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new DatabaseError('Failed to check overdue payments', DatabaseErrorType.QUERY, error, {
        operation: 'checkOverduePayments',
      });
    }
  }

  /**
   * Check all active inoperability periods and flag those exceeding the SLA threshold.
   * PRD Clause 7.6: lessor has 5 days to repair or replace equipment.
   * Sends notifications to JEFE_EQUIPO + ADMIN users for newly exceeded periods.
   */
  async checkInoperabilidadVencida(): Promise<void> {
    try {
      const { PeriodoInoperatividadService } = await import('./periodo-inoperatividad.service');
      const { PeriodoInoperatividad } = await import('../models/periodo-inoperatividad.model');
      const periodoService = new PeriodoInoperatividadService();
      const { actualizados, nuevosExcedidos } = await periodoService.verificarVencimientos();

      if (nuevosExcedidos === 0) {
        logger.info('Inoperabilidad check: no new exceeded periods', { actualizados });
        return;
      }

      // Notify JEFE_EQUIPO and ADMIN users
      const targetUsers = await this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.rol', 'rol')
        .where('rol.code IN (:...roles)', { roles: ['JEFE_EQUIPO', 'ADMIN'] })
        .getMany();

      const exceededPeriods = await AppDataSource.getRepository(PeriodoInoperatividad).find({
        where: { estado: 'ACTIVO', excedePlazo: true },
      });

      let notificationsSent = 0;
      for (const period of exceededPeriods) {
        const title = `Inoperatividad Excedida — Equipo #${period.equipoId}`;
        const message = `El equipo lleva ${period.diasInoperativo} días inoperativo, superando el plazo de ${period.diasPlazo} días establecido en la Cláusula 7.6. Motivo: ${period.motivo}`;
        for (const user of targetUsers) {
          try {
            const alreadyNotified = await this.notificationService.wasNotifiedRecently(
              user.id,
              title
            );
            if (!alreadyNotified) {
              await this.notificationService.notifyWarning(String(user.id), title, message, {
                link: `/equipment/${period.equipoId}`,
              });
              notificationsSent++;
            }
          } catch {
            // continue notifying other users
          }
        }
      }

      logger.info('Inoperabilidad check completed', {
        actualizados,
        nuevosExcedidos,
        notificationsSent,
        operation: 'checkInoperabilidadVencida',
      });
    } catch (error) {
      logger.error('Error checking inoperabilidad vencida', {
        error: error instanceof Error ? error.message : String(error),
        operation: 'checkInoperabilidadVencida',
      });
    }
  }

  startAllJobs(): void {
    try {
      const maintenanceJob = cron.schedule('0 8 * * *', async () => {
        try {
          await this.checkMaintenanceDue();
        } catch (error) {
          logger.error('Maintenance cron job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      const contractJob = cron.schedule('0 8 * * *', async () => {
        try {
          await this.checkContractExpirations();
        } catch (error) {
          logger.error('Contract expiration cron job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      const certificationJob = cron.schedule('0 8 * * *', async () => {
        try {
          await this.checkCertificationExpiry();
        } catch (error) {
          logger.error('Certification expiry cron job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      const equipmentDocJob = cron.schedule('0 8 * * *', async () => {
        try {
          await this.checkEquipmentDocumentExpiry();
        } catch (error) {
          logger.error('Equipment document expiry cron job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      const valuationDeadlineJob = cron.schedule('0 8 * * *', async () => {
        try {
          await this.checkValuationDeadlines();
        } catch (error) {
          logger.error('Valuation deadline cron job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      const overduePaymentsJob = cron.schedule('0 8 * * *', async () => {
        try {
          await this.checkOverduePayments();
        } catch (error) {
          logger.error('Overdue payments cron job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      const inoperabilidadJob = cron.schedule('0 8 * * *', async () => {
        try {
          await this.checkInoperabilidadVencida();
        } catch (error) {
          logger.error('Inoperabilidad cron job failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      this.jobs.push(
        maintenanceJob,
        contractJob,
        certificationJob,
        equipmentDocJob,
        valuationDeadlineJob,
        overduePaymentsJob,
        inoperabilidadJob
      );

      logger.info('All cron jobs started successfully', {
        job_count: this.jobs.length,
        schedules: [
          'Maintenance: 8:00 AM daily',
          'Contracts: 8:00 AM daily',
          'Certifications: 8:00 AM daily',
          'Equipment Documents: 8:00 AM daily',
          'Valuation Deadlines: 8:00 AM daily',
          'Overdue Payments: 8:00 AM daily',
          'Inoperabilidad: 8:00 AM daily',
        ],
      });
    } catch (error) {
      logger.error('Failed to start cron jobs', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  /**
   * Stop All Running Cron Jobs
   *
   * Stops all scheduled cron jobs and clears the jobs array.
   * Should be called during application graceful shutdown.
   *
   * @returns void
   */
  stopAllJobs(): void {
    try {
      for (const job of this.jobs) {
        job.stop();
      }
      this.jobs = [];
      logger.info('All cron jobs stopped successfully');
    } catch (error) {
      logger.error('Failed to stop cron jobs', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
