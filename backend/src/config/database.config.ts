import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as path from 'path';

dotenv.config();

// Import all entities explicitly
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { UnidadOperativa } from '../models/unidad-operativa.model';
import { Project } from '../models/project.model';
import { Provider } from '../models/provider.model';
import { ProviderContact } from '../models/provider-contact.model';
import { ProviderFinancialInfo } from '../models/provider-financial-info.model';
import { Equipment } from '../models/equipment.model';
import { Contract, Addendum } from '../models/contract.model';
import { Valuation } from '../models/valuation.model';
import { Product } from '../models/product.model';
import { Movement, MovementDetail } from '../models/movement.model';
import { MaintenanceSchedule } from '../models/maintenance-schedule.model';
import { MaintenanceScheduleRecurring } from '../models/maintenance-schedule-recurring.model';
import { ScheduledTask } from '../models/scheduled-task.model'; // Spanish schema: equipo.tarea_programada
import { OperatorAvailability } from '../models/operator-availability.model';
import { Notification } from '../models/notification.model';
// import { Employee } from '../models/employee.model'; // DELETED
import { SigDocument } from '../models/sig-document.model';
import { Tender } from '../models/tender.model';
import { SafetyIncident } from '../models/safety-incident.model';
import { CostCenter } from '../models/cost-center.model';
import { AccountsPayable } from '../models/accounts-payable.model';
import { PaymentSchedule } from '../models/payment-schedule.model';
import { PaymentScheduleDetail } from '../models/payment-schedule-detail.model';
// import { ReportPhoto } from '../models/report-photo.model'; // DELETED
// New entities directory
// import { Operator } from '../models/operator.entity'; // DELETED
import { OperatorDocument } from '../models/operator-document.entity';
// import { OperatorAvailability as OperatorAvailabilityEntity } from '../models/operator-availability.entity'; // DELETED
import { Trabajador } from '../models/trabajador.model';
import { Timesheet } from '../models/timesheet.model';
import { TimesheetDetail } from '../models/timesheet-detail.model';
import { EquipmentAssignment } from '../models/equipment-assignment.model';
import { FuelRecord } from '../models/fuel-record.model';
import { ChecklistTemplate } from '../models/checklist-template.model';
import { ChecklistItem } from '../models/checklist-item.model';
import { ChecklistInspection } from '../models/checklist-inspection.model';
import { ChecklistResult } from '../models/checklist-result.model';
import { ExcessFuel } from '../models/excess-fuel.model';
import { WorkExpense } from '../models/work-expense.model';
import { AdvanceAmortization } from '../models/advance-amortization.model';
import { DailyReport } from '../models/daily-report-typeorm.model';
import { DailyReportProduction } from '../models/daily-report-production.model';
import { DailyReportProductionActivity } from '../models/daily-report-activity.model';
import { DailyReportOperationalDelay } from '../models/daily-report-operational-delay.model';
import { DailyReportOtherEvent } from '../models/daily-report-other-event.model';
import { DailyReportMechanicalDelay } from '../models/daily-report-mechanical-delay.model';
import { Company, UserProject } from '../models/company-entity.model';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'bitcorp',
  password: process.env.POSTGRES_PASSWORD || 'dev_password_change_me',
  database: process.env.POSTGRES_DB || 'bitcorp_dev',
  synchronize: false, // Disabled - we manage schema with migrations
  logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Role,
    Permission,
    UnidadOperativa,
    Project,
    Provider,
    ProviderContact,
    ProviderFinancialInfo,
    Equipment,
    Contract,
    Addendum,
    Valuation,
    Product,
    Movement,
    MovementDetail,
    MaintenanceSchedule,
    MaintenanceScheduleRecurring,
    ScheduledTask,
    OperatorAvailability,
    Notification,
    // Employee, // DELETED
    SigDocument,
    Tender,
    SafetyIncident,
    CostCenter,
    AccountsPayable,
    PaymentSchedule,
    PaymentScheduleDetail,
    // ReportPhoto, // DELETED
    // New entities
    // Operator, // DELETED
    OperatorDocument,
    // OperatorAvailabilityEntity, // DELETED
    Trabajador,
    Timesheet,
    TimesheetDetail,
    EquipmentAssignment,
    FuelRecord,
    ChecklistTemplate,
    ChecklistItem,
    ChecklistInspection,
    ChecklistResult,
    ExcessFuel,
    WorkExpense,
    AdvanceAmortization,
    DailyReport,
    DailyReportProduction,
    DailyReportProductionActivity,
    DailyReportOperationalDelay,
    DailyReportOtherEvent,
    DailyReportMechanicalDelay,
    // Tenant / Multi-tenancy entities (tables don't exist yet - see company-entity.model.ts)
    Company,
    UserProject,
  ],
  migrations: [path.join(__dirname, '../database/migrations/*{.ts,.js}')],
  subscribers: [],
});

// PostgreSQL connection pool for raw queries
export const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'bitcorp',
  password: process.env.POSTGRES_PASSWORD || 'dev_password_change_me',
  database: process.env.POSTGRES_DB || 'bitcorp_dev',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Export pool as default for raw queries
export default pool;
