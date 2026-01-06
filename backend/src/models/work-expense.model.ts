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

@Entity('gasto_obra', { schema: 'equipo' })
@Index('idx_gasto_obra_valorizacion', ['valorizacionId'])
@Index('idx_gasto_obra_fecha', ['fechaOperacion'])
export class WorkExpense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'valorizacion_id', type: 'integer' })
  valorizacionId!: number;

  @Column({ name: 'fecha_operacion', type: 'date' })
  fechaOperacion!: Date;

  @Column({ name: 'proveedor', type: 'varchar', length: 200, nullable: true })
  proveedor?: string;

  @Column({ name: 'concepto', type: 'varchar', length: 500, nullable: true })
  concepto?: string;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 50, nullable: true })
  tipoDocumento?: string; // "FACTURA" | "BOLETA" | "RECIBO" | "NOTA DE CRÉDITO"

  @Column({ name: 'num_documento', type: 'varchar', length: 50, nullable: true })
  numDocumento?: string;

  @Column({ name: 'importe', type: 'decimal', precision: 15, scale: 2, default: 0 })
  importe!: number;

  @Column({ name: 'incluye_igv', type: 'varchar', length: 2, default: 'SI' })
  incluyeIgv!: string; // "SI" | "NO"

  @Column({ name: 'importe_sin_igv', type: 'decimal', precision: 15, scale: 2, default: 0 })
  importeSinIgv!: number;

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
}
