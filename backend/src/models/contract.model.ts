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
export type EstadoContrato =
  | 'ACTIVO'
  | 'VENCIDO'
  | 'CANCELADO'
  | 'BORRADOR'
  | 'RESUELTO'
  | 'LIQUIDADO';

/** PRD §12 causales de resolución */
export type CausalResolucion =
  | 'MUTUO_ACUERDO'
  | 'INCUMPLIMIENTO_ARRENDADOR'
  | 'INCUMPLIMIENTO_ARRENDATARIO'
  | 'FUERZA_MAYOR'
  | 'VENCIMIENTO'
  | 'DECISION_UNILATERAL'
  | 'QUIEBRA'
  | 'INCAPACIDAD'
  | 'JUDICIAL'
  | 'OTRO';

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

  @Column({ name: 'minimo_por', type: 'varchar', length: 20, nullable: true })
  minimoPor?: 'HORAS' | 'DIAS' | 'MES';

  @Column({ name: 'cantidad_minima', type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidadMinima?: number;

  @Column({ name: 'penalidad_exceso', type: 'decimal', precision: 12, scale: 2, nullable: true })
  penalidadExceso?: number;

  @Column({ name: 'documento_acredita', type: 'varchar', length: 200, nullable: true })
  documentoAcredita?: string;

  @Column({ name: 'fecha_acreditada', type: 'date', nullable: true })
  fechaAcreditada?: Date;

  @Column({ name: 'jurisdiccion', type: 'varchar', length: 200, nullable: true })
  jurisdiccion?: string;

  @Column({ name: 'plazo_texto', type: 'varchar', length: 200, nullable: true })
  plazoTexto?: string;

  @Column({ name: 'motivo_resolucion', type: 'text', nullable: true })
  motivoResolucion?: string;

  @Column({ name: 'fecha_resolucion', type: 'date', nullable: true })
  fechaResolucion?: Date;

  @Column({ name: 'monto_liquidacion', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoLiquidacion?: number;

  // WS-16: Resolution & Liquidation lifecycle fields
  @Column({ name: 'causal_resolucion', type: 'varchar', length: 30, nullable: true })
  causalResolucion?: CausalResolucion;

  @Column({ name: 'resuelto_por', type: 'integer', nullable: true })
  resueltoPor?: number;

  @Column({ name: 'fecha_liquidacion', type: 'date', nullable: true })
  fechaLiquidacion?: Date;

  @Column({ name: 'liquidado_por', type: 'integer', nullable: true })
  liquidadoPor?: number;

  @Column({ name: 'observaciones_liquidacion', type: 'text', nullable: true })
  observacionesLiquidacion?: string;

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

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;
}

// Export aliases for backward compatibility
export { Contract as ContractModel };
export { Contract as Addendum }; // Addendums use same table with tipo='ADENDA'
