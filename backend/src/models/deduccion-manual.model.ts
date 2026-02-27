import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Valorizacion } from './valuation.model';

export type TipoDeduccionManual =
  | 'REPUESTOS'
  | 'MANIPULEO_COMBUSTIBLE'
  | 'AMORTIZACION_ADELANTO'
  | 'PENALIDAD'
  | 'RETENCION'
  | 'OTRO';

@Entity('deduccion_manual', { schema: 'equipo' })
export class DeduccionManual {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'valorizacion_id', type: 'integer' })
  @Index('idx_deduccion_manual_valorizacion')
  valorizacionId!: number;

  @Column({ name: 'tipo', type: 'varchar', length: 50 })
  @Index('idx_deduccion_manual_tipo')
  tipo!: TipoDeduccionManual;

  @Column({ name: 'concepto', type: 'varchar', length: 500 })
  concepto!: string;

  @Column({ name: 'num_documento', type: 'varchar', length: 50, nullable: true })
  numDocumento?: string;

  @Column({ name: 'fecha', type: 'date', nullable: true })
  fecha?: Date;

  @Column({ name: 'monto', type: 'decimal', precision: 15, scale: 2, default: 0.0 })
  monto!: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  creadoPor?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Valorizacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'valorizacion_id' })
  valorizacion?: Valorizacion;
}
