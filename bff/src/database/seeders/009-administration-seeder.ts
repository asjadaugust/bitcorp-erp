import { BaseSeeder } from './base-seeder';
import { CentroCosto } from '../../models/cost-center.model';
import { AccountsPayable, AccountsPayableStatus } from '../../models/accounts-payable.model';
import { PaymentSchedule } from '../../models/payment-schedule.model';
import { PaymentRecord } from '../../models/payment-record.model';
import { Provider } from '../../models/provider.model';
import { Proyecto } from '../../models/project.model';
import { Valorizacion } from '../../models/valuation.model';
import { User } from '../../models/user.model';
import { ProviderContact } from '../../models/provider-contact.model';
import { ProviderDocument } from '../../models/provider-document.model';
import { ProviderFinancialInfo } from '../../models/provider-financial-info.model';

/**
 * Seeds administration data: cost centers, accounts payable, payment schedules,
 * payment records, provider contacts/documents/financial info
 */
export class AdministrationSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log(
      '  → Seeding administration data (cost centers, accounts payable, payments, provider data)...'
    );

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
          providerId: providers[0].id,
          documentNumber: 'F001-12345',
          issueDate: lastMonth,
          dueDate: nextWeek,
          currency: 'PEN',
          amount: 18290.0,
          amountPaid: 0,
          balance: 18290.0,
          status: AccountsPayableStatus.PENDING,
          description: 'Compra de combustible diesel B5 - 1000 galones. Proveedor: Petroperú',
          tenantId: 1,
        }),
        accountsPayableRepo.create({
          providerId: providers[1].id,
          documentNumber: 'F002-98765',
          issueDate: lastMonth,
          dueDate: new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000),
          currency: 'PEN',
          amount: 2879.2,
          amountPaid: 2879.2,
          balance: 0,
          status: AccountsPayableStatus.PAID,
          description: 'Compra de repuestos: filtros y lubricantes. Pagado.',
          tenantId: 1,
        }),
        accountsPayableRepo.create({
          providerId: providers[0].id,
          documentNumber: 'F001-12567',
          issueDate: today,
          dueDate: nextMonth,
          currency: 'USD',
          amount: 5310.0,
          amountPaid: 0,
          balance: 5310.0,
          status: AccountsPayableStatus.PENDING,
          description: 'Servicio de mantenimiento mayor - Tractor Komatsu. Factura en USD.',
          tenantId: 1,
        }),
        accountsPayableRepo.create({
          providerId: providers[1].id,
          documentNumber: 'F002-98890',
          issueDate: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
          dueDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
          currency: 'PEN',
          amount: 10030.0,
          amountPaid: 5000.0,
          balance: 5030.0,
          status: AccountsPayableStatus.PARTIAL,
          description: 'Alquiler de equipos auxiliares - Enero 2025. Pago parcial recibido.',
          tenantId: 1,
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
          providerId: providers[0].id,
          projectId: projects[0].id,
          periodo: '2025-01',
          scheduleDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          totalAmount: 18290.0,
          status: 'PROGRAMADO',
          description: 'Pago combustible enero 2025',
        }),
        paymentScheduleRepo.create({
          providerId: providers[1].id,
          projectId: projects[1].id,
          periodo: '2025-02',
          scheduleDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
          totalAmount: 5030.0,
          status: 'PROGRAMADO',
          description: 'Segunda cuota alquiler equipos',
        }),
      ]);
    }

    // 4. Payment Records (linked to APROBADO valuations)
    const paymentRepo = this.dataSource.getRepository(PaymentRecord);
    const valuationRepo = this.dataSource.getRepository(Valorizacion);
    const userRepo = this.dataSource.getRepository(User);

    const existingPayments = await paymentRepo.count();
    if (existingPayments === 0) {
      const approvedValuations = await valuationRepo.find({
        where: { estado: 'APROBADO' as never },
        take: 3,
      });
      const admin = await userRepo.findOne({ where: { username: 'admin' } });

      if (approvedValuations.length > 0 && admin) {
        const paymentData = [];

        // Payment 1: Full payment for first APROBADO valuation (CONFIRMADO)
        if (approvedValuations[0]) {
          paymentData.push(
            paymentRepo.create({
              valuationId: approvedValuations[0].id,
              contractId: approvedValuations[0].contratoId,
              projectId: approvedValuations[0].proyectoId,
              paymentNumber: 'PAG-2025-001',
              paymentDate: new Date('2025-02-10'),
              amountPaid:
                approvedValuations[0].totalConIgv || approvedValuations[0].totalValorizado,
              currency: 'PEN',
              paymentMethod: 'TRANSFERENCIA',
              originBank: 'Banco de Crédito del Perú',
              destinationBank: 'BBVA Continental',
              originAccount: '19-024-567890-12-45',
              destinationAccount: '01-112-345678-90-12',
              operationNumber: 'OP-2025-0001234',
              receiptType: 'FACTURA',
              receiptNumber: 'F001-00234',
              receiptDate: new Date('2025-02-10'),
              status: 'CONFIRMADO',
              reconciled: true,
              reconciliationDate: new Date('2025-02-12'),
              observations: 'Pago total de valorización enero 2025 - Excavadora CAT 320D',
              registeredBy: admin.id,
              approvedBy: admin.id,
              approvalDate: new Date('2025-02-11'),
            })
          );
        }

        // Payment 2: Full payment for second APROBADO valuation (CONFIRMADO)
        if (approvedValuations[1]) {
          paymentData.push(
            paymentRepo.create({
              valuationId: approvedValuations[1].id,
              contractId: approvedValuations[1].contratoId,
              projectId: approvedValuations[1].proyectoId,
              paymentNumber: 'PAG-2025-002',
              paymentDate: new Date('2025-02-15'),
              amountPaid:
                approvedValuations[1].totalConIgv || approvedValuations[1].totalValorizado,
              currency: 'PEN',
              paymentMethod: 'CHEQUE',
              originBank: 'Interbank',
              checkNumber: 'CHQ-0045678',
              receiptType: 'FACTURA',
              receiptNumber: 'F003-00567',
              receiptDate: new Date('2025-02-15'),
              status: 'CONFIRMADO',
              reconciled: false,
              observations:
                'Pago total valorización enero 2025 - Volquete Volvo FM500. Cheque en tránsito.',
              registeredBy: admin.id,
            })
          );
        }

        // Payment 3: Partial payment on first valuation (PENDIENTE — to show partial state)
        if (approvedValuations[0]) {
          paymentData.push(
            paymentRepo.create({
              valuationId: approvedValuations[0].id,
              projectId: approvedValuations[0].proyectoId,
              paymentNumber: 'PAG-2025-003',
              paymentDate: new Date('2025-03-01'),
              amountPaid: 5000.0,
              currency: 'PEN',
              paymentMethod: 'DEPOSITO',
              originBank: 'Scotiabank',
              destinationBank: 'BBVA Continental',
              operationNumber: 'DEP-2025-0009876',
              status: 'PENDIENTE',
              observations: 'Adelanto adicional contra siguiente valorización',
              registeredBy: admin.id,
            })
          );
        }

        if (paymentData.length > 0) {
          await paymentRepo.save(paymentData);
        }
      }
    }

    // 5. Provider Contacts
    const contactRepo = this.dataSource.getRepository(ProviderContact);

    const existingContacts = await contactRepo.count();
    if (existingContacts === 0) {
      const admin = await userRepo.findOne({ where: { username: 'admin' } });

      await contactRepo.save([
        // Provider 1 contacts
        contactRepo.create({
          providerId: providers[0].id,
          contactName: 'Juan Pérez Martínez',
          position: 'Gerente Comercial',
          primaryPhone: '(01) 234-5678',
          secondaryPhone: '+51 999 111 222',
          email: 'juan.perez@maquinariasperu.com',
          contactType: 'commercial',
          isPrimary: true,
          status: 'active',
          tenantId: 1,
          createdBy: admin?.id,
        }),
        contactRepo.create({
          providerId: providers[0].id,
          contactName: 'María García Flores',
          position: 'Jefa de Soporte Técnico',
          primaryPhone: '(01) 234-5680',
          email: 'maria.garcia@maquinariasperu.com',
          contactType: 'technical',
          isPrimary: false,
          status: 'active',
          tenantId: 1,
          createdBy: admin?.id,
        }),
        // Provider 2 contacts
        contactRepo.create({
          providerId: providers[1].id,
          contactName: 'Roberto Sánchez Villanueva',
          position: 'Director de Ventas',
          primaryPhone: '(01) 876-5432',
          secondaryPhone: '+51 999 333 444',
          email: 'roberto.sanchez@equipospesados.pe',
          contactType: 'commercial',
          isPrimary: true,
          status: 'active',
          tenantId: 1,
          createdBy: admin?.id,
        }),
        contactRepo.create({
          providerId: providers[1].id,
          contactName: 'Ana Torres Rivas',
          position: 'Contadora',
          primaryPhone: '(01) 876-5435',
          email: 'ana.torres@equipospesados.pe',
          contactType: 'financial',
          isPrimary: false,
          status: 'active',
          tenantId: 1,
          createdBy: admin?.id,
        }),
      ]);
    }

    // 6. Provider Documents
    const docRepo = this.dataSource.getRepository(ProviderDocument);

    const existingDocs = await docRepo.count();
    if (existingDocs === 0) {
      const today = new Date();
      const oneYearOut = new Date(today);
      oneYearOut.setFullYear(today.getFullYear() + 1);
      const sixMonthsOut = new Date(today);
      sixMonthsOut.setMonth(today.getMonth() + 6);
      const twoMonthsOut = new Date(today);
      twoMonthsOut.setMonth(today.getMonth() + 2);
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      const expiredDate = new Date(today);
      expiredDate.setMonth(today.getMonth() - 2);

      await docRepo.save([
        // Provider 1 documents
        docRepo.create({
          proveedorId: providers[0].id,
          tipoDocumento: 'RUC',
          numeroDocumento: '20123456789',
          fechaEmision: new Date('2010-03-15'),
          observaciones: 'Vigencia permanente - SUNAT',
        }),
        docRepo.create({
          proveedorId: providers[0].id,
          tipoDocumento: 'POLIZA',
          numeroDocumento: 'POL-2025-0001234',
          fechaEmision: lastYear,
          fechaVencimiento: sixMonthsOut,
          observaciones: 'Póliza TREC para equipos en alquiler',
        }),
        docRepo.create({
          proveedorId: providers[0].id,
          tipoDocumento: 'CERTIFICADO',
          numeroDocumento: 'CERT-ISO-9001-2024',
          fechaEmision: lastYear,
          fechaVencimiento: oneYearOut,
          observaciones: 'Certificado ISO 9001:2015 - Gestión de Calidad',
        }),
        // Provider 2 documents
        docRepo.create({
          proveedorId: providers[1].id,
          tipoDocumento: 'RUC',
          numeroDocumento: '20987654321',
          fechaEmision: new Date('2012-07-20'),
          observaciones: 'Vigencia permanente - SUNAT',
        }),
        docRepo.create({
          proveedorId: providers[1].id,
          tipoDocumento: 'LICENCIA',
          numeroDocumento: 'LIC-MUN-2024-5678',
          fechaEmision: lastYear,
          fechaVencimiento: twoMonthsOut,
          observaciones: 'Licencia de funcionamiento municipal - próxima a vencer',
        }),
        docRepo.create({
          proveedorId: providers[1].id,
          tipoDocumento: 'POLIZA',
          numeroDocumento: 'POL-2024-0009876',
          fechaEmision: new Date(lastYear.getTime() - 30 * 24 * 60 * 60 * 1000),
          fechaVencimiento: expiredDate,
          observaciones: 'VENCIDA - Póliza de responsabilidad civil. Solicitar renovación.',
        }),
      ]);
    }

    // 7. Provider Financial Info
    const financialRepo = this.dataSource.getRepository(ProviderFinancialInfo);

    const existingFinancial = await financialRepo.count();
    if (existingFinancial === 0) {
      const admin = await userRepo.findOne({ where: { username: 'admin' } });

      await financialRepo.save([
        // Provider 1 financial accounts
        financialRepo.create({
          providerId: providers[0].id,
          bankName: 'Banco de Crédito del Perú',
          accountNumber: '19-024-567890-12-45',
          cci: '002-190-024567890124-56',
          accountHolderName: 'MAQUINARIAS DEL PERÚ S.A.C.',
          accountType: 'checking',
          currency: 'PEN',
          isPrimary: true,
          status: 'active',
          tenantId: 1,
          createdBy: admin?.id,
        }),
        financialRepo.create({
          providerId: providers[0].id,
          bankName: 'BBVA Continental',
          accountNumber: '01-112-345678-90-12',
          cci: '011-011-234567890012-34',
          accountHolderName: 'MAQUINARIAS DEL PERÚ S.A.C.',
          accountType: 'checking',
          currency: 'USD',
          isPrimary: false,
          status: 'active',
          tenantId: 1,
          createdBy: admin?.id,
        }),
        // Provider 2 financial account
        financialRepo.create({
          providerId: providers[1].id,
          bankName: 'Interbank',
          accountNumber: '20-300-112233-44-55',
          cci: '003-200-300112233445-56',
          accountHolderName: 'EQUIPOS PESADOS SAC',
          accountType: 'checking',
          currency: 'PEN',
          isPrimary: true,
          status: 'active',
          tenantId: 1,
          createdBy: admin?.id,
        }),
      ]);
    }

    // Summary
    const costCenterCount = await costCenterRepo.count();
    const accountsCount = await accountsPayableRepo.count();
    const scheduleCount = await paymentScheduleRepo.count();
    const paymentCount = await paymentRepo.count();
    const contactCount = await contactRepo.count();
    const docCount = await docRepo.count();
    const financialCount = await financialRepo.count();

    console.log(
      `     ✓ Created ${costCenterCount} cost centers, ${accountsCount} accounts payable, ${scheduleCount} payment schedules`
    );
    console.log(
      `     ✓ Created ${paymentCount} payment records, ${contactCount} provider contacts, ${docCount} provider documents, ${financialCount} financial accounts`
    );
  }
}
