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
import { Equipment } from './equipment.model';

@Entity('adelanto_amortizacion', { schema: 'equipo' })
@Index('idx_adelanto_valorizacion', ['valorizacionId'])
@Index('idx_adelanto_equipo', ['equipoId'])
@Index('idx_adelanto_fecha', ['fechaOperacion'])
@Index('idx_adelanto_tipo', ['tipoOperacion'])
export class AdvanceAmortization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'valorizacion_id', type: 'integer' })
  valorizacionId!: number;

  @Column({ name: 'equipo_id', type: 'integer' })
  equipoId!: number;

  @Column({ name: 'fecha_operacion', type: 'date' })
  fechaOperacion!: Date;

  @Column({ name: 'tipo_operacion', type: 'varchar', length: 50 })
  tipoOperacion!: string; // "ADELANTO" | "AMORTIZACION"

  @Column({ name: 'num_documento', type: 'varchar', length: 50, nullable: true })
  numDocumento?: string;

  @Column({ name: 'concepto', type: 'varchar', length: 500, nullable: true })
  concepto?: string;

  @Column({ name: 'num_cuota', type: 'varchar', length: 20, nullable: true })
  numCuota?: string;

  @Column({ name: 'monto', type: 'decimal', precision: 15, scale: 2, default: 0 })
  monto!: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Valorizacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'valorizacion_id' })
  valorizacion?: Valorizacion;

  @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipo_id' })
  equipo?: Equipment;
}
