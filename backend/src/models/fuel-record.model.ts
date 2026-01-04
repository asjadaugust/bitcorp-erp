import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Valorizacion } from './valuation.model';

export type TipoCombustible =
  | 'DIESEL'
  | 'GASOLINA_84'
  | 'GASOLINA_90'
  | 'GASOLINA_95'
  | 'GASOLINA_97'
  | 'GLP'
  | 'GNV';

@Entity('equipo_combustible', { schema: 'equipo' })
export class RegistroCombustible {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'valorizacion_id', type: 'integer' })
  @Index('idx_equipo_combustible_valorizacion')
  valorizacionId!: number;

  @Column({ name: 'fecha', type: 'date' })
  @Index('idx_equipo_combustible_fecha')
  fecha!: Date;

  @Column({ name: 'cantidad', type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidad?: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioUnitario?: number;

  @Column({ name: 'monto_total', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoTotal?: number;

  @Column({ name: 'tipo_combustible', type: 'varchar', length: 50, nullable: true })
  tipoCombustible?: TipoCombustible;

  @Column({ name: 'proveedor', type: 'varchar', length: 100, nullable: true })
  proveedor?: string;

  @Column({ name: 'numero_documento', type: 'varchar', length: 50, nullable: true })
  numeroDocumento?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Valorizacion, { eager: true })
  @JoinColumn({ name: 'valorizacion_id' })
  valorizacion?: Valorizacion;
}

// Export with English alias for backward compatibility
export { RegistroCombustible as FuelRecord };
