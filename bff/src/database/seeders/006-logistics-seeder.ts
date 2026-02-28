import { BaseSeeder } from './base-seeder';
import { Movement, MovementDetail } from '../../models/movement.model';
import { Producto } from '../../models/product.model';
import { Proyecto } from '../../models/project.model';
import { User } from '../../models/user.model';

/**
 * Seeds logistics: movements and movement details
 */
export class LogisticsSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding logistics (movements)...');

    // Get references to existing data
    const productRepo = this.dataSource.getRepository(Producto);
    const projectRepo = this.dataSource.getRepository(Proyecto);
    const userRepo = this.dataSource.getRepository(User);

    const products = await productRepo.find({ take: 3 });
    const projects = await projectRepo.find({ take: 2 });
    const admin = await userRepo.findOne({ where: { username: 'admin' } });

    if (products.length === 0 || projects.length === 0 || !admin) {
      console.log('     ⚠️  Required data not found. Skipping logistics seeding.');
      return;
    }

    // 1. Movements with Details
    const movementRepo = this.dataSource.getRepository(Movement);
    const detailRepo = this.dataSource.getRepository(MovementDetail);

    const existingMovements = await movementRepo.count();
    if (existingMovements === 0) {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);

      // Movement 1: Entrada - Compra de combustible
      const movement1 = await movementRepo.save(
        movementRepo.create({
          legacyId: 'MOV001',
          projectId: projects[0].id,
          fecha: lastWeek,
          tipoMovimiento: 'entrada',
          numeroDocumento: 'FC-2025-00234',
          observaciones: 'Compra de combustible diesel B5 para proyecto Carretera Central',
          estado: 'completado',
          createdBy: admin.id,
          approvedBy: admin.id,
          approvedAt: lastWeek,
        })
      );

      await detailRepo.save(
        detailRepo.create({
          movementId: movement1.id,
          productId: products[0].id,
          cantidad: 1000.0,
          precioUnitario: 15.5,
          montoTotal: 15500.0,
          observaciones: 'Proveedor: Petroperú - Factura FC-2025-00234',
        })
      );

      // Movement 2: Salida - Consumo de combustible en obra
      const movement2 = await movementRepo.save(
        movementRepo.create({
          legacyId: 'MOV002',
          projectId: projects[0].id,
          fecha: threeDaysAgo,
          tipoMovimiento: 'salida',
          numeroDocumento: 'SAL-2025-00156',
          observaciones: 'Consumo semanal de combustible - Proyecto Carretera Central',
          estado: 'completado',
          createdBy: admin.id,
          approvedBy: admin.id,
          approvedAt: threeDaysAgo,
        })
      );

      await detailRepo.save(
        detailRepo.create({
          movementId: movement2.id,
          productId: products[0].id,
          cantidad: 425.5,
          precioUnitario: 15.5,
          montoTotal: 6595.25,
          observaciones: 'Consumo de 3 equipos: Excavadora, Tractor, Volquete',
        })
      );

      // Movement 3: Entrada - Compra de lubricantes y filtros
      const movement3 = await movementRepo.save(
        movementRepo.create({
          legacyId: 'MOV003',
          projectId: null,
          fecha: twoDaysAgo,
          tipoMovimiento: 'entrada',
          numeroDocumento: 'FC-2025-00301',
          observaciones: 'Compra de insumos para mantenimiento preventivo',
          estado: 'aprobado',
          createdBy: admin.id,
          approvedBy: admin.id,
          approvedAt: yesterday,
        })
      );

      await detailRepo.save([
        detailRepo.create({
          movementId: movement3.id,
          productId: products[1].id,
          cantidad: 40.0,
          precioUnitario: 25.0,
          montoTotal: 1000.0,
          observaciones: 'Aceite motor 15W-40 - 40 litros',
        }),
        detailRepo.create({
          movementId: movement3.id,
          productId: products[2].id,
          cantidad: 12.0,
          precioUnitario: 120.0,
          montoTotal: 1440.0,
          observaciones: 'Filtros de aire para mantenimiento 500 horas',
        }),
      ]);

      // Movement 4: Salida - Consumo lubricantes en mantenimiento
      const movement4 = await movementRepo.save(
        movementRepo.create({
          legacyId: 'MOV004',
          projectId: null,
          fecha: yesterday,
          tipoMovimiento: 'salida',
          numeroDocumento: 'SAL-2025-00178',
          observaciones: 'Consumo en mantenimiento preventivo excavadora CAT 320D',
          estado: 'completado',
          createdBy: admin.id,
          approvedBy: admin.id,
          approvedAt: yesterday,
        })
      );

      await detailRepo.save([
        detailRepo.create({
          movementId: movement4.id,
          productId: products[1].id,
          cantidad: 18.0,
          precioUnitario: 25.0,
          montoTotal: 450.0,
          observaciones: 'Cambio aceite motor - 18 litros',
        }),
        detailRepo.create({
          movementId: movement4.id,
          productId: products[2].id,
          cantidad: 3.0,
          precioUnitario: 120.0,
          montoTotal: 360.0,
          observaciones: 'Filtros: aire, combustible, hidráulico',
        }),
      ]);

      // Movement 5: Transferencia entre proyectos
      const movement5 = await movementRepo.save(
        movementRepo.create({
          legacyId: 'MOV005',
          projectId: projects[1].id,
          fecha: yesterday,
          tipoMovimiento: 'transferencia',
          numeroDocumento: 'TRF-2025-00045',
          observaciones:
            'Transferencia de combustible desde proyecto Carretera Central a proyecto Puente Arequipa',
          estado: 'completado',
          createdBy: admin.id,
          approvedBy: admin.id,
          approvedAt: yesterday,
        })
      );

      await detailRepo.save(
        detailRepo.create({
          movementId: movement5.id,
          productId: products[0].id,
          cantidad: 250.0,
          precioUnitario: 15.5,
          montoTotal: 3875.0,
          observaciones: 'Transferencia para arranque de actividades en nuevo proyecto',
        })
      );

      // Movement 6: Ajuste de inventario
      const movement6 = await movementRepo.save(
        movementRepo.create({
          legacyId: 'MOV006',
          projectId: null,
          fecha: today,
          tipoMovimiento: 'ajuste',
          numeroDocumento: 'AJU-2025-00012',
          observaciones: 'Ajuste por inventario físico - diferencia por merma',
          estado: 'pendiente',
          createdBy: admin.id,
        })
      );

      await detailRepo.save(
        detailRepo.create({
          movementId: movement6.id,
          productId: products[0].id,
          cantidad: -8.5,
          precioUnitario: 15.5,
          montoTotal: -131.75,
          observaciones: 'Merma detectada en inventario físico mensual',
        })
      );

      // Movement 7: Entrada - Compra de repuestos adicionales
      const movement7 = await movementRepo.save(
        movementRepo.create({
          legacyId: 'MOV007',
          projectId: projects[0].id,
          fecha: today,
          tipoMovimiento: 'entrada',
          numeroDocumento: 'FC-2025-00412',
          observaciones: 'Compra de repuestos para stock de emergencia',
          estado: 'aprobado',
          createdBy: admin.id,
          approvedBy: admin.id,
          approvedAt: today,
        })
      );

      await detailRepo.save(
        detailRepo.create({
          movementId: movement7.id,
          productId: products[2].id,
          cantidad: 20.0,
          precioUnitario: 120.0,
          montoTotal: 2400.0,
          observaciones: 'Stock de seguridad - filtros de aire',
        })
      );
    }

    const movementCount = await movementRepo.count();
    const detailCount = await detailRepo.count();

    console.log(`     ✓ Created ${movementCount} movements with ${detailCount} detail lines`);
  }
}
