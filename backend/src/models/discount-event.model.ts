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

export type TipoEventoDescuento = 'AVERIA' | 'STAND_BY' | 'CLIMATICO' | 'OTRO';

@Entity('evento_descuento', { schema: 'equipo' })
@Index('idx_evento_descuento_valorizacion', ['valorizacionId'])
export class DiscountEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'valorizacion_id', type: 'integer' })
  valorizacionId!: number;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: Date;

  @Column({ name: 'tipo', type: 'varchar', length: 50 })
  tipo!: TipoEventoDescuento;

  @Column({ name: 'horas_descuento', type: 'decimal', precision: 5, scale: 2, default: 0 })
  horasDescuento!: number;

  @Column({ name: 'dias_descuento', type: 'decimal', precision: 5, scale: 2, default: 0 })
  diasDescuento!: number;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Valorizacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'valorizacion_id' })
  valorizacion?: Valorizacion;
}
