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
  legacyId?: string;

  @Column({ name: 'proyecto_id', type: 'integer', nullable: true })
  @Index('idx_movements_project')
  projectId?: number;

  @Column({ type: 'date' })
  @Index('idx_movements_fecha')
  fecha!: Date;

  @Column({ name: 'tipo_movimiento', type: 'varchar', length: 50 })
  @Index('idx_movements_tipo')
  tipoMovimiento!: TipoMovimiento;

  @Column({ name: 'numero_documento', type: 'varchar', length: 50, nullable: true })
  numeroDocumento?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente', name: 'estado' })
  @Index('idx_movements_status')
  estado!: StatusMovimiento;

  @Column({ name: 'creado_por', type: 'integer', nullable: true })
  @Index('idx_movements_created_by')
  createdBy?: number;

  @Column({ name: 'aprobado_por', type: 'integer', nullable: true })
  approvedBy?: number;

  @Column({ name: 'aprobado_en', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'tenant_id', type: 'integer', nullable: true })
  tenantId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

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
  movementId!: number;

  @Column({ name: 'producto_id', type: 'integer' })
  @Index('idx_movement_details_product')
  productId!: number;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  cantidad!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'precio_unitario' })
  precioUnitario!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'monto_total', nullable: true })
  montoTotal?: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Movement, (movement) => movement.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movimiento_id' })
  movement!: Movement;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'producto_id' })
  product!: Product;
}
