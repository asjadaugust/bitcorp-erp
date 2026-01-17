import { BaseSeeder } from './base-seeder';
import { Licitacion } from '../../models/tender.model';
import { ScheduledTask } from '../../models/scheduled-task.model';
import { Equipment } from '../../models/equipment.model';
import { Proyecto } from '../../models/project.model';
import { User } from '../../models/user.model';

/**
 * Seeds operations: tenders and scheduled tasks
 */
export class OperationsSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding operations (tenders, scheduled tasks)...');

    // Get references to existing data
    const equipmentRepo = this.dataSource.getRepository(Equipment);
    const projectRepo = this.dataSource.getRepository(Proyecto);
    const userRepo = this.dataSource.getRepository(User);

    const equipment = await equipmentRepo.find({ take: 3 });
    const projects = await projectRepo.find({ take: 2 });
    const admin = await userRepo.findOne({ where: { username: 'admin' } });

    if (equipment.length === 0 || projects.length === 0 || !admin) {
      console.log('     ⚠️  Required data not found. Skipping operations seeding.');
      return;
    }

    // 1. Tenders (Licitaciones)
    const tendersRepo = this.dataSource.getRepository(Licitacion);

    const existingTenders = await tendersRepo.count();
    if (existingTenders === 0) {
      await tendersRepo.save([
        tendersRepo.create({
          legacyId: 'LIC001',
          codigo: 'LIC-2025-001',
          nombre: 'Licitación Pública Nacional - Mejoramiento Vía Panamericana Norte',
          entidadConvocante: 'PROVIAS NACIONAL',
          montoReferencial: 25000000.0,
          fechaConvocatoria: new Date('2025-01-10'),
          fechaPresentacion: new Date('2025-02-15'),
          estado: 'EVALUACION',
          observaciones: 'Expediente técnico incluye estudios de impacto ambiental',
        }),
        tendersRepo.create({
          legacyId: 'LIC002',
          codigo: 'LIC-2025-002',
          nombre: 'Adjudicación Directa Pública - Construcción de Puente Vehicular',
          entidadConvocante: 'Gobierno Regional de Arequipa',
          montoReferencial: 8500000.0,
          fechaConvocatoria: new Date('2025-01-20'),
          fechaPresentacion: new Date('2025-03-01'),
          estado: 'PUBLICADO',
          observaciones: 'Modalidad: Suma Alzada. Plazo: 180 días calendarios',
        }),
        tendersRepo.create({
          legacyId: 'LIC003',
          codigo: 'LIC-2024-087',
          nombre: 'Mantenimiento Periódico Carretera Cusco - Puno',
          entidadConvocante: 'PROVIAS DESCENTRALIZADO',
          montoReferencial: 15000000.0,
          fechaConvocatoria: new Date('2024-11-15'),
          fechaPresentacion: new Date('2024-12-20'),
          estado: 'ADJUDICADO',
          observaciones: 'Consorcio BitCorp-Constructora SAC adjudicado con S/. 14,250,000',
        }),
        tendersRepo.create({
          legacyId: 'LIC004',
          codigo: 'LIC-2025-003',
          nombre: 'Ampliación de Aeropuerto Internacional Jorge Chávez',
          entidadConvocante: 'Lima Airport Partners',
          montoReferencial: 45000000.0,
          fechaConvocatoria: new Date('2025-02-01'),
          fechaPresentacion: new Date('2025-04-15'),
          estado: 'PUBLICADO',
          observaciones:
            'Requiere experiencia en construcción aeroportuaria. Certificaciones ISO 9001, 14001, 45001',
        }),
      ]);
    }

    // 2. Scheduled Tasks (Tareas Programadas)
    const tasksRepo = this.dataSource.getRepository(ScheduledTask);

    const existingTasks = await tasksRepo.count();
    if (existingTasks === 0) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      await tasksRepo.save([
        // Maintenance tasks
        tasksRepo.create({
          equipmentId: equipment[0].id,
          taskType: 'maintenance',
          title: 'Mantenimiento Preventivo 500 Horas - Excavadora CAT 320D',
          description:
            'Cambio de filtros, aceite motor, inspección hidráulica, calibración de sensores',
          startDate: nextWeek,
          endDate: nextWeek,
          allDay: false,
          startTime: '08:00:00',
          endTime: '17:00:00',
          durationMinutes: 480,
          priority: 'high',
          status: 'pending',
          createdBy: admin.id,
          projectId: projects[0].id,
        }),
        tasksRepo.create({
          equipmentId: equipment[1].id,
          taskType: 'maintenance',
          title: 'Servicio de Mantenimiento 1000 Horas - Tractor Komatsu D65EX',
          description:
            'Servicio mayor: cambio de aceite motor, transmisión, filtros aire/combustible/hidráulico',
          startDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          endDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
          allDay: false,
          startTime: '07:00:00',
          endTime: '16:00:00',
          durationMinutes: 480,
          priority: 'urgent',
          status: 'pending',
          createdBy: admin.id,
        }),
        tasksRepo.create({
          equipmentId: equipment[2].id,
          taskType: 'maintenance',
          title: 'Inspección Técnica Vehicular - Volquete Volvo FM500',
          description:
            'Revisión técnica obligatoria anual. Incluye prueba de frenos, dirección, luces, emisiones',
          startDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days
          endDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
          allDay: true,
          durationMinutes: 240,
          priority: 'high',
          status: 'assigned',
          createdBy: admin.id,
        }),
        // Equipment assignment tasks
        tasksRepo.create({
          equipmentId: equipment[0].id,
          taskType: 'assignment',
          title: 'Asignación: Excavación Zanjas - Proyecto Carretera Central',
          description:
            'Excavación de zanjas para instalación de tuberías de drenaje pluvial. Sector KM 45+000 al KM 48+500',
          startDate: today,
          endDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days
          allDay: false,
          startTime: '07:00:00',
          endTime: '17:00:00',
          recurrence: 'daily',
          durationMinutes: 600,
          priority: 'high',
          status: 'in_progress',
          createdBy: admin.id,
          projectId: projects[0].id,
        }),
        tasksRepo.create({
          equipmentId: equipment[1].id,
          taskType: 'assignment',
          title: 'Asignación: Movimiento de Tierras - Proyecto Puente Arequipa',
          description: 'Nivelación y compactación de terreno para fundación de estribos',
          startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
          endDate: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days
          allDay: false,
          startTime: '06:30:00',
          endTime: '18:00:00',
          recurrence: 'daily',
          durationMinutes: 660,
          priority: 'medium',
          status: 'assigned',
          createdBy: admin.id,
          assignedBy: admin.id,
          projectId: projects[1].id,
        }),
        // Inspection tasks
        tasksRepo.create({
          equipmentId: equipment[0].id,
          taskType: 'inspection',
          title: 'Inspección Pre-Operacional Diaria',
          description:
            'Verificación: niveles de fluidos, sistema hidráulico, estructura, neumáticos/orugas, luces',
          startDate: today,
          endDate: nextMonth,
          allDay: false,
          startTime: '06:30:00',
          endTime: '07:00:00',
          recurrence: 'daily',
          durationMinutes: 30,
          priority: 'high',
          status: 'in_progress',
          createdBy: admin.id,
        }),
        tasksRepo.create({
          equipmentId: equipment[2].id,
          taskType: 'inspection',
          title: 'Inspección Semanal de Seguridad - Volquete',
          description:
            'Revisión sistema de frenos, dirección, neumáticos, luces, señalización de seguridad',
          startDate: nextWeek,
          endDate: nextWeek,
          allDay: false,
          startTime: '16:00:00',
          endTime: '17:00:00',
          recurrence: 'weekly',
          durationMinutes: 60,
          priority: 'medium',
          status: 'pending',
          createdBy: admin.id,
        }),
      ]);
    }

    const tenderCount = await tendersRepo.count();
    const taskCount = await tasksRepo.count();
    console.log(`     ✓ Created ${tenderCount} tenders, ${taskCount} scheduled tasks`);
  }
}
