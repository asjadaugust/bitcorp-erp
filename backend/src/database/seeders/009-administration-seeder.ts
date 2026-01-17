import { BaseSeeder } from './base-seeder';
import { CentroCosto } from '../../models/cost-center.model';
import { AccountsPayable, AccountsPayableStatus } from '../../models/accounts-payable.model';
import { PaymentSchedule } from '../../models/payment-schedule.model';
import { Provider } from '../../models/provider.model';
import { Proyecto } from '../../models/project.model';

/**
 * Seeds administration data: cost centers, accounts payable, payment schedules
 */
export class AdministrationSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding administration data (cost centers, accounts payable)...');

    // Get references to existing data
    const providerRepo = this.dataSource.getRepository(Provider);
    const projectRepo = this.dataSource.getRepository(Proyecto);

    const providers = await providerRepo.find({ take: 2 });
    const projects = await projectRepo.find({ take: 2 });

    if (providers.length === 0 || projects.length === 0) {
      console.log('     ⚠️  Required data not found. Skipping administration seeding.');
      return;
    }

    // 1. Cost Centers
    const costCenterRepo = this.dataSource.getRepository(CentroCosto);

    const existingCostCenters = await costCenterRepo.count();
    if (existingCostCenters === 0) {
      await costCenterRepo.save([
        costCenterRepo.create({
          legacyId: 'CC001',
          codigo: 'CC-ADM-001',
          nombre: 'Administración General',
          descripcion: 'Gastos administrativos generales de la empresa',
          presupuesto: 50000.0,
          isActive: true,
        }),
        costCenterRepo.create({
          legacyId: 'CC002',
          codigo: 'CC-PRO-001',
          nombre: 'Proyecto Carretera Central',
          descripcion: 'Centro de costo específico para proyecto Carretera Central',
          projectId: projects[0].id,
          presupuesto: 5000000.0,
          isActive: true,
        }),
        costCenterRepo.create({
          legacyId: 'CC003',
          codigo: 'CC-PRO-002',
          nombre: 'Proyecto Puente Arequipa',
          descripcion: 'Centro de costo específico para proyecto Puente Arequipa',
          projectId: projects[1].id,
          presupuesto: 3000000.0,
          isActive: true,
        }),
        costCenterRepo.create({
          legacyId: 'CC004',
          codigo: 'CC-MNT-001',
          nombre: 'Mantenimiento de Equipos',
          descripcion: 'Gastos de mantenimiento preventivo y correctivo',
          presupuesto: 250000.0,
          isActive: true,
        }),
        costCenterRepo.create({
          legacyId: 'CC005',
          codigo: 'CC-LOG-001',
          nombre: 'Logística y Almacén',
          descripcion: 'Gastos operativos de logística y gestión de almacén',
          presupuesto: 100000.0,
          isActive: true,
        }),
      ]);
    }

    // 2. Accounts Payable
    const accountsPayableRepo = this.dataSource.getRepository(AccountsPayable);

    const existingAccounts = await accountsPayableRepo.count();
    if (existingAccounts === 0) {
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      await accountsPayableRepo.save([
        accountsPayableRepo.create({
          provider_id: providers[0].id,
          document_number: 'F001-12345',
          issue_date: lastMonth,
          due_date: nextWeek,
          currency: 'PEN',
          amount: 18290.0,
          amount_paid: 0,
          balance: 18290.0,
          status: AccountsPayableStatus.PENDING,
          description: 'Compra de combustible diesel B5 - 1000 galones. Proveedor: Petroperú',
        }),
        accountsPayableRepo.create({
          provider_id: providers[1].id,
          document_number: 'F002-98765',
          issue_date: lastMonth,
          due_date: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
          currency: 'PEN',
          amount: 2879.2,
          amount_paid: 2879.2,
          balance: 0,
          status: AccountsPayableStatus.PAID,
          description: 'Compra de repuestos: filtros y lubricantes. Pagado.',
        }),
        accountsPayableRepo.create({
          provider_id: providers[0].id,
          document_number: 'F001-12567',
          issue_date: today,
          due_date: nextMonth,
          currency: 'USD',
          amount: 5310.0,
          amount_paid: 0,
          balance: 5310.0,
          status: AccountsPayableStatus.PENDING,
          description: 'Servicio de mantenimiento mayor - Tractor Komatsu. Factura en USD.',
        }),
        accountsPayableRepo.create({
          provider_id: providers[1].id,
          document_number: 'F002-98890',
          issue_date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
          due_date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
          currency: 'PEN',
          amount: 10030.0,
          amount_paid: 5000.0,
          balance: 5030.0,
          status: AccountsPayableStatus.PARTIAL,
          description: 'Alquiler de equipos auxiliares - Enero 2025. Pago parcial recibido.',
        }),
      ]);
    }

    // 3. Payment Schedules
    const paymentScheduleRepo = this.dataSource.getRepository(PaymentSchedule);

    const existingSchedules = await paymentScheduleRepo.count();
    if (existingSchedules === 0) {
      const today = new Date();

      await paymentScheduleRepo.save([
        paymentScheduleRepo.create({
          provider_id: providers[0].id,
          project_id: projects[0].id,
          periodo: '2025-01',
          schedule_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          total_amount: 18290.0,
          status: 'PROGRAMADO',
          description: 'Pago combustible enero 2025',
        }),
        paymentScheduleRepo.create({
          provider_id: providers[1].id,
          project_id: projects[1].id,
          periodo: '2025-02',
          schedule_date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
          total_amount: 5030.0,
          status: 'PROGRAMADO',
          description: 'Segunda cuota alquiler equipos',
        }),
      ]);
    }

    const costCenterCount = await costCenterRepo.count();
    const accountsCount = await accountsPayableRepo.count();
    const scheduleCount = await paymentScheduleRepo.count();

    console.log(
      `     ✓ Created ${costCenterCount} cost centers, ${accountsCount} accounts payable, ${scheduleCount} payment schedules`
    );
  }
}
