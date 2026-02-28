/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { AppDataSource } from '../src/config/database.config';
import { Equipment } from '../src/models/equipment.model';
import { OperatorDocument } from '../src/models/operator-document.entity';
import { Valorizacion as Valuation } from '../src/models/valuation.model';
import { AccountsPayable } from '../src/models/accounts-payable.model';
import { DailyReport } from '../src/models/daily-report-typeorm.model';
import { Trabajador } from '../src/models/trabajador.model';
import { Project } from '../src/models/project.model';

async function seedQAItems() {
  await AppDataSource.initialize();
  console.log('Database initialized');

  const equipmentRepo = AppDataSource.getRepository(Equipment);
  const operatorDocRepo = AppDataSource.getRepository(OperatorDocument);
  const valuationRepo = AppDataSource.getRepository(Valuation);
  const accountsPayableRepo = AppDataSource.getRepository(AccountsPayable);
  const dailyReportRepo = AppDataSource.getRepository(DailyReport);
  const trabajadorRepo = AppDataSource.getRepository(Trabajador);
  const projectRepo = AppDataSource.getRepository(Project);

  // 1. WS-1: Equipment Document Expiry (10 days from now)
  const tenDaysFromNow = new Date();
  tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);

  const equip = await equipmentRepo.findOne({ where: {}, order: { id: 'ASC' } });
  if (equip) {
    equip.fechaVencSoat = tenDaysFromNow;
    equip.fechaVencPoliza = tenDaysFromNow;
    equip.fechaVencCitv = tenDaysFromNow;
    await equipmentRepo.save(equip);
    console.log(`Updated Equipment ${equip.codigoEquipo} with expiring SOAT/Poliza/CITV`);
  }

  // 2. WS-1: Operator Document Expiry
  const trabalhador = await trabajadorRepo.findOne({ where: {}, order: { id: 'ASC' } });
  if (trabalhador) {
    let doc = await operatorDocRepo.findOne({ where: { trabajadorId: trabalhador.id } });
    if (!doc) {
      doc = operatorDocRepo.create({
        trabajadorId: trabalhador.id,
        tipoDocumento: 'LICENCIA',
        numeroDocumento: 'QWERTY12345',
      });
    }
    doc.fechaVencimiento = tenDaysFromNow;
    await operatorDocRepo.save(doc);
    console.log(`Updated Operator ${trabalhador.nombres} with expiring LICENCIA`);
  }

  // 3. WS-2: Valuation Deadline Alert
  // A valuation from last month set to PENDIENTE
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const periodoLastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const valuation = await valuationRepo.findOne({ where: {}, order: { id: 'DESC' } });
  if (valuation) {
    valuation.periodo = periodoLastMonth;
    valuation.estado = 'PENDIENTE';
    await valuationRepo.save(valuation);
    console.log(
      `Updated Valuation ${valuation.numeroValorizacion} to PENDIENTE for ${periodoLastMonth} (OVERDUE)`
    );
  }

  // 4. WS-3: Payment Overdue Alert
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const ap = await accountsPayableRepo.findOne({ where: {}, order: { id: 'ASC' } });
  if (ap) {
    ap.due_date = tenDaysAgo;
    ap.status = 'PENDIENTE' as any;
    await accountsPayableRepo.save(ap);
    console.log(`Updated Accounts Payable ${ap.document_number} to OVERDUE`);
  }

  // 5. WS-4: Daily Report Reception Tracking
  // Ensure we have a report for today
  const project = await projectRepo.findOne({ where: {}, order: { id: 'ASC' } });
  if (equip && trabalhador && project) {
    // Check if report for today exists
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingReport = await dailyReportRepo.findOne({
      where: {
        equipoId: equip.id,
        fecha: today,
      },
    });

    if (!existingReport) {
      const reportToday = dailyReportRepo.create({
        equipoId: equip.id,
        trabajadorId: trabalhador.id,
        proyectoId: project.id,
        fecha: new Date(),
        estado: 'ENVIADO',
        creadoPor: 1, // Assumes user 1 exists
      } as any);
      await dailyReportRepo.save(reportToday);
      console.log(`Created Daily Report for today for equipment ${equip.codigoEquipo}`);
    } else {
      console.log(`Daily Report for today already exists for equipment ${equip.codigoEquipo}`);
    }
  }

  await AppDataSource.destroy();
  console.log('Seeding complete');
}

seedQAItems().catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
