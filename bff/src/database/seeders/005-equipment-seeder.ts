import { BaseSeeder } from './base-seeder';
import { Contract } from '../../models/contract.model';
import { DailyReport } from '../../models/daily-report-typeorm.model';
import { Valorizacion } from '../../models/valuation.model';
import { MaintenanceSchedule } from '../../models/maintenance-schedule.model';
import { Equipment } from '../../models/equipment.model';
import { Proyecto } from '../../models/project.model';
import { Trabajador } from '../../models/trabajador.model';
import { User } from '../../models/user.model';
import { SolicitudEquipo } from '../../models/solicitud-equipo.model';
import { ActaDevolucion } from '../../models/acta-devolucion.model';
import { OrdenAlquiler } from '../../models/orden-alquiler.model';
import { ValeCombustible } from '../../models/vale-combustible.model';
import { PeriodoInoperatividad } from '../../models/periodo-inoperatividad.model';

/**
 * Seeds equipment-related entities: contracts, daily reports, valuations, maintenance schedules
 */
export class EquipmentSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log(
      '  → Seeding equipment data (contracts, daily reports, valuations, maintenance)...'
    );

    // Get references to existing data
    const equipmentRepo = this.dataSource.getRepository(Equipment);
    const projectRepo = this.dataSource.getRepository(Proyecto);
    const trabajadorRepo = this.dataSource.getRepository(Trabajador);
    const userRepo = this.dataSource.getRepository(User);

    const equipment = await equipmentRepo.find({ take: 20 });
    const projects = await projectRepo.find({ take: 2 });
    const trabajadores = await trabajadorRepo.find({ take: 2 });
    const admin = await userRepo.findOne({ where: { username: 'admin' } });

    if (equipment.length === 0 || projects.length === 0 || !admin) {
      console.log('     ⚠️  Required data not found. Skipping equipment seeding.');
      return;
    }

    // 1. Contracts (Contratos y Adendas)
    const contractsRepo = this.dataSource.getRepository(Contract);

    const existingContracts = await contractsRepo.count();
    if (existingContracts === 0) {
      const contract1 = await contractsRepo.save(
        contractsRepo.create({
          legacyId: 'CONT001',
          equipoId: equipment[0].id,
          numeroContrato: 'CONT-2025-001',
          tipo: 'CONTRATO',
          fechaContrato: new Date('2025-01-01'),
          fechaInicio: new Date('2025-01-15'),
          fechaFin: new Date('2025-12-31'),
          moneda: 'PEN',
          tipoTarifa: 'POR_HORA',
          tarifa: 350.0,
          incluyeMotor: true,
          incluyeOperador: true,
          horasIncluidas: 8,
          penalidadExceso: 50.0,
          condicionesEspeciales:
            'Incluye mantenimiento preventivo. Operador certificado con 5 años experiencia mínima.',
          estado: 'ACTIVO',
          creadoPor: admin.id,
          tenantId: 1,
        })
      );

      // Create an addendum for contract 1
      await contractsRepo.save(
        contractsRepo.create({
          legacyId: 'CONT001-AD01',
          equipoId: equipment[0].id,
          numeroContrato: 'CONT-2025-001-AD01',
          tipo: 'ADENDA',
          contratoPadreId: contract1.id,
          fechaContrato: new Date('2025-03-15'),
          fechaInicio: new Date('2025-04-01'),
          fechaFin: new Date('2025-12-31'),
          moneda: 'PEN',
          tipoTarifa: 'POR_HORA',
          tarifa: 380.0,
          incluyeMotor: true,
          incluyeOperador: true,
          horasIncluidas: 8,
          penalidadExceso: 55.0,
          condicionesEspeciales:
            'Adenda 01: Incremento de tarifa por ampliación de alcance de trabajos',
          estado: 'ACTIVO',
          creadoPor: admin.id,
          tenantId: 1,
        })
      );

      await contractsRepo.save([
        contractsRepo.create({
          legacyId: 'CONT004',
          equipoId: equipment[3]?.id ?? equipment[0].id,
          numeroContrato: 'CONT-2025-004',
          tipo: 'CONTRATO',
          fechaContrato: new Date('2025-02-01'),
          fechaInicio: new Date('2025-02-15'),
          fechaFin: new Date('2025-08-31'),
          moneda: 'PEN',
          tipoTarifa: 'POR_DIA',
          tarifa: 2800.0,
          incluyeMotor: true,
          incluyeOperador: true,
          horasIncluidas: 10,
          penalidadExceso: 45.0,
          condicionesEspeciales: 'Tarifa diaria todo incluido. Máximo 10 horas por día.',
          estado: 'ACTIVO',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        contractsRepo.create({
          legacyId: 'CONT005',
          equipoId: equipment[4]?.id ?? equipment[1].id,
          numeroContrato: 'CONT-2025-005',
          tipo: 'CONTRATO',
          fechaContrato: new Date('2025-03-01'),
          fechaInicio: new Date('2025-03-15'),
          fechaFin: new Date('2025-09-30'),
          moneda: 'USD',
          tipoTarifa: 'POR_HORA',
          tarifa: 95.0,
          incluyeMotor: false,
          incluyeOperador: false,
          horasIncluidas: 8,
          penalidadExceso: 15.0,
          condicionesEspeciales:
            'Equipo seco (sin operador ni combustible). Mantenimiento preventivo a cargo del arrendador.',
          estado: 'ACTIVO',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        contractsRepo.create({
          legacyId: 'CONT002',
          equipoId: equipment[1].id,
          numeroContrato: 'CONT-2025-002',
          tipo: 'CONTRATO',
          fechaContrato: new Date('2025-01-10'),
          fechaInicio: new Date('2025-02-01'),
          fechaFin: new Date('2025-11-30'),
          moneda: 'PEN',
          tipoTarifa: 'POR_HORA',
          tarifa: 420.0,
          incluyeMotor: true,
          incluyeOperador: false,
          costoAdicionalMotor: 150.0,
          horasIncluidas: 10,
          penalidadExceso: 60.0,
          condicionesEspeciales:
            'Combustible por cuenta del contratante. Seguro contra todo riesgo incluido.',
          estado: 'ACTIVO',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        contractsRepo.create({
          legacyId: 'CONT003',
          equipoId: equipment[2].id,
          numeroContrato: 'CONT-2025-003',
          tipo: 'CONTRATO',
          fechaContrato: new Date('2024-12-15'),
          fechaInicio: new Date('2025-01-01'),
          fechaFin: new Date('2025-06-30'),
          moneda: 'USD',
          tipoTarifa: 'TARIFA_FIJA_MENSUAL',
          tarifa: 8500.0,
          incluyeMotor: true,
          incluyeOperador: true,
          horasIncluidas: 200,
          penalidadExceso: 0,
          condicionesEspeciales:
            'Modalidad todo incluido: operador, combustible, mantenimiento, seguro. 200 horas mensuales.',
          estado: 'ACTIVO',
          creadoPor: admin.id,
          tenantId: 1,
        }),
      ]);
    }

    // 2. Daily Reports (Partes Diarios)
    const dailyReportsRepo = this.dataSource.getRepository(DailyReport);

    const existingReports = await dailyReportsRepo.count();
    if (existingReports === 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);

      await dailyReportsRepo.save([
        dailyReportsRepo.create({
          legacyId: 'PD001',
          equipoId: equipment[0].id,
          trabajadorId: trabajadores[0]?.id,
          proyectoId: projects[0].id,
          fecha: threeDaysAgo,
          horaInicio: '07:00:00',
          horaFin: '17:00:00',
          horasTrabajadas: 9.5,
          horometroInicial: 4523.5,
          horometroFinal: 4533.0,
          combustibleInicial: 75.0,
          combustibleConsumido: 45.5,
          lugarSalida: 'Campamento Base KM 42+500',
          observaciones:
            'Excavación de zanjas para drenaje pluvial. Terreno arcilloso con presencia de agua subterránea. Rendimiento: 125 m³/día',
          estado: 'APROBADO',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date(),
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD002',
          equipoId: equipment[0].id,
          trabajadorId: trabajadores[0]?.id,
          proyectoId: projects[0].id,
          fecha: twoDaysAgo,
          horaInicio: '06:30:00',
          horaFin: '17:30:00',
          horasTrabajadas: 10.5,
          horometroInicial: 4533.0,
          horometroFinal: 4543.5,
          combustibleInicial: 80.0,
          combustibleConsumido: 52.0,
          lugarSalida: 'Campamento Base KM 42+500',
          observaciones:
            'Continuación excavación zanjas. Sector KM 45+200 al KM 46+000. Sin novedades operativas.',
          estado: 'APROBADO',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date(),
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD003',
          equipoId: equipment[0].id,
          trabajadorId: trabajadores[0]?.id,
          proyectoId: projects[0].id,
          fecha: yesterday,
          horaInicio: '07:00:00',
          horaFin: '16:00:00',
          horasTrabajadas: 8.5,
          horometroInicial: 4543.5,
          horometroFinal: 4552.0,
          combustibleInicial: 78.0,
          combustibleConsumido: 42.0,
          lugarSalida: 'Campamento Base KM 42+500',
          observaciones:
            'Trabajo reducido por condiciones climáticas adversas. Lluvia moderada desde las 15:00 hrs.',
          estado: 'ENVIADO',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD004',
          equipoId: equipment[1].id,
          trabajadorId: trabajadores[1]?.id,
          proyectoId: projects[1].id,
          fecha: threeDaysAgo,
          horaInicio: '06:00:00',
          horaFin: '18:00:00',
          horasTrabajadas: 11.0,
          horometroInicial: 2145.0,
          horometroFinal: 2156.0,
          combustibleInicial: 85.0,
          combustibleConsumido: 58.0,
          lugarSalida: 'Cantera El Pedregal',
          observaciones:
            'Movimiento de tierras para fundación estribo izquierdo. Volumen movido: 340 m³',
          estado: 'APROBADO',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date(),
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD005',
          equipoId: equipment[1].id,
          trabajadorId: trabajadores[1]?.id,
          proyectoId: projects[1].id,
          fecha: yesterday,
          horaInicio: '06:30:00',
          horaFin: '17:30:00',
          horasTrabajadas: 10.5,
          horometroInicial: 2156.0,
          horometroFinal: 2166.5,
          combustibleInicial: 80.0,
          combustibleConsumido: 55.0,
          lugarSalida: 'Cantera El Pedregal',
          observaciones:
            'Nivelación y compactación terreno de fundación. Densidad alcanzada: 95% Proctor Modificado',
          estado: 'ENVIADO',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD006',
          equipoId: equipment[2].id,
          trabajadorId: trabajadores[0]?.id,
          proyectoId: projects[0].id,
          fecha: yesterday,
          horaInicio: '05:30:00',
          horaFin: '14:00:00',
          horasTrabajadas: 8.0,
          odometroInicial: 45230.0,
          odometroFinal: 45420.0,
          kmRecorridos: 190.0,
          combustibleInicial: 120.0,
          combustibleConsumido: 68.0,
          lugarSalida: 'Planta de Concreto Lima Norte',
          observaciones:
            'Transporte de material agregado desde cantera. 8 viajes realizados. 24 m³ transportados por viaje.',
          estado: 'APROBADO',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date(),
          tenantId: 1,
        }),
        // Additional daily reports for expanded equipment
        dailyReportsRepo.create({
          legacyId: 'PD007',
          equipoId: equipment[3]?.id ?? equipment[0].id,
          trabajadorId: trabajadores[0]?.id,
          proyectoId: projects[0].id,
          fecha: twoDaysAgo,
          horaInicio: '07:00:00',
          horaFin: '17:00:00',
          horasTrabajadas: 9.0,
          horometroInicial: 3200.0,
          horometroFinal: 3209.0,
          combustibleInicial: 60.0,
          combustibleConsumido: 35.0,
          lugarSalida: 'Zona de Acopio KM 38+000',
          observaciones: 'Carga de material granular para base de pavimento. 280 m³ cargados.',
          estado: 'APROBADO',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date(),
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD008',
          equipoId: equipment[3]?.id ?? equipment[0].id,
          trabajadorId: trabajadores[0]?.id,
          proyectoId: projects[0].id,
          fecha: yesterday,
          horaInicio: '06:30:00',
          horaFin: '16:30:00',
          horasTrabajadas: 9.5,
          horometroInicial: 3209.0,
          horometroFinal: 3218.5,
          combustibleInicial: 55.0,
          combustibleConsumido: 38.0,
          lugarSalida: 'Zona de Acopio KM 38+000',
          observaciones: 'Continuación carga material granular. Rendimiento óptimo.',
          estado: 'ENVIADO',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD009',
          equipoId: equipment[4]?.id ?? equipment[1].id,
          trabajadorId: trabajadores[1]?.id,
          proyectoId: projects[1].id,
          fecha: threeDaysAgo,
          horaInicio: '06:00:00',
          horaFin: '15:00:00',
          horasTrabajadas: 8.5,
          horometroInicial: 1580.0,
          horometroFinal: 1588.5,
          combustibleInicial: 70.0,
          combustibleConsumido: 40.0,
          lugarSalida: 'Campamento Principal',
          observaciones: 'Compactación de sub-rasante. Densidad: 97% Proctor. Sin novedades.',
          estado: 'APROBADO',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date(),
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD010',
          equipoId: equipment[5]?.id ?? equipment[2].id,
          trabajadorId: trabajadores[0]?.id,
          proyectoId: projects[0].id,
          fecha: yesterday,
          horaInicio: '05:00:00',
          horaFin: '17:00:00',
          horasTrabajadas: 11.0,
          odometroInicial: 32100.0,
          odometroFinal: 32350.0,
          kmRecorridos: 250.0,
          combustibleInicial: 100.0,
          combustibleConsumido: 75.0,
          lugarSalida: 'Cantera Rio Seco',
          observaciones: 'Transporte de agregado grueso. 10 viajes. Ruta: Cantera → Planta Km 42.',
          estado: 'ENVIADO',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        dailyReportsRepo.create({
          legacyId: 'PD011',
          equipoId: equipment[6]?.id ?? equipment[0].id,
          trabajadorId: trabajadores[1]?.id,
          proyectoId: projects[1].id,
          fecha: twoDaysAgo,
          horaInicio: '07:00:00',
          horaFin: '18:00:00',
          horasTrabajadas: 10.0,
          odometroInicial: 78500.0,
          odometroFinal: 78650.0,
          kmRecorridos: 150.0,
          combustibleInicial: 40.0,
          combustibleConsumido: 22.0,
          lugarSalida: 'Oficina Central Lima',
          observaciones: 'Movilización de personal técnico y suministros a frente de obra.',
          estado: 'BORRADOR',
          creadoPor: admin.id,
          tenantId: 1,
        }),
      ]);
    }

    // 3. Valuations (Valorizaciones)
    const valuationsRepo = this.dataSource.getRepository(Valorizacion);

    const existingValuations = await valuationsRepo.count();
    if (existingValuations === 0) {
      const contracts = await contractsRepo.find({ where: { tipo: 'CONTRATO' }, take: 3 });

      await valuationsRepo.save([
        valuationsRepo.create({
          legacyId: 'VAL001',
          equipoId: equipment[0].id,
          contratoId: contracts[0]?.id,
          proyectoId: projects[0].id,
          periodo: '2025-01',
          fechaInicio: new Date('2025-01-01'),
          fechaFin: new Date('2025-01-31'),
          diasTrabajados: 22,
          horasTrabajadas: 189.5,
          combustibleConsumido: 845.0,
          costoBase: 66325.0,
          costoCombustible: 13097.5,
          cargosAdicionales: 0,
          totalValorizado: 79422.5,
          numeroValorizacion: 'VAL-2025-001',
          tipoCambio: 3.75,
          descuentoPorcentaje: 0,
          descuentoMonto: 0,
          igvPorcentaje: 18,
          igvMonto: 14296.05,
          totalConIgv: 93718.55,
          estado: 'APROBADO',
          observaciones:
            'Valorización correspondiente al mes de enero 2025. Trabajo ejecutado según cronograma.',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date('2025-02-05'),
          tenantId: 1,
        }),
        valuationsRepo.create({
          legacyId: 'VAL002',
          equipoId: equipment[1].id,
          contratoId: contracts[1]?.id,
          proyectoId: projects[1].id,
          periodo: '2025-02',
          fechaInicio: new Date('2025-02-01'),
          fechaFin: new Date('2025-02-28'),
          diasTrabajados: 20,
          horasTrabajadas: 215.0,
          combustibleConsumido: 1120.0,
          costoBase: 90300.0,
          costoCombustible: 17360.0,
          cargosAdicionales: 2500.0,
          totalValorizado: 110160.0,
          numeroValorizacion: 'VAL-2025-002',
          tipoCambio: 3.78,
          descuentoPorcentaje: 0,
          descuentoMonto: 0,
          igvPorcentaje: 18,
          igvMonto: 19828.8,
          totalConIgv: 129988.8,
          estado: 'PENDIENTE',
          observaciones:
            'Valorización febrero 2025. Incluye cargo adicional por trabajo en horario nocturno (20 horas).',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        valuationsRepo.create({
          legacyId: 'VAL003',
          equipoId: equipment[2].id,
          contratoId: contracts[2]?.id,
          proyectoId: projects[0].id,
          periodo: '2025-01',
          fechaInicio: new Date('2025-01-01'),
          fechaFin: new Date('2025-01-31'),
          diasTrabajados: 24,
          horasTrabajadas: 0, // Volquete usa tarifa fija mensual
          combustibleConsumido: 1650.0,
          costoBase: 8500.0, // Tarifa fija mensual en USD
          costoCombustible: 0, // Incluido en tarifa fija
          cargosAdicionales: 0,
          totalValorizado: 8500.0,
          numeroValorizacion: 'VAL-2025-003',
          tipoCambio: 3.75,
          descuentoPorcentaje: 0,
          descuentoMonto: 0,
          igvPorcentaje: 18,
          igvMonto: 5737.5, // En soles: 8500*3.75*0.18
          totalConIgv: 37612.5, // En soles: 8500*3.75*1.18
          estado: 'APROBADO',
          observaciones:
            'Valorización modalidad todo incluido. Monto en USD convertido a PEN para efectos de IGV. 4,580 km recorridos.',
          creadoPor: admin.id,
          aprobadoPor: admin.id,
          aprobadoEn: new Date('2025-02-03'),
          tenantId: 1,
        }),
        valuationsRepo.create({
          legacyId: 'VAL004',
          equipoId: equipment[3]?.id ?? equipment[0].id,
          contratoId: contracts[3]?.id ?? contracts[0]?.id,
          proyectoId: projects[0].id,
          periodo: '2025-03',
          fechaInicio: new Date('2025-03-01'),
          fechaFin: new Date('2025-03-31'),
          diasTrabajados: 23,
          horasTrabajadas: 207.0,
          combustibleConsumido: 920.0,
          costoBase: 64400.0,
          costoCombustible: 14260.0,
          cargosAdicionales: 0,
          totalValorizado: 78660.0,
          numeroValorizacion: 'VAL-2025-004',
          tipoCambio: 3.72,
          descuentoPorcentaje: 0,
          descuentoMonto: 0,
          igvPorcentaje: 18,
          igvMonto: 14158.8,
          totalConIgv: 92818.8,
          estado: 'BORRADOR',
          observaciones:
            'Valorización marzo 2025 en elaboración. Pendiente cierre de partes diarios.',
          creadoPor: admin.id,
          tenantId: 1,
        }),
        valuationsRepo.create({
          legacyId: 'VAL005',
          equipoId: equipment[4]?.id ?? equipment[1].id,
          contratoId: contracts[4]?.id ?? contracts[1]?.id,
          proyectoId: projects[1].id,
          periodo: '2025-03',
          fechaInicio: new Date('2025-03-15'),
          fechaFin: new Date('2025-03-31'),
          diasTrabajados: 12,
          horasTrabajadas: 102.0,
          combustibleConsumido: 480.0,
          costoBase: 9690.0,
          costoCombustible: 0,
          cargosAdicionales: 500.0,
          totalValorizado: 10190.0,
          numeroValorizacion: 'VAL-2025-005',
          tipoCambio: 3.72,
          descuentoPorcentaje: 0,
          descuentoMonto: 0,
          igvPorcentaje: 18,
          igvMonto: 6823.0,
          totalConIgv: 44739.4,
          estado: 'VALIDADO',
          observaciones: 'Medio mes por inicio tardío del contrato. Validado por Control OC.',
          creadoPor: admin.id,
          tenantId: 1,
        }),
      ]);
    }

    // 4. Maintenance Schedules (Programas de Mantenimiento)
    const maintenanceRepo = this.dataSource.getRepository(MaintenanceSchedule);

    const existingMaintenance = await maintenanceRepo.count();
    if (existingMaintenance === 0) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      const twoMonthsAgo = new Date(today);
      twoMonthsAgo.setMonth(today.getMonth() - 2);
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);

      await maintenanceRepo.save([
        maintenanceRepo.create({
          equipoId: equipment[0].id,
          tipoMantenimiento: 'PREVENTIVO',
          descripcion:
            'Servicio de mantenimiento 500 horas: Cambio aceite motor, filtros aire/combustible/hidráulico, inspección sistema hidráulico',
          fechaProgramada: nextMonth,
          costoEstimado: 2800.0,
          tecnicoResponsable: 'Carlos Mendoza - Técnico Certificado CAT',
          estado: 'PROGRAMADO',
          observaciones: 'Coordinar con proveedor autorizado Caterpillar. Repuestos originales.',
          tenantId: 1,
        }),
        maintenanceRepo.create({
          equipoId: equipment[0].id,
          tipoMantenimiento: 'PREVENTIVO',
          descripcion: 'Servicio 250 horas: Cambio aceite motor y filtros',
          fechaProgramada: twoMonthsAgo,
          fechaRealizada: twoMonthsAgo,
          costoEstimado: 1200.0,
          costoReal: 1150.0,
          tecnicoResponsable: 'Carlos Mendoza',
          estado: 'COMPLETADO',
          observaciones: 'Servicio completado sin novedades. Equipo en óptimas condiciones.',
          tenantId: 1,
        }),
        maintenanceRepo.create({
          equipoId: equipment[0].id,
          tipoMantenimiento: 'CORRECTIVO',
          descripcion: 'Reparación fuga hidráulica en cilindro del brazo',
          fechaProgramada: lastMonth,
          fechaRealizada: lastMonth,
          costoEstimado: 850.0,
          costoReal: 920.0,
          tecnicoResponsable: 'Roberto Sánchez - Especialista Hidráulica',
          estado: 'COMPLETADO',
          observaciones: 'Reemplazo de sellos hidráulicos. Prueba de presión OK. Equipo operativo.',
          tenantId: 1,
        }),
        maintenanceRepo.create({
          equipoId: equipment[1].id,
          tipoMantenimiento: 'PREVENTIVO',
          descripcion:
            'Servicio mayor 1000 horas: Cambio aceite motor, transmisión, diferenciales, filtros completos, calibración',
          fechaProgramada: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
          costoEstimado: 4500.0,
          tecnicoResponsable: 'Miguel Torres - Técnico Certificado Komatsu',
          estado: 'PROGRAMADO',
          observaciones:
            'Servicio mayor programado. Requiere 2 días de paralización. Repuestos ya solicitados.',
          tenantId: 1,
        }),
        maintenanceRepo.create({
          equipoId: equipment[1].id,
          tipoMantenimiento: 'PREDICTIVO',
          descripcion: 'Análisis de aceite motor - Monitoreo de condición',
          fechaProgramada: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
          costoEstimado: 350.0,
          tecnicoResponsable: 'Laboratorio SGS Perú',
          estado: 'PROGRAMADO',
          observaciones: 'Análisis espectométrico para detectar desgaste prematuro de componentes.',
          tenantId: 1,
        }),
        maintenanceRepo.create({
          equipoId: equipment[2].id,
          tipoMantenimiento: 'PREVENTIVO',
          descripcion: 'Revisión técnica vehicular anual - Inspección obligatoria MTC',
          fechaProgramada: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000),
          costoEstimado: 450.0,
          tecnicoResponsable: 'Centro de Inspección Técnica Vehicular Autorizado',
          estado: 'PROGRAMADO',
          observaciones:
            'ITV obligatorio. Incluye: frenos, dirección, luces, emisiones, estructura.',
          tenantId: 1,
        }),
        maintenanceRepo.create({
          equipoId: equipment[2].id,
          tipoMantenimiento: 'PREVENTIVO',
          descripcion:
            'Mantenimiento PM2 - 20,000 km: Cambio aceite motor, filtros, rotación neumáticos',
          fechaProgramada: lastMonth,
          fechaRealizada: lastMonth,
          costoEstimado: 1800.0,
          costoReal: 1950.0,
          tecnicoResponsable: 'Taller Volvo Trucks Perú',
          estado: 'COMPLETADO',
          observaciones:
            'Servicio completado. Alineamiento y balanceo incluido. Un neumático delantero con 60% desgaste.',
          tenantId: 1,
        }),
        maintenanceRepo.create({
          equipoId: equipment[2].id,
          tipoMantenimiento: 'CORRECTIVO',
          descripcion: 'Reparación sistema de frenos - Fuga en cámara de freno trasera derecha',
          fechaProgramada: twoMonthsAgo,
          fechaRealizada: twoMonthsAgo,
          costoEstimado: 1200.0,
          costoReal: 1350.0,
          tecnicoResponsable: 'Talleres Diesel SAC',
          estado: 'COMPLETADO',
          observaciones:
            'Reemplazo cámara de freno y ajuste completo sistema neumático. Prueba de frenado OK.',
          tenantId: 1,
        }),
      ]);
    }

    // 5. Equipment Requests (Solicitudes de Equipo)
    const solicitudesRepo = this.dataSource.getRepository(SolicitudEquipo);
    const existingSolicitudes = await solicitudesRepo.count();

    if (existingSolicitudes === 0) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      await solicitudesRepo.save([
        solicitudesRepo.create({
          codigo: 'SOL-2025-001',
          proyectoId: projects[0].id,
          tipoEquipo: 'Excavadora sobre Orugas',
          descripcion: 'Excavadora de 30tn para movimiento de tierras en sector sur.',
          cantidad: 1,
          fechaRequerida: nextWeek,
          justificacion: 'Requerido para inicio de excavación masiva según cronograma.',
          prioridad: 'ALTA',
          estado: 'APROBADO',
          aprobadoPor: admin.id,
          fechaAprobacion: new Date(),
          creadoPor: admin.id,
        }),
        solicitudesRepo.create({
          codigo: 'SOL-2025-002',
          proyectoId: projects[0].id,
          tipoEquipo: 'Camión Volquete 15m3',
          descripcion: 'Transporte de material excedente.',
          cantidad: 3,
          fechaRequerida: nextWeek,
          justificacion: 'Apoyo a excavadora SOL-001.',
          prioridad: 'MEDIA',
          estado: 'ENVIADO',
          creadoPor: admin.id,
        }),
        solicitudesRepo.create({
          codigo: 'SOL-2025-003',
          proyectoId: projects[1].id,
          tipoEquipo: 'Retroexcavadora',
          descripcion: 'Para trabajos de servicios y zanjas menores.',
          cantidad: 1,
          fechaRequerida: nextMonth,
          justificacion: 'Mantenimiento de vías internas.',
          prioridad: 'BAJA',
          estado: 'BORRADOR',
          creadoPor: admin.id,
        }),
        solicitudesRepo.create({
          codigo: 'SOL-2025-004',
          proyectoId: projects[1].id,
          tipoEquipo: 'Cargador Frontal',
          descripcion: 'Cargador de gran capacidad para cantera.',
          cantidad: 1,
          fechaRequerida: today,
          justificacion: 'Solicitud urgente por falla de equipo propio.',
          prioridad: 'ALTA',
          estado: 'RECHAZADO',
          observaciones: 'No hay disponibilidad presupuestal para alquiler adicional este mes.',
          creadoPor: admin.id,
        }),
        solicitudesRepo.create({
          codigo: 'SOL-2025-005',
          proyectoId: projects[0].id,
          tipoEquipo: 'Generador Eléctrico 150 KVA',
          descripcion: 'Generador diesel para suministro eléctrico temporal en campamento.',
          cantidad: 2,
          fechaRequerida: nextMonth,
          justificacion: 'Ampliación de campamento requiere respaldo eléctrico adicional.',
          prioridad: 'MEDIA',
          estado: 'ENVIADO',
          creadoPor: admin.id,
        }),
      ]);
    }

    // 6. Return Acts (Actas de Devolución)
    const actasRepo = this.dataSource.getRepository(ActaDevolucion);
    const existingActas = await actasRepo.count();

    if (existingActas === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      await actasRepo.save([
        actasRepo.create({
          codigo: 'ACT-2025-001',
          equipoId: equipment[0].id,
          proyectoId: projects[0].id,
          fechaDevolucion: lastWeek,
          tipo: 'DEVOLUCION',
          estado: 'FIRMADO',
          condicionEquipo: 'BUENO',
          observaciones: 'Equipo devuelto en perfectas condiciones después de finalizar contrato.',
          horometroDevolucion: 4600.5,
          creadoPor: admin.id,
          recibidoPor: trabajadores[0]?.id,
          entregadoPor: trabajadores[1]?.id,
          fechaFirma: lastWeek,
        }),
        actasRepo.create({
          codigo: 'ACT-2025-002',
          equipoId: equipment[1].id,
          proyectoId: projects[1].id,
          fechaDevolucion: yesterday,
          tipo: 'DESMOBILIZACION',
          estado: 'PENDIENTE',
          condicionEquipo: 'REGULAR',
          observaciones:
            'Desmovilización por cambio de fase en proyecto. Pendiente firma de receptor.',
          horometroDevolucion: 2200.0,
          creadoPor: admin.id,
          entregadoPor: trabajadores[0]?.id,
        }),
        actasRepo.create({
          codigo: 'ACT-2025-003',
          equipoId: equipment[2].id,
          proyectoId: projects[0].id,
          fechaDevolucion: new Date(),
          tipo: 'TRANSFERENCIA',
          estado: 'BORRADOR',
          condicionEquipo: 'BUENO',
          observaciones: 'Transferencia interna programada para mañana.',
          kilometrajeDevolucion: 45800.0,
          creadoPor: admin.id,
        }),
        actasRepo.create({
          codigo: 'ACT-2025-004',
          equipoId: equipment[0].id,
          proyectoId: projects[1].id,
          fechaDevolucion: lastWeek,
          tipo: 'DEVOLUCION',
          estado: 'ANULADO',
          condicionEquipo: 'MALO',
          observaciones: 'Acta anulada por error en ingreso de datos.',
          creadoPor: admin.id,
        }),
      ]);
    }

    // 7. Órdenes de Alquiler
    const ordenesRepo = this.dataSource.getRepository(OrdenAlquiler);
    const existingOrdenes = await ordenesRepo.count();

    if (existingOrdenes === 0) {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      await ordenesRepo.save([
        ordenesRepo.create({
          codigo: 'OAL-2025-001',
          proveedorId: 1,
          equipoId: equipment[0]?.id,
          proyectoId: projects[0]?.id,
          descripcionEquipo: 'Excavadora Caterpillar 320D, año 2020, Cap. 1.2m³',
          fechaOrden: twoWeeksAgo,
          fechaInicioEstimada: lastWeek,
          fechaFinEstimada: new Date('2025-12-31'),
          tarifaAcordada: 350.0,
          tipoTarifa: 'HORA',
          moneda: 'PEN',
          horasIncluidas: 8,
          penalidadExceso: 50.0,
          condicionesEspeciales:
            'Incluye operador certificado. Combustible por cuenta del contratante.',
          estado: 'CONFIRMADO',
          enviadoA: 'proveedor@example.com',
          fechaEnvio: twoWeeksAgo,
          confirmadoPor: 'Juan Pérez - Gerente de Alquileres',
          fechaConfirmacion: lastWeek,
          creadoPor: admin.id,
        }),
        ordenesRepo.create({
          codigo: 'OAL-2025-002',
          proveedorId: 2,
          proyectoId: projects[1]?.id,
          descripcionEquipo: 'Rodillo Vibratorio Liso BOMAG BW219DH-5, 20tn',
          fechaOrden: lastWeek,
          fechaInicioEstimada: today,
          fechaFinEstimada: new Date('2025-06-30'),
          tarifaAcordada: 1800.0,
          tipoTarifa: 'DIA',
          moneda: 'PEN',
          horasIncluidas: 10,
          penalidadExceso: 45.0,
          estado: 'ENVIADO',
          enviadoA: 'alquileres@proveedorb.com',
          fechaEnvio: lastWeek,
          creadoPor: admin.id,
        }),
        ordenesRepo.create({
          codigo: 'OAL-2025-003',
          proveedorId: 1,
          proyectoId: projects[0]?.id,
          descripcionEquipo: 'Grupo Electrógeno Cummins 150 KVA',
          fechaOrden: today,
          tarifaAcordada: 4500.0,
          tipoTarifa: 'MES',
          moneda: 'USD',
          tipoCambio: 3.72,
          condicionesEspeciales: 'Incluye mantenimiento y combustible. Entrega en obra.',
          estado: 'BORRADOR',
          creadoPor: admin.id,
        }),
      ]);
    }

    // 8. Vales de Combustible
    const valesRepo = this.dataSource.getRepository(ValeCombustible);
    const existingVales = await valesRepo.count();

    if (existingVales === 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(today.getDate() - 4);

      await valesRepo.save([
        valesRepo.create({
          codigo: 'VCB-2025-001',
          equipoId: equipment[0].id,
          proyectoId: projects[0]?.id,
          fecha: threeDaysAgo,
          numeroVale: 'VALE-0451',
          tipoCombustible: 'DIESEL',
          cantidadGalones: 45.5,
          precioUnitario: 15.5,
          montoTotal: 705.25,
          proveedor: 'Grifo Repsol KM 42',
          observaciones: 'Abastecimiento matutino antes de inicio de jornada.',
          estado: 'REGISTRADO',
          creadoPor: admin.id,
        }),
        valesRepo.create({
          codigo: 'VCB-2025-002',
          equipoId: equipment[1].id,
          proyectoId: projects[1]?.id,
          fecha: twoDaysAgo,
          numeroVale: 'VALE-0452',
          tipoCombustible: 'DIESEL',
          cantidadGalones: 58.0,
          precioUnitario: 15.5,
          montoTotal: 899.0,
          proveedor: 'Grifo Repsol KM 42',
          observaciones: 'Tanque completo para jornada extendida.',
          estado: 'REGISTRADO',
          creadoPor: admin.id,
        }),
        valesRepo.create({
          codigo: 'VCB-2025-003',
          equipoId: equipment[2].id,
          proyectoId: projects[0]?.id,
          fecha: twoDaysAgo,
          numeroVale: 'VALE-0453',
          tipoCombustible: 'DIESEL',
          cantidadGalones: 68.0,
          precioUnitario: 15.8,
          montoTotal: 1074.4,
          proveedor: 'Estación Primax Lima Norte',
          observaciones: 'Carga completa para transporte de material.',
          estado: 'REGISTRADO',
          creadoPor: admin.id,
        }),
        valesRepo.create({
          codigo: 'VCB-2025-004',
          equipoId: equipment[6]?.id ?? equipment[0].id,
          proyectoId: projects[1]?.id,
          fecha: yesterday,
          numeroVale: 'VALE-0454',
          tipoCombustible: 'GASOLINA_90',
          cantidadGalones: 12.0,
          precioUnitario: 16.2,
          montoTotal: 194.4,
          proveedor: 'Grifo Pecsa Cañete',
          observaciones: 'Camioneta supervisión de obra.',
          estado: 'PENDIENTE',
          creadoPor: admin.id,
        }),
        valesRepo.create({
          codigo: 'VCB-2025-005',
          equipoId: equipment[0].id,
          proyectoId: projects[0]?.id,
          fecha: yesterday,
          numeroVale: 'VALE-0455',
          tipoCombustible: 'DIESEL',
          cantidadGalones: 42.0,
          precioUnitario: 15.5,
          montoTotal: 651.0,
          proveedor: 'Grifo Repsol KM 42',
          estado: 'PENDIENTE',
          creadoPor: admin.id,
        }),
        valesRepo.create({
          codigo: 'VCB-2025-006',
          equipoId: equipment[3]?.id ?? equipment[0].id,
          proyectoId: projects[0]?.id,
          fecha: fourDaysAgo,
          numeroVale: 'VALE-0450',
          tipoCombustible: 'DIESEL',
          cantidadGalones: 35.0,
          precioUnitario: 15.5,
          montoTotal: 542.5,
          proveedor: 'Grifo Repsol KM 42',
          observaciones: 'Vale anulado por error en cantidad. Ver VALE-0451.',
          estado: 'ANULADO',
          creadoPor: admin.id,
        }),
      ]);
    }

    // 9. Períodos de Inoperatividad
    const periodosRepo = this.dataSource.getRepository(PeriodoInoperatividad);
    const existingPeriodos = await periodosRepo.count();

    if (existingPeriodos === 0) {
      const today = new Date();
      const contracts = await contractsRepo.find({ where: { tipo: 'CONTRATO' }, take: 5 });

      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(today.getDate() - 5);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);
      const tenDaysAgo = new Date(today);
      tenDaysAgo.setDate(today.getDate() - 10);
      const sixDaysAgo = new Date(today);
      sixDaysAgo.setDate(today.getDate() - 6);

      await periodosRepo.save([
        periodosRepo.create({
          equipoId: equipment[0].id,
          contratoId: contracts[0]?.id,
          fechaInicio: fiveDaysAgo,
          fechaFin: threeDaysAgo,
          diasInoperativo: 2,
          motivo: 'Fuga en sistema hidráulico del brazo. Requirió reemplazo de sellos.',
          estado: 'RESUELTO',
          excedePlazo: false,
          diasPlazo: 5,
          penalidadAplicada: false,
          resueltoPor: admin.id,
          creadoPor: admin.id,
        }),
        periodosRepo.create({
          equipoId: equipment[1].id,
          contratoId: contracts[1]?.id,
          fechaInicio: tenDaysAgo,
          fechaFin: sixDaysAgo,
          diasInoperativo: 4,
          motivo: 'Avería en transmisión. Espera de repuesto importado.',
          estado: 'RESUELTO',
          excedePlazo: false,
          diasPlazo: 5,
          penalidadAplicada: false,
          resueltoPor: admin.id,
          creadoPor: admin.id,
        }),
        periodosRepo.create({
          equipoId: equipment[3]?.id ?? equipment[0].id,
          contratoId: contracts[3]?.id ?? contracts[0]?.id,
          fechaInicio: threeDaysAgo,
          diasInoperativo: 3,
          motivo: 'Falla en sistema eléctrico. Diagnóstico pendiente del proveedor.',
          estado: 'ACTIVO',
          excedePlazo: false,
          diasPlazo: 5,
          penalidadAplicada: false,
          creadoPor: admin.id,
        }),
        periodosRepo.create({
          equipoId: equipment[4]?.id ?? equipment[1].id,
          contratoId: contracts[4]?.id ?? contracts[1]?.id,
          fechaInicio: tenDaysAgo,
          diasInoperativo: 10,
          motivo: 'Rotura de eje de transmisión. Proveedor no reemplaza equipo.',
          estado: 'PENALIZADO',
          excedePlazo: true,
          diasPlazo: 5,
          penalidadAplicada: true,
          montoPenalidad: 4750.0,
          observacionesPenalidad:
            'Penalidad aplicada por 5 días excedidos (10 - 5 = 5 días x S/ 950/día).',
          resueltoPor: admin.id,
          creadoPor: admin.id,
        }),
      ]);
    }

    const contractCount = await contractsRepo.count();
    const reportCount = await dailyReportsRepo.count();
    const valuationCount = await valuationsRepo.count();
    const maintenanceCount = await maintenanceRepo.count();
    const solicitudesCount = await solicitudesRepo.count();
    const actasCount = await actasRepo.count();
    const ordenesCount = await ordenesRepo.count();
    const valesCount = await valesRepo.count();
    const periodosCount = await periodosRepo.count();

    console.log(
      `     ✓ Created ${contractCount} contracts, ${reportCount} daily reports, ${valuationCount} valuations, ${maintenanceCount} maintenance schedules, ${solicitudesCount} requests, ${actasCount} return acts, ${ordenesCount} rental orders, ${valesCount} fuel vouchers, ${periodosCount} inoperability periods`
    );
  }
}
