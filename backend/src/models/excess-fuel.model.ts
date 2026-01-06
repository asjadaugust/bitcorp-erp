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

@Entity('exceso_combustible', { schema: 'equipo' })
@Index('idx_exceso_combustible_valorizacion', ['valorizacionId'])
export class ExcessFuel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'valorizacion_id', type: 'integer' })
  valorizacionId!: number;

  @Column({ name: 'consumo_combustible', type: 'decimal', precision: 10, scale: 2, default: 0 })
  consumoCombustible!: number;

  @Column({ name: 'tipo_horo_odo', type: 'varchar', length: 20, nullable: true })
  tipoHoroOdo?: string; // "HORÓMETRO" | "ODÓMETRO"

  @Column({ name: 'inicio', type: 'decimal', precision: 10, scale: 2, default: 0 })
  inicio!: number;

  @Column({ name: 'final', type: 'decimal', precision: 10, scale: 2, default: 0 })
  final!: number;

  @Column({ name: 'total', type: 'decimal', precision: 10, scale: 2, default: 0 })
  total!: number;

  @Column({ name: 'rendimiento', type: 'decimal', precision: 10, scale: 4, default: 0 })
  rendimiento!: number; // Gallons per hour/km

  @Column({ name: 'ratio_control', type: 'decimal', precision: 10, scale: 4, default: 0 })
  ratioControl!: number;

  @Column({ name: 'diferencia', type: 'decimal', precision: 10, scale: 2, default: 0 })
  diferencia!: number;

  @Column({ name: 'exceso_combustible', type: 'decimal', precision: 10, scale: 2, default: 0 })
  excesoCombustible!: number; // Excess gallons

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 4, default: 0 })
  precioUnitario!: number;

  @Column({
    name: 'importe_exceso_combustible',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  importeExcesoCombustible!: number;

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
