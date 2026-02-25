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
import { TipoEquipo } from './tipo-equipo.model';
// import { Project } from './project.model'; // Unused

export enum EquipmentStatus {
  DISPONIBLE = 'DISPONIBLE',
  EN_USO = 'EN_USO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  RETIRADO = 'RETIRADO',
}

export enum FuelType {
  DIESEL = 'DIESEL',
  GASOLINA = 'GASOLINA',
  ELECTRICO = 'ELECTRICO',
  HIBRIDO = 'HIBRIDO',
}

export enum EquipmentCategory {
  EXCAVADORA = 'Excavadora',
  TRACTOR_ORUGA = 'Tractor de Oruga',
  CARGADOR_FRONTAL = 'Cargador Frontal',
  MOTONIVELADORA = 'Motoniveladora',
  CAMION_VOLQUETE = 'Camión Volquete',
  MEZCLADORA = 'Mezcladora',
  COMPACTADORA = 'Compactadora',
  GRUA = 'Grúa',
  MONTACARGAS = 'Montacargas',
}

export enum MeterType {
  HOROMETRO = 'HOROMETRO',
  ODOMETRO = 'ODOMETRO',
}

export enum ProviderType {
  PROPIO = 'PROPIO',
  TERCERO = 'TERCERO',
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

  @ManyToOne(() => TipoEquipo, { nullable: true, eager: false })
  @JoinColumn({ name: 'tipo_equipo_id' })
  tipoEquipo?: TipoEquipo;

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

  // Document and Certification Fields (from DB schema)
  @Column({ name: 'fecha_venc_poliza', type: 'date', nullable: true })
  fechaVencPoliza?: Date;

  @Column({ name: 'fecha_venc_soat', type: 'date', nullable: true })
  fechaVencSoat?: Date;

  @Column({ name: 'fecha_venc_citv', type: 'date', nullable: true })
  fechaVencCitv?: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

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
