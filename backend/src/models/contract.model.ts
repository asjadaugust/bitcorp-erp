import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from './equipment.model';
import { User } from './user.model';
import { Provider } from './provider.model';

export type TipoContrato = 'CONTRATO' | 'ADENDA';
export type EstadoContrato = 'ACTIVO' | 'VENCIDO' | 'CANCELADO' | 'BORRADOR';

@Entity('contrato_adenda', { schema: 'equipo' })
export class Contract {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacyId?: string;

  @Column({ name: 'equipo_id', type: 'integer' })
  equipoId!: number;

  @ManyToOne(() => Equipment)
  @JoinColumn({ name: 'equipo_id' })
  equipo?: Equipment;

  @Column({ name: 'proveedor_id', type: 'integer', nullable: true })
  proveedorId?: number;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'proveedor_id' })
  provider?: Provider;

  @Column({ name: 'numero_contrato', type: 'varchar', length: 50, unique: true })
  numeroContrato!: string;

  @Column({ name: 'tipo', type: 'varchar', length: 50, default: 'CONTRATO' })
  tipo!: TipoContrato;

  // Self-referencing for addendums
  @Column({ name: 'contrato_padre_id', type: 'integer', nullable: true })
  contratoPadreId?: number;

  @ManyToOne(() => Contract, (contract) => contract.adendas, { nullable: true })
  @JoinColumn({ name: 'contrato_padre_id' })
  contratoPadre?: Contract;

  @OneToMany(() => Contract, (contract) => contract.contratoPadre)
  adendas?: Contract[];

  @Column({ name: 'fecha_contrato', type: 'date' })
  fechaContrato!: Date;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio!: Date;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin!: Date;

  @Column({ name: 'moneda', type: 'varchar', length: 3, default: 'PEN' })
  moneda!: string;

  @Column({ name: 'modalidad', type: 'varchar', length: 50, nullable: true })
  modalidad?: string;

  @Column({ name: 'tipo_tarifa', type: 'varchar', length: 50, nullable: true })
  tipoTarifa?: string;

  @Column({ name: 'tarifa', type: 'decimal', precision: 12, scale: 2, nullable: true })
  tarifa?: number;

  @Column({ name: 'incluye_motor', type: 'boolean', default: false })
  incluyeMotor!: boolean;

  @Column({ name: 'incluye_operador', type: 'boolean', default: false })
  incluyeOperador!: boolean;

  @Column({
    name: 'costo_adicional_motor',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  costoAdicionalMotor?: number;

  @Column({ name: 'horas_incluidas', type: 'integer', nullable: true })
  horasIncluidas?: number;

  @Column({ name: 'penalidad_exceso', type: 'decimal', precision: 12, scale: 2, nullable: true })
  penalidadExceso?: number;

  @Column({ name: 'condiciones_especiales', type: 'text', nullable: true })
  condicionesEspeciales?: string;

  @Column({ name: 'documento_url', type: 'text', nullable: true })
  documentoUrl?: string;

  @Column({ name: 'estado', type: 'varchar', length: 50, default: 'ACTIVO' })
  estado!: EstadoContrato;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  creador?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

// Export aliases for backward compatibility
export { Contract as ContractModel };
export { Contract as Addendum }; // Addendums use same table with tipo='ADENDA'
