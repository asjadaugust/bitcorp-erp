import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from './equipment.model';
import { Provider } from './provider.model';
import { Project } from './project.model';

@Entity('contrato_adenda', { schema: 'equipo' })
export class Contract {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacy_id?: string;

  @Column({ name: 'numero_contrato', type: 'varchar', length: 50, unique: true })
  numero_contrato!: string;

  @Column({ name: 'equipo_id', type: 'integer', nullable: true })
  equipment_id?: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipo_id' })
  equipment?: Equipment;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fecha_inicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fecha_fin!: Date;

  @Column({ name: 'moneda', type: 'varchar', length: 3, default: 'PEN' })
  moneda!: string;

  @Column({ name: 'tipo_tarifa', type: 'varchar', length: 50, nullable: true })
  tipo_tarifa?: string;

  @Column({ name: 'tarifa', type: 'decimal', precision: 15, scale: 2, nullable: true })
  tarifa?: number;

  @Column({ name: 'incluye_operador', type: 'boolean', default: false })
  incluye_operador!: boolean;

  @Column({ name: 'incluye_motor', type: 'boolean', default: false })
  incluye_motor!: boolean;

  @Column({ name: 'horas_incluidas', type: 'integer', nullable: true })
  horas_incluidas?: number;

  @Column({ name: 'condiciones_especiales', type: 'text', nullable: true })
  condiciones_especiales?: string;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'activo' })
  estado!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  // deleted_at removed

  @OneToMany(() => Addendum, (addendum) => addendum.contract)
  addendums?: Addendum[];
}

@Entity('contract_addendums')
export class Addendum {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacy_id?: string;

  @Column({ name: 'numero_adenda', type: 'varchar', length: 50 })
  numero_adenda!: string;

  @Column({ name: 'contract_id', type: 'integer' })
  contract_id!: number;

  @ManyToOne(() => Contract, (contract) => contract.addendums)
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract;

  @Column({ name: 'nueva_fecha_fin', type: 'date' })
  nueva_fecha_fin!: Date;

  @Column({ name: 'cambio_tarifa', type: 'boolean', default: false })
  cambio_tarifa!: boolean;

  @Column({ name: 'nueva_tarifa', type: 'decimal', precision: 15, scale: 2, nullable: true })
  nueva_tarifa?: number;

  @Column({ name: 'nueva_moneda', type: 'varchar', length: 3, nullable: true })
  nueva_moneda?: string;

  @Column({ name: 'justificacion', type: 'text' })
  justificacion!: string;

  @Column({ name: 'documento_url', type: 'varchar', length: 500, nullable: true })
  documento_url?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  // deleted_at removed
}
