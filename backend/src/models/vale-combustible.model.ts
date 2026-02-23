import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DailyReport } from './daily-report-typeorm.model';

export const TIPOS_COMBUSTIBLE = ['DIESEL', 'GASOLINA_90', 'GASOLINA_95', 'GLP', 'GNV'] as const;
export type TipoCombustibleVale = (typeof TIPOS_COMBUSTIBLE)[number];

export const ESTADOS_VALE = ['PENDIENTE', 'REGISTRADO', 'ANULADO'] as const;
export type EstadoVale = (typeof ESTADOS_VALE)[number];

@Entity({ schema: 'equipo', name: 'vale_combustible' })
export class ValeCombustible {
  @PrimaryGeneratedColumn()
  id!: number;

  /** Código único: VCB-0001 */
  @Column({ name: 'codigo', length: 20, unique: true })
  codigo!: string;

  /** Parte diario al que se adjunta (nullable: puede registrarse sin parte) */
  @Column({ name: 'parte_diario_id', nullable: true })
  parteDiarioId!: number | null;

  @Column({ name: 'equipo_id' })
  equipoId!: number;

  @Column({ name: 'proyecto_id', nullable: true })
  proyectoId!: number | null;

  @Column({ name: 'fecha', type: 'date' })
  fecha!: Date;

  /** Número impreso en el vale físico */
  @Column({ name: 'numero_vale', length: 50 })
  numeroVale!: string;

  @Column({
    name: 'tipo_combustible',
    type: 'varchar',
    length: 20,
    enum: TIPOS_COMBUSTIBLE,
    default: 'DIESEL',
  })
  tipoCombustible!: TipoCombustibleVale;

  @Column({ name: 'cantidad_galones', type: 'decimal', precision: 8, scale: 2 })
  cantidadGalones!: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioUnitario!: number | null;

  @Column({ name: 'monto_total', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoTotal!: number | null;

  @Column({ name: 'proveedor', length: 150, nullable: true })
  proveedor!: string | null;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones!: string | null;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 20,
    enum: ESTADOS_VALE,
    default: 'PENDIENTE',
  })
  estado!: EstadoVale;

  @Column({ name: 'creado_por', nullable: true })
  creadoPor!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => DailyReport, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario?: DailyReport;
}
