import { BaseSeeder } from './base-seeder';
import { Proyecto, EstadoProyecto } from '../../models/project.model';
import { Provider, TipoProveedor } from '../../models/provider.model';
import { Equipment } from '../../models/equipment.model';
import { Trabajador } from '../../models/trabajador.model';
import { Producto } from '../../models/product.model';

/**
 * Seeds core business entities: projects, providers, equipment, workers, products
 */
export class CoreEntitiesSeeder extends BaseSeeder {
  async run(): Promise<void> {
    console.log('  → Seeding core entities (projects, providers, equipment, workers, products)...');

    // 1. Projects
    const projectsRepo = this.dataSource.getRepository(Proyecto);
    const projectsData = [
      {
        legacyId: 'PROJ001',
        codigo: 'PRO-2025-001',
        nombre: 'Proyecto Carretera Central',
        descripcion: 'Construcción de carretera en zona central',
        ubicacion: 'Lima - Huancayo',
        fechaInicio: new Date('2025-01-01'),
        fechaFin: new Date('2025-12-31'),
        presupuesto: 5000000,
        estado: 'ACTIVO' as EstadoProyecto,
        cliente: 'Ministerio de Transportes',
        isActive: true,
      },
      {
        legacyId: 'PROJ002',
        codigo: 'PRO-2025-002',
        nombre: 'Proyecto Puente Arequipa',
        descripcion: 'Construcción de puente vehicular',
        ubicacion: 'Arequipa',
        fechaInicio: new Date('2025-02-01'),
        fechaFin: new Date('2025-11-30'),
        presupuesto: 3000000,
        estado: 'PLANIFICACION' as EstadoProyecto,
        cliente: 'Gobierno Regional',
        isActive: true,
      },
    ];

    for (const data of projectsData) {
      const existing = await projectsRepo.findOneBy({ legacyId: data.legacyId });
      if (!existing) {
        await projectsRepo.save(projectsRepo.create(data));
      }
    }

    // 2. Providers
    const providersRepo = this.dataSource.getRepository(Provider);
    const providersData = [
      {
        legacyId: 'PROV001',
        ruc: '20123456789',
        razonSocial: 'MAQUINARIAS DEL PERÚ S.A.C.',
        nombreComercial: 'Maquinarias Perú',
        tipoProveedor: 'EQUIPOS' as TipoProveedor,
        direccion: 'Av. Industrial 123, Lima',
        telefono: '(01) 234-5678',
        email: 'ventas@maquinariasperu.com',
        isActive: true,
      },
      {
        legacyId: 'PROV002',
        ruc: '20987654321',
        razonSocial: 'EQUIPOS PESADOS SAC',
        nombreComercial: 'Equipos Pesados',
        tipoProveedor: 'EQUIPOS' as TipoProveedor,
        direccion: 'Jr. Los Pinos 456, Callao',
        telefono: '(01) 876-5432',
        email: 'info@equipospesados.pe',
        isActive: true,
      },
    ];

    for (const data of providersData) {
      const existing = await providersRepo.findOneBy({ legacyId: data.legacyId });
      if (!existing) {
        await providersRepo.save(providersRepo.create(data));
      }
    }

    // 3. Equipment
    const equipmentRepo = this.dataSource.getRepository(Equipment);
    const equipmentData = [
      {
        legacyId: 'EQ001',
        codigoEquipo: 'EXC-001',
        categoria: 'EXCAVADORA',
        placa: 'ABC-123',
        marca: 'Caterpillar',
        modelo: '320D',
        numeroSerieEquipo: 'CAT320D-2025-001',
        anioFabricacion: 2020,
        potenciaNeta: 121.0,
        estado: 'DISPONIBLE',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ002',
        codigoEquipo: 'TRA-001',
        categoria: 'TRACTOR',
        placa: 'DEF-456',
        marca: 'Komatsu',
        modelo: 'D65EX',
        numeroSerieEquipo: 'KOM-D65-2025-001',
        anioFabricacion: 2021,
        potenciaNeta: 175.0,
        estado: 'DISPONIBLE',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ003',
        codigoEquipo: 'VOL-001',
        categoria: 'VOLQUETE',
        placa: 'GHI-789',
        marca: 'Volvo',
        modelo: 'FM500',
        numeroSerieEquipo: 'VOL-FM500-2025-001',
        anioFabricacion: 2022,
        estado: 'DISPONIBLE',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      // MAQUINARIA_PESADA
      {
        legacyId: 'EQ004',
        codigoEquipo: 'CAR-001',
        categoria: 'CARGADOR_FRONTAL',
        placa: 'JKL-101',
        marca: 'Caterpillar',
        modelo: '950H',
        numeroSerieEquipo: 'CAT950H-2025-001',
        anioFabricacion: 2019,
        potenciaNeta: 195.0,
        estado: 'EN_USO',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ005',
        codigoEquipo: 'ROD-001',
        categoria: 'RODILLO',
        placa: 'MNO-202',
        marca: 'BOMAG',
        modelo: 'BW219DH-5',
        numeroSerieEquipo: 'BOM-BW219-2025-001',
        anioFabricacion: 2021,
        potenciaNeta: 145.0,
        estado: 'DISPONIBLE',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      // VEHICULOS_PESADOS
      {
        legacyId: 'EQ006',
        codigoEquipo: 'MIX-001',
        categoria: 'MIXER',
        placa: 'PQR-303',
        marca: 'Mercedes-Benz',
        modelo: 'Actros 3341',
        numeroSerieEquipo: 'MB-ACT3341-2025-001',
        anioFabricacion: 2020,
        potenciaNeta: 408.0,
        estado: 'EN_USO',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ007',
        codigoEquipo: 'GRU-001',
        categoria: 'GRUA',
        placa: 'STU-404',
        marca: 'Liebherr',
        modelo: 'LTM 1100-4.2',
        numeroSerieEquipo: 'LIE-LTM1100-2025-001',
        anioFabricacion: 2018,
        potenciaNeta: 350.0,
        estado: 'MANTENIMIENTO',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ008',
        codigoEquipo: 'VOL-002',
        categoria: 'VOLQUETE',
        placa: 'VWX-505',
        marca: 'Scania',
        modelo: 'P440',
        numeroSerieEquipo: 'SCA-P440-2025-001',
        anioFabricacion: 2021,
        estado: 'DISPONIBLE',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ009',
        codigoEquipo: 'VOL-003',
        categoria: 'VOLQUETE',
        placa: 'YZA-606',
        marca: 'Volvo',
        modelo: 'FMX 500',
        numeroSerieEquipo: 'VOL-FMX500-2025-001',
        anioFabricacion: 2022,
        estado: 'EN_USO',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      // VEHICULOS_LIVIANOS
      {
        legacyId: 'EQ010',
        codigoEquipo: 'CAM-001',
        categoria: 'CAMIONETA',
        placa: 'BCD-707',
        marca: 'Toyota',
        modelo: 'Hilux 4x4',
        numeroSerieEquipo: 'TOY-HIL4X4-2025-001',
        anioFabricacion: 2023,
        estado: 'EN_USO',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ011',
        codigoEquipo: 'CAM-002',
        categoria: 'CAMIONETA',
        placa: 'EFG-808',
        marca: 'Nissan',
        modelo: 'Frontier NP300',
        numeroSerieEquipo: 'NIS-NP300-2025-001',
        anioFabricacion: 2022,
        estado: 'DISPONIBLE',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ012',
        codigoEquipo: 'VAN-001',
        categoria: 'FURGONETA',
        placa: 'HIJ-909',
        marca: 'Mercedes-Benz',
        modelo: 'Sprinter 316',
        numeroSerieEquipo: 'MB-SPR316-2025-001',
        anioFabricacion: 2021,
        estado: 'EN_USO',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ013',
        codigoEquipo: 'SUV-001',
        categoria: 'SUV',
        placa: 'KLM-010',
        marca: 'Toyota',
        modelo: 'Land Cruiser',
        numeroSerieEquipo: 'TOY-LC-2025-001',
        anioFabricacion: 2023,
        estado: 'DISPONIBLE',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ014',
        codigoEquipo: 'CAM-003',
        categoria: 'CAMIONETA',
        placa: 'NOP-111',
        marca: 'Mitsubishi',
        modelo: 'L200',
        numeroSerieEquipo: 'MIT-L200-2025-001',
        anioFabricacion: 2020,
        estado: 'MANTENIMIENTO',
        medidorUso: 'ODOMETRO',
        isActive: true,
        tenantId: 1,
      },
      // EQUIPOS_MENORES
      {
        legacyId: 'EQ015',
        codigoEquipo: 'GEN-001',
        categoria: 'GENERADOR',
        marca: 'Cummins',
        modelo: 'C150D5',
        numeroSerieEquipo: 'CUM-C150-2025-001',
        anioFabricacion: 2021,
        potenciaNeta: 150.0,
        estado: 'DISPONIBLE',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ016',
        codigoEquipo: 'COM-001',
        categoria: 'COMPRESOR',
        marca: 'Atlas Copco',
        modelo: 'XAS 185',
        numeroSerieEquipo: 'AC-XAS185-2025-001',
        anioFabricacion: 2020,
        potenciaNeta: 49.0,
        estado: 'EN_USO',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ017',
        codigoEquipo: 'SOL-001',
        categoria: 'SOLDADORA',
        marca: 'Lincoln Electric',
        modelo: 'Ranger 305D',
        numeroSerieEquipo: 'LE-R305D-2025-001',
        anioFabricacion: 2022,
        estado: 'DISPONIBLE',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ018',
        codigoEquipo: 'GEN-002',
        categoria: 'GENERADOR',
        marca: 'Caterpillar',
        modelo: 'DE110',
        numeroSerieEquipo: 'CAT-DE110-2025-001',
        anioFabricacion: 2019,
        potenciaNeta: 110.0,
        estado: 'MANTENIMIENTO',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ019',
        codigoEquipo: 'VIB-001',
        categoria: 'VIBROAPISONADOR',
        marca: 'Wacker Neuson',
        modelo: 'BS 70-2plus',
        numeroSerieEquipo: 'WN-BS70-2025-001',
        anioFabricacion: 2023,
        estado: 'DISPONIBLE',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
      {
        legacyId: 'EQ020',
        codigoEquipo: 'BOM-001',
        categoria: 'BOMBA_AGUA',
        marca: 'Honda',
        modelo: 'WB30XT',
        numeroSerieEquipo: 'HON-WB30-2025-001',
        anioFabricacion: 2022,
        estado: 'EN_USO',
        medidorUso: 'HOROMETRO',
        isActive: true,
        tenantId: 1,
      },
    ];

    for (const data of equipmentData) {
      const existing = await equipmentRepo.findOneBy({ legacyId: data.legacyId });
      if (!existing) {
        await equipmentRepo.save(equipmentRepo.create(data));
      }
    }

    // 4. Workers (Trabajadores)
    const trabajadoresRepo = this.dataSource.getRepository(Trabajador);
    const trabajadoresData = [
      {
        legacyId: 'TRAB001',
        dni: '87654321',
        nombres: 'Pedro',
        apellidoPaterno: 'Ramírez',
        apellidoMaterno: 'López',
        fechaNacimiento: new Date('1985-05-15'),
        telefono: '+51 987111222',
        email: 'pedro.ramirez@bitcorp.pe',
        cargo: 'Operador de Excavadora',
        especialidad: 'Operación de maquinaria pesada',
        licenciaConducir: 'A-III-c',
        tipoContrato: 'PLAZO_FIJO',
        fechaIngreso: new Date('2024-01-15'),
        isActive: true,
      },
      {
        legacyId: 'TRAB002',
        dni: '76543210',
        nombres: 'José',
        apellidoPaterno: 'Torres',
        apellidoMaterno: 'Sánchez',
        fechaNacimiento: new Date('1990-08-20'),
        telefono: '+51 987222333',
        email: 'jose.torres@bitcorp.pe',
        cargo: 'Operador de Tractor',
        especialidad: 'Operación de equipos de movimiento de tierras',
        licenciaConducir: 'A-III-c',
        tipoContrato: 'INDEFINIDO',
        fechaIngreso: new Date('2023-06-01'),
        isActive: true,
      },
    ];

    for (const data of trabajadoresData) {
      const existing = await trabajadoresRepo.findOneBy({ legacyId: data.legacyId });
      if (!existing) {
        await trabajadoresRepo.save(trabajadoresRepo.create(data));
      }
    }

    // 5. Products (Logística)
    const productsRepo = this.dataSource.getRepository(Producto);
    const productsData = [
      {
        legacyId: 'PROD001',
        codigo: 'COMB-DIESEL',
        nombre: 'Combustible Diesel B5',
        descripcion: 'Combustible diesel para maquinaria pesada',
        categoria: 'COMBUSTIBLES',
        unidadMedida: 'GAL',
        stockActual: 5000.0,
        stockMinimo: 500.0,
        precioUnitario: 15.5,
        isActive: true,
      },
      {
        legacyId: 'PROD002',
        codigo: 'LUBR-ENGINE',
        nombre: 'Aceite Lubricante Motor 15W-40',
        descripcion: 'Aceite lubricante para motores diesel',
        categoria: 'LUBRICANTES',
        unidadMedida: 'LT',
        stockActual: 200.0,
        stockMinimo: 50.0,
        precioUnitario: 25.0,
        isActive: true,
      },
      {
        legacyId: 'PROD003',
        codigo: 'FIL-AIR',
        nombre: 'Filtro de Aire',
        descripcion: 'Filtro de aire para maquinaria pesada',
        categoria: 'REPUESTOS',
        unidadMedida: 'UND',
        stockActual: 50.0,
        stockMinimo: 10.0,
        precioUnitario: 120.0,
        isActive: true,
      },
    ];

    for (const data of productsData) {
      const existing = await productsRepo.findOneBy({ legacyId: data.legacyId });
      if (!existing) {
        await productsRepo.save(productsRepo.create(data));
      }
    }

    console.log('     ✓ Core entities seeding processed (skipped if already exist)');
  }
}
