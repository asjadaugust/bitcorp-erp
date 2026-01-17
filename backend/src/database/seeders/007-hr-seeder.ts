import { BaseSeeder } from './base-seeder';
import { Timesheet } from '../../models/timesheet.model';
import { TimesheetDetail } from '../../models/timesheet-detail.model';
import { Trabajador } from '../../models/trabajador.model';
import { Proyecto } from '../../models/project.model';
import { User } from '../../models/user.model';

/**
 * Seeds HR data: timesheets and timesheet details
 */
export class HrSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding HR data (timesheets)...');

    // Get references to existing data
    const trabajadorRepo = this.dataSource.getRepository(Trabajador);
    const projectRepo = this.dataSource.getRepository(Proyecto);
    const userRepo = this.dataSource.getRepository(User);

    const trabajadores = await trabajadorRepo.find({ take: 2 });
    const projects = await projectRepo.find({ take: 2 });
    const admin = await userRepo.findOne({ where: { username: 'admin' } });

    if (trabajadores.length === 0 || projects.length === 0 || !admin) {
      console.log('     ⚠️  Required data not found. Skipping HR seeding.');
      return;
    }

    // 1. Timesheets with Details
    const timesheetRepo = this.dataSource.getRepository(Timesheet);
    const detailRepo = this.dataSource.getRepository(TimesheetDetail);

    const existingTimesheets = await timesheetRepo.count();
    if (existingTimesheets === 0) {
      // Create timesheets for January 2025 (approved)
      const timesheet1 = await timesheetRepo.save(
        timesheetRepo.create({
          legacyId: 'TAR001',
          trabajadorId: trabajadores[0].id,
          periodo: '2025-01',
          totalDiasTrabajados: 22,
          totalHoras: 189.5,
          montoCalculado: 9475.0,
          estado: 'APROBADO',
          observaciones: 'Tareo enero 2025 - Proyecto Carretera Central',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date('2025-02-05'),
        })
      );

      // Create daily details for January
      const details1 = [];
      const tarifaHora = 50.0;
      const startDate = new Date('2025-01-02'); // Start from Jan 2 (first working day)

      for (let day = 0; day < 31; day++) {
        const fecha = new Date(startDate);
        fecha.setDate(startDate.getDate() + day);

        // Skip Sundays (day 0) and some Saturdays
        const dayOfWeek = fecha.getDay();
        if (dayOfWeek === 0 || (dayOfWeek === 6 && Math.random() > 0.3)) {
          continue;
        }

        const horasTrabajadas = dayOfWeek === 6 ? 4.0 : 8.5 + (Math.random() * 2 - 1); // Saturday 4hrs, weekdays 8-9hrs
        details1.push(
          detailRepo.create({
            tareoId: timesheet1.id,
            proyectoId: projects[0].id,
            fecha: fecha,
            horasTrabajadas: Math.round(horasTrabajadas * 100) / 100,
            tarifaHora: tarifaHora,
            monto: Math.round(horasTrabajadas * tarifaHora * 100) / 100,
            observaciones: dayOfWeek === 6 ? 'Medio día - Sábado' : undefined,
          })
        );
      }
      await detailRepo.save(details1);

      // Timesheet for February 2025 (pending)
      const timesheet2 = await timesheetRepo.save(
        timesheetRepo.create({
          legacyId: 'TAR002',
          trabajadorId: trabajadores[0].id,
          periodo: '2025-02',
          totalDiasTrabajados: 18,
          totalHoras: 158.0,
          montoCalculado: 7900.0,
          estado: 'ENVIADO',
          observaciones: 'Tareo febrero 2025 - En revisión',
          creadoPor: admin.id,
        })
      );

      // Create details for February (partial month)
      const details2 = [];
      const startDateFeb = new Date('2025-02-03');

      for (let day = 0; day < 20; day++) {
        const fecha = new Date(startDateFeb);
        fecha.setDate(startDateFeb.getDate() + day);

        const dayOfWeek = fecha.getDay();
        if (dayOfWeek === 0) continue; // Skip Sundays

        const horasTrabajadas = dayOfWeek === 6 ? 4.0 : 8.5 + (Math.random() * 2 - 1);
        details2.push(
          detailRepo.create({
            tareoId: timesheet2.id,
            proyectoId: projects[0].id,
            fecha: fecha,
            horasTrabajadas: Math.round(horasTrabajadas * 100) / 100,
            tarifaHora: tarifaHora,
            monto: Math.round(horasTrabajadas * tarifaHora * 100) / 100,
          })
        );
      }
      await detailRepo.save(details2);

      // Timesheet for second worker - January 2025
      if (trabajadores.length > 1) {
        const timesheet3 = await timesheetRepo.save(
          timesheetRepo.create({
            legacyId: 'TAR003',
            trabajadorId: trabajadores[1].id,
            periodo: '2025-01',
            totalDiasTrabajados: 24,
            totalHoras: 215.0,
            montoCalculado: 11825.0,
            estado: 'APROBADO',
            observaciones: 'Tareo enero 2025 - Proyecto Puente Arequipa. Incluye horas extras',
            creadoPor: admin.id,
            aprobadoPor: admin.id,
            aprobadoEn: new Date('2025-02-05'),
          })
        );

        // Create daily details for second worker
        const details3 = [];
        const tarifaHora2 = 55.0;

        for (let day = 0; day < 31; day++) {
          const fecha = new Date(startDate);
          fecha.setDate(startDate.getDate() + day);

          const dayOfWeek = fecha.getDay();
          if (dayOfWeek === 0) continue; // Skip Sundays

          // This worker works more hours including some Saturdays
          let horasTrabajadas = 9.0 + (Math.random() * 2 - 1);
          if (dayOfWeek === 6 && Math.random() > 0.5) {
            horasTrabajadas = 6.0; // Some Saturday work
          } else if (dayOfWeek === 6) {
            continue; // Skip this Saturday
          }

          details3.push(
            detailRepo.create({
              tareoId: timesheet3.id,
              proyectoId: projects[1].id,
              fecha: fecha,
              horasTrabajadas: Math.round(horasTrabajadas * 100) / 100,
              tarifaHora: horasTrabajadas > 8 ? tarifaHora2 * 1.5 : tarifaHora2, // Overtime rate
              monto:
                Math.round(
                  horasTrabajadas * (horasTrabajadas > 8 ? tarifaHora2 * 1.5 : tarifaHora2) * 100
                ) / 100,
              observaciones: horasTrabajadas > 9 ? 'Incluye horas extras' : undefined,
            })
          );
        }
        await detailRepo.save(details3);
      }
    }

    const timesheetCount = await timesheetRepo.count();
    const detailCount = await detailRepo.count();

    console.log(`     ✓ Created ${timesheetCount} timesheets with ${detailCount} daily records`);
  }
}
