import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('producto', { schema: 'logistica' })
export class Producto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'legacy_id', type: 'varchar', length: 50, unique: true, nullable: true })
  legacy_id?: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index('idx_producto_codigo')
  codigo!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index('idx_producto_categoria')
  categoria?: string;

  @Column({ name: 'unidad_medida', type: 'varchar', length: 20, nullable: true })
  unidad_medida?: string;

  @Column({ name: 'stock_actual', type: 'decimal', precision: 12, scale: 3, default: 0 })
  stock_actual!: number;

  @Column({ name: 'stock_minimo', type: 'decimal', precision: 12, scale: 3, nullable: true })
  stock_minimo?: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precio_unitario?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;
}

// Backward compatibility alias
export { Producto as Product };
