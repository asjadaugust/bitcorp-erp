import { BaseSeeder } from './base-seeder';
import { ChecklistPlantilla } from '../../models/checklist-template.model';
import { ChecklistItem } from '../../models/checklist-item.model';
import { ChecklistInspeccion } from '../../models/checklist-inspection.model';
import { Equipment } from '../../models/equipment.model';
import { Trabajador } from '../../models/trabajador.model';
import { User } from '../../models/user.model';

/**
 * Seeds checklist data: templates, items, and inspections
 */
export class ChecklistsSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding checklists (templates, items, inspections)...');

    // Get references to existing data
    const equipmentRepo = this.dataSource.getRepository(Equipment);
    const trabajadorRepo = this.dataSource.getRepository(Trabajador);
    const userRepo = this.dataSource.getRepository(User);

    const equipment = await equipmentRepo.find({ take: 3 });
    const trabajadores = await trabajadorRepo.find({ take: 2 });
    const admin = await userRepo.findOne({ where: { username: 'admin' } });

    if (equipment.length === 0 || trabajadores.length === 0 || !admin) {
      console.log('     ⚠️  Required data not found. Skipping checklists seeding.');
      return;
    }

    // 1. Checklist Templates
    const templateRepo = this.dataSource.getRepository(ChecklistPlantilla);
    const itemRepo = this.dataSource.getRepository(ChecklistItem);

    const existingTemplates = await templateRepo.count();
    if (existingTemplates === 0) {
      // Template 1: Pre-operational inspection for excavators
      const template1 = await templateRepo.save(
        templateRepo.create({
          codigo: 'CHK-EXC-001',
          nombre: 'Inspección Pre-Operacional Excavadora',
          tipoEquipo: 'EXCAVADORA',
          descripcion: 'Checklist diario antes de iniciar operaciones con excavadora hidráulica',
          frecuencia: 'DIARIO',
          activo: true,
          createdBy: admin.id,
        })
      );

      await itemRepo.save([
        // Motor y Sistema Eléctrico
        itemRepo.create({
          plantillaId: template1.id,
          orden: 1,
          categoria: 'Motor y Sistema Eléctrico',
          descripcion: 'Nivel de aceite de motor',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Entre MIN y MAX',
          esCritico: true,
          instrucciones: 'Verificar con motor apagado en terreno nivelado',
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 2,
          categoria: 'Motor y Sistema Eléctrico',
          descripcion: 'Nivel de refrigerante',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Entre MIN y MAX',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 3,
          categoria: 'Motor y Sistema Eléctrico',
          descripcion: 'Fugas de aceite motor',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Sin fugas',
          esCritico: true,
          requiereFoto: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 4,
          categoria: 'Motor y Sistema Eléctrico',
          descripcion: 'Estado de batería y conexiones',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Limpias, sin corrosión',
          esCritico: false,
        }),
        // Sistema Hidráulico
        itemRepo.create({
          plantillaId: template1.id,
          orden: 5,
          categoria: 'Sistema Hidráulico',
          descripcion: 'Nivel de aceite hidráulico',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Entre MIN y MAX',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 6,
          categoria: 'Sistema Hidráulico',
          descripcion: 'Fugas en cilindros hidráulicos',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Sin fugas',
          esCritico: true,
          requiereFoto: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 7,
          categoria: 'Sistema Hidráulico',
          descripcion: 'Estado de mangueras hidráulicas',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Sin grietas ni desgaste',
          esCritico: true,
        }),
        // Estructura y Tren de Rodaje
        itemRepo.create({
          plantillaId: template1.id,
          orden: 8,
          categoria: 'Estructura y Tren de Rodaje',
          descripcion: 'Estado de orugas',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Tensión adecuada, sin eslabones rotos',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 9,
          categoria: 'Estructura y Tren de Rodaje',
          descripcion: 'Pasadores de brazo y pluma',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Asegurados, sin holguras',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 10,
          categoria: 'Estructura y Tren de Rodaje',
          descripcion: 'Estado del balde/cucharon',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Sin grietas, dientes en buen estado',
          esCritico: false,
        }),
        // Seguridad y Cabina
        itemRepo.create({
          plantillaId: template1.id,
          orden: 11,
          categoria: 'Seguridad y Cabina',
          descripcion: 'Funcionamiento de bocina',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Audible a 30 metros',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 12,
          categoria: 'Seguridad y Cabina',
          descripcion: 'Luces delanteras y traseras',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Todas operativas',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 13,
          categoria: 'Seguridad y Cabina',
          descripcion: 'Cinturón de seguridad',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Operativo, sin rasgaduras',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 14,
          categoria: 'Seguridad y Cabina',
          descripcion: 'Espejos retrovisores',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Limpios, completos, ajustados',
          esCritico: false,
        }),
        itemRepo.create({
          plantillaId: template1.id,
          orden: 15,
          categoria: 'Seguridad y Cabina',
          descripcion: 'Extintor',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Vigente, accesible, presurizado',
          esCritico: true,
        }),
      ]);

      // Template 2: Pre-operational inspection for dump trucks
      const template2 = await templateRepo.save(
        templateRepo.create({
          codigo: 'CHK-VOL-001',
          nombre: 'Inspección Pre-Operacional Volquete',
          tipoEquipo: 'VOLQUETE',
          descripcion: 'Checklist diario antes de iniciar operaciones con volquete',
          frecuencia: 'DIARIO',
          activo: true,
          createdBy: admin.id,
        })
      );

      await itemRepo.save([
        // Motor
        itemRepo.create({
          plantillaId: template2.id,
          orden: 1,
          categoria: 'Motor',
          descripcion: 'Nivel de aceite motor',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Entre MIN y MAX',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 2,
          categoria: 'Motor',
          descripcion: 'Nivel de refrigerante',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Entre MIN y MAX',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 3,
          categoria: 'Motor',
          descripcion: 'Fugas de aceite o combustible',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Sin fugas',
          esCritico: true,
          requiereFoto: true,
        }),
        // Frenos y Dirección
        itemRepo.create({
          plantillaId: template2.id,
          orden: 4,
          categoria: 'Frenos y Dirección',
          descripcion: 'Funcionamiento de frenos de servicio',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Respuesta inmediata',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 5,
          categoria: 'Frenos y Dirección',
          descripcion: 'Funcionamiento de freno de estacionamiento',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Mantiene vehículo detenido',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 6,
          categoria: 'Frenos y Dirección',
          descripcion: 'Presión de aire del sistema neumático',
          tipoVerificacion: 'MEDICION',
          valorEsperado: '120-140 PSI',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 7,
          categoria: 'Frenos y Dirección',
          descripcion: 'Juego en dirección',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Menos de 5 cm',
          esCritico: true,
        }),
        // Neumáticos
        itemRepo.create({
          plantillaId: template2.id,
          orden: 8,
          categoria: 'Neumáticos y Suspensión',
          descripcion: 'Presión de neumáticos',
          tipoVerificacion: 'MEDICION',
          valorEsperado: 'Según especificaciones fabricante',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 9,
          categoria: 'Neumáticos y Suspensión',
          descripcion: 'Estado de neumáticos (cortes, desgaste)',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Sin cortes profundos, banda de rodadura > 3mm',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 10,
          categoria: 'Neumáticos y Suspensión',
          descripcion: 'Tuercas de ruedas apretadas',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Todas presentes y apretadas',
          esCritico: true,
        }),
        // Tolva y Sistema Hidráulico
        itemRepo.create({
          plantillaId: template2.id,
          orden: 11,
          categoria: 'Tolva y Sistema Hidráulico',
          descripcion: 'Funcionamiento del sistema de volteo',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Sube y baja suavemente',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 12,
          categoria: 'Tolva y Sistema Hidráulico',
          descripcion: 'Estado de cilindros hidráulicos',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Sin fugas, pasadores seguros',
          esCritico: true,
        }),
        // Seguridad
        itemRepo.create({
          plantillaId: template2.id,
          orden: 13,
          categoria: 'Seguridad',
          descripcion: 'Luces: direccionales, stop, retroceso',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Todas operativas',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 14,
          categoria: 'Seguridad',
          descripcion: 'Alarma de retroceso',
          tipoVerificacion: 'AUDITIVO',
          valorEsperado: 'Audible a 15 metros',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 15,
          categoria: 'Seguridad',
          descripcion: 'Cinturón de seguridad',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Operativo',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template2.id,
          orden: 16,
          categoria: 'Seguridad',
          descripcion: 'Extintor y botiquín',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Vigentes, accesibles',
          esCritico: true,
        }),
      ]);

      // Template 3: Monthly maintenance inspection
      const template3 = await templateRepo.save(
        templateRepo.create({
          codigo: 'CHK-MNT-001',
          nombre: 'Inspección Mensual de Mantenimiento',
          tipoEquipo: 'TODOS',
          descripcion: 'Checklist mensual de mantenimiento preventivo para toda maquinaria',
          frecuencia: 'MENSUAL',
          activo: true,
          createdBy: admin.id,
        })
      );

      await itemRepo.save([
        itemRepo.create({
          plantillaId: template3.id,
          orden: 1,
          categoria: 'Fluidos',
          descripcion: 'Cambio de aceite motor según horómetro/odómetro',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Completado',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template3.id,
          orden: 2,
          categoria: 'Filtros',
          descripcion: 'Cambio de filtro de aceite',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Completado',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template3.id,
          orden: 3,
          categoria: 'Filtros',
          descripcion: 'Limpieza/cambio filtro de aire',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Completado',
          esCritico: true,
        }),
        itemRepo.create({
          plantillaId: template3.id,
          orden: 4,
          categoria: 'Sistema de Enfriamiento',
          descripcion: 'Limpieza de radiador',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Sin obstrucciones',
          esCritico: false,
        }),
        itemRepo.create({
          plantillaId: template3.id,
          orden: 5,
          categoria: 'Sistema Eléctrico',
          descripcion: 'Revisión de alternador y motor de arranque',
          tipoVerificacion: 'FUNCIONAL',
          valorEsperado: 'Funcionamiento correcto',
          esCritico: false,
        }),
        itemRepo.create({
          plantillaId: template3.id,
          orden: 6,
          categoria: 'Documentación',
          descripcion: 'Actualización de bitácora de mantenimiento',
          tipoVerificacion: 'VISUAL',
          valorEsperado: 'Actualizada',
          esCritico: false,
        }),
      ]);
    }

    // 2. Inspections
    const inspectionRepo = this.dataSource.getRepository(ChecklistInspeccion);

    const existingInspections = await inspectionRepo.count();
    if (existingInspections === 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);

      const templates = await templateRepo.find({ take: 2 });

      if (templates.length > 0) {
        await inspectionRepo.save([
          inspectionRepo.create({
            codigo: 'INS-2025-001',
            plantillaId: templates[0].id,
            equipoId: equipment[0].id,
            trabajadorId: trabajadores[0].id,
            fechaInspeccion: twoDaysAgo,
            horaInicio: '06:30:00',
            horaFin: '06:55:00',
            ubicacion: 'Campamento Base KM 42+500',
            horometroInicial: 4523.5,
            estado: 'COMPLETADO',
            resultadoGeneral: 'APROBADO',
            itemsConforme: 14,
            itemsNoConforme: 1,
            itemsTotal: 15,
            observacionesGenerales:
              'Inspección completada. 1 observación menor: espejo retrovisor izquierdo requiere ajuste.',
            requiereMantenimiento: false,
            equipoOperativo: true,
            completadoEn: twoDaysAgo,
          }),
          inspectionRepo.create({
            codigo: 'INS-2025-002',
            plantillaId: templates[0].id,
            equipoId: equipment[0].id,
            trabajadorId: trabajadores[0].id,
            fechaInspeccion: yesterday,
            horaInicio: '06:30:00',
            horaFin: '06:50:00',
            ubicacion: 'Campamento Base KM 42+500',
            horometroInicial: 4533.0,
            estado: 'COMPLETADO',
            resultadoGeneral: 'APROBADO',
            itemsConforme: 15,
            itemsNoConforme: 0,
            itemsTotal: 15,
            observacionesGenerales:
              'Inspección completada sin observaciones. Equipo en óptimas condiciones operativas.',
            requiereMantenimiento: false,
            equipoOperativo: true,
            completadoEn: yesterday,
          }),
        ]);

        if (templates.length > 1 && equipment.length > 2) {
          await inspectionRepo.save([
            inspectionRepo.create({
              codigo: 'INS-2025-003',
              plantillaId: templates[1].id,
              equipoId: equipment[2].id,
              trabajadorId: trabajadores[0].id,
              fechaInspeccion: yesterday,
              horaInicio: '05:20:00',
              horaFin: '05:45:00',
              ubicacion: 'Planta de Concreto Lima Norte',
              odometroInicial: 45230.0,
              estado: 'COMPLETADO',
              resultadoGeneral: 'APROBADO_CON_OBSERVACIONES',
              itemsConforme: 14,
              itemsNoConforme: 2,
              itemsTotal: 16,
              observacionesGenerales:
                'Inspección completada. Observaciones: 1) Neumático delantero derecho con 60% desgaste - programar cambio. 2) Extintor vence en 15 días.',
              requiereMantenimiento: true,
              equipoOperativo: true,
              completadoEn: yesterday,
            }),
            inspectionRepo.create({
              codigo: 'INS-2025-004',
              plantillaId: templates[1].id,
              equipoId: equipment[2].id,
              trabajadorId: trabajadores[0].id,
              fechaInspeccion: today,
              horaInicio: '05:30:00',
              ubicacion: 'Planta de Concreto Lima Norte',
              odometroInicial: 45420.0,
              estado: 'EN_PROGRESO',
              itemsConforme: 0,
              itemsNoConforme: 0,
              itemsTotal: 16,
              requiereMantenimiento: false,
              equipoOperativo: true,
            }),
          ]);
        }
      }
    }

    const templateCount = await templateRepo.count();
    const itemCount = await itemRepo.count();
    const inspectionCount = await inspectionRepo.count();

    console.log(
      `     ✓ Created ${templateCount} checklist templates, ${itemCount} items, ${inspectionCount} inspections`
    );
  }
}
