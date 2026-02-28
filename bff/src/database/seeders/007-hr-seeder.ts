import { BaseSeeder } from './base-seeder';
import { Timesheet } from '../../models/timesheet.model';
import { TimesheetDetail } from '../../models/timesheet-detail.model';
import { Trabajador } from '../../models/trabajador.model';
import { Proyecto } from '../../models/project.model';
import { User } from '../../models/user.model';
import { CertificacionOperador } from '../../models/operador-certificacion.model';
import { HabilidadOperador } from '../../models/operador-habilidad.model';

/**
 * Seeds HR data: timesheets, timesheet details, operator certifications, operator skills
 */
export class HrSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding HR data (timesheets, certifications, skills)...');

    // Get references to existing data
    const trabajadorRepo = this.dataSource.getRepository(Trabajador);
    const projectRepo = this.dataSource.getRepository(Proyecto);
    const userRepo = this.dataSource.getRepository(User);

    const trabajadores = await trabajadorRepo.find({ take: 5 });
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

    // 2. Operator Certifications
    const certRepo = this.dataSource.getRepository(CertificacionOperador);

    const existingCerts = await certRepo.count();
    if (existingCerts === 0) {
      const today = new Date();
      const oneYearOut = new Date(today);
      oneYearOut.setFullYear(today.getFullYear() + 1);
      const thirtyDaysOut = new Date(today);
      thirtyDaysOut.setDate(today.getDate() + 30);
      const expiredDate = new Date(today);
      expiredDate.setMonth(today.getMonth() - 3);
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(today.getFullYear() - 2);

      const certData = [];

      // Worker 1 (Pedro Ramírez - Operador de Excavadora)
      if (trabajadores[0]) {
        certData.push(
          certRepo.create({
            trabajadorId: trabajadores[0].id,
            nombreCertificacion: 'Certificado de Operador de Excavadora Hidráulica',
            numeroCertificacion: 'CERT-EXC-2024-001',
            fechaEmision: lastYear,
            fechaVencimiento: oneYearOut,
            entidadEmisora: 'SENCICO - Servicio Nacional de Capacitación',
            estado: 'VIGENTE',
            tenantId: 1,
          }),
          certRepo.create({
            trabajadorId: trabajadores[0].id,
            nombreCertificacion: 'Licencia de Conducir Categoría A-III-c',
            numeroCertificacion: 'LIC-A3C-87654321',
            fechaEmision: twoYearsAgo,
            fechaVencimiento: thirtyDaysOut,
            entidadEmisora: 'Ministerio de Transportes y Comunicaciones',
            estado: 'POR_VENCER',
            tenantId: 1,
          }),
          certRepo.create({
            trabajadorId: trabajadores[0].id,
            nombreCertificacion: 'Capacitación en Seguridad y Salud Ocupacional',
            numeroCertificacion: 'SSO-2024-0456',
            fechaEmision: lastYear,
            fechaVencimiento: oneYearOut,
            entidadEmisora: 'Instituto de Seguridad Minera - ISEM',
            estado: 'VIGENTE',
            tenantId: 1,
          })
        );
      }

      // Worker 2 (José Torres - Operador de Tractor)
      if (trabajadores[1]) {
        certData.push(
          certRepo.create({
            trabajadorId: trabajadores[1].id,
            nombreCertificacion: 'Certificado de Operador de Tractor sobre Orugas',
            numeroCertificacion: 'CERT-TRA-2023-045',
            fechaEmision: twoYearsAgo,
            fechaVencimiento: expiredDate,
            entidadEmisora: 'TECSUP',
            estado: 'VENCIDO',
            tenantId: 1,
          }),
          certRepo.create({
            trabajadorId: trabajadores[1].id,
            nombreCertificacion: 'Licencia de Conducir Categoría A-III-c',
            numeroCertificacion: 'LIC-A3C-76543210',
            fechaEmision: lastYear,
            fechaVencimiento: oneYearOut,
            entidadEmisora: 'Ministerio de Transportes y Comunicaciones',
            estado: 'VIGENTE',
            tenantId: 1,
          })
        );
      }

      // Worker 3 (Carlos Huamán - Operador de Cargador Frontal)
      if (trabajadores[2]) {
        certData.push(
          certRepo.create({
            trabajadorId: trabajadores[2].id,
            nombreCertificacion: 'Certificado de Operador de Cargador Frontal',
            numeroCertificacion: 'CERT-CAR-2024-012',
            fechaEmision: lastYear,
            fechaVencimiento: oneYearOut,
            entidadEmisora: 'SENCICO',
            estado: 'VIGENTE',
            tenantId: 1,
          }),
          certRepo.create({
            trabajadorId: trabajadores[2].id,
            nombreCertificacion: 'Certificado de Primeros Auxilios',
            numeroCertificacion: 'PA-2024-0789',
            fechaEmision: lastYear,
            fechaVencimiento: thirtyDaysOut,
            entidadEmisora: 'Cruz Roja Peruana',
            estado: 'POR_VENCER',
            tenantId: 1,
          })
        );
      }

      // Worker 4 (Miguel Condori - Operador de Rodillo)
      if (trabajadores[3]) {
        certData.push(
          certRepo.create({
            trabajadorId: trabajadores[3].id,
            nombreCertificacion: 'Certificado de Operador de Rodillo Compactador',
            numeroCertificacion: 'CERT-ROD-2024-033',
            fechaEmision: lastYear,
            fechaVencimiento: oneYearOut,
            entidadEmisora: 'SENCICO',
            estado: 'VIGENTE',
            tenantId: 1,
          })
        );
      }

      // Worker 5 (Luis Flores - Conductor de Volquete)
      if (trabajadores[4]) {
        certData.push(
          certRepo.create({
            trabajadorId: trabajadores[4].id,
            nombreCertificacion: 'Brevete Profesional Categoría A-III-c',
            numeroCertificacion: 'LIC-A3C-23456789',
            fechaEmision: twoYearsAgo,
            fechaVencimiento: expiredDate,
            entidadEmisora: 'Ministerio de Transportes y Comunicaciones',
            estado: 'VENCIDO',
            tenantId: 1,
          }),
          certRepo.create({
            trabajadorId: trabajadores[4].id,
            nombreCertificacion: 'Manejo Defensivo y Seguridad Vial',
            numeroCertificacion: 'MDV-2024-0567',
            fechaEmision: lastYear,
            fechaVencimiento: oneYearOut,
            entidadEmisora: 'Touring y Automóvil Club del Perú',
            estado: 'VIGENTE',
            tenantId: 1,
          })
        );
      }

      if (certData.length > 0) {
        await certRepo.save(certData);
      }
    }

    // 3. Operator Skills
    const skillRepo = this.dataSource.getRepository(HabilidadOperador);

    const existingSkills = await skillRepo.count();
    if (existingSkills === 0) {
      const today = new Date();
      const recentVerification = new Date(today);
      recentVerification.setMonth(today.getMonth() - 2);
      const olderVerification = new Date(today);
      olderVerification.setFullYear(today.getFullYear() - 1);

      const skillData = [];

      // Worker 1 (Pedro Ramírez)
      if (trabajadores[0]) {
        skillData.push(
          skillRepo.create({
            trabajadorId: trabajadores[0].id,
            tipoEquipo: 'Excavadora Hidráulica',
            nivelHabilidad: 'EXPERTO',
            aniosExperiencia: 8.0,
            ultimaVerificacion: recentVerification,
            tenantId: 1,
          }),
          skillRepo.create({
            trabajadorId: trabajadores[0].id,
            tipoEquipo: 'Retroexcavadora',
            nivelHabilidad: 'AVANZADO',
            aniosExperiencia: 4.5,
            ultimaVerificacion: olderVerification,
            tenantId: 1,
          })
        );
      }

      // Worker 2 (José Torres)
      if (trabajadores[1]) {
        skillData.push(
          skillRepo.create({
            trabajadorId: trabajadores[1].id,
            tipoEquipo: 'Tractor sobre Orugas',
            nivelHabilidad: 'EXPERTO',
            aniosExperiencia: 10.0,
            ultimaVerificacion: recentVerification,
            tenantId: 1,
          }),
          skillRepo.create({
            trabajadorId: trabajadores[1].id,
            tipoEquipo: 'Motoniveladora',
            nivelHabilidad: 'INTERMEDIO',
            aniosExperiencia: 2.0,
            ultimaVerificacion: olderVerification,
            tenantId: 1,
          })
        );
      }

      // Worker 3 (Carlos Huamán)
      if (trabajadores[2]) {
        skillData.push(
          skillRepo.create({
            trabajadorId: trabajadores[2].id,
            tipoEquipo: 'Cargador Frontal',
            nivelHabilidad: 'AVANZADO',
            aniosExperiencia: 5.5,
            ultimaVerificacion: recentVerification,
            tenantId: 1,
          }),
          skillRepo.create({
            trabajadorId: trabajadores[2].id,
            tipoEquipo: 'Excavadora Hidráulica',
            nivelHabilidad: 'INTERMEDIO',
            aniosExperiencia: 2.0,
            tenantId: 1,
          })
        );
      }

      // Worker 4 (Miguel Condori)
      if (trabajadores[3]) {
        skillData.push(
          skillRepo.create({
            trabajadorId: trabajadores[3].id,
            tipoEquipo: 'Rodillo Compactador',
            nivelHabilidad: 'EXPERTO',
            aniosExperiencia: 12.0,
            ultimaVerificacion: recentVerification,
            tenantId: 1,
          })
        );
      }

      // Worker 5 (Luis Flores)
      if (trabajadores[4]) {
        skillData.push(
          skillRepo.create({
            trabajadorId: trabajadores[4].id,
            tipoEquipo: 'Volquete',
            nivelHabilidad: 'AVANZADO',
            aniosExperiencia: 6.0,
            ultimaVerificacion: recentVerification,
            tenantId: 1,
          }),
          skillRepo.create({
            trabajadorId: trabajadores[4].id,
            tipoEquipo: 'Camión Cisterna',
            nivelHabilidad: 'PRINCIPIANTE',
            aniosExperiencia: 0.5,
            tenantId: 1,
          })
        );
      }

      if (skillData.length > 0) {
        await skillRepo.save(skillData);
      }
    }

    // Summary
    const timesheetCount = await timesheetRepo.count();
    const detailCount = await detailRepo.count();
    const certCount = await certRepo.count();
    const skillCount = await skillRepo.count();

    console.log(`     ✓ Created ${timesheetCount} timesheets with ${detailCount} daily records`);
    console.log(
      `     ✓ Created ${certCount} operator certifications, ${skillCount} operator skills`
    );
  }
}
