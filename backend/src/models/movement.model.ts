import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseModel } from './base.model';
import { Project } from './project.model';
import { User } from './user.model';
import { Product } from './product.model';

export type TipoMovimiento = 'entrada' | 'salida' | 'transferencia' | 'ajuste';
export type StatusMovimiento = 'pendiente' | 'aprobado' | 'rechazado' | 'completado';

@Entity('movimiento', { schema: 'logistica' })
export class Movement extends BaseModel {
  @Column({ type: 'integer', nullable: true })
  @Index('idx_movements_project')
  project_id?: number;

  @Column({ type: 'date' })
  @Index('idx_movements_fecha')
  fecha!: Date;

  @Column({ type: 'varchar', length: 50 })
  @Index('idx_movements_tipo')
  tipo_movimiento!: TipoMovimiento;

  @Column({ type: 'varchar', length: 255, nullable: true })
  origen?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  destino?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  @Index('idx_movements_status')
  status!: StatusMovimiento;

  @Column({ type: 'integer', nullable: true })
  @Index('idx_movements_created_by')
  created_by?: number;

  @Column({ type: 'integer', nullable: true })
  approved_by?: number;

  @Column({ type: 'timestamp', nullable: true })
  approved_at?: Date;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver?: User;

  @OneToMany(() => MovementDetail, (detail) => detail.movement, { cascade: true })
  details?: MovementDetail[];
}

@Entity('movement_details')
export class MovementDetail extends BaseModel {
  @Column({ type: 'integer' })
  @Index('idx_movement_details_movement')
  movement_id!: number;

  @Column({ type: 'integer' })
  @Index('idx_movement_details_product')
  product_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costo_unitario!: number;

  // total is a GENERATED column in DB, TypeORM will return it but we don't insert/update it
  // @Column({ type: 'decimal', precision: 10, scale: 2 })
  // total?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_movement_details_lote')
  lote?: string;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento?: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @ManyToOne(() => Movement, (movement) => movement.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movement_id' })
  movement!: Movement;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
