import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Movement } from './movement.model';
import { Product } from './product.model';

/**
 * MovementDetail Entity - Represents line items of inventory movements
 * Table: movement_details
 * Note: 'total' column is GENERATED in DB (cantidad * costo_unitario)
 */
@Entity('detalle_movimiento', { schema: 'logistica' })
export class MovementDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index('idx_movement_details_movement')
  movement_id: number;

  @ManyToOne(() => Movement, (movement) => movement.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movement_id' })
  movement: Movement;

  @Column()
  @Index('idx_movement_details_product')
  product_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costo_unitario: number;

  // Note: total is a GENERATED column in the database
  // TypeORM will return it in queries, but we don't INSERT/UPDATE it
  // @Column({ type: 'decimal', precision: 10, scale: 2, generated: true })
  // total?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index('idx_movement_details_lote')
  lote?: string;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento?: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn()
  created_at: Date;
}
