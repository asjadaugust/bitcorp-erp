import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.model';
import { User } from './user.model';
import { Product } from './product.model';

export type TipoMovimiento = 'entrada' | 'salida' | 'transferencia' | 'ajuste';
export type StatusMovimiento = 'pendiente' | 'aprobado' | 'rechazado' | 'completado';

@Entity('movimiento', { schema: 'logistica' })
export class Movement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacy_id?: string;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  @Index('idx_movements_project')
  project_id?: number;

  @Column({ type: 'date' })
  @Index('idx_movements_fecha')
  fecha!: Date;

  @Column({ type: 'varchar', length: 50 })
  @Index('idx_movements_tipo')
  tipo_movimiento!: TipoMovimiento;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero_documento?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente', name: 'estado' })
  @Index('idx_movements_status')
  status!: StatusMovimiento;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  @Index('idx_movements_created_by')
  created_by?: number;

  @Column({ name: 'aprobado_por', type: 'integer', nullable: true })
  approved_by?: number;

  @Column({ name: 'aprobado_en', type: 'timestamp', nullable: true })
  approved_at?: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'proyecto_id' })
  project?: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  creator?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'aprobado_por' })
  approver?: User;

  @OneToMany(() => MovementDetail, (detail) => detail.movement, { cascade: true })
  details?: MovementDetail[];
}

@Entity('detalle_movimiento', { schema: 'logistica' })
export class MovementDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'movimiento_id', type: 'integer' })
  @Index('idx_movement_details_movement')
  movement_id!: number;

  @Column({ name: 'producto_id', type: 'integer' })
  @Index('idx_movement_details_product')
  product_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'precio_unitario' })
  costo_unitario!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monto_total?: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @ManyToOne(() => Movement, (movement) => movement.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movimiento_id' })
  movement!: Movement;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'producto_id' })
  product!: Product;
}
