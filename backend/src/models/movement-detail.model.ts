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

  @Column({ name: 'movimiento_id' })
  @Index('idx_movement_details_movement')
  movementId: number;

  @ManyToOne(() => Movement, (movement) => movement.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movimiento_id' })
  movement: Movement;

  @Column({ name: 'producto_id' })
  @Index('idx_movement_details_product')
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'producto_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'precio_unitario' })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, name: 'monto_total', nullable: true })
  montoTotal?: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
