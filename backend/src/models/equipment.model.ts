import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { Provider } from './provider.model';
import { Project } from './project.model';

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
  legacy_id?: string;

  @Column({ name: 'codigo_equipo', type: 'varchar', length: 50, unique: true })
  codigo_equipo!: string;

  @Column({ name: 'tipo_equipo_id', type: 'integer', nullable: true })
  equipment_type_id?: number;

  @Column({ name: 'proveedor_id', type: 'integer', nullable: true })
  provider_id?: number;

  @ManyToOne(() => Provider, { nullable: true })
  @JoinColumn({ name: 'proveedor_id' })
  provider?: Provider;

  @Column({ name: 'tipo_proveedor', type: 'varchar', length: 50, nullable: true })
  tipo_proveedor?: string;

  @Column({ name: 'categoria', type: 'varchar', length: 50, nullable: true })
  categoria?: string;

  @Column({ name: 'placa', type: 'varchar', length: 20, nullable: true })
  placa?: string;

  @Column({ name: 'marca', type: 'varchar', length: 100, nullable: true })
  marca?: string;

  @Column({ name: 'modelo', type: 'varchar', length: 100, nullable: true })
  modelo?: string;

  @Column({ name: 'numero_serie_equipo', type: 'varchar', length: 100, nullable: true })
  numero_serie_equipo?: string;

  @Column({ name: 'numero_chasis', type: 'varchar', length: 100, nullable: true })
  numero_chasis?: string;

  @Column({ name: 'numero_serie_motor', type: 'varchar', length: 100, nullable: true })
  numero_serie_motor?: string;

  @Column({ name: 'anio_fabricacion', type: 'integer', nullable: true })
  anio_fabricacion?: number;

  @Column({ name: 'potencia_neta', type: 'decimal', precision: 10, scale: 2, nullable: true })
  potencia_neta?: number;

  @Column({ name: 'tipo_motor', type: 'varchar', length: 50, nullable: true })
  tipo_motor?: string;

  @Column({ name: 'medidor_uso', type: 'varchar', length: 20, nullable: true })
  medidor_uso?: string;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'disponible' })
  estado!: string;

  // project_id removed as it does not exist in equipo.equipo table
  // Use EquipmentAssignment (equipo.equipo_edt) for project assignments

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  created_by?: number;

  @Column({ name: 'actualizado_por', type: 'integer', nullable: true })
  updated_by?: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  // deleted_at removed as it does not exist in equipo.equipo table
}
