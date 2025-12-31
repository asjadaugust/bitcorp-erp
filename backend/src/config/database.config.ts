import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as path from 'path';

dotenv.config();

// Import all entities explicitly
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { Project } from '../models/project.model';
import { Provider } from '../models/provider.model';
import { Equipment } from '../models/equipment.model';
import { Contract, Addendum } from '../models/contract.model';
import { Valuation } from '../models/valuation.model';
import { Product } from '../models/product.model';
import { Movement, MovementDetail } from '../models/movement.model';
import { MaintenanceSchedule } from '../models/maintenance-schedule.model';
import { ScheduledTask } from '../models/scheduled-task.model'; // Spanish schema: equipo.tarea_programada
import { OperatorAvailability } from '../models/operator-availability.model';
import { Notification } from '../models/notification.model';
import { Employee } from '../models/employee.model';
import { SigDocument } from '../models/sig-document.model';
import { Tender } from '../models/tender.model';
import { SafetyIncident } from '../models/safety-incident.model';
import { CostCenter } from '../models/cost-center.model';
import { AccountsPayable } from '../models/accounts-payable.model';
import { PaymentSchedule } from '../models/payment-schedule.model';
import { PaymentScheduleDetail } from '../models/payment-schedule-detail.model';
import { ReportPhoto } from '../models/report-photo.model';
// New entities directory
import { Operator } from '../models/operator.entity';
import { OperatorDocument } from '../models/operator-document.entity';
import { OperatorAvailability as OperatorAvailabilityEntity } from '../models/operator-availability.entity';
import { Trabajador } from '../models/trabajador.model';
import { EquipmentAssignment } from '../models/equipment-assignment.model';

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
    Project,
    Provider,
    Equipment,
    Contract,
    Addendum,
    Valuation,
    Product,
    Movement,
    MovementDetail,
    MaintenanceSchedule,
    ScheduledTask,
    OperatorAvailability,
    Notification,
    Employee,
    SigDocument,
    Tender,
    SafetyIncident,
    CostCenter,
    AccountsPayable,
    PaymentSchedule,
    PaymentScheduleDetail,
    ReportPhoto,
    // New entities
    Operator,
    OperatorDocument,
    OperatorAvailabilityEntity,
    Trabajador,
    EquipmentAssignment,
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



