import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
// import { BaseModel } from './base.model'; // Unused
import { Provider } from './provider.model';
// import { Project } from './project.model'; // Unused

export enum EquipmentStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export enum FuelType {
  DIESEL = 'diesel',
  GASOLINE = 'gasoline',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
}

export enum EquipmentCategory {
  EXCAVATOR = 'Excavadora',
  BULLDOZER = 'Tractor de Oruga',
  LOADER = 'Cargador Frontal',
  GRADER = 'Motoniveladora',
  TRUCK = 'Camión Volquete',
  MIXER = 'Mezcladora',
  COMPACTOR = 'Compactadora',
  CRANE = 'Grúa',
  FORKLIFT = 'Montacargas',
}

export enum MeterType {
  HOROMETRO = 'horometro',
  ODOMETRO = 'odometro',
}

export enum ProviderType {
  RENTAL = 'rental',
  OWNED = 'owned',
  SERVICE = 'service',
}

@Entity('equipo', { schema: 'equipo' })
export class Equipment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'codigo_equipo', type: 'varchar', length: 50, unique: true })
  codigoEquipo!: string;

  @Column({ name: 'tipo_equipo_id', type: 'integer', nullable: true })
  tipoEquipoId?: number;

  @Column({ name: 'proveedor_id', type: 'integer', nullable: true })
  proveedorId?: number;

  @ManyToOne(() => Provider, { nullable: true })
  @JoinColumn({ name: 'proveedor_id' })
  provider?: Provider;

  @Column({ name: 'tipo_proveedor', type: 'varchar', length: 50, nullable: true })
  tipoProveedor?: string;

  @Column({ name: 'categoria', type: 'varchar', length: 50, nullable: true })
  categoria?: string;

  @Column({ name: 'placa', type: 'varchar', length: 20, nullable: true })
  placa?: string;

  @Column({ name: 'marca', type: 'varchar', length: 100, nullable: true })
  marca?: string;

  @Column({ name: 'modelo', type: 'varchar', length: 100, nullable: true })
  modelo?: string;

  @Column({ name: 'numero_serie_equipo', type: 'varchar', length: 100, nullable: true })
  numeroSerieEquipo?: string;

  @Column({ name: 'numero_chasis', type: 'varchar', length: 100, nullable: true })
  numeroChasis?: string;

  @Column({ name: 'numero_serie_motor', type: 'varchar', length: 100, nullable: true })
  numeroSerieMotor?: string;

  @Column({ name: 'anio_fabricacion', type: 'integer', nullable: true })
  anioFabricacion?: number;

  @Column({ name: 'potencia_neta', type: 'decimal', precision: 10, scale: 2, nullable: true })
  potenciaNeta?: number;

  @Column({ name: 'tipo_motor', type: 'varchar', length: 50, nullable: true })
  tipoMotor?: string;

  @Column({ name: 'medidor_uso', type: 'varchar', length: 20, nullable: true })
  medidorUso?: string;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'DISPONIBLE' })
  estado!: string;

  // project_id removed as it does not exist in equipo.equipo table
  // Use EquipmentAssignment (equipo.equipo_edt) for project assignments

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // creado_por and actualizado_por columns don't exist in equipo.equipo table
  // These fields are not tracked in the database schema

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  // deleted_at removed as it does not exist in equipo.equipo table
}
