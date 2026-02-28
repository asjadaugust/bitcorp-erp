import { DataSource } from 'typeorm';
import { BaseSeeder } from './base-seeder';
import { PlantillaAprobacion } from '../../models/plantilla-aprobacion.model';
import { PlantillaPaso } from '../../models/plantilla-paso.model';

/**
 * WS-35: Seed default approval templates
 * Seeds 3 default templates for the 3 integrated modules:
 *   - daily_report: 1 step (RESIDENTE, FIRST_APPROVES)
 *   - valorizacion: 2 steps (RESIDENTE → DIRECTOR, ALL_MUST_APPROVE)
 *   - solicitud_equipo: 1 step (JEFE_EQUIPO, ALL_MUST_APPROVE)
 */
export class ApprovalsSeeder extends BaseSeeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    const plantillaRepo = this.dataSource.getRepository(PlantillaAprobacion);
    const pasoRepo = this.dataSource.getRepository(PlantillaPaso);

    const templates: Array<{
      nombre: string;
      module_name: 'daily_report' | 'valorizacion' | 'solicitud_equipo';
      descripcion: string;
      pasos: Array<{
        paso_numero: number;
        nombre_paso: string;
        rol: string;
        logica: 'ALL_MUST_APPROVE' | 'FIRST_APPROVES';
      }>;
    }> = [
      {
        nombre: 'Aprobación Parte Diario',
        module_name: 'daily_report',
        descripcion: 'Flujo estándar: el Residente aprueba el parte diario del operador',
        pasos: [
          {
            paso_numero: 1,
            nombre_paso: 'Aprobación Residente',
            rol: 'RESIDENTE',
            logica: 'FIRST_APPROVES',
          },
        ],
      },
      {
        nombre: 'Aprobación Valorización',
        module_name: 'valorizacion',
        descripcion: 'Flujo 2 pasos: Residente valida → Director aprueba',
        pasos: [
          {
            paso_numero: 1,
            nombre_paso: 'Validación Residente',
            rol: 'RESIDENTE',
            logica: 'ALL_MUST_APPROVE',
          },
          {
            paso_numero: 2,
            nombre_paso: 'Aprobación Director',
            rol: 'DIRECTOR',
            logica: 'ALL_MUST_APPROVE',
          },
        ],
      },
      {
        nombre: 'Aprobación Solicitud de Equipo',
        module_name: 'solicitud_equipo',
        descripcion: 'El Jefe de Equipo aprueba la solicitud de equipamiento',
        pasos: [
          {
            paso_numero: 1,
            nombre_paso: 'Aprobación Jefe de Equipo',
            rol: 'JEFE_EQUIPO',
            logica: 'ALL_MUST_APPROVE',
          },
        ],
      },
    ];

    for (const tmpl of templates) {
      // Skip if already exists
      const existing = await plantillaRepo.findOne({
        where: { moduleName: tmpl.module_name, estado: 'ACTIVO' as const },
      });

      if (existing) {
        console.log(`  ⏭️  Plantilla '${tmpl.nombre}' already exists, skipping`);
        continue;
      }

      const plantilla = plantillaRepo.create({
        nombre: tmpl.nombre,
        moduleName: tmpl.module_name,
        descripcion: tmpl.descripcion,
        estado: 'ACTIVO',
        version: 1,
      });
      const savedPlantilla = await plantillaRepo.save(plantilla);

      for (const paso of tmpl.pasos) {
        await pasoRepo.save(
          pasoRepo.create({
            plantillaId: savedPlantilla.id,
            pasoNumero: paso.paso_numero,
            nombrePaso: paso.nombre_paso,
            tipoAprobador: 'ROLE',
            rol: paso.rol,
            logicaAprobacion: paso.logica,
            esOpcional: false,
          })
        );
      }

      console.log(`  ✅ Created template '${tmpl.nombre}' with ${tmpl.pasos.length} paso(s)`);
    }
  }
}
