import { BaseSeeder } from './base-seeder';
import { Incidente, EstadoIncidente, SeveridadIncidente } from '../../models/safety-incident.model';
import { Notification } from '../../models/notification.model';
import { User } from '../../models/user.model';
import { Project } from '../../models/project.model';

/**
 * SST (Salud y Seguridad en el Trabajo) Seeder
 * Creates safety incidents and system notifications
 */
export class SstSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding SST (Safety & Health) data...');

    await this.seedIncidentes();
    await this.seedNotifications();
  }

  private async seedIncidentes(): Promise<void> {
    const incidenteRepo = this.dataSource.getRepository(Incidente);
    const userRepo = this.dataSource.getRepository(User);
    const projectRepo = this.dataSource.getRepository(Project);

    // Get existing data
    const users = await userRepo.find({ take: 5 });
    const projects = await projectRepo.find({ take: 3 });

    if (users.length === 0 || projects.length === 0) {
      console.log('     ⚠️  Required users or projects not found. Skipping incidents.');
      return;
    }

    // Check if already seeded
    const existingCount = await incidenteRepo.count();
    if (existingCount === 0) {
      const now = new Date();

      await incidenteRepo.save([
        incidenteRepo.create({
          fechaIncidente: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          tipoIncidente: 'Caída de persona a diferente nivel',
          severidad: 'GRAVE' as SeveridadIncidente,
          ubicacion: 'Proyecto Puente Arequipa - Zona de excavación, Km 12+300',
          descripcion:
            'Trabajador cayó desde andamio a 3 metros de altura durante trabajos de encofrado. Se encontraba sin arnés de seguridad. Presenta fractura en brazo derecho y contusiones.',
          accionesTomadas:
            'Atención médica inmediata en Clínica San Juan. Investigación de causas iniciada. Charla de seguridad reforzada sobre trabajo en altura. Verificación de equipos de protección personal obligatoria.',
          proyectoId: projects[0].id,
          reportadoPor: users[1 % users.length].id,
          estado: 'CERRADO' as EstadoIncidente,
          tenantId: 1,
          legacyId: 'INC-2024-001',
        }),

        incidenteRepo.create({
          fechaIncidente: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          tipoIncidente: 'Incidente con equipo pesado',
          severidad: 'MODERADO' as SeveridadIncidente,
          ubicacion: 'Proyecto Carretera Central - Cantera El Milagro',
          descripcion:
            'Excavadora EXC-001 golpeó tubería de agua durante excavación. Daño material a infraestructura. Sin lesiones personales. Planos de servicios existentes no estaban actualizados.',
          accionesTomadas:
            'Reparación de tubería coordinada con SEDAPAL. Actualización de planos de servicios. Protocolo de verificación antes de excavación establecido. Capacitación al operador sobre procedimientos.',
          proyectoId: projects[1 % projects.length].id,
          reportadoPor: users[2 % users.length].id,
          estado: 'EN_INVESTIGACION' as EstadoIncidente,
          tenantId: 1,
          legacyId: 'INC-2024-002',
        }),

        incidenteRepo.create({
          fechaIncidente: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          tipoIncidente: 'Cuasi accidente - Near miss',
          severidad: 'LEVE' as SeveridadIncidente,
          ubicacion: 'Proyecto Puente Arequipa - Acceso principal',
          descripcion:
            'Material de construcción (varillas de acero) almacenado inadecuadamente casi cae sobre operario que transitaba por zona. Sin lesiones. Se identificó falta de señalización y delimitación de área.',
          accionesTomadas:
            'Reorganización inmediata del almacén temporal. Colocación de señalética y cinta de seguridad. Inspección de todas las zonas de almacenamiento en obra.',
          proyectoId: projects[0].id,
          reportadoPor: users[3 % users.length].id,
          estado: 'CERRADO' as EstadoIncidente,
          tenantId: 1,
          legacyId: 'INC-2025-003',
        }),

        incidenteRepo.create({
          fechaIncidente: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          tipoIncidente: 'Exposición a sustancia peligrosa',
          severidad: 'MODERADO' as SeveridadIncidente,
          ubicacion: 'Proyecto Carretera Central - Planta de asfalto',
          descripcion:
            'Trabajador expuesto a humos de asfalto sin respirador adecuado durante más de 2 horas. Presenta irritación en vías respiratorias. Equipo de protección respiratoria se encontraba en mantenimiento.',
          accionesTomadas:
            'Evaluación médica ocupacional. Adquisición de respiradores de respaldo. Implementación de sistema de rotación de equipos. Revisión de inventario de EPP.',
          proyectoId: projects[1 % projects.length].id,
          reportadoPor: users[1 % users.length].id,
          estado: 'EN_INVESTIGACION' as EstadoIncidente,
          tenantId: 1,
          legacyId: 'INC-2025-004',
        }),

        incidenteRepo.create({
          fechaIncidente: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          tipoIncidente: 'Condición insegura identificada',
          severidad: 'LEVE' as SeveridadIncidente,
          ubicacion: 'Proyecto Puente Arequipa - Campamento temporal',
          descripcion:
            'Instalación eléctrica provisional con cables expuestos y sin sistema de puesta a tierra identificada durante inspección de rutina. Riesgo de electrocución.',
          accionesTomadas:
            'Desconexión inmediata del circuito. Contratación de electricista certificado para corrección. Inspección de todas las instalaciones eléctricas temporales en proyecto.',
          proyectoId: projects[0].id,
          reportadoPor: users[0].id, // Use first user instead of users[4]
          estado: 'ABIERTO' as EstadoIncidente,
          tenantId: 1,
          legacyId: 'INC-2025-005',
        }),

        incidenteRepo.create({
          fechaIncidente: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          tipoIncidente: 'Sobreesfuerzo físico',
          severidad: 'LEVE' as SeveridadIncidente,
          ubicacion: 'Proyecto Carretera Central - Zona de carga',
          descripcion:
            'Trabajador presenta lumbalgia tras manipulación manual de sacos de cemento (42.5 kg c/u) sin ayuda mecánica ni técnica adecuada. Total aproximado: 50 sacos movidos.',
          accionesTomadas:
            'Atención en tópico de obra. Reposo médico por 3 días. Capacitación sobre técnicas de levantamiento seguro. Evaluación para adquisición de equipo de manipulación de carga.',
          proyectoId: projects[1 % projects.length].id,
          reportadoPor: users[2 % users.length].id,
          estado: 'ABIERTO' as EstadoIncidente,
          tenantId: 1,
          legacyId: 'INC-2025-006',
        }),

        incidenteRepo.create({
          fechaIncidente: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Yesterday
          tipoIncidente: 'Acto inseguro observado',
          severidad: 'LEVE' as SeveridadIncidente,
          ubicacion: 'Proyecto Puente Arequipa - Acceso peatonal',
          descripcion:
            'Operador de maquinaria observado operando equipo sin haber realizado check-list pre-operacional. Además, no portaba casco de seguridad durante inspección visual del equipo.',
          accionesTomadas:
            'Llamado de atención verbal registrado. Reforzamiento de protocolo de inspección pre-operacional. Supervisión intensificada durante primera hora de operación diaria.',
          proyectoId: projects[0].id,
          reportadoPor: users[3 % users.length].id,
          estado: 'ABIERTO' as EstadoIncidente,
          tenantId: 1,
          legacyId: 'INC-2025-007',
        }),

        incidenteRepo.create({
          fechaIncidente: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
          tipoIncidente: 'Emergencia médica',
          severidad: 'MUY_GRAVE' as SeveridadIncidente,
          ubicacion: 'Proyecto Carretera Central - Km 45+800, frente de trabajo',
          descripcion:
            'Trabajador sufre shock eléctrico al contacto con línea energizada durante trabajos de instalación de luminarias. Quemaduras de segundo grado en manos. Pérdida momentánea de consciencia.',
          accionesTomadas:
            'Activación de plan de emergencia. Traslado inmediato a Hospital Dos de Mayo. Desconexión de circuito. Notificación a SUNAFIL iniciada. Suspensión temporal de trabajos eléctricos hasta investigación completa.',
          proyectoId: projects[1 % projects.length].id,
          reportadoPor: users[1 % users.length].id,
          estado: 'ABIERTO' as EstadoIncidente,
          tenantId: 1,
          legacyId: 'INC-2025-008',
        }),
      ]);
    }

    const finalCount = await incidenteRepo.count();
    console.log(`     ✓ Safety incidents: ${finalCount}`);
  }

  private async seedNotifications(): Promise<void> {
    const notificationRepo = this.dataSource.getRepository(Notification);
    const userRepo = this.dataSource.getRepository(User);
    const projectRepo = this.dataSource.getRepository(Project);
    const incidenteRepo = this.dataSource.getRepository(Incidente);

    // Get existing data
    const users = await userRepo.find({ take: 5 });
    const projects = await projectRepo.find({ take: 3 });
    const incidentes = await incidenteRepo.find({ take: 3 });

    if (users.length === 0) {
      console.log('     ⚠️  Required users not found. Skipping notifications.');
      return;
    }

    // Check if already seeded
    const existingCount = await notificationRepo.count();
    if (existingCount === 0) {
      const now = new Date();

      const notifications = [];

      // Safety incident notifications
      if (incidentes.length > 0) {
        notifications.push(
          notificationRepo.create({
            userId: users[0].id, // Admin
            type: 'SYSTEM',
            title: 'Incidente de Seguridad - Acción Requerida',
            message:
              'Se ha reportado un incidente de severidad MUY_GRAVE en Proyecto Carretera Central. Se requiere revisión inmediata y autorización de investigación formal.',
            read: false,
            data: {
              incidenteId: incidentes[0]?.id,
              severidad: 'MUY_GRAVE',
              fechaIncidente: new Date(now.getTime() - 12 * 60 * 60 * 1000),
              requiereAccion: true,
            },
          }),

          notificationRepo.create({
            userId: users[1].id,
            type: 'SYSTEM',
            title: 'Incidente Cerrado - Informe Disponible',
            message:
              'La investigación del incidente INC-2024-001 (Caída desde andamio) ha sido completada. Informe final disponible para revisión.',
            read: true,
            data: {
              incidenteId: incidentes[0]?.id,
              estado: 'CERRADO',
              tieneInforme: true,
            },
          })
        );
      }

      // Maintenance due notifications
      notifications.push(
        notificationRepo.create({
          userId: users[1].id,
          type: 'MAINTENANCE_DUE',
          title: 'Mantenimiento Preventivo Próximo',
          message:
            'La excavadora EXC-001 tiene programado mantenimiento preventivo de 500 horas para el 25/01/2025. Coordinar parada de equipo.',
          read: false,
          data: {
            equipoId: 1,
            equipoCodigo: 'EXC-001',
            tipoMantenimiento: 'PREVENTIVO',
            fechaProgramada: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
            horasActuales: 485,
          },
        }),

        notificationRepo.create({
          userId: users[2].id,
          type: 'MAINTENANCE_DUE',
          title: 'Mantenimiento Vencido',
          message:
            'El volquete VOL-003 tiene mantenimiento preventivo vencido desde hace 3 días. Programar revisión urgente.',
          read: false,
          data: {
            equipoId: 3,
            equipoCodigo: 'VOL-003',
            tipoMantenimiento: 'PREVENTIVO',
            diasVencido: 3,
            prioridad: 'ALTA',
          },
        })
      );

      // Contract expiry notifications
      notifications.push(
        notificationRepo.create({
          userId: users[0].id,
          type: 'CONTRACT_EXPIRY',
          title: 'Contrato Próximo a Vencer',
          message:
            'El contrato CON-2024-001 para excavadora EXC-001 vence el 30/01/2025. Evaluar renovación o devolución de equipo.',
          read: false,
          data: {
            contratoId: 1,
            contratoCodigo: 'CON-2024-001',
            fechaVencimiento: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
            equipoId: 1,
            diasRestantes: 13,
          },
        }),

        notificationRepo.create({
          userId: users[0].id,
          type: 'CONTRACT_EXPIRY',
          title: 'Contrato Vencido',
          message:
            'El contrato CON-2023-999 ha vencido. Se requiere acción inmediata: renovar, adenda o finalizar.',
          read: true,
          data: {
            contratoId: 999,
            contratoCodigo: 'CON-2023-999',
            fechaVencimiento: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            diasVencido: 5,
            accionRequerida: true,
          },
        })
      );

      // Schedule assignment notifications
      if (projects.length > 0) {
        notifications.push(
          notificationRepo.create({
            userId: users[3].id,
            type: 'SCHEDULE_ASSIGNMENT',
            title: 'Nueva Tarea Asignada',
            message:
              'Se te ha asignado la inspección pre-operacional de la excavadora EXC-001 programada para mañana 07:00 AM.',
            read: false,
            data: {
              tareaId: 1,
              tipoTarea: 'INSPECCION',
              equipoId: 1,
              fechaProgramada: new Date(
                now.getTime() + 1 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000
              ),
              proyectoId: projects[0].id,
            },
          }),

          notificationRepo.create({
            userId: users[0].id,
            type: 'SCHEDULE_ASSIGNMENT',
            title: 'Cambio en Programación',
            message:
              'La tarea de mantenimiento del rodillo compactador ha sido reprogramada del 20/01 al 22/01 debido a disponibilidad de repuestos.',
            read: false,
            data: {
              tareaId: 5,
              tipoTarea: 'MANTENIMIENTO',
              equipoId: 4,
              fechaOriginal: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
              fechaNueva: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
              motivo: 'Disponibilidad de repuestos',
            },
          })
        );
      }

      // System notifications
      notifications.push(
        notificationRepo.create({
          userId: users[0].id,
          type: 'SYSTEM',
          title: 'Reporte Mensual Generado',
          message:
            'El reporte mensual de operaciones de diciembre 2024 está disponible para revisión y aprobación.',
          read: true,
          data: {
            tipoReporte: 'OPERACIONES_MENSUAL',
            periodo: '2024-12',
            fechaGeneracion: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
            requiereAprobacion: true,
          },
        }),

        notificationRepo.create({
          userId: users[1].id,
          type: 'SYSTEM',
          title: 'Actualización del Sistema',
          message:
            'El sistema ERP será actualizado el próximo sábado 25/01/2025 entre 02:00 AM y 06:00 AM. Habrá indisponibilidad temporal.',
          read: false,
          data: {
            tipoNotificacion: 'MANTENIMIENTO_SISTEMA',
            fechaInicio: new Date(2025, 0, 25, 2, 0, 0),
            fechaFin: new Date(2025, 0, 25, 6, 0, 0),
            impacto: 'Sistema no disponible',
          },
        }),

        notificationRepo.create({
          userId: users[2].id,
          type: 'SYSTEM',
          title: 'Solicitud de Aprobación Pendiente',
          message:
            'Tienes 3 valorizaciones de equipo pendientes de aprobación. Se requiere revisión antes del 20/01/2025.',
          read: false,
          data: {
            tipoAprobacion: 'VALORIZACION',
            cantidad: 3,
            fechaLimite: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            prioridad: 'ALTA',
          },
        }),

        notificationRepo.create({
          userId: users[0].id,
          type: 'SYSTEM',
          title: 'Backup Completado',
          message:
            'El respaldo automático de la base de datos se completó exitosamente. Última ejecución: 17/01/2025 03:00 AM.',
          read: true,
          data: {
            tipoBackup: 'AUTOMATICO',
            fechaEjecucion: new Date(now.getTime() - 3 * 60 * 60 * 1000),
            tamano: '2.4 GB',
            estado: 'EXITOSO',
          },
        }),

        notificationRepo.create({
          userId: users[3].id,
          type: 'SYSTEM',
          title: 'Documento Compartido',
          message:
            'Se ha compartido contigo el documento "Procedimiento de Seguridad en Excavaciones - Rev. 02" en el módulo SIG.',
          read: false,
          data: {
            documentoId: 1,
            tipoDocumento: 'PROCEDIMIENTO',
            norma: 'ISO 45001',
            compartidoPor: users[0].id,
            fechaCompartido: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          },
        })
      );

      await notificationRepo.save(notifications);
    }

    const finalCount = await notificationRepo.count();
    console.log(`     ✓ Notifications: ${finalCount}`);
  }
}
